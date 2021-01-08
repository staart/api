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
exports.MultiFactorAuthenticationController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const errors_constants_1 = require("../../errors/errors.constants");
const scope_decorator_1 = require("../auth/scope.decorator");
const multi_factor_authentication_dto_1 = require("./multi-factor-authentication.dto");
const multi_factor_authentication_service_1 = require("./multi-factor-authentication.service");
let MultiFactorAuthenticationController = class MultiFactorAuthenticationController {
    constructor(multiFactorAuthenticationService) {
        this.multiFactorAuthenticationService = multiFactorAuthenticationService;
    }
    async regenerateBackupCodes(userId) {
        return this.multiFactorAuthenticationService.regenerateBackupCodes(userId);
    }
    async disable2FA(userId) {
        return this.multiFactorAuthenticationService.disableMfa(userId);
    }
    async enableTotp(userId, body) {
        if (body.token)
            return this.multiFactorAuthenticationService.enableMfa('TOTP', userId, body.token);
        return this.multiFactorAuthenticationService.requestTotpMfa(userId);
    }
    async enableSms(userId, body) {
        if (body.token)
            return this.multiFactorAuthenticationService.enableMfa('SMS', userId, body.token);
        if (body.phone)
            return this.multiFactorAuthenticationService.requestSmsMfa(userId, body.phone);
        throw new common_1.BadRequestException(errors_constants_1.MFA_PHONE_OR_TOKEN_REQUIRED);
    }
    async enableEmail(userId, body) {
        if (body.token)
            return this.multiFactorAuthenticationService.enableMfa('EMAIL', userId, body.token);
        return this.multiFactorAuthenticationService.requestEmailMfa(userId);
    }
};
__decorate([
    common_1.Post('regenerate'),
    scope_decorator_1.Scopes('user-{userId}:write-mfa-regenerate'),
    openapi.ApiResponse({ status: 201, type: [String] }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MultiFactorAuthenticationController.prototype, "regenerateBackupCodes", null);
__decorate([
    common_1.Delete(),
    scope_decorator_1.Scopes('user-{userId}:delete-mfa-*'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MultiFactorAuthenticationController.prototype, "disable2FA", null);
__decorate([
    common_1.Post('totp'),
    scope_decorator_1.Scopes('user-{userId}:write-mfa-totp'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, multi_factor_authentication_dto_1.EnableTotpMfaDto]),
    __metadata("design:returntype", Promise)
], MultiFactorAuthenticationController.prototype, "enableTotp", null);
__decorate([
    common_1.Post('sms'),
    scope_decorator_1.Scopes('user-{userId}:write-mfa-sms'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, multi_factor_authentication_dto_1.EnableSmsMfaDto]),
    __metadata("design:returntype", Promise)
], MultiFactorAuthenticationController.prototype, "enableSms", null);
__decorate([
    common_1.Post('email'),
    scope_decorator_1.Scopes('user-{userId}:write-mfa-email'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, multi_factor_authentication_dto_1.EnableTotpMfaDto]),
    __metadata("design:returntype", Promise)
], MultiFactorAuthenticationController.prototype, "enableEmail", null);
MultiFactorAuthenticationController = __decorate([
    common_1.Controller('users/:userId/multi-factor-authentication'),
    __metadata("design:paramtypes", [multi_factor_authentication_service_1.MultiFactorAuthenticationService])
], MultiFactorAuthenticationController);
exports.MultiFactorAuthenticationController = MultiFactorAuthenticationController;
//# sourceMappingURL=multi-factor-authentication.controller.js.map