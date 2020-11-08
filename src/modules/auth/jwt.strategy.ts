import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { verify } from 'jsonwebtoken';
import { Strategy } from 'passport-strategy';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { LOGIN_ACCESS_TOKEN } from '../tokens/tokens.constants';
import { AccessTokenClaims } from './auth.interface';

class StaartStrategy extends Strategy {
  name = 'jwt';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(StaartStrategy) {
  constructor(private apiKeyService: ApiKeysService) {
    super();
  }

  async authenticate(request: Request) {
    /** API key authorization */
    let apiKey =
      request.query['api_key'] ??
      request.headers['x-api-key'] ??
      request.headers.authorization;
    if (typeof apiKey === 'string') {
      if (apiKey.startsWith('Bearer ')) apiKey = apiKey.replace('Bearer ', '');
      const apiKeyDetails = await this.apiKeyService.getApiKeyFromKey(apiKey);
      if (apiKeyDetails)
        return this.success({
          type: 'api-key',
          id: apiKeyDetails.id,
          scopes: apiKeyDetails.scopes,
        });
    }

    /** Bearer JWT authorization */
    let bearerToken = request.headers.authorization;
    if (typeof bearerToken !== 'string')
      return this.fail('No token found', 401);
    if (bearerToken.startsWith('Bearer '))
      bearerToken = bearerToken.replace('Bearer ', '');
    try {
      const payload = verify(
        bearerToken,
        process.env.JWT_SECRET,
      ) as AccessTokenClaims;
      const { sub, id, scopes } = payload;
      if (sub !== LOGIN_ACCESS_TOKEN) throw new UnauthorizedException();
      return this.success({ type: 'user', id, scopes });
    } catch (error) {}

    return this.fail('Unable to parse token', 401);
  }
}
