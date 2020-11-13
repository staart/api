import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import ipRangeCheck from 'ip-range-check';
import minimatch from 'minimatch';
import { Strategy } from 'passport-strategy';
import { getClientIp } from 'request-ip';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { LOGIN_ACCESS_TOKEN } from '../../providers/tokens/tokens.constants';
import { TokensService } from '../../providers/tokens/tokens.service';
import { AccessTokenClaims, AccessTokenParsed } from './auth.interface';
import { validate } from 'uuid';

class StaartStrategyName extends Strategy {
  name = 'staart';
}

@Injectable()
export class StaartStrategy extends PassportStrategy(StaartStrategyName) {
  constructor(
    private apiKeyService: ApiKeysService,
    private tokensService: TokensService,
  ) {
    super();
  }

  private safeSuccess(result: AccessTokenParsed) {
    return this.success(result);
  }

  async authenticate(request: Request) {
    /** API key authorization */
    let apiKey = request.query['api_key'] ?? request.headers.authorization;
    if (typeof apiKey === 'string') {
      if (apiKey.startsWith('Bearer ')) apiKey = apiKey.replace('Bearer ', '');
      if (validate(apiKey))
        try {
          const apiKeyDetails = await this.apiKeyService.getApiKeyFromKey(
            apiKey,
          );
          const referer = request.headers.referer;
          if (Array.isArray(apiKeyDetails.referrerRestrictions) && referer) {
            let referrerRestrictionsMet = !apiKeyDetails.referrerRestrictions
              .length;
            apiKeyDetails.referrerRestrictions.forEach((restriction) => {
              referrerRestrictionsMet =
                referrerRestrictionsMet ||
                minimatch(referer, restriction as string);
            });
            if (!referrerRestrictionsMet)
              return this.fail('Referrer restrictions not met', 401);
          }
          if (
            Array.isArray(apiKeyDetails.ipRestrictions) &&
            apiKeyDetails.ipRestrictions.length
          ) {
            const ipAddress = getClientIp(request);
            if (
              !ipRangeCheck(ipAddress, apiKeyDetails.ipRestrictions as string[])
            )
              return this.fail('IP address restrictions not met', 401);
          }
          return this.safeSuccess({
            type: 'api-key',
            id: apiKeyDetails.id,
            scopes: apiKeyDetails.scopes as string[],
          });
        } catch (error) {}
    }

    /** Bearer JWT authorization */
    let bearerToken = request.query['token'] ?? request.headers.authorization;
    if (typeof bearerToken !== 'string')
      return this.fail('No token found', 401);
    if (bearerToken.startsWith('Bearer '))
      bearerToken = bearerToken.replace('Bearer ', '');
    try {
      const payload = this.tokensService.verify(
        LOGIN_ACCESS_TOKEN,
        bearerToken,
      ) as AccessTokenClaims;
      const { id, scopes } = payload;
      return this.safeSuccess({ type: 'user', id, scopes });
    } catch (error) {}

    return this.fail('Invalid token', 401);
  }
}
