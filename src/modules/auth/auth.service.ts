import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { users } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { OmitSecrets } from '../prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../user/user.service';
import { RegisterDto } from './auth.dto';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private email: EmailService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password?: string): Promise<number> {
    const emailSafe = this.users.getSafeEmail(email);
    const user = await this.prisma.users.findFirst({
      where: { emails: { some: { emailSafe } } },
      select: { id: true, password: true },
    });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (!password || !user.password)
      throw new HttpException(
        'Logging in without passwords is not supported',
        HttpStatus.NOT_IMPLEMENTED,
      );
    if (await compare(password, user.password)) return user.id;
    return null;
  }

  async login(
    ipAddress: string,
    userAgent: string,
    email: string,
    password?: string,
  ) {
    const id = await this.validateUser(email, password);
    if (!id) throw new UnauthorizedException();
    const token = randomStringGenerator();
    await this.prisma.sessions.create({
      data: { token, ipAddress, userAgent, user: { connect: { id } } },
    });
    return {
      accessToken: this.jwtService.sign(
        { sub: `user${id}` },
        {
          expiresIn: this.configService.get<string>(
            'security.accessTokenExpiry',
          ),
        },
      ),
      refreshToken: token,
    };
  }

  async register(data: RegisterDto): Promise<OmitSecrets<users>> {
    const email = data.email;
    const emailSafe = this.users.getSafeEmail(email);
    delete data.email;

    const users = await this.users.users({
      take: 1,
      where: { emails: { some: { emailSafe } } },
    });
    if (users.length)
      throw new HttpException(
        'A user with this email already exists',
        HttpStatus.CONFLICT,
      );

    const user = await this.prisma.users.create({
      data: {
        ...data,
        emails: {
          create: { email: email, emailSafe },
        },
      },
    });
    await this.sendEmailVerification(email);
    return this.prisma.expose(user);
  }

  async sendEmailVerification(email: string, resend = false) {
    const emailSafe = this.users.getSafeEmail(email);
    const emailDetails = await this.prisma.emails.findFirst({
      where: { emailSafe },
      include: { user: true },
    });
    if (!emailDetails)
      throw new HttpException(
        'There is no user for this email',
        HttpStatus.NOT_FOUND,
      );
    this.email.send({
      to: `"${emailDetails.user.name}" <${email}>`,
      template: resend
        ? 'auth/resend-email-verification'
        : 'auth/email-verification',
      data: {
        name: emailDetails.user.name,
        link: `${this.configService.get<string>(
          'frontendUrl',
        )}/auth/verify-email?token=`,
      },
    });
    return { queued: true };
  }
}
