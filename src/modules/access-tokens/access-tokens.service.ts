import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
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

@Injectable()
export class AccessTokensService {
  constructor(private prisma: PrismaService) {}
  async createAccessToken(
    userId: number,
    data: Omit<Omit<accessTokensCreateInput, 'accessToken'>, 'user'>,
  ): Promise<accessTokens> {
    const accessToken = randomStringGenerator();
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
}
