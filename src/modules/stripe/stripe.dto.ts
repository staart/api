import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

class Address {
  @IsString()
  @IsNotEmpty()
  line1!: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  @Length(2)
  country?: string;

  @IsString()
  @IsOptional()
  line2?: string;

  @IsString()
  @IsOptional()
  postal_code?: string;

  @IsString()
  @IsOptional()
  state?: string;
}

export class CreateBillingDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  promotion_code?: string;

  @IsObject()
  @ValidateNested()
  @IsOptional()
  address?: Address;
}

export class UpdateBillingDto {
  @IsString()
  @IsOptional()
  default_source?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  promotion_code?: string;

  @IsObject()
  @ValidateNested()
  @IsOptional()
  address?: Address;
}

export class ReplaceBillingDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsObject()
  @ValidateNested()
  address!: Address;
}
