import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { users } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { OmitSecrets } from '../prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../user/user.service';
import { RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private email: EmailService,
  ) {}

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
    return this.prisma.expose(user);
  }

  async resentEmailVerification() {
    return { queued: true };
  }
}
