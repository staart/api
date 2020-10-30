import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ApprovedSubnetController } from './approved-subnets.controller';
import { ApprovedSubnetsService } from './approved-subnets.service';

@Module({
  imports: [PrismaModule],
  controllers: [ApprovedSubnetController],
  providers: [ApprovedSubnetsService],
})
export class ApprovedSubnetsModule {}
