import { Body, Controller, Headers, Ip, Post } from '@nestjs/common';
import { User } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResendEmailVerificationDto,
  ResetPasswordDto,
  TotpLoginDto,
  VerifyEmailDto,
} from './auth.dto';
import { TokenResponse, TotpTokenResponse } from './auth.interface';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { RateLimit } from './rate-limit.decorator';

@Controller('auth')
@Public()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @RateLimit(10)
  async login(
    @Body() data: LoginDto,
    @Ip() ip: string,
    @Headers('User-Agent') userAgent: string,
  ): Promise<TokenResponse | TotpTokenResponse> {
    return this.authService.login(
      ip,
      userAgent,
      data.email,
      data.password,
      data.code,
    );
  }

  @Post('register')
  @RateLimit(10)
  async register(
    @Ip() ip: string,
    @Body() data: RegisterDto,
  ): Promise<Expose<User>> {
    return this.authService.register(ip, data);
  }

  @Post('refresh')
  @RateLimit(5)
  async refresh(
    @Ip() ip: string,
    @Headers('User-Agent') userAgent: string,
    @Body('token') refreshToken: string,
  ): Promise<TokenResponse> {
    return this.authService.refresh(ip, userAgent, refreshToken);
  }

  @Post('logout')
  @RateLimit(5)
  async logout(@Body('token') refreshToken: string): Promise<void> {
    return this.authService.logout(refreshToken);
  }

  @Post('approve-subnet')
  @RateLimit(5)
  async approveSubnet(
    @Ip() ip: string,
    @Headers('User-Agent') userAgent: string,
    @Body('token') token: string,
  ): Promise<TokenResponse> {
    return this.authService.approveSubnet(ip, userAgent, token);
  }

  @Post('resend-email-verification')
  @RateLimit(10)
  async resendVerify(@Body() data: ResendEmailVerificationDto) {
    return this.authService.sendEmailVerification(data.email, true);
  }

  @Post('verify-email')
  async verifyEmail(
    @Ip() ip: string,
    @Headers('User-Agent') userAgent: string,
    @Body() data: VerifyEmailDto,
  ): Promise<TokenResponse> {
    return this.authService.verifyEmail(ip, userAgent, data.token);
  }

  @Post('forgot-password')
  @RateLimit(10)
  async forgotPassword(@Body() data: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(data.email);
  }

  @Post('reset-password')
  @RateLimit(10)
  async resetPassword(
    @Ip() ip: string,
    @Headers('User-Agent') userAgent: string,
    @Body() data: ResetPasswordDto,
  ): Promise<TokenResponse> {
    return this.authService.resetPassword(
      ip,
      userAgent,
      data.token,
      data.password,
      data.ignorePwnedPassword,
    );
  }

  @Post('login/totp')
  @RateLimit(10)
  async totpLogin(
    @Body() data: TotpLoginDto,
    @Ip() ip: string,
    @Headers('User-Agent') userAgent: string,
  ): Promise<TokenResponse> {
    return this.authService.loginWithTotp(ip, userAgent, data.token, data.code);
  }

  @Post('login/token')
  @RateLimit(10)
  async emailTokenLoginPost(
    @Body('token') token: string,
    @Ip() ip: string,
    @Headers('User-Agent') userAgent: string,
  ): Promise<TokenResponse> {
    return this.authService.loginWithEmailToken(ip, userAgent, token);
  }

  @Post('merge-accounts')
  @RateLimit(10)
  async merge(@Body('token') token: string): Promise<{ success: true }> {
    return this.authService.mergeUsers(token);
  }
}
