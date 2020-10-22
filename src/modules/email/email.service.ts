import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailConfig } from './email.interface';

@Injectable()
export class EmailService {
  emailConfig: EmailConfig;

  constructor(private configService: ConfigService) {
    this.emailConfig = this.configService.get<EmailConfig>('email');
  }
}
