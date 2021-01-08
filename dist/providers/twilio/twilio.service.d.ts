import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message';
import TwilioClient from 'twilio/lib/rest/Twilio';
export declare class TwilioService {
    private configService;
    client: TwilioClient;
    logger: Logger;
    private smsConfig;
    private queue;
    constructor(configService: ConfigService);
    send(options: MessageListInstanceCreateOptions): void;
    private sendSms;
}
