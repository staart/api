"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaartStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const ip_range_check_1 = __importDefault(require("ip-range-check"));
const minimatch_1 = __importDefault(require("minimatch"));
const passport_strategy_1 = require("passport-strategy");
const request_ip_1 = require("request-ip");
const uuid_1 = require("uuid");
const tokens_constants_1 = require("../../providers/tokens/tokens.constants");
const tokens_service_1 = require("../../providers/tokens/tokens.service");
const api_keys_service_1 = require("../api-keys/api-keys.service");
class StaartStrategyName extends passport_strategy_1.Strategy {
    constructor() {
        super(...arguments);
        this.name = 'staart';
    }
}
let StaartStrategy = class StaartStrategy extends passport_1.PassportStrategy(StaartStrategyName) {
    constructor(apiKeyService, tokensService, configService) {
        super();
        this.apiKeyService = apiKeyService;
        this.tokensService = tokensService;
        this.configService = configService;
    }
    safeSuccess(result) {
        return this.success(result);
    }
    async authenticate(request) {
        var _a, _b;
        let apiKey = (_a = request.query['api_key']) !== null && _a !== void 0 ? _a : request.headers.authorization;
        if (typeof apiKey === 'string') {
            if (apiKey.startsWith('Bearer '))
                apiKey = apiKey.replace('Bearer ', '');
            if (uuid_1.validate(apiKey))
                try {
                    const apiKeyDetails = await this.apiKeyService.getApiKeyFromKey(apiKey);
                    const referer = request.headers.referer;
                    if (Array.isArray(apiKeyDetails.referrerRestrictions) && referer) {
                        let referrerRestrictionsMet = !apiKeyDetails.referrerRestrictions
                            .length;
                        apiKeyDetails.referrerRestrictions.forEach((restriction) => {
                            referrerRestrictionsMet =
                                referrerRestrictionsMet ||
                                    minimatch_1.default(referer, restriction);
                        });
                        if (!referrerRestrictionsMet)
                            return this.fail('Referrer restrictions not met', 401);
                    }
                    if (Array.isArray(apiKeyDetails.ipRestrictions) &&
                        apiKeyDetails.ipRestrictions.length) {
                        const ipAddress = request_ip_1.getClientIp(request);
                        if (!ip_range_check_1.default(ipAddress, apiKeyDetails.ipRestrictions))
                            return this.fail('IP address restrictions not met', 401);
                    }
                    return this.safeSuccess({
                        type: 'api-key',
                        id: apiKeyDetails.id,
                        scopes: apiKeyDetails.scopes,
                    });
                }
                catch (error) { }
        }
        let bearerToken = (_b = request.query['token']) !== null && _b !== void 0 ? _b : request.headers.authorization;
        if (typeof bearerToken !== 'string')
            return this.fail('No token found', 401);
        if (bearerToken.startsWith('Bearer '))
            bearerToken = bearerToken.replace('Bearer ', '');
        try {
            const payload = this.tokensService.verify(tokens_constants_1.LOGIN_ACCESS_TOKEN, bearerToken);
            const { sub, scopes } = payload;
            const [userPart, hostPart] = sub.split('@');
            if (hostPart !==
                this.configService.get('security.issuerDomain'))
                throw new Error('Invalid issuer domain');
            const id = parseInt(userPart.replace('acct:', ''));
            if (isNaN(id))
                throw new Error('Invalid user ID');
            return this.safeSuccess({ type: 'user', id, scopes });
        }
        catch (error) { }
        return this.fail('Invalid token', 401);
    }
};
StaartStrategy = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [api_keys_service_1.ApiKeysService,
        tokens_service_1.TokensService,
        config_1.ConfigService])
], StaartStrategy);
exports.StaartStrategy = StaartStrategy;
//# sourceMappingURL=staart.strategy.js.map