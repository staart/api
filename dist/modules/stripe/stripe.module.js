"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("../../providers/prisma/prisma.module");
const stripe_billing_controller_1 = require("./stripe-billing.controller");
const stripe_webhook_controller_1 = require("./stripe-webhook.controller");
const stripe_subscription_controller_1 = require("./stripe-subscription.controller");
const stripe_sources_controller_1 = require("./stripe-sources.controller");
const stripe_invoices_controller_1 = require("./stripe-invoices.controller");
const stripe_service_1 = require("./stripe.service");
let StripeModule = class StripeModule {
};
StripeModule = __decorate([
    common_1.Module({
        imports: [config_1.ConfigModule, prisma_module_1.PrismaModule],
        providers: [stripe_service_1.StripeService],
        exports: [stripe_service_1.StripeService],
        controllers: [
            stripe_billing_controller_1.StripeBillingController,
            stripe_invoices_controller_1.StripeInvoicesController,
            stripe_sources_controller_1.StripeSourcesController,
            stripe_subscription_controller_1.StripeSubscriptionController,
            stripe_webhook_controller_1.StripeWebhookController,
        ],
    })
], StripeModule);
exports.StripeModule = StripeModule;
//# sourceMappingURL=stripe.module.js.map