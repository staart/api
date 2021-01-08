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
exports.UserMembershipController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const cursor_pipe_1 = require("../../pipes/cursor.pipe");
const optional_int_pipe_1 = require("../../pipes/optional-int.pipe");
const order_by_pipe_1 = require("../../pipes/order-by.pipe");
const where_pipe_1 = require("../../pipes/where.pipe");
const scope_decorator_1 = require("../auth/scope.decorator");
const groups_dto_1 = require("../groups/groups.dto");
const memberships_service_1 = require("./memberships.service");
let UserMembershipController = class UserMembershipController {
    constructor(membershipsService) {
        this.membershipsService = membershipsService;
    }
    async create(userId, data) {
        return this.membershipsService.createUserMembership(userId, data);
    }
    async getAll(userId, skip, take, cursor, where, orderBy) {
        return this.membershipsService.getMemberships({
            skip,
            take,
            orderBy,
            cursor,
            where: Object.assign(Object.assign({}, where), { user: { id: userId } }),
        });
    }
    async get(userId, id) {
        return this.membershipsService.getUserMembership(userId, Number(id));
    }
    async remove(userId, id) {
        return this.membershipsService.deleteUserMembership(userId, Number(id));
    }
};
__decorate([
    common_1.Post(),
    scope_decorator_1.Scopes('user-{userId}:write-membership'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, groups_dto_1.CreateGroupDto]),
    __metadata("design:returntype", Promise)
], UserMembershipController.prototype, "create", null);
__decorate([
    common_1.Get(),
    scope_decorator_1.Scopes('user-{userId}:read-membership'),
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
], UserMembershipController.prototype, "getAll", null);
__decorate([
    common_1.Get(':id'),
    scope_decorator_1.Scopes('user-{userId}:read-membership-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], UserMembershipController.prototype, "get", null);
__decorate([
    common_1.Delete(':id'),
    scope_decorator_1.Scopes('user-{userId}:delete-membership-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], UserMembershipController.prototype, "remove", null);
UserMembershipController = __decorate([
    common_1.Controller('users/:userId/memberships'),
    __metadata("design:paramtypes", [memberships_service_1.MembershipsService])
], UserMembershipController);
exports.UserMembershipController = UserMembershipController;
//# sourceMappingURL=memberships-user.controller.js.map