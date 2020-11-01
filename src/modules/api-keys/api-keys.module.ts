import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TokensService } from '../tokens/tokens.service';
import { ApiKeyController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

@Module({
  imports: [PrismaModule, TokensService],
  controllers: [ApiKeyController],
  providers: [ApiKeysService],
})
export class ApiKeysModule {}
