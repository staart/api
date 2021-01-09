import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { MFA_PHONE_OR_TOKEN_REQUIRED } from '../../errors/errors.constants';
import { Expose } from '../../providers/prisma/prisma.interface';
import { Scopes } from '../auth/scope.decorator';
import {
  EnableSmsMfaDto,
  EnableTotpMfaDto,
} from './multi-factor-authentication.dto';
import { MultiFactorAuthenticationService } from './multi-factor-authentication.service';

@Controller('users/:userId/multi-factor-authentication')
export class MultiFactorAuthenticationController {
  constructor(
    private multiFactorAuthenticationService: MultiFactorAuthenticationService,
  ) {}

  /** Disable MFA for a user */
  @Delete()
  @Scopes('user-{userId}:delete-mfa-*')
  async disable2FA(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Expose<User>> {
    return this.multiFactorAuthenticationService.disableMfa(userId);
  }

  /** Regenerate backup codes for a user */
  @Post('regenerate')
  @Scopes('user-{userId}:write-mfa-regenerate')
  async regenerateBackupCodes(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<string[]> {
    return this.multiFactorAuthenticationService.regenerateBackupCodes(userId);
  }

  /** Enable TOTP-based MFA for a user */
  @Post('totp')
  @Scopes('user-{userId}:write-mfa-totp')
  async enableTotp(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: EnableTotpMfaDto,
  ): Promise<string[] | { img: string }> {
    if (body.token)
      return this.multiFactorAuthenticationService.enableMfa(
        'TOTP',
        userId,
        body.token,
      );
    return {
      img: await this.multiFactorAuthenticationService.requestTotpMfa(userId),
    };
  }

  /** Enable SMS-based MFA for a user */
  @Post('sms')
  @Scopes('user-{userId}:write-mfa-sms')
  async enableSms(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: EnableSmsMfaDto,
  ): Promise<string[] | { success: true }> {
    if (body.token)
      return this.multiFactorAuthenticationService.enableMfa(
        'SMS',
        userId,
        body.token,
      );
    if (body.phone) {
      await this.multiFactorAuthenticationService.requestSmsMfa(
        userId,
        body.phone,
      );
      return { success: true };
    }
    throw new BadRequestException(MFA_PHONE_OR_TOKEN_REQUIRED);
  }

  /** Enable email-based MFA for a user */
  @Post('email')
  @Scopes('user-{userId}:write-mfa-email')
  async enableEmail(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: EnableTotpMfaDto,
  ): Promise<string[] | { success: true }> {
    if (body.token)
      return this.multiFactorAuthenticationService.enableMfa(
        'EMAIL',
        userId,
        body.token,
      );
    await this.multiFactorAuthenticationService.requestEmailMfa(userId);
    return { success: true };
  }
}
