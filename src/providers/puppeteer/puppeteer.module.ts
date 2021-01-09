import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PuppeteerService } from './puppeteer.service';

@Module({
  imports: [ConfigModule],
  providers: [PuppeteerService],
  exports: [PuppeteerService],
})
export class PuppeteerModule {}
