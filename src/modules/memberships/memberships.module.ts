import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GroupMembershipController } from './memberships-group.controller';
import { UserMembershipController } from './memberships-user.controller';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserMembershipController, GroupMembershipController],
  providers: [MembershipsService],
})
export class MembershipsModule {}
