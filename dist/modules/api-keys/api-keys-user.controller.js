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
exports.ApiKeyUserController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const cursor_pipe_1 = require("../../pipes/cursor.pipe");
const optional_int_pipe_1 = require("../../pipes/optional-int.pipe");
const order_by_pipe_1 = require("../../pipes/order-by.pipe");
const where_pipe_1 = require("../../pipes/where.pipe");
const audit_log_decorator_1 = require("../audit-logs/audit-log.decorator");
const scope_decorator_1 = require("../auth/scope.decorator");
const api_keys_dto_1 = require("./api-keys.dto");
const api_keys_service_1 = require("./api-keys.service");
let ApiKeyUserController = class ApiKeyUserController {
    constructor(apiKeysService) {
        this.apiKeysService = apiKeysService;
    }
    async create(userId, data) {
        return this.apiKeysService.createApiKeyForUser(userId, data);
    }
    async getAll(userId, skip, take, cursor, where, orderBy) {
        return this.apiKeysService.getApiKeysForUser(userId, {
            skip,
            take,
            orderBy,
            cursor,
            where,
        });
    }
    async scopes(userId) {
        return this.apiKeysService.getApiKeyScopesForUser(userId);
    }
    async get(userId, id) {
        return this.apiKeysService.getApiKeyForUser(userId, Number(id));
    }
    async update(data, userId, id) {
        return this.apiKeysService.updateApiKeyForUser(userId, Number(id), data);
    }
    async replace(data, userId, id) {
        return this.apiKeysService.updateApiKeyForUser(userId, Number(id), data);
    }
    async remove(userId, id) {
        return this.apiKeysService.deleteApiKeyForUser(userId, Number(id));
    }
    async getLogs(userId, id, take, cursor, where) {
        return this.apiKeysService.getApiKeyLogsForUser(userId, id, {
            take,
            cursor,
            where,
        });
    }
};
__decorate([
    common_1.Post(),
    audit_log_decorator_1.AuditLog('create-api-key'),
    scope_decorator_1.Scopes('user-{userId}:write-api-key-*'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, api_keys_dto_1.CreateApiKeyDto]),
    __metadata("design:returntype", Promise)
], ApiKeyUserController.prototype, "create", null);
__decorate([
    common_1.Get(),
    scope_decorator_1.Scopes('user-{userId}:read-api-key-*'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Query('skip', optional_int_pipe_1.OptionalIntPipe)),
    __param(2, common_1.Query('take', optional_int_pipe_1.OptionalIntPipe)),
    __param(3, common_1.Query('cursor', cursor_pipe_1.CursorPipe)),
    __param(4, common_1.Query('where', where_pipe_1.WherePipe)),
    __param(5, common_1.Query('orderBy', order_by_pipe_1.OrderByPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ApiKeyUserController.prototype, "getAll", null);
__decorate([
    common_1.Get('scopes'),
    scope_decorator_1.Scopes('user-{userId}:write-api-key-*'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ApiKeyUserController.prototype, "scopes", null);
__decorate([
    common_1.Get(':id'),
    scope_decorator_1.Scopes('user-{userId}:read-api-key-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ApiKeyUserController.prototype, "get", null);
__decorate([
    common_1.Patch(':id'),
    audit_log_decorator_1.AuditLog('update-api-key'),
    scope_decorator_1.Scopes('user-{userId}:write-api-key-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Body()),
    __param(1, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(2, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [api_keys_dto_1.UpdateApiKeyDto, Number, Number]),
    __metadata("design:returntype", Promise)
], ApiKeyUserController.prototype, "update", null);
__decorate([
    common_1.Put(':id'),
    audit_log_decorator_1.AuditLog('update-api-key'),
    scope_decorator_1.Scopes('user-{userId}:write-api-key-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Body()),
    __param(1, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(2, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [api_keys_dto_1.ReplaceApiKeyDto, Number, Number]),
    __metadata("design:returntype", Promise)
], ApiKeyUserController.prototype, "replace", null);
__decorate([
    common_1.Delete(':id'),
    audit_log_decorator_1.AuditLog('delete-api-key'),
    scope_decorator_1.Scopes('user-{userId}:delete-api-key-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ApiKeyUserController.prototype, "remove", null);
__decorate([
    common_1.Get(':id/logs'),
    scope_decorator_1.Scopes('user-{userId}:read-api-key-logs-*'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Param('id', common_1.ParseIntPipe)),
    __param(2, common_1.Query('take', optional_int_pipe_1.OptionalIntPipe)),
    __param(3, common_1.Query('cursor', cursor_pipe_1.CursorPipe)),
    __param(4, common_1.Query('where', where_pipe_1.WherePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Object, Object]),
    __metadata("design:returntype", Promise)
], ApiKeyUserController.prototype, "getLogs", null);
ApiKeyUserController = __decorate([
    common_1.Controller('users/:userId/api-keys'),
    __metadata("design:paramtypes", [api_keys_service_1.ApiKeysService])
], ApiKeyUserController);
exports.ApiKeyUserController = ApiKeyUserController;
//# sourceMappingURL=api-keys-user.controller.js.map