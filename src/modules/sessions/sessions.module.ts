import { Module } from '@nestjs/common';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { SessionController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [PrismaModule],
  controllers: [SessionController],
  providers: [SessionsService],
})
export class SessionsModule {}
