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
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const got_1 = __importDefault(require("got"));
const p_queue_1 = __importDefault(require("p-queue"));
const p_retry_1 = __importDefault(require("p-retry"));
const errors_constants_1 = require("../../errors/errors.constants");
const prisma_service_1 = require("../../providers/prisma/prisma.service");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(WebhooksService_1.name);
        this.queue = new p_queue_1.default({ concurrency: 1 });
    }
    async createWebhook(groupId, data) {
        return this.prisma.webhook.create({
            data: Object.assign(Object.assign({}, data), { group: { connect: { id: groupId } } }),
        });
    }
    async getWebhooks(groupId, params) {
        const { skip, take, cursor, where, orderBy } = params;
        const webhooks = await this.prisma.webhook.findMany({
            skip,
            take,
            cursor,
            where: Object.assign(Object.assign({}, where), { group: { id: groupId } }),
            orderBy,
        });
        return webhooks.map((group) => this.prisma.expose(group));
    }
    async getWebhook(groupId, id) {
        const webhook = await this.prisma.webhook.findUnique({
            where: { id },
        });
        if (!webhook)
            throw new common_1.NotFoundException(errors_constants_1.WEBHOOK_NOT_FOUND);
        if (webhook.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        return this.prisma.expose(webhook);
    }
    async updateWebhook(groupId, id, data) {
        const testWebhook = await this.prisma.webhook.findUnique({
            where: { id },
        });
        if (!testWebhook)
            throw new common_1.NotFoundException(errors_constants_1.WEBHOOK_NOT_FOUND);
        if (testWebhook.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        const webhook = await this.prisma.webhook.update({
            where: { id },
            data,
        });
        return this.prisma.expose(webhook);
    }
    async replaceWebhook(groupId, id, data) {
        const testWebhook = await this.prisma.webhook.findUnique({
            where: { id },
        });
        if (!testWebhook)
            throw new common_1.NotFoundException(errors_constants_1.WEBHOOK_NOT_FOUND);
        if (testWebhook.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        const webhook = await this.prisma.webhook.update({
            where: { id },
            data,
        });
        return this.prisma.expose(webhook);
    }
    async deleteWebhook(groupId, id) {
        const testWebhook = await this.prisma.webhook.findUnique({
            where: { id },
        });
        if (!testWebhook)
            throw new common_1.NotFoundException(errors_constants_1.WEBHOOK_NOT_FOUND);
        if (testWebhook.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        const webhook = await this.prisma.webhook.delete({
            where: { id },
        });
        return this.prisma.expose(webhook);
    }
    async getWebhookScopes() {
        const scopes = {
            'create-api-key': 'Create API key',
            'update-api-key': 'Update API key',
            'delete-api-key': 'Delete API key',
            'create-domain': 'Create domain',
            'delete-domain': 'Delete domain',
            'verify-domain-txt': 'Verify domain (TXT)',
            'verify-domain-html': 'Verify domain (HTML)',
            'update-info': 'Update info',
            delete: 'Delete group',
            'add-membership': 'Add membership',
            'update-membership': 'Update membership',
            'delete-membership': 'Delete membership',
            'create-billing': 'Create billing',
            'update-billing': 'Update billing',
            'delete-billing': 'Delete billing',
            'write-source': 'Write source',
            'delete-source': 'Delete source',
            'create-subscription': 'Create subscription',
            'delete-subscription': 'Delete subscription',
            'create-webhook': 'Create webhook',
            'update-webhook': 'Update webhook',
            'delete-webhook': 'Delete webhook',
        };
        return scopes;
    }
    triggerWebhook(groupId, event) {
        this.prisma.webhook
            .findMany({
            where: { group: { id: groupId }, isActive: true, event },
        })
            .then((webhooks) => {
            webhooks.forEach((webhook) => this.queue
                .add(() => {
                var _a;
                return p_retry_1.default(() => this.callWebhook(webhook, event), {
                    retries: (_a = this.configService.get('webhooks.retries')) !== null && _a !== void 0 ? _a : 3,
                    onFailedAttempt: (error) => {
                        this.logger.error(`Triggering webhoook failed, retrying (${error.retriesLeft} attempts left)`, error.name);
                        if (error.retriesLeft === 0)
                            this.prisma.webhook
                                .update({
                                where: { id: webhook.id },
                                data: { isActive: false },
                            })
                                .then(() => { })
                                .catch(() => { });
                    },
                });
            })
                .then(() => { })
                .catch(() => { }));
        })
            .catch((error) => this.logger.error('Unable to get webhooks', error));
    }
    async callWebhook(webhook, event) {
        if (webhook.contentType === 'application/json')
            await got_1.default(webhook.url, { method: 'POST', json: { event } });
        else
            await got_1.default(webhook.url, { method: 'POST', body: event });
        await this.prisma.webhook.update({
            where: { id: webhook.id },
            data: { lastFiredAt: new Date() },
        });
    }
};
WebhooksService = WebhooksService_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], WebhooksService);
exports.WebhooksService = WebhooksService;
//# sourceMappingURL=webhooks.service.js.map