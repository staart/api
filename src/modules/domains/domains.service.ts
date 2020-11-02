import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  domains,
  domainsCreateInput,
  domainsOrderByInput,
  domainsWhereInput,
  domainsWhereUniqueInput,
} from '@prisma/client';
import { Expose } from '../prisma/prisma.interface';
import { PrismaService } from '../prisma/prisma.service';
import { TokensService } from '../tokens/tokens.service';
import { DomainVerificationMethods } from './domains.interface';

@Injectable()
export class DomainsService {
  constructor(
    private prisma: PrismaService,
    private tokensService: TokensService,
  ) {}

  async createDomain(
    groupId: number,
    data: Omit<Omit<domainsCreateInput, 'group'>, 'verificationCode'>,
  ): Promise<domains> {
    const verificationCode = this.tokensService.generateUuid();
    return this.prisma.domains.create({
      data: {
        ...data,
        verificationCode,
        group: { connect: { id: groupId } },
      },
    });
  }

  async getDomains(
    groupId: number,
    params: {
      skip?: number;
      take?: number;
      cursor?: domainsWhereUniqueInput;
      where?: domainsWhereInput;
      orderBy?: domainsOrderByInput;
    },
  ): Promise<Expose<domains>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const domains = await this.prisma.domains.findMany({
      skip,
      take,
      cursor,
      where: { ...where, group: { id: groupId } },
      orderBy,
    });
    return domains.map((group) => this.prisma.expose<domains>(group));
  }

  async getDomain(groupId: number, id: number): Promise<Expose<domains>> {
    const domain = await this.prisma.domains.findOne({
      where: { id },
    });
    if (!domain)
      throw new HttpException('Domain not found', HttpStatus.NOT_FOUND);
    if (domain.groupId !== groupId) throw new UnauthorizedException();
    return this.prisma.expose<domains>(domain);
  }

  async verifyDomain(
    groupId: number,
    id: number,
    method: DomainVerificationMethods,
  ): Promise<Expose<domains>> {
    const domain = await this.prisma.domains.findOne({
      where: { id },
    });
    if (!domain)
      throw new HttpException('Domain not found', HttpStatus.NOT_FOUND);
    if (domain.groupId !== groupId) throw new UnauthorizedException();
    return domain;
  }

  async deleteDomain(groupId: number, id: number): Promise<Expose<domains>> {
    const testDomain = await this.prisma.domains.findOne({
      where: { id },
    });
    if (!testDomain)
      throw new HttpException('Domain not found', HttpStatus.NOT_FOUND);
    if (testDomain.groupId !== groupId) throw new UnauthorizedException();
    const domain = await this.prisma.domains.delete({
      where: { id },
    });
    return this.prisma.expose<domains>(domain);
  }
}
