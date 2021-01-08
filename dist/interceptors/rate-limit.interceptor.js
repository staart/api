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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitInterceptor = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const request_ip_1 = require("request-ip");
const errors_constants_1 = require("../errors/errors.constants");
let RateLimitInterceptor = class RateLimitInterceptor {
    constructor(reflector, configService) {
        this.reflector = reflector;
        this.configService = configService;
        this.rateLimiterPublic = new rate_limiter_flexible_1.RateLimiterMemory(this.configService.get('rateLimit.public'));
        this.rateLimiterAuthenticated = new rate_limiter_flexible_1.RateLimiterMemory(this.configService.get('rateLimit.authenticated'));
        this.rateLimiterApiKey = new rate_limiter_flexible_1.RateLimiterMemory(this.configService.get('rateLimit.apiKey'));
    }
    async intercept(context, next) {
        var _a, _b, _c;
        const points = (_a = this.reflector.get('rateLimit', context.getHandler())) !== null && _a !== void 0 ? _a : 1;
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        let limiter = this.rateLimiterPublic;
        if (((_b = request.user) === null || _b === void 0 ? void 0 : _b.type) === 'api-key')
            limiter = this.rateLimiterApiKey;
        else if (((_c = request.user) === null || _c === void 0 ? void 0 : _c.type) === 'user')
            limiter = this.rateLimiterAuthenticated;
        try {
            const ip = request_ip_1.getClientIp(request);
            const result = await limiter.consume(ip.replace(/^.*:/, ''), points);
            response.header('Retry-After', Math.ceil(result.msBeforeNext / 1000));
            response.header('X-RateLimit-Limit', points);
            response.header('X-Retry-Remaining', result.remainingPoints);
            response.header('X-Retry-Reset', new Date(Date.now() + result.msBeforeNext).toUTCString());
        }
        catch (result) {
            response.header('Retry-After', Math.ceil(result.msBeforeNext / 1000));
            throw new common_1.HttpException(errors_constants_1.RATE_LIMIT_EXCEEDED, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        return next.handle();
    }
};
RateLimitInterceptor = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [core_1.Reflector,
        config_1.ConfigService])
], RateLimitInterceptor);
exports.RateLimitInterceptor = RateLimitInterceptor;
//# sourceMappingURL=rate-limit.interceptor.js.map