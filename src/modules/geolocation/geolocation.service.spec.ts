import { ConfigService } from '@nestjs/config';
import { GeolocationService } from './geolocation.service';

const geolocationService = new GeolocationService(new ConfigService());

describe('GeolocationService', () => {
  describe('getLocation', () => {
    it('gets geolocation', async () => {
      const geolocation = await geolocationService.getLocation(
        '182.64.221.140',
      );
      expect(geolocation).toBeDefined();
    });

    it('gets country in result', async () => {
      const geolocation = await geolocationService.getLocation(
        '182.64.221.140',
      );
      expect(geolocation.country).toBeDefined();
    });

    it('gets correct country', async () => {
      const geolocation = await geolocationService.getLocation(
        '182.64.221.140',
      );
      expect(geolocation.country.iso_code).toBe('IN');
    });

    it('gets correct timezone', async () => {
      const geolocation = await geolocationService.getLocation(
        '182.64.221.140',
      );
      expect(geolocation.location.time_zone).toBe('Asia/Kolkata');
    });
  });

  afterAll(() => {
    geolocationService.onModuleDestroy();
  });
});
