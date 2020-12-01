import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  decode,
  DecodeOptions,
  sign,
  SignOptions,
  verify,
  VerifyOptions,
} from 'jsonwebtoken';
import { Configuration } from 'src/config/configuration.interface';
import { v4 } from 'uuid';
import { INVALID_TOKEN } from '../../errors/errors.constants';

@Injectable()
export class TokensService {
  private securityConfig = this.configService.get<Configuration['security']>(
    'security',
  );

  constructor(private configService: ConfigService) {}

  signJwt(
    jwtType: string,
    payload: object,
    expiresIn?: string,
    options?: SignOptions,
  ) {
    return sign({ ...payload, typ: jwtType }, this.securityConfig.jwtSecret, {
      ...options,
      expiresIn,
      issuer: this.securityConfig.issuerDomain,
    });
  }

  verify<T>(jwtType: string, token: string, options?: VerifyOptions) {
    try {
      const result = (verify(
        token,
        this.securityConfig.jwtSecret,
        options,
      ) as any) as T;
      if ('typ' in result) {
        if ((result as { typ?: string }).typ !== jwtType) throw new Error();
      } else throw new Error();
      return result;
    } catch (error) {
      throw new UnauthorizedException(INVALID_TOKEN);
    }
  }

  decode<T>(token: string, options?: DecodeOptions) {
    return decode(token, options) as T;
  }

  generateUuid() {
    return v4();
  }
}
