import { IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class EnableTotpMfaDto {
  @IsString()
  @IsOptional()
  token?: string;
}

export class EnableSmsMfaDto {
  @IsString()
  @IsOptional()
  token?: string;

  @IsPhoneNumber('ZZ')
  @IsOptional()
  phone?: string;
}
