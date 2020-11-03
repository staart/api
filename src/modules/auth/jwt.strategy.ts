import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccessTokenClaims, AccessTokenParsed } from './auth.interface';
import { LOGIN_ACCESS_TOKEN } from '../tokens/tokens.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: AccessTokenClaims): Promise<AccessTokenParsed> {
    const { sub, id, scopes } = payload;
    if (sub !== LOGIN_ACCESS_TOKEN) throw new UnauthorizedException();
    return { id, scopes };
  }
}
