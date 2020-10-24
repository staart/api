import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { users } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { Expose } from '../prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../user/user.service';
import { RegisterDto } from './auth.dto';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { AccessTokenClaims } from './auth.interface';
import { PwnedService } from '../pwned/pwned.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private email: EmailService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private pwnedService: PwnedService,
  ) {}

  async validateUser(email: string, password?: string): Promise<number> {
    const emailSafe = this.users.getSafeEmail(email);
    const user = await this.prisma.users.findFirst({
      where: { emails: { some: { emailSafe } } },
      select: { id: true, password: true, emails: true },
    });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (!user.emails.find(i => i.emailSafe === emailSafe)?.isVerified)
      throw new UnauthorizedException('This email is not verified');
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
      accessToken: await this.getAccessToken(id),
      refreshToken: token,
    };
  }

  async register(data: RegisterDto): Promise<Expose<users>> {
    const email = data.email;
    const emailSafe = this.users.getSafeEmail(email);
    const ignorePwnedPassword = !!data.ignorePwnedPassword;
    delete data.email;
    delete data.ignorePwnedPassword;
    data.password = await this.hashAndValidatePassword(
      data.password,
      ignorePwnedPassword,
    );

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
    if (!emailDetails.isVerified)
      throw new HttpException(
        'This email is already verified',
        HttpStatus.BAD_REQUEST,
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

  async refresh(ipAddress: string, userAgent: string, token: string) {
    if (!token) throw new UnprocessableEntityException();
    const session = await this.prisma.sessions.findFirst({
      where: { token },
      select: { user: { select: { id: true } } },
    });
    if (!session)
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    await this.prisma.sessions.updateMany({
      where: { token },
      data: { ipAddress, userAgent },
    });
    return {
      accessToken: await this.getAccessToken(session.user.id),
      refreshToken: token,
    };
  }

  private async getAccessToken(userId: number): Promise<string> {
    const scopes = await this.getScopes(userId);
    const payload: AccessTokenClaims = {
      sub: `user${userId}`,
      scopes,
    };
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('security.accessTokenExpiry'),
    });
  }

  async hashAndValidatePassword(
    password: string,
    ignorePwnedPassword: boolean,
  ): Promise<string> {
    if (!ignorePwnedPassword) {
      if (!this.configService.get<boolean>('security.passwordPwnedCheck'))
        return;
      if (!(await this.pwnedService.isPasswordSafe(password)))
        throw new HttpException(
          'This password has been compromised in a data breach.',
          HttpStatus.BAD_REQUEST,
        );
    }
    return await hash(
      password,
      this.configService.get<number>('security.saltRounds'),
    );
  }

  async getScopes(userId: number): Promise<string[]> {
    const scopes: string[] = [`user-${userId}:*`];
    const memberships = await this.prisma.memberships.findMany({
      where: { user: { id: userId } },
      select: { id: true, role: true, group: { select: { id: true } } },
    });
    memberships.forEach(membership => {
      scopes.push(`membership-${membership.id}:*`);
      if (membership.role === 'OWNER')
        scopes.push(`group-${membership.group.id}:*`);

      // Admins cannot delete a group, but they can read/write
      if (membership.role === 'ADMIN')
        scopes.push(`group-${membership.group.id}:write-*`);

      // Non-owners (admins and regular members) can also read
      if (membership.role !== 'OWNER')
        scopes.push(`group-${membership.group.id}:read-*`);
    });
    return scopes;
  }
}
