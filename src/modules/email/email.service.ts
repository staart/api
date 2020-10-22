import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailConfig, EmailOptions } from './email.interface';
import PQueue from 'p-queue';
import pRetry from 'p-retry';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { promises as fs } from 'fs';
import { join } from 'path';
import mem from 'mem';
import { render } from '@staart/mustache-markdown';

@Injectable()
export class EmailService {
  transport: Mail;
  config: EmailConfig;
  queue = new PQueue({ concurrency: 1 });
  readTemplate = mem(this.readTemplateUnmemoized);

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

  private async sendEmail(options: Mail.Options & EmailOptions) {
    if (options.template) {
      const template = await this.readTemplate(options.template);
      const [markdown, html] = render(template, options.data);
      options.html = html;
      options.text = markdown;
      options.alternatives = [
        {
          contentType: 'text/x-web-markdown',
          content: markdown,
        },
      ];
    }
    return this.transport.sendMail(options);
  }

  private async readTemplateUnmemoized(name: string) {
    return fs.readFile(join('.', 'src', 'templates', `${name}.md`), 'utf8');
  }
}
