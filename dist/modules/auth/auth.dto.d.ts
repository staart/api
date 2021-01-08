export declare class RegisterDto {
    name: string;
    email: string;
    checkLocationOnLogin?: boolean;
    countryCode?: string;
    gender?: 'MALE' | 'FEMALE' | 'NONBINARY' | 'UNKNOWN';
    notificationEmails?: 'ACCOUNT' | 'UPDATES' | 'PROMOTIONS';
    password?: string | null;
    prefersLanguage?: string;
    prefersColorScheme?: 'NO_PREFERENCE' | 'LIGHT' | 'DARK';
    prefersReducedMotion?: 'NO_PREFERENCE' | 'REDUCE';
    profilePictureUrl?: string;
    timezone?: string;
    ignorePwnedPassword?: boolean;
}
export declare class ResendEmailVerificationDto {
    email: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    password: string;
    ignorePwnedPassword?: boolean;
}
export declare class LoginDto {
    email: string;
    password?: string;
    code?: string;
}
export declare class TotpLoginDto {
    token: string;
    code: string;
}
export declare class VerifyEmailDto {
    token: string;
}
