import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { users } from '@prisma/client';
import { Expose } from '../../modules/prisma/prisma.interface';
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

  @Post('regenerate')
  @Scopes('user-{userId}:write-mfa-regenerate')
  async regenerateBackupCodes(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<string[]> {
    return this.multiFactorAuthenticationService.regenerateBackupCodes(userId);
  }

  @Delete()
  @Scopes('user-{userId}:delete-mfa-*')
  async disable2FA(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Expose<users>> {
    return this.multiFactorAuthenticationService.disableMfa(userId);
  }

  @Post('totp')
  @Scopes('user-{userId}:write-mfa-totp')
  async enableTotp(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: EnableTotpMfaDto,
  ): Promise<string[] | string> {
    if (body.token)
      return this.multiFactorAuthenticationService.enableMfa(
        'TOTP',
        userId,
        body.token,
      );
    return this.multiFactorAuthenticationService.requestTotpMfa(userId);
  }

  @Post('sms')
  @Scopes('user-{userId}:write-mfa-sms')
  async enableSms(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: EnableSmsMfaDto,
  ): Promise<string[] | void> {
    if (body.token)
      return this.multiFactorAuthenticationService.enableMfa(
        'SMS',
        userId,
        body.token,
      );
    if (body.phone)
      return this.multiFactorAuthenticationService.requestSmsMfa(
        userId,
        body.phone,
      );
    throw new BadRequestException('Phone number or token is required');
  }

  @Post('email')
  @Scopes('user-{userId}:write-mfa-email')
  async enableEmail(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: EnableTotpMfaDto,
  ): Promise<string[] | void> {
    if (body.token)
      return this.multiFactorAuthenticationService.enableMfa(
        'EMAIL',
        userId,
        body.token,
      );
    return this.multiFactorAuthenticationService.requestEmailMfa(userId);
  }
}
