import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  emails,
  emailsCreateInput,
  emailsOrderByInput,
  emailsWhereInput,
  emailsWhereUniqueInput,
} from '@prisma/client';
import { safeEmail } from '../../../src/helpers/safe-email';
import { Expose } from '../../../src/modules/prisma/prisma.interface';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class EmailsService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private auth: AuthService,
  ) {}

  async createEmail(
    userId: number,
    data: Omit<Omit<emailsCreateInput, 'emailSafe'>, 'user'>,
  ): Promise<emails> {
    const emailSafe = safeEmail(data.email);
    const result = await this.prisma.emails.create({
      data: { ...data, emailSafe, user: { connect: { id: userId } } },
    });
    await this.auth.sendEmailVerification(data.email);
    return result;
  }

  async getEmails(
    userId: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: emailsWhereUniqueInput;
      where?: emailsWhereInput;
      orderBy?: emailsOrderByInput;
    },
  ): Promise<Expose<emails>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const emails = await this.prisma.emails.findMany({
      skip,
      take,
      cursor,
      where: { ...where, user: { id: userId } },
      orderBy,
    });
    return emails.map((user) => this.prisma.expose<emails>(user));
  }

  async getEmail(userId: number, id: number): Promise<Expose<emails>> {
    const email = await this.prisma.emails.findOne({
      where: { id },
    });
    if (!email)
      throw new HttpException('Email not found', HttpStatus.NOT_FOUND);
    if (email.userId !== userId) throw new UnauthorizedException();
    return this.prisma.expose<emails>(email);
  }

  async deleteEmail(userId: number, id: number): Promise<Expose<emails>> {
    const testEmail = await this.prisma.emails.findOne({
      where: { id },
    });
    if (!testEmail)
      throw new HttpException('Email not found', HttpStatus.NOT_FOUND);
    if (testEmail.userId !== userId) throw new UnauthorizedException();
    const email = await this.prisma.emails.delete({
      where: { id },
    });
    return this.prisma.expose<emails>(email);
  }
}
