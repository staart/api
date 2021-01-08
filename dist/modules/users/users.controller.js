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
exports.UserController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const cursor_pipe_1 = require("../../pipes/cursor.pipe");
const optional_int_pipe_1 = require("../../pipes/optional-int.pipe");
const order_by_pipe_1 = require("../../pipes/order-by.pipe");
const where_pipe_1 = require("../../pipes/where.pipe");
const rate_limit_decorator_1 = require("../auth/rate-limit.decorator");
const scope_decorator_1 = require("../auth/scope.decorator");
const users_dto_1 = require("./users.dto");
const users_service_1 = require("./users.service");
let UserController = class UserController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getAll(skip, take, cursor, where, orderBy) {
        return this.usersService.getUsers({ skip, take, orderBy, cursor, where });
    }
    async get(id) {
        return this.usersService.getUser(Number(id));
    }
    async update(id, data) {
        return this.usersService.updateUser(Number(id), data);
    }
    async remove(id) {
        return this.usersService.deactivateUser(Number(id));
    }
    async mergeRequest(id, email) {
        return this.usersService.requestMerge(Number(id), email);
    }
};
__decorate([
    common_1.Get(),
    scope_decorator_1.Scopes('user-*:read-info'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, common_1.Query('skip', optional_int_pipe_1.OptionalIntPipe)),
    __param(1, common_1.Query('take', optional_int_pipe_1.OptionalIntPipe)),
    __param(2, common_1.Query('cursor', cursor_pipe_1.CursorPipe)),
    __param(3, common_1.Query('where', where_pipe_1.WherePipe)),
    __param(4, common_1.Query('orderBy', order_by_pipe_1.OrderByPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getAll", null);
__decorate([
    common_1.Get(':userId'),
    scope_decorator_1.Scopes('user-{userId}:read-info'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "get", null);
__decorate([
    common_1.Patch(':userId'),
    scope_decorator_1.Scopes('user-{userId}:write-info'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, users_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "update", null);
__decorate([
    common_1.Delete(':userId'),
    scope_decorator_1.Scopes('user-{userId}:deactivate'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "remove", null);
__decorate([
    common_1.Post(':userId/merge-request'),
    scope_decorator_1.Scopes('user-{userId}:merge'),
    rate_limit_decorator_1.RateLimit(10),
    openapi.ApiResponse({ status: 201 }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Body('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "mergeRequest", null);
UserController = __decorate([
    common_1.Controller('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UserController);
exports.UserController = UserController;
//# sourceMappingURL=users.controller.js.map