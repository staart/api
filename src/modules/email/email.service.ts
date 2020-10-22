import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailConfig } from './email.interface';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class EmailService {
  transport: Mail;

  constructor(private configService: ConfigService) {
    this.transport = nodemailer.createTransport(
      this.configService.get<EmailConfig>('email'),
    );
  }

  async queue() {
    //
  }

  private send() {
    //
  }
}
