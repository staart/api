import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { Domain } from '@prisma/client';
import got from 'got';
import { URL } from 'url';
import {
  DOMAIN_NOT_FOUND,
  DOMAIN_NOT_VERIFIED,
  INVALID_DOMAIN,
  UNAUTHORIZED_RESOURCE,
} from '../../errors/errors.constants';
import { DnsService } from '../../providers/dns/dns.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { TokensService } from '../../providers/tokens/tokens.service';
import { DOMAIN_VERIFICATION_TXT } from './domains.constants';
import { DomainVerificationMethods } from './domains.interface';

@Injectable()
export class DomainsService {
  constructor(
    private prisma: PrismaService,
    private tokensService: TokensService,
    private dnsService: DnsService,
    private configService: ConfigService,
  ) {}

  async createDomain(
    groupId: number,
    data: Omit<Omit<Prisma.DomainCreateInput, 'group'>, 'verificationCode'>,
  ): Promise<Domain> {
    try {
      const fullUrl = new URL(data.domain);
      data.domain = fullUrl.hostname;
    } catch (error) {}
    if (
      !/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(
        data.domain,
      )
    )
      throw new BadRequestException(INVALID_DOMAIN);
    const verificationCode = this.tokensService.generateUuid();
    const currentProfilePicture = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { profilePictureUrl: true },
    });
    const parsedProfilePicture = new URL(
      currentProfilePicture.profilePictureUrl,
    );
    if (parsedProfilePicture.hostname === 'ui-avatars.com')
      try {
        const img = await got('https://logo.clearbit.com/${data.domain}', {
          responseType: 'buffer',
        });
        if (img.body.byteLength > 1)
          await this.prisma.group.update({
            where: { id: groupId },
            data: {
              profilePictureUrl: `https://logo.clearbit.com/${data.domain}`,
            },
          });
      } catch (error) {}

    return this.prisma.domain.create({
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
      cursor?: Prisma.DomainWhereUniqueInput;
      where?: Prisma.DomainWhereInput;
      orderBy?: Prisma.DomainOrderByInput;
    },
  ): Promise<Expose<Domain>[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const domains = await this.prisma.domain.findMany({
      skip,
      take,
      cursor,
      where: { ...where, group: { id: groupId } },
      orderBy,
    });
    return domains.map((group) => this.prisma.expose<Domain>(group));
  }

  async getDomain(groupId: number, id: number): Promise<Expose<Domain>> {
    const domain = await this.prisma.domain.findUnique({
      where: { id },
    });
    if (!domain) throw new NotFoundException(DOMAIN_NOT_FOUND);
    if (domain.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    return this.prisma.expose<Domain>(domain);
  }

  async verifyDomain(
    groupId: number,
    id: number,
    method: DomainVerificationMethods,
  ): Promise<Expose<Domain>> {
    const domain = await this.prisma.domain.findUnique({
      where: { id },
    });
    if (!domain) throw new NotFoundException(DOMAIN_NOT_FOUND);
    if (domain.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    if (method === DOMAIN_VERIFICATION_TXT) {
      const txtRecords = await this.dnsService.lookup(domain.domain, 'TXT');
      if (JSON.stringify(txtRecords).includes(domain.verificationCode)) {
        await this.prisma.domain.update({
          where: { id },
          data: { isVerified: true },
        });
      } else throw new BadRequestException(DOMAIN_NOT_VERIFIED);
    } else {
      let verified = false;
      try {
        const { body } = await got(
          `http://${domain.domain}/.well-known/${this.configService.get<string>(
            'meta.domainVerificationFile' ?? 'staart-verify.txt',
          )}`,
        );
        verified = body.includes(domain.verificationCode);
      } catch (error) {}
      if (verified) {
        await this.prisma.domain.update({
          where: { id },
          data: { isVerified: true },
        });
      } else throw new BadRequestException(DOMAIN_NOT_VERIFIED);
    }
    return domain;
  }

  async deleteDomain(groupId: number, id: number): Promise<Expose<Domain>> {
    const testDomain = await this.prisma.domain.findUnique({
      where: { id },
    });
    if (!testDomain) throw new NotFoundException(DOMAIN_NOT_FOUND);
    if (testDomain.groupId !== groupId)
      throw new UnauthorizedException(UNAUTHORIZED_RESOURCE);
    const domain = await this.prisma.domain.delete({
      where: { id },
    });
    return this.prisma.expose<Domain>(domain);
  }
}
