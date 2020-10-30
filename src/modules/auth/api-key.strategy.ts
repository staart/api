import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy) {
  constructor(private apiKeysService: ApiKeysService) {
    super(
      { header: 'Authorization', prefix: 'Bearer ' },
      true,
      (apikey: string, done: any) => {
        const checkKey = this.apiKeysService.getApiKeyFromKey(apikey);
        if (!checkKey) return done(false);
        return done(true);
      },
    );
  }
}
