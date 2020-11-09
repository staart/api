import { Module } from '@nestjs/common';
import { DnsService } from './dns.service';

@Module({
  providers: [DnsService],
  exports: [DnsService],
})
export class DnsModule {}
