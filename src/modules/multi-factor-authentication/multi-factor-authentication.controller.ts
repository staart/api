import {
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
import { EnableTotpMfaDto } from './multi-factor-authentication.dto';
import { MultiFactorAuthenticationService } from './multi-factor-authentication.service';

@Controller('users/:userId/multi-factor-authentication')
export class MultiFactorAuthenticationController {
  constructor(
    private multiFactorAuthenticationService: MultiFactorAuthenticationService,
  ) {}

  @Post('totp')
  @Scopes('user-{userId}:write-totp')
  async enable2FA(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: EnableTotpMfaDto,
  ): Promise<string[] | string> {
    if (body.token)
      return this.multiFactorAuthenticationService.enableTotpMfa(
        userId,
        body.token,
      );
    return this.multiFactorAuthenticationService.requestTotpMfa(userId);
  }

  @Post('totp/regenerate')
  @Scopes('user-{userId}:write-totp')
  async regenerateBackupCodes(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<string[]> {
    return this.multiFactorAuthenticationService.regenerateBackupCodes(userId);
  }

  @Delete('totp')
  @Scopes('user-{userId}:delete-totp')
  async disable2FA(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Expose<users>> {
    return this.multiFactorAuthenticationService.disableTotpMfa(userId);
  }
}
