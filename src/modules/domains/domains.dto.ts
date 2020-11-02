import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDomainDto {
  @IsString()
  @IsNotEmpty()
  domain: string;
}
