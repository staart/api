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
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
const errors_constants_1 = require("../../errors/errors.constants");
const prisma_service_1 = require("../../providers/prisma/prisma.service");
let StripeService = StripeService_1 = class StripeService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(StripeService_1.name);
        this.metaConfig = this.configService.get('meta');
        this.paymentsConfig = this.configService.get('payments');
        this.stripe = new stripe_1.default(this.paymentsConfig.stripeApiKey, {
            apiVersion: '2020-08-27',
            typescript: true,
        });
    }
    async createCustomer(groupId, data) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            select: { attributes: true },
        });
        if (!group)
            throw new common_1.NotFoundException(errors_constants_1.GROUP_NOT_FOUND);
        const attributes = group.attributes;
        if (attributes === null || attributes === void 0 ? void 0 : attributes.stripeCustomerId)
            throw new common_1.ConflictException(errors_constants_1.BILLING_ACCOUNT_CREATED_CONFLICT);
        const result = await this.stripe.customers.create(data);
        await this.prisma.group.update({
            where: { id: groupId },
            data: { attributes: { stripeCustomerId: result.id } },
        });
        return result;
    }
    async getCustomer(groupId) {
        const stripeId = await this.stripeId(groupId);
        const result = await this.stripe.customers.retrieve(stripeId);
        if (result.deleted)
            throw new common_1.NotFoundException(errors_constants_1.CUSTOMER_NOT_FOUND);
        return result;
    }
    async updateCustomer(groupId, data) {
        const stripeId = await this.stripeId(groupId);
        const result = await this.stripe.customers.update(stripeId, data);
        return result;
    }
    async deleteCustomer(groupId) {
        const stripeId = await this.stripeId(groupId);
        const result = (await this.stripe.customers.del(stripeId));
        await this.prisma.group.update({
            where: { id: groupId },
            data: { attributes: { stripeCustomerId: null } },
        });
        return result;
    }
    async getBillingPortalLink(groupId) {
        const stripeId = await this.stripeId(groupId);
        return this.stripe.billingPortal.sessions.create({
            customer: stripeId,
            return_url: `${this.metaConfig.frontendUrl}/groups/${groupId}`,
        });
    }
    async getInvoices(groupId, params) {
        var _a;
        const stripeId = await this.stripeId(groupId);
        const result = await this.stripe.invoices.list({
            customer: stripeId,
            limit: params.take,
            starting_after: (_a = params.cursor) === null || _a === void 0 ? void 0 : _a.id,
        });
        return this.list(result);
    }
    async getInvoice(groupId, invoiceId) {
        const stripeId = await this.stripeId(groupId);
        const result = await this.stripe.invoices.retrieve(invoiceId);
        if (result.customer !== stripeId)
            throw new common_1.NotFoundException(errors_constants_1.INVOICE_NOT_FOUND);
        return result;
    }
    async getSubscriptions(groupId, params) {
        var _a;
        const stripeId = await this.stripeId(groupId);
        const result = await this.stripe.subscriptions.list({
            customer: stripeId,
            limit: params.take,
            starting_after: (_a = params.cursor) === null || _a === void 0 ? void 0 : _a.id,
        });
        return this.list(result);
    }
    async getSubscription(groupId, subscriptionId) {
        const stripeId = await this.stripeId(groupId);
        const result = await this.stripe.subscriptions.retrieve(subscriptionId);
        if (result.customer !== stripeId)
            throw new common_1.NotFoundException(errors_constants_1.SUBSCRIPTION_NOT_FOUND);
        return result;
    }
    async getSources(groupId, params) {
        var _a;
        const stripeId = await this.stripeId(groupId);
        const result = await this.stripe.customers.listSources(stripeId, {
            limit: params.take,
            starting_after: (_a = params.cursor) === null || _a === void 0 ? void 0 : _a.id,
        });
        return this.list(result);
    }
    async getSource(groupId, sourceId) {
        const stripeId = await this.stripeId(groupId);
        const result = await this.stripe.sources.retrieve(sourceId);
        if (result.customer !== stripeId)
            throw new common_1.NotFoundException(errors_constants_1.SOURCE_NOT_FOUND);
        return result;
    }
    async deleteSource(groupId, sourceId) {
        const stripeId = await this.stripeId(groupId);
        const result = await this.stripe.sources.retrieve(sourceId);
        if (result.customer !== stripeId)
            throw new common_1.NotFoundException(errors_constants_1.SOURCE_NOT_FOUND);
        await this.stripe.customers.deleteSource(stripeId, sourceId);
    }
    async createSession(groupId, mode, planId) {
        var _a;
        const stripeId = await this.stripeId(groupId);
        const data = {
            customer: stripeId,
            mode,
            payment_method_types: (_a = this.paymentsConfig.paymentMethodTypes) !== null && _a !== void 0 ? _a : ['card'],
            success_url: `${this.metaConfig.frontendUrl}/groups/${groupId}`,
            cancel_url: `${this.metaConfig.frontendUrl}/groups/${groupId}`,
        };
        if (mode === 'subscription')
            data.line_items = [{ quantity: 1, price: planId }];
        const result = await this.stripe.checkout.sessions.create(data);
        return result;
    }
    async cancelSubscription(groupId, subscriptionId) {
        const stripeId = await this.stripeId(groupId);
        const result = await this.stripe.subscriptions.retrieve(subscriptionId);
        if (result.customer !== stripeId)
            throw new common_1.NotFoundException(errors_constants_1.SUBSCRIPTION_NOT_FOUND);
        return this.stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
    }
    async plans(groupId, product) {
        const stripeId = await this.stripeId(groupId);
        const plans = await this.stripe.plans.list({ product });
        return plans.data.filter((plan) => {
            let show = true;
            ['special', 'internal'].forEach((word) => {
                if (plan.nickname.toLowerCase().includes(word))
                    show = false;
            });
            const tokens = plan.nickname
                .toLowerCase()
                .replace(/[^a-zA-Z0-9]/g, ' ')
                .replace(/\s\s+/g, ' ')
                .split(' ');
            [stripeId, groupId.toString()].forEach((word) => {
                if (tokens.includes(word))
                    show = true;
            });
            return show;
        });
    }
    async handleWebhook(signature, payload) {
        const event = this.stripe.webhooks.constructEvent(payload, signature, this.paymentsConfig.stripeEndpointSecret);
        switch (event.type) {
            default:
                this.logger.warn(`Unhandled event type ${event.type}`);
        }
        return { received: true };
    }
    list(result) {
        return result.data;
    }
    async stripeId(groupId) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            select: { attributes: true },
        });
        if (!group)
            throw new common_1.NotFoundException(errors_constants_1.GROUP_NOT_FOUND);
        const attributes = group.attributes;
        if (!(attributes === null || attributes === void 0 ? void 0 : attributes.stripeCustomerId))
            throw new common_1.BadRequestException(errors_constants_1.BILLING_NOT_FOUND);
        return attributes.stripeCustomerId;
    }
};
StripeService = StripeService_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], StripeService);
exports.StripeService = StripeService;
//# sourceMappingURL=stripe.service.js.map