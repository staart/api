import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MembershipController } from './memberships.controller';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [PrismaModule],
  controllers: [MembershipController],
  providers: [MembershipsService],
})
export class MembershipsModule {}
