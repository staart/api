import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OmitSecrets } from '../prisma/prisma.interface';
import { users } from '@prisma/client';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(email: string, password: string): Promise<OmitSecrets<users>> {
    const user = await this.authService.validateUser(email, password);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
