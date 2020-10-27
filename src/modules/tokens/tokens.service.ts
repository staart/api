import { Injectable } from '@nestjs/common';
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
    payload: string | object | Buffer,
    expiresIn?: string,
    options?: SignOptions,
  ) {
    return sign(payload, this.configService.get<string>('security.jwtSecret'), {
      ...options,
      subject,
      expiresIn,
    });
  }

  verify<T>(subject: string, token: string, options?: VerifyOptions) {
    return (verify(
      token,
      this.configService.get<string>('security.jwtSecret'),
      { ...options, subject },
    ) as any) as T;
  }

  decode<T>(token: string, options?: DecodeOptions) {
    return decode(token, options) as T;
  }

  generateUuid() {
    return v4();
  }
}
