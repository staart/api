import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatPostMessageArguments, WebClient } from '@slack/web-api';
import PQueue from 'p-queue';
import pRetry from 'p-retry';
import { Configuration } from '../../config/configuration.interface';

@Injectable()
export class SlackService {
  slack?: WebClient;
  private logger = new Logger(SlackService.name);
  private queue = new PQueue({ concurrency: 1 });

  constructor(private configService: ConfigService) {
    const config = this.configService.get<Configuration['slack']>('slack');
    if (config.token)
      this.slack = new WebClient(config.token, {
        slackApiUrl: config.slackApiUrl,
        rejectRateLimitedCalls: config.rejectRateLimitedCalls,
      });
  }

  send(options: ChatPostMessageArguments) {
    this.queue
      .add(() =>
        pRetry(() => this.sendMessage(options), {
          retries: this.configService.get<number>('slack.retries') ?? 3,
          onFailedAttempt: (error) => {
            this.logger.error(
              `Message to ${options.channel} failed, retrying (${error.retriesLeft} attempts left)`,
              error.name,
            );
          },
        }),
      )
      .then(() => {})
      .catch(() => {});
  }

  private async sendMessage(options: ChatPostMessageArguments) {
    return this.slack?.chat.postMessage(options);
  }
}
