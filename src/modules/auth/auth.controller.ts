import { Body, Controller, Post } from '@nestjs/common';
import { users } from '@prisma/client';
import { OmitSecrets } from 'src/modules/prisma/prisma.interface';
import { RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async update(@Body() data: RegisterDto): Promise<OmitSecrets<users>> {
    return this.authService.register(data);
  }
}
