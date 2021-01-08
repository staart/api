import { User } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResendEmailVerificationDto, ResetPasswordDto, TotpLoginDto, VerifyEmailDto } from './auth.dto';
import { TokenResponse, TotpTokenResponse } from './auth.interface';
import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(data: LoginDto, ip: string, userAgent: string): Promise<TokenResponse | TotpTokenResponse>;
    register(ip: string, data: RegisterDto): Promise<Expose<User>>;
    refresh(ip: string, userAgent: string, refreshToken: string): Promise<TokenResponse>;
    logout(refreshToken: string): Promise<void>;
    approveSubnet(ip: string, userAgent: string, token: string): Promise<TokenResponse>;
    resendVerify(data: ResendEmailVerificationDto): Promise<{
        queued: boolean;
    }>;
    verifyEmail(ip: string, userAgent: string, data: VerifyEmailDto): Promise<TokenResponse>;
    forgotPassword(data: ForgotPasswordDto): Promise<{
        queued: boolean;
    }>;
    resetPassword(ip: string, userAgent: string, data: ResetPasswordDto): Promise<TokenResponse>;
    totpLogin(data: TotpLoginDto, ip: string, userAgent: string): Promise<TokenResponse>;
    emailTokenLoginPost(token: string, ip: string, userAgent: string): Promise<TokenResponse>;
    merge(token: string): Promise<{
        success: true;
    }>;
}
