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
exports.StripeBillingController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const audit_log_decorator_1 = require("../audit-logs/audit-log.decorator");
const scope_decorator_1 = require("../auth/scope.decorator");
const stripe_dto_1 = require("./stripe.dto");
const stripe_service_1 = require("./stripe.service");
let StripeBillingController = class StripeBillingController {
    constructor(stripeService) {
        this.stripeService = stripeService;
    }
    async createBillingAccount(groupId, data) {
        return this.stripeService.createCustomer(groupId, data);
    }
    async getBillingAccount(groupId) {
        return this.stripeService.getCustomer(groupId);
    }
    async updateBillingAccount(groupId, data) {
        return this.stripeService.updateCustomer(groupId, data);
    }
    async replaceBillingAccount(groupId, data) {
        return this.stripeService.updateCustomer(groupId, data);
    }
    async deleteBillingAccount(groupId) {
        return this.stripeService.deleteCustomer(groupId);
    }
    async getSession(groupId) {
        return this.stripeService.getBillingPortalLink(groupId);
    }
};
__decorate([
    common_1.Post(),
    audit_log_decorator_1.AuditLog('create-billing'),
    scope_decorator_1.Scopes('group-{groupId}:write-billing'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, stripe_dto_1.CreateBillingDto]),
    __metadata("design:returntype", Promise)
], StripeBillingController.prototype, "createBillingAccount", null);
__decorate([
    common_1.Get(),
    scope_decorator_1.Scopes('group-{groupId}:read-billing'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], StripeBillingController.prototype, "getBillingAccount", null);
__decorate([
    common_1.Patch(),
    audit_log_decorator_1.AuditLog('update-billing'),
    scope_decorator_1.Scopes('group-{groupId}:write-billing'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, stripe_dto_1.UpdateBillingDto]),
    __metadata("design:returntype", Promise)
], StripeBillingController.prototype, "updateBillingAccount", null);
__decorate([
    common_1.Put(),
    audit_log_decorator_1.AuditLog('update-billing'),
    scope_decorator_1.Scopes('group-{groupId}:write-billing'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, stripe_dto_1.ReplaceBillingDto]),
    __metadata("design:returntype", Promise)
], StripeBillingController.prototype, "replaceBillingAccount", null);
__decorate([
    common_1.Delete(),
    audit_log_decorator_1.AuditLog('delete-billing'),
    scope_decorator_1.Scopes('group-{groupId}:delete-billing'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], StripeBillingController.prototype, "deleteBillingAccount", null);
__decorate([
    common_1.Get('link'),
    audit_log_decorator_1.AuditLog('billing-portal'),
    scope_decorator_1.Scopes('group-{groupId}:write-billing'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], StripeBillingController.prototype, "getSession", null);
StripeBillingController = __decorate([
    common_1.Controller('groups/:groupId/billing'),
    __metadata("design:paramtypes", [stripe_service_1.StripeService])
], StripeBillingController);
exports.StripeBillingController = StripeBillingController;
//# sourceMappingURL=stripe-billing.controller.js.map