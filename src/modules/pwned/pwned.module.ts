import { Module } from '@nestjs/common';
import { PwnedService } from './pwned.service';

@Module({
  providers: [PwnedService],
  exports: [PwnedService],
})
export class PwnedModule {}
