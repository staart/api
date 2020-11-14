import { Client } from '@googlemaps/google-maps-services-js';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration } from '../../config/configuration.interface';

@Injectable()
export class GoogleMapsService {
  private logger = new Logger(GoogleMapsService.name);
  private config = this.configService.get<Configuration['googleMaps']>(
    'googleMaps',
  );
  client: Client;

  constructor(private configService: ConfigService) {
    if (this.config.apiKey) this.client = new Client();
    else this.logger.warn('Google Maps API key not found');
  }

  autocomplete(query: string, components?: string[]) {
    return this.client.placeAutocomplete({
      params: {
        input: query,
        key: this.config.apiKey,
        components,
      },
    });
  }
}
