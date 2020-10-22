import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { users } from '@prisma/client';
import { RateLimit } from 'nestjs-rate-limiter';
import { OmitSecrets } from 'src/modules/prisma/prisma.interface';
import { LoginDto, RegisterDto, ResendEmailVerificationDto } from './auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @RateLimit({
    points: 10,
    duration: 60,
    errorMessage: 'Wait for 60 seconds before trying to login again',
  })
  async login(
    @Request() req,
    @Body() _: LoginDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.login(req.user);
  }

  @Post('register')
  @RateLimit({
    points: 10,
    duration: 60,
    errorMessage: 'Wait for 60 seconds before trying to create an account',
  })
  async register(@Body() data: RegisterDto): Promise<OmitSecrets<users>> {
    return this.authService.register(data);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh() {
    return { newToken: 'okay' };
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
