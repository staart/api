import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { Email } from '@prisma/client';
import {
  EMAIL_DELETE_PRIMARY,
  EMAIL_NOT_FOUND,
  UNAUTHORIZED_RESOURCE,
  USER_NOT_FOUND,
} from '../../errors/errors.constants';
import { safeEmail } from '../../helpers/safe-email';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
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
    data: Omit<Omit<Prisma.EmailCreateInput, 'emailSafe'>, 'user'>,
  ): Promise<Email> {
    const emailSafe = safeEmail(data.email);
    const result = await this.prisma.email.create({
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
      cursor?: Prisma.EmailWhereUniqueInput;
      where?: Prisma.EmailWhereInput;
      orderBy?: Prisma.EmailOrderByInput;
    },
  ): Promise<Expose<Email>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const emails = await this.prisma.email.findMany({
      skip,
      take,
      cursor,
      where: { ...where, user: { id: userId } },
      orderBy,
    });
    return emails.map((user) => this.prisma.expose<Email>(user));
  }

  async getEmail(userId: number, id: number): Promise<Expose<Email>> {
    const email = await this.prisma.email.findUnique({
      where: { id },
    });
    if (!email) throw new NotFoundException(EMAIL_NOT_FOUND);
    if (email.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    return this.prisma.expose<Email>(email);
  }

  async deleteEmail(userId: number, id: number): Promise<Expose<Email>> {
    const testEmail = await this.prisma.email.findUnique({
      where: { id },
    });
    if (!testEmail) throw new NotFoundException(EMAIL_NOT_FOUND);
    if (testEmail.userId !== userId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { prefersEmail: true },
    });
    if (!user) throw new NotFoundException(USER_NOT_FOUND);
    if (user.prefersEmail.id === id) {
      const otherEmails = (
        await this.prisma.email.findMany({ where: { user: { id: userId } } })
      ).filter((i) => i.id !== id);
      if (!otherEmails.length)
        throw new BadRequestException(EMAIL_DELETE_PRIMARY);
      await this.prisma.user.update({
        where: { id: userId },
        data: { prefersEmail: { connect: { id: otherEmails[0].id } } },
      });
    }
    const email = await this.prisma.email.delete({
      where: { id },
    });
    return this.prisma.expose<Email>(email);
  }
}
