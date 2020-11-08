import { Module } from '@nestjs/common';
import { ErrorsService } from './errors.service';

@Module({
  providers: [ErrorsService],
  exports: [ErrorsService],
})
export class ErrorsModule {}
