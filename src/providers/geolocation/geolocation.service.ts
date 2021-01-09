import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import geolite2 from 'geolite2-redist';
import maxmind, { CityResponse, Reader } from 'maxmind';
import QuickLRU from 'quick-lru';

@Injectable()
export class GeolocationService implements OnModuleDestroy {
  constructor(private configService: ConfigService) {}

  private lookup: Reader<CityResponse> | null = null;
  private lru = new QuickLRU<string, Partial<CityResponse>>({
    maxSize:
      this.configService.get<number>('caching.geolocationLruSize') ?? 100,
  });

  onModuleDestroy() {
    if (this.lookup) this.lookup = null;
  }

  /** Get the geolocation from an IP address */
  async getLocation(ipAddress: string): Promise<Partial<CityResponse>> {
    if (this.lru.has(ipAddress)) return this.lru.get(ipAddress) ?? {};
    const result = await this.getSafeLocation(ipAddress);
    this.lru.set(ipAddress, result);
    return result;
  }

  private async getSafeLocation(
    ipAddress: string,
  ): Promise<Partial<CityResponse>> {
    try {
      return this.getUnsafeLocation(ipAddress);
    } catch (error) {
      return {};
    }
  }

  private async getUnsafeLocation(
    ipAddress: string,
  ): Promise<Partial<CityResponse>> {
    if (!this.lookup)
      this.lookup = await geolite2.open<CityResponse>('GeoLite2-City', (path) =>
        maxmind.open(path),
      );
    return this.lookup.get(ipAddress) ?? {};
  }
}
