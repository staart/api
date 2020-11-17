import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from '../../providers/mail/mail.module';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuthModule } from '../auth/auth.module';
import { GroupsModule } from '../groups/groups.module';
import { GroupMembershipController } from './memberships-group.controller';
import { UserMembershipController } from './memberships-user.controller';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    ConfigModule,
    AuthModule,
    GroupsModule,
    ApiKeysModule,
  ],
  controllers: [UserMembershipController, GroupMembershipController],
  providers: [MembershipsService],
})
export class MembershipsModule {}
