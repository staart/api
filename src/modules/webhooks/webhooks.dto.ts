import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  event: string;

  @IsString()
  @IsOptional()
  contentType?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  secret?: string;
}

export class UpdateWebhookDto {
  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  event?: string;

  @IsString()
  @IsOptional()
  contentType?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  secret?: string;
}

export class ReplaceWebhookDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsNotEmpty()
  event!: string;

  @IsString()
  @IsOptional()
  contentType!: string;

  @IsBoolean()
  @IsOptional()
  isActive!: boolean;

  @IsString()
  @IsOptional()
  secret!: string;
}
