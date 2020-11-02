import { Module } from '@nestjs/common';
import { DnsModule } from '../dns/dns.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokensService } from '../tokens/tokens.service';
import { DomainController } from './domains.controller';
import { DomainsService } from './domains.service';

@Module({
  imports: [PrismaModule, TokensService, DnsModule],
  controllers: [DomainController],
  providers: [DomainsService],
})
export class DomainsModule {}
