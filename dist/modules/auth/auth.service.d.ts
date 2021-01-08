import { ConfigService } from '@nestjs/config';
import { MfaMethod, User } from '@prisma/client';
import { GeolocationService } from '../../providers/geolocation/geolocation.service';
import { MailService } from '../../providers/mail/mail.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { PwnedService } from '../../providers/pwned/pwned.service';
import { TokensService } from '../../providers/tokens/tokens.service';
import { TwilioService } from '../../providers/twilio/twilio.service';
import { ApprovedSubnetsService } from '../approved-subnets/approved-subnets.service';
import { RegisterDto } from './auth.dto';
import { TokenResponse, TotpTokenResponse } from './auth.interface';
export declare class AuthService {
    private prisma;
    private email;
    private configService;
    private pwnedService;
    private tokensService;
    private geolocationService;
    private approvedSubnetsService;
    private twilioService;
    private authenticator;
    private securityConfig;
    private metaConfig;
    constructor(prisma: PrismaService, email: MailService, configService: ConfigService, pwnedService: PwnedService, tokensService: TokensService, geolocationService: GeolocationService, approvedSubnetsService: ApprovedSubnetsService, twilioService: TwilioService);
    login(ipAddress: string, userAgent: string, email: string, password?: string, code?: string): Promise<TokenResponse | TotpTokenResponse>;
    register(ipAddress: string, _data: RegisterDto): Promise<Expose<User>>;
    sendEmailVerification(email: string, resend?: boolean): Promise<{
        queued: boolean;
    }>;
    refresh(ipAddress: string, userAgent: string, token: string): Promise<TokenResponse>;
    logout(token: string): Promise<void>;
    approveSubnet(ipAddress: string, userAgent: string, token: string): Promise<TokenResponse>;
    getTotpQrCode(userId: number): Promise<string>;
    enableMfaMethod(method: MfaMethod, userId: number, code: string): Promise<Expose<User>>;
    loginWithTotp(ipAddress: string, userAgent: string, token: string, code: string): Promise<TokenResponse>;
    loginWithEmailToken(ipAddress: string, userAgent: string, token: string): Promise<TokenResponse>;
    requestPasswordReset(email: string): Promise<{
        queued: boolean;
    }>;
    resetPassword(ipAddress: string, userAgent: string, token: string, password: string, ignorePwnedPassword?: boolean): Promise<TokenResponse>;
    verifyEmail(ipAddress: string, userAgent: string, token: string): Promise<TokenResponse>;
    getOneTimePassword(secret: string): string;
    private loginUserWithTotpCode;
    private getAccessToken;
    private loginResponse;
    private mfaResponse;
    private checkLoginSubnet;
    hashAndValidatePassword(password: string, ignorePwnedPassword: boolean): Promise<string>;
    getScopes(user: User): Promise<string[]>;
    private recursivelyGetSubgroupIds;
    mergeUsers(token: string): Promise<{
        success: true;
    }>;
    private merge;
}
