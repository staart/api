import { IsNotEmpty, IsEmail } from 'class-validator';

export class CreateEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
