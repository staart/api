import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { User } from '@prisma/client';
import { compare } from 'bcrypt';
import {
  CURRENT_PASSWORD_REQUIRED,
  INVALID_CREDENTIALS,
  USER_NOT_FOUND,
} from '../../errors/errors.constants';
import { safeEmail } from '../../helpers/safe-email';
import { MailService } from '../../providers/mail/mail.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { MERGE_ACCOUNTS_TOKEN } from '../../providers/tokens/tokens.constants';
import { TokensService } from '../../providers/tokens/tokens.service';
import { AuthService } from '../auth/auth.service';
import { PasswordUpdateInput } from './users.interface';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
    private email: MailService,
    private configService: ConfigService,
    private tokensService: TokensService,
  ) {}

  async getUser(id: number): Promise<Expose<User>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException(USER_NOT_FOUND);
    return this.prisma.expose<User>(user);
  }

  async getUsers(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByInput;
  }): Promise<Expose<User>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const users = await this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
    return users.map((user) => this.prisma.expose<User>(user));
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateUser(
    id: number,
    data: Omit<Prisma.UserUpdateInput, 'password'> & PasswordUpdateInput,
  ): Promise<Expose<User>> {
    const transformed: Prisma.UserUpdateInput & PasswordUpdateInput = data;
    if (data.newPassword) {
      if (!data.currentPassword)
        throw new BadRequestException(CURRENT_PASSWORD_REQUIRED);
      const previousPassword = (
        await this.prisma.user.findUnique({
          where: { id },
          select: { password: true },
        })
      )?.password;
      if (previousPassword)
        if (!(await compare(data.currentPassword, previousPassword)))
          throw new BadRequestException(INVALID_CREDENTIALS);
      transformed.password = await this.auth.hashAndValidatePassword(
        data.newPassword,
        !!data.ignorePwnedPassword,
      );
    }
    delete transformed.currentPassword;
    delete transformed.newPassword;
    delete transformed.ignorePwnedPassword;
    const updateData: Prisma.UserUpdateInput = transformed;
    const user = await this.prisma.user.update({
      data: updateData,
      where: { id },
    });
    return this.prisma.expose<User>(user);
  }

  async deactivateUser(id: number): Promise<Expose<User>> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { active: false },
    });
    await this.prisma.session.deleteMany({ where: { user: { id } } });
    return this.prisma.expose<User>(user);
  }

  async requestMerge(userId: number, email: string): Promise<{ queued: true }> {
    const emailSafe = safeEmail(email);
    const user = await this.prisma.user.findFirst({
      where: { emails: { some: { emailSafe } } },
      include: { prefersEmail: true },
    });
    if (!user) throw new NotFoundException(USER_NOT_FOUND);
    if (user.id === userId) throw new NotFoundException(USER_NOT_FOUND);
    const minutes = parseInt(
      this.configService.get<string>('security.mergeUsersTokenExpiry') ?? '',
    );
    this.email.send({
      to: `"${user.name}" <${user.prefersEmail.email}>`,
      template: 'auth/mfa-code',
      data: {
        name: user.name,
        minutes,
        link: `${this.configService.get<string>(
          'frontendUrl',
        )}/auth/link/merge-accounts?token=${this.tokensService.signJwt(
          MERGE_ACCOUNTS_TOKEN,
          { baseUserId: userId, mergeUserId: user.id },
          `${minutes}m`,
        )}`,
      },
    });
    return { queued: true };
  }
}
