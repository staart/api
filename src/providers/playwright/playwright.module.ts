import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlaywrightService } from './playwright.service';

@Module({
  imports: [ConfigModule],
  providers: [PlaywrightService],
  exports: [PlaywrightService],
})
export class PlaywrightModule {}
