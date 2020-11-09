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
import { v4 } from 'uuid';
import { INVALID_TOKEN } from '../../errors/errors.constants';

@Injectable()
export class TokensService {
  constructor(private configService: ConfigService) {}

  signJwt(
    subject: string,
    payload: number | string | object | Buffer,
    expiresIn?: string,
    options?: SignOptions,
  ) {
    if (typeof payload === 'number') payload = payload.toString();
    return sign(
      payload,
      this.configService.get<string>('security.jwtSecret') ?? '',
      {
        ...options,
        subject,
        expiresIn,
      },
    );
  }

  verify<T>(subject: string, token: string, options?: VerifyOptions) {
    try {
      return (verify(
        token,
        this.configService.get<string>('security.jwtSecret') ?? '',
        { ...options, subject },
      ) as any) as T;
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
