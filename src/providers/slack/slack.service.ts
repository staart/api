import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChatPostMessageArguments,
  WebAPICallResult,
  WebClient,
} from '@slack/web-api';
import PQueue from 'p-queue';
import pRetry from 'p-retry';
import { Configuration } from '../../config/configuration.interface';

@Injectable()
export class SlackService {
  client?: WebClient;
  private logger = new Logger(SlackService.name);
  private queue = new PQueue({ concurrency: 1 });

  constructor(private configService: ConfigService) {
    const config = this.configService.get<Configuration['slack']>('slack');
    if (config.token)
      this.client = new WebClient(config.token, {
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

  sendToChannel(channelName: string, text: string) {
    this.queue
      .add(() =>
        pRetry(() => this.sendMessageToChannel(channelName, text), {
          retries: this.configService.get<number>('slack.retries') ?? 3,
          onFailedAttempt: (error) => {
            this.logger.error(
              `Message to ${channelName} failed, retrying (${error.retriesLeft} attempts left)`,
              error.name,
            );
          },
        }),
      )
      .then(() => {})
      .catch(() => {});
  }

  private async sendMessageToChannel(channelName: string, text: string) {
    const conversations = (await this.client?.conversations.list()) as WebAPICallResult & {
      channels: { name: string; id: string }[];
    };
    const channel = conversations.channels.find(
      (channel) => channel.name === channelName,
    );
    const options: ChatPostMessageArguments = { text, channel: channel.id };
    return this.client?.chat.postMessage(options);
  }
  private async sendMessage(options: ChatPostMessageArguments) {
    return this.client?.chat.postMessage(options);
  }
}
