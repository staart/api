import { ConfigService } from '@nestjs/config';
import type { MfaMethod } from '@prisma/client';
import { User } from '@prisma/client';
import { MailService } from '../../providers/mail/mail.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { TokensService } from '../../providers/tokens/tokens.service';
import { TwilioService } from '../../providers/twilio/twilio.service';
import { AuthService } from '../auth/auth.service';
export declare class MultiFactorAuthenticationService {
    private prisma;
    private auth;
    private configService;
    private twilioService;
    private emailService;
    private tokensService;
    constructor(prisma: PrismaService, auth: AuthService, configService: ConfigService, twilioService: TwilioService, emailService: MailService, tokensService: TokensService);
    requestTotpMfa(userId: number): Promise<string>;
    requestSmsMfa(userId: number, phone: string): Promise<void>;
    requestEmailMfa(userId: number): Promise<void>;
    enableMfa(method: MfaMethod, userId: number, token: string): Promise<string[]>;
    disableMfa(userId: number): Promise<Expose<User>>;
    regenerateBackupCodes(id: number): Promise<string[]>;
}
