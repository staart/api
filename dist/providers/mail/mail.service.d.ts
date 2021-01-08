import { ConfigService } from '@nestjs/config';
import Mail from 'nodemailer/lib/mailer';
import { MailOptions } from './mail.interface';
export declare class MailService {
    private configService;
    private readonly logger;
    private transport;
    private emailConfig;
    private queue;
    private readTemplate;
    constructor(configService: ConfigService);
    send(options: Mail.Options & MailOptions): void;
    private sendMail;
    private readTemplateUnmemoized;
}
