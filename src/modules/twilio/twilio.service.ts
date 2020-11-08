import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import PQueue from 'p-queue';
import pRetry from 'p-retry';
import TwilioClient from 'twilio/lib/rest/Twilio';
import { MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message';

@Injectable()
export class TwilioService {
  twilio: TwilioClient;
  logger = new Logger(TwilioService.name);
  private queue = new PQueue({ concurrency: 1 });

  constructor(private configService: ConfigService) {
    const twilioAccountSid = this.configService.get<string>(
      'sms.twilioAccountSid',
    );
    const twilioAuthToken = this.configService.get<string>(
      'sms.twilioAuthToken',
    );
    if (!twilioAccountSid || !twilioAuthToken)
      this.logger.warn('Twilio account SID/auth token not found');
    this.twilio = twilio(twilioAccountSid ?? '', twilioAuthToken ?? '');
  }

  send(options: MessageListInstanceCreateOptions) {
    this.queue
      .add(() =>
        pRetry(() => this.sendSms(options), {
          retries: 3,
          onFailedAttempt: (error) => {
            this.logger.error(
              `SMS to ${options.to} failed, retrying (${error.retriesLeft} attempts left)`,
              error.name,
            );
          },
        }),
      )
      .then(() => {})
      .catch(() => {});
  }

  private async sendSms(options: MessageListInstanceCreateOptions) {
    return this.twilio.messages.create(options);
  }
}
