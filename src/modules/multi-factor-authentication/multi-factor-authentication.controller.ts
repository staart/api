import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { users } from '@prisma/client';
import { Expose } from 'src/modules/prisma/prisma.interface';
import { Scopes } from '../auth/scope.decorator';
import { EnableTwoFactorAuthenticationDto } from './multi-factor-authentication.dto';
import { MultiFactorAuthenticationService } from './multi-factor-authentication.service';

@Controller('users/:userId/multi-factor-authentication')
export class MultiFactorAuthenticationController {
  constructor(
    private multiFactorAuthenticationService: MultiFactorAuthenticationService,
  ) {}

  @Post('2fa')
  @Scopes('user-{userId}:write-2fa')
  async enable2FA(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: EnableTwoFactorAuthenticationDto,
  ): Promise<Expose<users> | string> {
    if (body.token)
      return this.multiFactorAuthenticationService.enableTwoFactorAuthentication(
        userId,
        body.token,
      );
    return this.multiFactorAuthenticationService.requestTwoFactorAuthentication(
      userId,
    );
  }

  @Delete('2fa')
  @Scopes('user-{userId}:delete-2fa')
  async disable2FA(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Expose<users>> {
    return this.multiFactorAuthenticationService.disableTwoFactorAuthentication(
      userId,
    );
  }
}
