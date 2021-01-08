"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../providers/prisma/prisma.module");
const audit_logs_controller_1 = require("./audit-logs.controller");
const audit_logs_service_1 = require("./audit-logs.service");
let AuditLogsModule = class AuditLogsModule {
};
AuditLogsModule = __decorate([
    common_1.Module({
        imports: [prisma_module_1.PrismaModule],
        controllers: [audit_logs_controller_1.AuditLogController],
        providers: [audit_logs_service_1.AuditLogsService],
    })
], AuditLogsModule);
exports.AuditLogsModule = AuditLogsModule;
//# sourceMappingURL=audit-logs.module.js.map