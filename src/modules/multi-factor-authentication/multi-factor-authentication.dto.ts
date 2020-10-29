import { IsOptional, IsString } from 'class-validator';

export class EnableTotpMfaDto {
  @IsString()
  @IsOptional()
  token?: string;
}
