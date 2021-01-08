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
exports.EmailController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const cursor_pipe_1 = require("../../pipes/cursor.pipe");
const optional_int_pipe_1 = require("../../pipes/optional-int.pipe");
const order_by_pipe_1 = require("../../pipes/order-by.pipe");
const where_pipe_1 = require("../../pipes/where.pipe");
const scope_decorator_1 = require("../auth/scope.decorator");
const emails_dto_1 = require("./emails.dto");
const emails_service_1 = require("./emails.service");
let EmailController = class EmailController {
    constructor(emailsService) {
        this.emailsService = emailsService;
    }
    async create(userId, data) {
        return this.emailsService.createEmail(userId, data);
    }
    async getAll(userId, skip, take, cursor, where, orderBy) {
        return this.emailsService.getEmails(userId, {
            skip,
            take,
            orderBy,
            cursor,
            where,
        });
    }
    async get(userId, id) {
        return this.emailsService.getEmail(userId, Number(id));
    }
    async remove(userId, id) {
        return this.emailsService.deleteEmail(userId, Number(id));
    }
};
__decorate([
    common_1.Post(),
    scope_decorator_1.Scopes('user-{userId}:write-email-*'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, emails_dto_1.CreateEmailDto]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "create", null);
__decorate([
    common_1.Get(),
    scope_decorator_1.Scopes('user-{userId}:read-email-*'),
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
], EmailController.prototype, "getAll", null);
__decorate([
    common_1.Get(':id'),
    scope_decorator_1.Scopes('user-{userId}:read-email-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "get", null);
__decorate([
    common_1.Delete(':id'),
    scope_decorator_1.Scopes('user-{userId}:delete-email-{id}'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, common_1.Param('userId', common_1.ParseIntPipe)),
    __param(1, common_1.Param('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "remove", null);
EmailController = __decorate([
    common_1.Controller('users/:userId/emails'),
    __metadata("design:paramtypes", [emails_service_1.EmailsService])
], EmailController);
exports.EmailController = EmailController;
//# sourceMappingURL=emails.controller.js.map