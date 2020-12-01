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
  private slackConfig = this.configService.get<Configuration['slack']>('slack');
  private logger = new Logger(SlackService.name);
  private queue = new PQueue({ concurrency: 1 });

  constructor(private configService: ConfigService) {
    if (this.slackConfig.token)
      this.client = new WebClient(this.slackConfig.token, {
        slackApiUrl: this.slackConfig.slackApiUrl,
        rejectRateLimitedCalls: this.slackConfig.rejectRateLimitedCalls,
      });
  }

  send(options: ChatPostMessageArguments) {
    this.queue
      .add(() =>
        pRetry(() => this.sendMessage(options), {
          retries: this.slackConfig.retries,
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
          retries: this.slackConfig.retries,
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
