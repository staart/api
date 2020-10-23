import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccessTokenClaims, AccessTokenParsed } from './auth.interface';

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
    const { sub, scopes } = payload;
    const id = Number(sub.replace('user', ''));
    if (isNaN(id)) throw new UnauthorizedException();
    return { id, scopes };
  }
}
