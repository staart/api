import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeolocationModule } from '../geolocation/geolocation.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApprovedSubnetController } from './approved-subnets.controller';
import { ApprovedSubnetsService } from './approved-subnets.service';

@Module({
  imports: [PrismaModule, ConfigModule, GeolocationModule],
  controllers: [ApprovedSubnetController],
  providers: [ApprovedSubnetsService],
})
export class ApprovedSubnetsModule {}
