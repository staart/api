import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailConfig, EmailOptions } from './email.interface';
import PQueue from 'p-queue';
import pRetry from 'p-retry';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class EmailService {
  transport: Mail;
  config: EmailConfig;
  queue = new PQueue({ concurrency: 1 });

  constructor(private configService: ConfigService) {
    this.config = this.configService.get<EmailConfig>('email');
    this.transport = nodemailer.createTransport(this.config);
  }

  send(options: Mail.Options & EmailOptions) {
    this.queue.add(() =>
      pRetry(
        () =>
          this.sendEmail({
            ...options,
            from: options.from ?? `"${this.config.name}" <${this.config.from}>`,
          }),
        {
          retries: 3,
          onFailedAttempt: error => {
            console.log(
              `Email to ${options.to} failed, retrying (${error.retriesLeft} attempts left)`,
              error.name,
            );
          },
        },
      ),
    );
  }

  private async sendEmail(options: Mail.Options) {
    return this.transport.sendMail(options);
  }
}
