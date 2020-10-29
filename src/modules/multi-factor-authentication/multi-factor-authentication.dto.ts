import { IsOptional, IsString } from 'class-validator';

export class EnableTwoFactorAuthenticationDto {
  @IsString()
  @IsOptional()
  token?: string;
}
