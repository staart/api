import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { verify } from 'jsonwebtoken';
import { Strategy } from 'passport-strategy';
import { LOGIN_ACCESS_TOKEN } from '../tokens/tokens.constants';
import { AccessTokenClaims, AccessTokenParsed } from './auth.interface';

class StaartStrategy extends Strategy {
  name = 'jwt';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(StaartStrategy) {
  constructor() {
    super();
  }

  authenticate(request: Request) {
    const bearerToken = request.headers.authorization;
    if (typeof bearerToken !== 'string')
      return this.fail('No token found', 401);
    const matches = bearerToken.match(/(\S+)\s+(\S+)/);
    if (matches) {
      const token = matches[2];
      if (!token) return this.fail('No token found', 401);
      try {
        return this.success(verify(token, process.env.JWT_SECRET));
      } catch (error) {}
    }
    return this.fail('Unable to parse token', 401);
  }

  async validate(payload: AccessTokenClaims): Promise<AccessTokenParsed> {
    console.log('got here');
    const { sub, id, scopes } = payload;
    if (sub !== LOGIN_ACCESS_TOKEN) throw new UnauthorizedException();
    return { id, scopes };
  }
}
