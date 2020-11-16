import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  users,
  usersCreateInput,
  usersOrderByInput,
  usersUpdateInput,
  usersWhereInput,
  usersWhereUniqueInput,
} from '@prisma/client';
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

  async getUser(id: number): Promise<Expose<users>> {
    const user = await this.prisma.users.findOne({
      where: { id },
    });
    if (!user) throw new NotFoundException(USER_NOT_FOUND);
    return this.prisma.expose<users>(user);
  }

  async getUsers(params: {
    skip?: number;
    take?: number;
    cursor?: usersWhereUniqueInput;
    where?: usersWhereInput;
    orderBy?: usersOrderByInput;
  }): Promise<Expose<users>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const users = await this.prisma.users.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
    return users.map((user) => this.prisma.expose<users>(user));
  }

  async createUser(data: usersCreateInput): Promise<users> {
    return this.prisma.users.create({
      data,
    });
  }

  async updateUser(
    id: number,
    data: Omit<usersUpdateInput, 'password'> & PasswordUpdateInput,
  ): Promise<Expose<users>> {
    const transformed: usersUpdateInput & PasswordUpdateInput = data;
    if (data.newPassword) {
      if (!data.currentPassword)
        throw new BadRequestException(CURRENT_PASSWORD_REQUIRED);
      const previousPassword = (
        await this.prisma.users.findOne({
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
    const updateData: usersUpdateInput = transformed;
    const user = await this.prisma.users.update({
      data: updateData,
      where: { id },
    });
    return this.prisma.expose<users>(user);
  }

  async deactivateUser(id: number): Promise<Expose<users>> {
    const user = await this.prisma.users.update({
      where: { id },
      data: { active: false },
    });
    await this.prisma.sessions.deleteMany({ where: { user: { id } } });
    return this.prisma.expose<users>(user);
  }

  async requestMerge(userId: number, email: string): Promise<void> {
    const emailSafe = safeEmail(email);
    const user = await this.prisma.users.findFirst({
      where: { emails: { some: { emailSafe } } },
      include: { prefersEmail: true },
    });
    if (!user) throw new NotFoundException(USER_NOT_FOUND);
    if (user.id === userId) throw new NotFoundException(USER_NOT_FOUND);
    const minutes = parseInt(
      this.configService.get<string>('security.mergeUsersTokenExpiry') ?? '',
    );
    return this.email.send({
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
  }
}
