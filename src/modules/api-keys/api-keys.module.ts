import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeyController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

@Module({
  imports: [PrismaModule],
  controllers: [ApiKeyController],
  providers: [ApiKeysService],
})
export class ApiKeysModule {}
