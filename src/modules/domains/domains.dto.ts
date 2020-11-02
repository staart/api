import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDomainDto {
  @IsString()
  @IsNotEmpty()
  domain: string;
}
