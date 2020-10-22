import {
  IsBoolean,
  IsIn,
  IsLocale,
  IsObject,
  IsString,
  IsUrl,
  Length,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsBoolean()
  checkLocationOnLogin: boolean;

  @IsString()
  @Length(2, 2)
  countryCode: string;

  @IsString()
  @IsIn(['MALE', 'FEMALE', 'NONBINARY', 'UNKNOWN'])
  gender: 'MALE' | 'FEMALE' | 'NONBINARY' | 'UNKNOWN';

  @IsString()
  @MinLength(3)
  name: string;

  @IsIn(['ACCOUNT', 'UPDATES', 'PROMOTIONS'])
  notificationEmails: 'ACCOUNT' | 'UPDATES' | 'PROMOTIONS';

  @IsString()
  password: string | null;

  @IsLocale()
  prefersLanguage: string;

  @IsString()
  @IsIn(['NO_PREFERENCE', 'LIGHT', 'DARK'])
  prefersColorScheme: 'NO_PREFERENCE' | 'LIGHT' | 'DARK';

  @IsString()
  @IsIn(['NO_PREFERENCE', 'REDUCE'])
  prefersReducedMotion: 'NO_PREFERENCE' | 'REDUCE';

  @IsUrl()
  profilePictureUrl: string;

  @IsString()
  timezone: string;

  @IsBoolean()
  twoFactorEnabled: boolean;

  @IsObject()
  attributes: Record<string, any>;
}
