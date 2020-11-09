import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@staart/mustache-markdown';
import { promises as fs } from 'fs';
import mem from 'mem';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import PQueue from 'p-queue';
import pRetry from 'p-retry';
import { join } from 'path';
import { MailConfig, MailOptions } from './mail.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transport: Mail;
  private config: MailConfig;
  private queue = new PQueue({ concurrency: 1 });
  private readTemplate = mem(this.readTemplateUnmemoized);

  constructor(private configService: ConfigService) {
    const emailConfig = this.configService.get<MailConfig>('email');
    if (emailConfig) this.config = emailConfig;
    this.transport = nodemailer.createTransport(this.config);
  }

  send(options: Mail.Options & MailOptions) {
    this.queue
      .add(() =>
        pRetry(
          () =>
            this.sendMail({
              ...options,
              from:
                options.from ?? `"${this.config.name}" <${this.config.from}>`,
            }),
          {
            retries: 3,
            onFailedAttempt: (error) => {
              this.logger.error(
                `Mail to ${options.to} failed, retrying (${error.retriesLeft} attempts left)`,
                error.name,
              );
            },
          },
        ),
      )
      .then(() => {})
      .catch(() => {});
  }

  private async sendMail(options: Mail.Options & MailOptions) {
    if (options.template) {
      const layout = await this.readTemplate('layout.html');
      let template = await this.readTemplate(options.template);
      if (template.startsWith('#')) {
        const subject = template.split('\n', 1)[0].replace('#', '').trim();
        if (subject) {
          options.subject = options.subject ?? subject;
          template = template.replace(`# ${template.split('\n', 1)[0]}`, '');
        }
      }
      const [markdown, html] = render(template, options.data);
      options.html = options.noLayout
        ? html
        : render(layout, { content: html })[1];
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
    if (!name.endsWith('.html')) name = `${name}.md`;
    return fs.readFile(join('.', 'src', 'templates', name), 'utf8');
  }
}
