import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { users } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { OmitSecrets } from '../prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../user/user.service';
import { RegisterDto } from './auth.dto';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private email: EmailService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<number> {
    const emailSafe = this.users.getSafeEmail(email);
    const user = await this.prisma.users.findFirst({
      where: { emails: { some: { emailSafe } } },
    });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (await compare(password, user.password)) return user.id;
    return null;
  }

  async login(id: number) {
    const payload = { sub: id };
    return {
      accessToken: this.jwtService.sign(payload),
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
