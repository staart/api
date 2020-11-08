import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeolocationService } from './geolocation.service';

@Module({
  imports: [ConfigModule],
  providers: [GeolocationService],
  exports: [GeolocationService],
})
export class GeolocationModule {}
