import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

@Injectable()
export class TwilioService {
  twilio: Twilio;
  logger = new Logger('twilio');

  constructor(private configService: ConfigService) {
    const twilioApiKey = this.configService.get<string>('sms.twilioApiKey');
    if (!twilioApiKey) this.logger.warn('Twilio API key not found');
    this.twilio = new Twilio(twilioApiKey ?? '', {
      apiVersion: '2020-08-27',
    });
  }
}
