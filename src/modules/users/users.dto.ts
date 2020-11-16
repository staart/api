import { MfaMethod } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsLocale,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsBoolean()
  @IsOptional()
  checkLocationOnLogin?: boolean;

  @IsString()
  @Length(2, 2)
  @IsOptional()
  countryCode?: string;

  @IsString()
  @IsIn(['MALE', 'FEMALE', 'NONBINARY', 'UNKNOWN'])
  @IsOptional()
  gender?: 'MALE' | 'FEMALE' | 'NONBINARY' | 'UNKNOWN';

  @IsString()
  @MinLength(3)
  @IsOptional()
  name?: string;

  @IsIn(['ACCOUNT', 'UPDATES', 'PROMOTIONS'])
  @IsOptional()
  notificationEmails?: 'ACCOUNT' | 'UPDATES' | 'PROMOTIONS';

  @IsString()
  @IsOptional()
  newPassword?: string;

  @IsString()
  @IsOptional()
  currentPassword?: string;

  @IsBoolean()
  @IsOptional()
  ignorePwnedPassword?: boolean;

  @IsLocale()
  @IsOptional()
  prefersLanguage?: string;

  @IsString()
  @IsIn(['NO_PREFERENCE', 'LIGHT', 'DARK'])
  @IsOptional()
  prefersColorScheme?: 'NO_PREFERENCE' | 'LIGHT' | 'DARK';

  @IsString()
  @IsIn(['NO_PREFERENCE', 'REDUCE'])
  @IsOptional()
  prefersReducedMotion?: 'NO_PREFERENCE' | 'REDUCE';

  @IsUrl()
  @IsOptional()
  profilePictureUrl?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsEnum(['NONE', 'TOTP', 'EMAIL'])
  @IsOptional()
  twoFactorMethod?: MfaMethod;
}
