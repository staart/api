"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../providers/prisma/prisma.module");
const stripe_module_1 = require("../stripe/stripe.module");
const tokens_module_1 = require("../../providers/tokens/tokens.module");
const webhooks_controller_1 = require("./webhooks.controller");
const webhooks_service_1 = require("./webhooks.service");
const config_1 = require("@nestjs/config");
let WebhooksModule = class WebhooksModule {
};
WebhooksModule = __decorate([
    common_1.Module({
        imports: [prisma_module_1.PrismaModule, tokens_module_1.TokensModule, stripe_module_1.StripeModule, config_1.ConfigModule],
        controllers: [webhooks_controller_1.WebhookController],
        providers: [webhooks_service_1.WebhooksService],
        exports: [webhooks_service_1.WebhooksService],
    })
], WebhooksModule);
exports.WebhooksModule = WebhooksModule;
//# sourceMappingURL=webhooks.module.js.map