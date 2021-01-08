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
exports.StripeWebhookController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../auth/public.decorator");
const stripe_service_1 = require("./stripe.service");
let StripeWebhookController = class StripeWebhookController {
    constructor(stripeService) {
        this.stripeService = stripeService;
    }
    async handleWebhook(signature, raw) {
        return this.stripeService.handleWebhook(signature, raw);
    }
};
__decorate([
    common_1.Post(),
    openapi.ApiResponse({ status: 201 }),
    __param(0, common_1.Headers('stripe-signature')),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Buffer]),
    __metadata("design:returntype", Promise)
], StripeWebhookController.prototype, "handleWebhook", null);
StripeWebhookController = __decorate([
    common_1.Controller('webhooks/stripe'),
    public_decorator_1.Public(),
    __metadata("design:paramtypes", [stripe_service_1.StripeService])
], StripeWebhookController);
exports.StripeWebhookController = StripeWebhookController;
//# sourceMappingURL=stripe-webhook.controller.js.map