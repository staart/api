import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeolocationModule } from '../../providers/geolocation/geolocation.module';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { ApprovedSubnetController } from './approved-subnets.controller';
import { ApprovedSubnetsService } from './approved-subnets.service';

@Module({
  imports: [PrismaModule, ConfigModule, GeolocationModule],
  controllers: [ApprovedSubnetController],
  providers: [ApprovedSubnetsService],
})
export class ApprovedSubnetsModule {}
