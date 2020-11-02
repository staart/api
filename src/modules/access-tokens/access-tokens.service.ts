import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  accessTokens,
  accessTokensCreateInput,
  accessTokensOrderByInput,
  accessTokensUpdateInput,
  accessTokensWhereInput,
  accessTokensWhereUniqueInput,
} from '@prisma/client';
import { Expose } from '../../modules/prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';
import { TokensService } from '../tokens/tokens.service';

@Injectable()
export class AccessTokensService {
  constructor(
    private prisma: PrismaService,
    private tokensService: TokensService,
  ) {}

  async createAccessToken(
    userId: number,
    data: Omit<Omit<accessTokensCreateInput, 'accessToken'>, 'user'>,
  ): Promise<accessTokens> {
    const accessToken = this.tokensService.generateUuid();
    return this.prisma.accessTokens.create({
      data: { ...data, accessToken, user: { connect: { id: userId } } },
    });
  }

  async getAccessTokens(
    userId: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: accessTokensWhereUniqueInput;
      where?: accessTokensWhereInput;
      orderBy?: accessTokensOrderByInput;
    },
  ): Promise<Expose<accessTokens>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const accessTokens = await this.prisma.accessTokens.findMany({
      skip,
      take,
      cursor,
      where: { ...where, user: { id: userId } },
      orderBy,
    });
    return accessTokens.map((user) => this.prisma.expose<accessTokens>(user));
  }

  async getAccessToken(
    userId: number,
    id: number,
  ): Promise<Expose<accessTokens>> {
    const accessToken = await this.prisma.accessTokens.findOne({
      where: { id },
    });
    if (!accessToken)
      throw new HttpException('AccessToken not found', HttpStatus.NOT_FOUND);
    if (accessToken.userId !== userId) throw new UnauthorizedException();
    return this.prisma.expose<accessTokens>(accessToken);
  }

  async updateAccessToken(
    userId: number,
    id: number,
    data: accessTokensUpdateInput,
  ): Promise<Expose<accessTokens>> {
    const testAccessToken = await this.prisma.accessTokens.findOne({
      where: { id },
    });
    if (!testAccessToken)
      throw new HttpException('AccessToken not found', HttpStatus.NOT_FOUND);
    if (testAccessToken.userId !== userId) throw new UnauthorizedException();
    const accessToken = await this.prisma.accessTokens.update({
      where: { id },
      data,
    });
    return this.prisma.expose<accessTokens>(accessToken);
  }

  async replaceAccessToken(
    userId: number,
    id: number,
    data: accessTokensCreateInput,
  ): Promise<Expose<accessTokens>> {
    const testAccessToken = await this.prisma.accessTokens.findOne({
      where: { id },
    });
    if (!testAccessToken)
      throw new HttpException('AccessToken not found', HttpStatus.NOT_FOUND);
    if (testAccessToken.userId !== userId) throw new UnauthorizedException();
    const accessToken = await this.prisma.accessTokens.update({
      where: { id },
      data,
    });
    return this.prisma.expose<accessTokens>(accessToken);
  }

  async deleteAccessToken(
    userId: number,
    id: number,
  ): Promise<Expose<accessTokens>> {
    const testAccessToken = await this.prisma.accessTokens.findOne({
      where: { id },
    });
    if (!testAccessToken)
      throw new HttpException('AccessToken not found', HttpStatus.NOT_FOUND);
    if (testAccessToken.userId !== userId) throw new UnauthorizedException();
    const accessToken = await this.prisma.accessTokens.delete({
      where: { id },
    });
    return this.prisma.expose<accessTokens>(accessToken);
  }

  async getAccessTokenScopes(userId: number): Promise<Record<string, string>> {
    const scopes: Record<string, string> = {};
    scopes[`user-${userId}:read-info`] = 'Read user details';
    scopes[`user-${userId}:write-info`] = 'Update user details';
    scopes[`user-${userId}:delete`] = 'Delete user';

    scopes[`user-${userId}:write-membership-*`] = 'Create new groups';
    scopes[`user-${userId}:read-membership-*`] = 'Read group memberships';
    for await (const membership of await this.prisma.memberships.findMany({
      where: { user: { id: userId } },
      select: { id: true, group: true },
    })) {
      scopes[
        `user-${userId}:read-membership-${membership.id}`
      ] = `Read membership: ${membership.group.name}`;
      scopes[
        `user-${userId}:write-membership-${membership.id}`
      ] = `Update membership: ${membership.group.name}`;
      scopes[
        `user-${userId}:delete-membership-${membership.id}`
      ] = `Delete membership: ${membership.group.name}`;
    }

    scopes[`user-${userId}:write-email-*`] = 'Create and update emails';
    scopes[`user-${userId}:read-email-*`] = 'Read emails';
    for await (const email of await this.prisma.emails.findMany({
      where: { user: { id: userId } },
      select: { id: true, email: true },
    })) {
      scopes[
        `user-${userId}:read-email-${email.id}`
      ] = `Read email: ${email.email}`;
      scopes[
        `user-${userId}:delete-email-${email.id}`
      ] = `Delete email: ${email.email}`;
    }

    scopes[`user-${userId}:read-session-*`] = 'Read sessions';
    for await (const session of await this.prisma.sessions.findMany({
      where: { user: { id: userId } },
      select: { id: true, browser: true },
    })) {
      scopes[`user-${userId}:read-session-${session.id}`] = `Read session: ${
        session.browser ?? session.id
      }`;
      scopes[
        `user-${userId}:delete-session-${session.id}`
      ] = `Delete session: ${session.browser ?? session.id}`;
    }

    scopes[`user-${userId}:read-approved-subnet-*`] = 'Read approvedSubnets';
    for await (const subnet of await this.prisma.approvedSubnets.findMany({
      where: { user: { id: userId } },
      select: { id: true, subnet: true },
    })) {
      scopes[
        `user-${userId}:read-approved-subnet-${subnet.id}`
      ] = `Read subnet: ${subnet.subnet}`;
      scopes[
        `user-${userId}:delete-approved-subnet-${subnet.id}`
      ] = `Delete subnet: ${subnet.subnet}`;
    }

    scopes[`user-${userId}:delete-mfa-*`] =
      'Disable multi-factor authentication';
    scopes[`user-${userId}:write-mfa-regenerate`] =
      'Regenerate MFA backup codes';
    scopes[`user-${userId}:write-mfa-totp`] = 'Enable TOTP-based MFA';
    scopes[`user-${userId}:write-mfa-sms`] = 'Enable SMS-based MFA';
    scopes[`user-${userId}:write-mfa-email`] = 'Enable email-based MFA';

    return scopes;
  }
}
