import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../../providers/email/email.module';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { GroupMembershipController } from './memberships-group.controller';
import { UserMembershipController } from './memberships-user.controller';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [PrismaModule, EmailModule, ConfigModule, AuthModule],
  controllers: [UserMembershipController, GroupMembershipController],
  providers: [MembershipsService],
})
export class MembershipsModule {}
