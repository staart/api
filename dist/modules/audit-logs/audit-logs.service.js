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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogsService = void 0;
const common_1 = require("@nestjs/common");
const errors_constants_1 = require("../../errors/errors.constants");
const prisma_service_1 = require("../../providers/prisma/prisma.service");
let AuditLogsService = class AuditLogsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAuditLogs(groupId, params) {
        const { skip, take, cursor, where, orderBy } = params;
        const AuditLog = await this.prisma.auditLog.findMany({
            skip,
            take,
            cursor,
            where: Object.assign(Object.assign({}, where), { group: { id: groupId } }),
            orderBy,
        });
        return AuditLog.map((group) => this.prisma.expose(group));
    }
    async getAuditLog(groupId, id) {
        const AuditLog = await this.prisma.auditLog.findUnique({
            where: { id },
        });
        if (!AuditLog)
            throw new common_1.NotFoundException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        if (AuditLog.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        return this.prisma.expose(AuditLog);
    }
};
AuditLogsService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogsService);
exports.AuditLogsService = AuditLogsService;
//# sourceMappingURL=audit-logs.service.js.map