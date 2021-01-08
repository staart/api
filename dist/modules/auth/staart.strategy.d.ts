import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Strategy } from 'passport-strategy';
import { TokensService } from '../../providers/tokens/tokens.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
declare class StaartStrategyName extends Strategy {
    name: string;
}
declare const StaartStrategy_base: new (...args: any[]) => StaartStrategyName;
export declare class StaartStrategy extends StaartStrategy_base {
    private apiKeyService;
    private tokensService;
    private configService;
    constructor(apiKeyService: ApiKeysService, tokensService: TokensService, configService: ConfigService);
    private safeSuccess;
    authenticate(request: Request): Promise<void>;
}
export {};
