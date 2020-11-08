import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';
import { TokensModule } from '../tokens/tokens.module';
import { ApiKeyGroupController } from './api-keys-group.controller';
import { ApiKeyUserController } from './api-keys-user.controller';
import { ApiKeysService } from './api-keys.service';

@Module({
  imports: [PrismaModule, TokensModule, StripeModule],
  controllers: [ApiKeyGroupController, ApiKeyUserController],
  providers: [ApiKeysService],
})
export class ApiKeysModule {}
