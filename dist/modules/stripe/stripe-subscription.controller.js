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
exports.StripeSubscriptionController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const cursor_pipe_1 = require("../../pipes/cursor.pipe");
const optional_int_pipe_1 = require("../../pipes/optional-int.pipe");
const audit_log_decorator_1 = require("../audit-logs/audit-log.decorator");
const scope_decorator_1 = require("../auth/scope.decorator");
const stripe_service_1 = require("./stripe.service");
let StripeSubscriptionController = class StripeSubscriptionController {
    constructor(stripeService) {
        this.stripeService = stripeService;
    }
    async create(groupId, plan) {
        return this.stripeService.createSession(groupId, 'subscription', plan);
    }
    async getAll(groupId, take, cursor) {
        return this.stripeService.getSubscriptions(groupId, { take, cursor });
    }
    async get(groupId, id) {
        return this.stripeService.getSubscription(groupId, id);
    }
    async remove(groupId, id) {
        return this.stripeService.cancelSubscription(groupId, id);
    }
    async getPlans(groupId, product) {
        return this.stripeService.plans(groupId, product);
    }
};
__decorate([
    common_1.Post(':plan'),
    audit_log_decorator_1.AuditLog('create-subscription'),
    scope_decorator_1.Scopes('group-{groupId}:write-subscription-*'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(1, common_1.Param('plan')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "create", null);
__decorate([
    common_1.Get(),
    scope_decorator_1.Scopes('group-{groupId}:read-subscription-*'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(1, common_1.Query('take', optional_int_pipe_1.OptionalIntPipe)),
    __param(2, common_1.Query('cursor', cursor_pipe_1.CursorPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "getAll", null);
__decorate([
    common_1.Get(':id'),
    scope_decorator_1.Scopes('group-{groupId}:read-subscription-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(1, common_1.Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "get", null);
__decorate([
    common_1.Delete(':id'),
    audit_log_decorator_1.AuditLog('delete-subscription'),
    scope_decorator_1.Scopes('group-{groupId}:delete-subscription-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(1, common_1.Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "remove", null);
__decorate([
    common_1.Get('plans'),
    scope_decorator_1.Scopes('group-{groupId}:write-subscription-*'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(1, common_1.Query('product')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "getPlans", null);
StripeSubscriptionController = __decorate([
    common_1.Controller('groups/:groupId/subscriptions'),
    __metadata("design:paramtypes", [stripe_service_1.StripeService])
], StripeSubscriptionController);
exports.StripeSubscriptionController = StripeSubscriptionController;
//# sourceMappingURL=stripe-subscription.controller.js.map