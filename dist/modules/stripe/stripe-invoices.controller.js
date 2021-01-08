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
exports.StripeInvoicesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const cursor_pipe_1 = require("../../pipes/cursor.pipe");
const optional_int_pipe_1 = require("../../pipes/optional-int.pipe");
const scope_decorator_1 = require("../auth/scope.decorator");
const stripe_service_1 = require("./stripe.service");
let StripeInvoicesController = class StripeInvoicesController {
    constructor(stripeService) {
        this.stripeService = stripeService;
    }
    async getAll(groupId, take, cursor) {
        return this.stripeService.getInvoices(groupId, { take, cursor });
    }
    async get(groupId, id) {
        return this.stripeService.getInvoice(groupId, id);
    }
};
__decorate([
    common_1.Get(),
    scope_decorator_1.Scopes('group-{groupId}:read-invoice-*'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(1, common_1.Query('take', optional_int_pipe_1.OptionalIntPipe)),
    __param(2, common_1.Query('cursor', cursor_pipe_1.CursorPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], StripeInvoicesController.prototype, "getAll", null);
__decorate([
    common_1.Get(':id'),
    scope_decorator_1.Scopes('group-{groupId}:read-invoice-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(1, common_1.Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], StripeInvoicesController.prototype, "get", null);
StripeInvoicesController = __decorate([
    common_1.Controller('groups/:groupId/invoices'),
    __metadata("design:paramtypes", [stripe_service_1.StripeService])
], StripeInvoicesController);
exports.StripeInvoicesController = StripeInvoicesController;
//# sourceMappingURL=stripe-invoices.controller.js.map