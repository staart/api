import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateGroupDto {
  @IsBoolean()
  @IsOptional()
  autoJoinDomain?: boolean;

  @IsBoolean()
  @IsOptional()
  forceTwoFactor?: boolean;

  @IsArray()
  @IsOptional()
  ipRestrictions?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsBoolean()
  @IsOptional()
  onlyAllowDomain?: boolean;

  @IsString()
  @IsOptional()
  profilePictureUrl?: string;
}

export class UpdateGroupDto {
  @IsBoolean()
  @IsOptional()
  autoJoinDomain?: boolean;

  @IsBoolean()
  @IsOptional()
  forceTwoFactor?: boolean;

  @IsArray()
  @IsOptional()
  ipRestrictions?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  onlyAllowDomain?: boolean;

  @IsString()
  @IsOptional()
  profilePictureUrl?: string;
}

export class ReplaceGroupDto {
  @IsBoolean()
  @IsNotEmpty()
  autoJoinDomain!: boolean;

  @IsBoolean()
  @IsNotEmpty()
  forceTwoFactor!: boolean;

  @IsArray()
  @IsNotEmpty()
  ipRestrictions!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsBoolean()
  @IsNotEmpty()
  onlyAllowDomain!: boolean;

  @IsString()
  @IsNotEmpty()
  profilePictureUrl!: string;

  @IsObject()
  @IsNotEmpty()
  attributes!: Record<string, any>;
}
