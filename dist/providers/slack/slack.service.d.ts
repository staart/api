import { ConfigService } from '@nestjs/config';
import { ChatPostMessageArguments, WebClient } from '@slack/web-api';
export declare class SlackService {
    private configService;
    client?: WebClient;
    private slackConfig;
    private logger;
    private queue;
    constructor(configService: ConfigService);
    send(options: ChatPostMessageArguments): void;
    sendToChannel(channelName: string, text: string): void;
    private sendMessageToChannel;
    private sendMessage;
}
