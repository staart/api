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
exports.WebhookController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const cursor_pipe_1 = require("../../pipes/cursor.pipe");
const optional_int_pipe_1 = require("../../pipes/optional-int.pipe");
const order_by_pipe_1 = require("../../pipes/order-by.pipe");
const where_pipe_1 = require("../../pipes/where.pipe");
const audit_log_decorator_1 = require("../audit-logs/audit-log.decorator");
const scope_decorator_1 = require("../auth/scope.decorator");
const webhooks_dto_1 = require("./webhooks.dto");
const webhooks_service_1 = require("./webhooks.service");
let WebhookController = class WebhookController {
    constructor(webhooksService) {
        this.webhooksService = webhooksService;
    }
    async create(groupId, data) {
        return this.webhooksService.createWebhook(groupId, data);
    }
    async getAll(groupId, skip, take, cursor, where, orderBy) {
        return this.webhooksService.getWebhooks(groupId, {
            skip,
            take,
            orderBy,
            cursor,
            where,
        });
    }
    async scopes() {
        return this.webhooksService.getWebhookScopes();
    }
    async get(groupId, id) {
        return this.webhooksService.getWebhook(groupId, Number(id));
    }
    async update(data, groupId, id) {
        return this.webhooksService.updateWebhook(groupId, Number(id), data);
    }
    async replace(data, groupId, id) {
        return this.webhooksService.updateWebhook(groupId, Number(id), data);
    }
    async remove(groupId, id) {
        return this.webhooksService.deleteWebhook(groupId, Number(id));
    }
};
__decorate([
    common_1.Post(),
    audit_log_decorator_1.AuditLog('create-webhook'),
    scope_decorator_1.Scopes('group-{groupId}:write-webhook-*'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, webhooks_dto_1.CreateWebhookDto]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "create", null);
__decorate([
    common_1.Get(),
    scope_decorator_1.Scopes('group-{groupId}:read-webhook-*'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(1, common_1.Query('skip', optional_int_pipe_1.OptionalIntPipe)),
    __param(2, common_1.Query('take', optional_int_pipe_1.OptionalIntPipe)),
    __param(3, common_1.Query('cursor', cursor_pipe_1.CursorPipe)),
    __param(4, common_1.Query('where', where_pipe_1.WherePipe)),
    __param(5, common_1.Query('orderBy', order_by_pipe_1.OrderByPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "getAll", null);
__decorate([
    common_1.Get('scopes'),
    scope_decorator_1.Scopes('group-{groupId}:write-webhook-*'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "scopes", null);
__decorate([
    common_1.Get(':id'),
    scope_decorator_1.Scopes('group-{groupId}:read-webhook-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(1, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "get", null);
__decorate([
    common_1.Patch(':id'),
    audit_log_decorator_1.AuditLog('update-webhook'),
    scope_decorator_1.Scopes('group-{groupId}:write-webhook-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Body()),
    __param(1, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(2, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [webhooks_dto_1.UpdateWebhookDto, Number, Number]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "update", null);
__decorate([
    common_1.Put(':id'),
    audit_log_decorator_1.AuditLog('update-webhook'),
    scope_decorator_1.Scopes('group-{groupId}:write-webhook-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Body()),
    __param(1, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(2, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [webhooks_dto_1.ReplaceWebhookDto, Number, Number]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "replace", null);
__decorate([
    common_1.Delete(':id'),
    audit_log_decorator_1.AuditLog('delete-webhook'),
    scope_decorator_1.Scopes('group-{groupId}:delete-webhook-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(1, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "remove", null);
WebhookController = __decorate([
    common_1.Controller('groups/:groupId/webhooks'),
    __metadata("design:paramtypes", [webhooks_service_1.WebhooksService])
], WebhookController);
exports.WebhookController = WebhookController;
//# sourceMappingURL=webhooks.controller.js.map