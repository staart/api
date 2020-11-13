import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticSearchModule } from '../../providers/elasticsearch/elasticsearch.module';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { TokensModule } from '../../providers/tokens/tokens.module';
import { StripeModule } from '../stripe/stripe.module';
import { ApiKeyGroupController } from './api-keys-group.controller';
import { ApiKeyUserController } from './api-keys-user.controller';
import { ApiKeysService } from './api-keys.service';

@Module({
  imports: [
    PrismaModule,
    TokensModule,
    StripeModule,
    ConfigModule,
    ElasticSearchModule,
  ],
  controllers: [ApiKeyGroupController, ApiKeyUserController],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
