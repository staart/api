import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { Domain } from '@prisma/client';
import { DnsService } from '../../providers/dns/dns.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { TokensService } from '../../providers/tokens/tokens.service';
import { DomainVerificationMethods } from './domains.interface';
export declare class DomainsService {
    private prisma;
    private tokensService;
    private dnsService;
    private configService;
    constructor(prisma: PrismaService, tokensService: TokensService, dnsService: DnsService, configService: ConfigService);
    createDomain(groupId: number, data: Omit<Omit<Prisma.DomainCreateInput, 'group'>, 'verificationCode'>): Promise<Domain>;
    getDomains(groupId: number, params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.DomainWhereUniqueInput;
        where?: Prisma.DomainWhereInput;
        orderBy?: Prisma.DomainOrderByInput;
    }): Promise<Expose<Domain>[]>;
    getDomain(groupId: number, id: number): Promise<Expose<Domain>>;
    verifyDomain(groupId: number, id: number, method: DomainVerificationMethods): Promise<Expose<Domain>>;
    deleteDomain(groupId: number, id: number): Promise<Expose<Domain>>;
}
