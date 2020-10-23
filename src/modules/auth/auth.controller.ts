import { Body, Controller, Headers, Ip, Post } from '@nestjs/common';
import { users } from '@prisma/client';
import { RateLimit } from 'nestjs-rate-limiter';
import { Expose } from 'src/modules/prisma/prisma.interface';
import { LoginDto, RegisterDto, ResendEmailVerificationDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @RateLimit({
    points: 10,
    duration: 60,
    errorMessage: 'Wait for 60 seconds before trying to login again',
  })
  async login(
    @Body() data: LoginDto,
    @Ip() ip: string,
    @Headers('User-Agent') userAgent: string,
  ): Promise<{ accessToken: string }> {
    return this.authService.login(ip, userAgent, data.email, data.password);
  }

  @Post('register')
  @RateLimit({
    points: 10,
    duration: 60,
    errorMessage: 'Wait for 60 seconds before trying to create an account',
  })
  async register(@Body() data: RegisterDto): Promise<Expose<users>> {
    return this.authService.register(data);
  }

  @Post('refresh')
  @RateLimit({
    points: 5,
    duration: 60,
    errorMessage: 'Wait for 60 seconds before trying to login again',
  })
  async refresh(
    @Ip() ip: string,
    @Headers('User-Agent') userAgent: string,
    @Body('token') refreshToken: string,
  ): Promise<{ accessToken: string }> {
    return this.authService.refresh(ip, userAgent, refreshToken);
  }

  @Post('resend-email-verification')
  @RateLimit({
    points: 1,
    duration: 60,
    errorMessage: 'Wait for 60 seconds before requesting another email',
  })
  async resendVerify(@Body() data: ResendEmailVerificationDto) {
    return this.authService.sendEmailVerification(data.email, true);
  }
}
