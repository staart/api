import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GroupController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [PrismaModule],
  controllers: [GroupController],
  providers: [GroupsService],
})
export class GroupsModule {}
