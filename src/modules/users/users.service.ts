import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma, UserRole } from '@prisma/client';
import { User } from '@prisma/client';
import { compare } from 'bcrypt';
import { extname } from 'path';
import {
  CURRENT_PASSWORD_REQUIRED,
  FILE_TOO_LARGE,
  INVALID_CREDENTIALS,
  USER_NOT_FOUND,
} from '../../errors/errors.constants';
import { Files } from '../../helpers/interfaces';
import { safeEmail } from '../../helpers/safe-email';
import { MailService } from '../../providers/mail/mail.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { S3Service } from '../../providers/s3/s3.service';
import { MERGE_ACCOUNTS_TOKEN } from '../../providers/tokens/tokens.constants';
import { TokensService } from '../../providers/tokens/tokens.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
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
    private s3Service: S3Service,
    private apiKeysService: ApiKeysService,
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
    try {
      const users = await this.prisma.user.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy,
      });
      return users.map((user) => this.prisma.expose<User>(user));
    } catch (error) {
      return [];
    }
  }

  async updateUser(
    id: number,
    data: Omit<Prisma.UserUpdateInput, 'password'> & PasswordUpdateInput,
    role?: UserRole,
  ): Promise<Expose<User>> {
    const testUser = await this.prisma.user.findUnique({ where: { id } });
    if (!testUser) throw new NotFoundException(USER_NOT_FOUND);
    const transformed: Prisma.UserUpdateInput & PasswordUpdateInput = data;
    // If the user is updating their password
    if (data.newPassword) {
      if (!data.currentPassword)
        throw new BadRequestException(CURRENT_PASSWORD_REQUIRED);
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: { prefersEmail: true },
      });
      const previousPassword = user?.password;
      if (previousPassword)
        if (!(await compare(data.currentPassword, previousPassword)))
          throw new BadRequestException(INVALID_CREDENTIALS);
      transformed.password = await this.auth.hashAndValidatePassword(
        data.newPassword,
        !!data.ignorePwnedPassword,
      );
      this.email.send({
        to: `"${user.name}" <${user.prefersEmail.email}>`,
        template: 'users/password-changed',
        data: {
          name: user.name,
        },
      });
    }
    delete transformed.currentPassword;
    delete transformed.newPassword;
    delete transformed.ignorePwnedPassword;
    if (role !== 'SUDO') delete transformed.role;
    const updateData: Prisma.UserUpdateInput = transformed;
    const user = await this.prisma.user.update({
      data: updateData,
      where: { id },
    });
    // If the role of this user has changed
    if (transformed.role && testUser.role !== transformed.role) {
      // Log out from all sessions since their scopes have changed
      await this.prisma.session.deleteMany({ where: { user: { id } } });
      // Remove all scopes now allowed anymore from API keys
      await this.apiKeysService.cleanAllApiKeysForUser(id);
    }
    return this.prisma.expose<User>(user);
  }

  async deactivateUser(
    id: number,
    deactivatedBy?: number,
  ): Promise<Expose<User>> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { active: false },
      include: { prefersEmail: true },
    });
    await this.prisma.session.deleteMany({ where: { user: { id } } });
    if (deactivatedBy === id)
      this.email.send({
        to: `"${user.name}" <${user.prefersEmail.email}>`,
        template: 'users/deactivated',
        data: {
          name: user.name,
        },
      });
    return this.prisma.expose<User>(user);
  }

  async deleteUser(id: number): Promise<Expose<User>> {
    const testUser = await this.prisma.user.findUnique({ where: { id } });
    if (!testUser) throw new NotFoundException(USER_NOT_FOUND);
    await this.prisma.membership.deleteMany({ where: { user: { id } } });
    await this.prisma.email.deleteMany({ where: { user: { id } } });
    await this.prisma.session.deleteMany({ where: { user: { id } } });
    await this.prisma.approvedSubnet.deleteMany({ where: { user: { id } } });
    await this.prisma.backupCode.deleteMany({ where: { user: { id } } });
    await this.prisma.identity.deleteMany({ where: { user: { id } } });
    await this.prisma.auditLog.deleteMany({ where: { user: { id } } });
    await this.prisma.apiKey.deleteMany({ where: { user: { id } } });
    const user = await this.prisma.user.delete({ where: { id } });
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
      template: 'users/merge-request',
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

  async uploadProfilePicture(
    id: number,
    file: Files[0],
  ): Promise<Expose<User>> {
    if (file.size > 25000000) throw new Error(FILE_TOO_LARGE);
    if (!this.configService.get<string>('s3.profilePictureBucket'))
      throw new InternalServerErrorException('Profile picture bucket not set');
    const { Location } = await this.s3Service.upload(
      `picture-${id}-${this.tokensService.generateUuid()}${extname(
        file.originalname,
      )}`,
      file.buffer,
      this.configService.get<string>('s3.profilePictureBucket'),
      true,
    );
    return this.prisma.user.update({
      where: { id },
      data: {
        profilePictureUrl: Location.replace(
          `${this.configService.get<string>(
            's3.profilePictureBucket',
          )}.s3.${this.configService.get<string>('s3.region')}.amazonaws.com`,
          this.configService.get<string>('s3.profilePictureCdnHostname'),
        ),
      },
    });
  }
}
