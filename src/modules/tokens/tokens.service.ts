import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';
import {
  sign,
  decode,
  verify,
  SignOptions,
  VerifyOptions,
  DecodeOptions,
} from 'jsonwebtoken';

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
      throw new UnauthorizedException('This token is invalid');
    }
  }

  decode<T>(token: string, options?: DecodeOptions) {
    return decode(token, options) as T;
  }

  generateUuid() {
    return v4();
  }
}
