import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAccessTokenDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scopes?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ipRestrictions?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  referrerRestrictions?: string[];
}

export class UpdateAccessTokenDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scopes?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ipRestrictions?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  referrerRestrictions?: string[];
}

export class ReplaceAccessTokenDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  scopes: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  ipRestrictions: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  referrerRestrictions: string[];
}
