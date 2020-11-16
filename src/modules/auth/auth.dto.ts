import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsLocale,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

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

  @IsIn(['ACCOUNT', 'UPDATES', 'PROMOTIONS'])
  @IsOptional()
  notificationEmails?: 'ACCOUNT' | 'UPDATES' | 'PROMOTIONS';

  @IsString()
  @IsOptional()
  password?: string | null;

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

  @IsBoolean()
  @IsOptional()
  ignorePwnedPassword?: boolean;
}

export class ResendEmailVerificationDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  @IsBoolean()
  @IsOptional()
  ignorePwnedPassword?: boolean;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @IsString()
  @Length(6)
  @IsOptional()
  code?: string;
}

export class TotpLoginDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @Length(6)
  @IsNotEmpty()
  code!: string;
}

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
