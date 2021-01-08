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
exports.GroupController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const cursor_pipe_1 = require("../../pipes/cursor.pipe");
const optional_int_pipe_1 = require("../../pipes/optional-int.pipe");
const order_by_pipe_1 = require("../../pipes/order-by.pipe");
const where_pipe_1 = require("../../pipes/where.pipe");
const audit_log_decorator_1 = require("../audit-logs/audit-log.decorator");
const scope_decorator_1 = require("../auth/scope.decorator");
const groups_dto_1 = require("./groups.dto");
const groups_service_1 = require("./groups.service");
const select_include_pipe_1 = require("../../pipes/select-include.pipe");
let GroupController = class GroupController {
    constructor(groupsService) {
        this.groupsService = groupsService;
    }
    async getAll(skip, take, cursor, where, orderBy) {
        return this.groupsService.getGroups({
            skip,
            take,
            orderBy,
            cursor,
            where,
        });
    }
    async get(id, select, include) {
        return this.groupsService.getGroup(Number(id), { select, include });
    }
    async update(data, id) {
        return this.groupsService.updateGroup(Number(id), data);
    }
    async replace(data, id) {
        return this.groupsService.updateGroup(Number(id), data);
    }
    async remove(id) {
        return this.groupsService.deleteGroup(Number(id));
    }
    async getSubgroups(id, skip, take, cursor, where, orderBy) {
        return this.groupsService.getSubgroups(id, {
            skip,
            take,
            orderBy,
            cursor,
            where,
        });
    }
};
__decorate([
    common_1.Get(),
    scope_decorator_1.Scopes('group-*:read-info'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, common_1.Query('skip', optional_int_pipe_1.OptionalIntPipe)),
    __param(1, common_1.Query('take', optional_int_pipe_1.OptionalIntPipe)),
    __param(2, common_1.Query('cursor', cursor_pipe_1.CursorPipe)),
    __param(3, common_1.Query('where', where_pipe_1.WherePipe)),
    __param(4, common_1.Query('orderBy', order_by_pipe_1.OrderByPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "getAll", null);
__decorate([
    common_1.Get(':groupId'),
    scope_decorator_1.Scopes('group-{groupId}:read-info'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __param(1, common_1.Query('select', select_include_pipe_1.SelectIncludePipe)),
    __param(2, common_1.Query('include', select_include_pipe_1.SelectIncludePipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "get", null);
__decorate([
    common_1.Patch(':groupId'),
    audit_log_decorator_1.AuditLog('update-info'),
    scope_decorator_1.Scopes('group-{groupId}:write-info'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Body()),
    __param(1, common_1.Param('groupId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [groups_dto_1.UpdateGroupDto, Number]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "update", null);
__decorate([
    common_1.Put(':groupId'),
    audit_log_decorator_1.AuditLog('update-info'),
    scope_decorator_1.Scopes('group-{groupId}:write-info'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Body()),
    __param(1, common_1.Param('groupId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [groups_dto_1.ReplaceGroupDto, Number]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "replace", null);
__decorate([
    common_1.Delete(':groupId'),
    audit_log_decorator_1.AuditLog('delete'),
    scope_decorator_1.Scopes('group-{groupId}:delete'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('groupId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], GroupController.prototype, "remove", null);
__decorate([
    common_1.Get(':groupId/subgroups'),
    scope_decorator_1.Scopes('group-*:read-info'),
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
], GroupController.prototype, "getSubgroups", null);
GroupController = __decorate([
    common_1.Controller('groups'),
    __metadata("design:paramtypes", [groups_service_1.GroupsService])
], GroupController);
exports.GroupController = GroupController;
//# sourceMappingURL=groups.controller.js.map