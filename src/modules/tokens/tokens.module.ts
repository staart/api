import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TokensService } from './tokens.service';

@Module({
  imports: [ConfigModule],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
