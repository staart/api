import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserMembershipController } from './memberships-user.controller';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserMembershipController],
  providers: [MembershipsService],
})
export class MembershipsModule {}
