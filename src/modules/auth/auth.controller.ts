import { Body, Controller, Headers, Ip, Post } from '@nestjs/common';
import { users } from '@prisma/client';
import { RateLimit } from 'nestjs-rate-limiter';
import { Expose } from 'src/modules/prisma/prisma.interface';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendEmailVerificationDto,
  ResetPasswordDto,
  TotpLoginDto,
  VerifyEmailDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
@Public()
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
    return this.authService.login(
      ip,
      userAgent,
      data.email,
      data.password,
      data.code,
    );
  }

  @Post('register')
  @RateLimit({
    points: 10,
    duration: 60,
    errorMessage: 'Wait for 60 seconds before trying to create an account',
  })
  async register(
    @Ip() ip: string,
    @Body() data: RegisterDto,
  ): Promise<Expose<users>> {
    return this.authService.register(ip, data);
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

  @Post('logout')
  @RateLimit({
    points: 5,
    duration: 60,
    errorMessage: 'Wait for 60 seconds before trying to logout again',
  })
  async logout(@Body('token') refreshToken: string): Promise<void> {
    return this.authService.logout(refreshToken);
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

  @Post('verify-email')
  async verifyEmail(@Body() data: VerifyEmailDto) {
    return this.authService.verifyEmail(data.token);
  }

  @Post('forgot-password')
  @RateLimit({
    points: 10,
    duration: 60,
    errorMessage: 'Wait for 60 seconds before resetting another password',
  })
  async forgotPassword(@Body() data: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(data.email);
  }

  @Post('reset-password')
  @RateLimit({
    points: 10,
    duration: 60,
    errorMessage: 'Wait for 60 seconds before resetting another password',
  })
  async resetPassword(
    @Ip() ip: string,
    @Headers('User-Agent') userAgent: string,
    @Body() data: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(
      ip,
      userAgent,
      data.token,
      data.password,
      data.ignorePwnedPassword,
    );
  }

  @Post('totp-login')
  @RateLimit({
    points: 10,
    duration: 60,
    errorMessage: 'Wait for 60 seconds before trying to login again',
  })
  async totpLogin(
    @Body() data: TotpLoginDto,
    @Ip() ip: string,
    @Headers('User-Agent') userAgent: string,
  ): Promise<{ accessToken: string }> {
    return this.authService.loginWithTotp(ip, userAgent, data.token, data.code);
  }
}
