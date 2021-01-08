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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const auth_dto_1 = require("./auth.dto");
const auth_service_1 = require("./auth.service");
const public_decorator_1 = require("./public.decorator");
const rate_limit_decorator_1 = require("./rate-limit.decorator");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(data, ip, userAgent) {
        return this.authService.login(ip, userAgent, data.email, data.password, data.code);
    }
    async register(ip, data) {
        return this.authService.register(ip, data);
    }
    async refresh(ip, userAgent, refreshToken) {
        return this.authService.refresh(ip, userAgent, refreshToken);
    }
    async logout(refreshToken) {
        return this.authService.logout(refreshToken);
    }
    async approveSubnet(ip, userAgent, token) {
        return this.authService.approveSubnet(ip, userAgent, token);
    }
    async resendVerify(data) {
        return this.authService.sendEmailVerification(data.email, true);
    }
    async verifyEmail(ip, userAgent, data) {
        return this.authService.verifyEmail(ip, userAgent, data.token);
    }
    async forgotPassword(data) {
        return this.authService.requestPasswordReset(data.email);
    }
    async resetPassword(ip, userAgent, data) {
        return this.authService.resetPassword(ip, userAgent, data.token, data.password, data.ignorePwnedPassword);
    }
    async totpLogin(data, ip, userAgent) {
        return this.authService.loginWithTotp(ip, userAgent, data.token, data.code);
    }
    async emailTokenLoginPost(token, ip, userAgent) {
        return this.authService.loginWithEmailToken(ip, userAgent, token);
    }
    async merge(token) {
        return this.authService.mergeUsers(token);
    }
};
__decorate([
    common_1.Post('login'),
    rate_limit_decorator_1.RateLimit(10),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Body()),
    __param(1, common_1.Ip()),
    __param(2, common_1.Headers('User-Agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    common_1.Post('register'),
    rate_limit_decorator_1.RateLimit(10),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Ip()),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    common_1.Post('refresh'),
    rate_limit_decorator_1.RateLimit(5),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Ip()),
    __param(1, common_1.Headers('User-Agent')),
    __param(2, common_1.Body('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    common_1.Post('logout'),
    rate_limit_decorator_1.RateLimit(5),
    openapi.ApiResponse({ status: 201 }),
    __param(0, common_1.Body('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    common_1.Post('approve-subnet'),
    rate_limit_decorator_1.RateLimit(5),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Ip()),
    __param(1, common_1.Headers('User-Agent')),
    __param(2, common_1.Body('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "approveSubnet", null);
__decorate([
    common_1.Post('resend-email-verification'),
    rate_limit_decorator_1.RateLimit(10),
    openapi.ApiResponse({ status: 201 }),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResendEmailVerificationDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerify", null);
__decorate([
    common_1.Post('verify-email'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Ip()),
    __param(1, common_1.Headers('User-Agent')),
    __param(2, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, auth_dto_1.VerifyEmailDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    common_1.Post('forgot-password'),
    rate_limit_decorator_1.RateLimit(10),
    openapi.ApiResponse({ status: 201 }),
    __param(0, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    common_1.Post('reset-password'),
    rate_limit_decorator_1.RateLimit(10),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Ip()),
    __param(1, common_1.Headers('User-Agent')),
    __param(2, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, auth_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    common_1.Post('login/totp'),
    rate_limit_decorator_1.RateLimit(10),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Body()),
    __param(1, common_1.Ip()),
    __param(2, common_1.Headers('User-Agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.TotpLoginDto, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "totpLogin", null);
__decorate([
    common_1.Post('login/token'),
    rate_limit_decorator_1.RateLimit(10),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Body('token')),
    __param(1, common_1.Ip()),
    __param(2, common_1.Headers('User-Agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "emailTokenLoginPost", null);
__decorate([
    common_1.Post('merge-accounts'),
    rate_limit_decorator_1.RateLimit(10),
    openapi.ApiResponse({ status: 201 }),
    __param(0, common_1.Body('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "merge", null);
AuthController = __decorate([
    common_1.Controller('auth'),
    public_decorator_1.Public(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map