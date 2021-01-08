import { MfaMethod } from '@prisma/client';
export declare class UpdateUserDto {
    checkLocationOnLogin?: boolean;
    countryCode?: string;
    gender?: 'MALE' | 'FEMALE' | 'NONBINARY' | 'UNKNOWN';
    name?: string;
    notificationEmails?: 'ACCOUNT' | 'UPDATES' | 'PROMOTIONS';
    newPassword?: string;
    currentPassword?: string;
    ignorePwnedPassword?: boolean;
    prefersLanguage?: string;
    prefersColorScheme?: 'NO_PREFERENCE' | 'LIGHT' | 'DARK';
    prefersReducedMotion?: 'NO_PREFERENCE' | 'REDUCE';
    profilePictureUrl?: string;
    timezone?: string;
    twoFactorMethod?: MfaMethod;
}
