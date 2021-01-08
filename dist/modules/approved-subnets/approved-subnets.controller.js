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
exports.ApprovedSubnetController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const cursor_pipe_1 = require("../../pipes/cursor.pipe");
const optional_int_pipe_1 = require("../../pipes/optional-int.pipe");
const order_by_pipe_1 = require("../../pipes/order-by.pipe");
const where_pipe_1 = require("../../pipes/where.pipe");
const scope_decorator_1 = require("../auth/scope.decorator");
const approved_subnets_service_1 = require("./approved-subnets.service");
let ApprovedSubnetController = class ApprovedSubnetController {
    constructor(approvedSubnetsService) {
        this.approvedSubnetsService = approvedSubnetsService;
    }
    async getAll(userId, skip, take, cursor, where, orderBy) {
        return this.approvedSubnetsService.getApprovedSubnets(userId, {
            skip,
            take,
            orderBy,
            cursor,
            where,
        });
    }
    async get(userId, id) {
        return this.approvedSubnetsService.getApprovedSubnet(userId, Number(id));
    }
    async remove(userId, id) {
        return this.approvedSubnetsService.deleteApprovedSubnet(userId, Number(id));
    }
};
__decorate([
    common_1.Get(),
    scope_decorator_1.Scopes('user-{userId}:read-approved-subnet-*'),
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
], ApprovedSubnetController.prototype, "getAll", null);
__decorate([
    common_1.Get(':id'),
    scope_decorator_1.Scopes('user-{userId}:read-approved-subnet-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ApprovedSubnetController.prototype, "get", null);
__decorate([
    common_1.Delete(':id'),
    scope_decorator_1.Scopes('user-{userId}:delete-approved-subnet-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ApprovedSubnetController.prototype, "remove", null);
ApprovedSubnetController = __decorate([
    common_1.Controller('users/:userId/approved-subnets'),
    __metadata("design:paramtypes", [approved_subnets_service_1.ApprovedSubnetsService])
], ApprovedSubnetController);
exports.ApprovedSubnetController = ApprovedSubnetController;
//# sourceMappingURL=approved-subnets.controller.js.map