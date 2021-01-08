import { ConfigService } from '@nestjs/config';
import { DecodeOptions, SignOptions, VerifyOptions } from 'jsonwebtoken';
export declare class TokensService {
    private configService;
    private securityConfig;
    constructor(configService: ConfigService);
    signJwt(jwtType: string, payload: object, expiresIn?: string, options?: SignOptions): string;
    verify<T>(jwtType: string, token: string, options?: VerifyOptions): T;
    decode<T>(token: string, options?: DecodeOptions): T;
    generateUuid(): string;
}
