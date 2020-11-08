import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DnsModule } from '../dns/dns.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokensModule } from '../tokens/tokens.module';
import { DomainController } from './domains.controller';
import { DomainsService } from './domains.service';

@Module({
  imports: [PrismaModule, TokensModule, DnsModule, ConfigModule],
  controllers: [DomainController],
  providers: [DomainsService],
})
export class DomainsModule {}
