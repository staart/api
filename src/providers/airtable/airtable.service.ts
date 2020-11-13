import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Airtable from 'airtable';
import { Configuration } from '../../config/configuration.interface';

@Injectable()
export class AirtableService {
  airtable?: Airtable;
  private logger = new Logger(AirtableService.name);

  constructor(private configService: ConfigService) {
    const config = this.configService.get<Configuration['airtable']>(
      'airtable',
    );
    if (config.apiKey)
      this.airtable = new Airtable({
        apiKey: config.apiKey,
        endpointUrl: config.endpointUrl,
      });
    else this.logger.warn('No Airtable API key set');
  }
}
