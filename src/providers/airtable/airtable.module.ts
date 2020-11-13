import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AirtableService } from './airtable.service';

@Module({
  imports: [ConfigModule],
  providers: [AirtableService],
  exports: [AirtableService],
})
export class AirtableModule {}
