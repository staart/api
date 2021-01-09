import { Module } from '@nestjs/common';
import { MetaController } from './meta.controller';

@Module({
  controllers: [MetaController],
})
export class MetaModule {}
