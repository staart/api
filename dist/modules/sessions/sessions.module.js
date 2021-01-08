"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../providers/prisma/prisma.module");
const sessions_controller_1 = require("./sessions.controller");
const sessions_service_1 = require("./sessions.service");
let SessionsModule = class SessionsModule {
};
SessionsModule = __decorate([
    common_1.Module({
        imports: [prisma_module_1.PrismaModule],
        controllers: [sessions_controller_1.SessionController],
        providers: [sessions_service_1.SessionsService],
    })
], SessionsModule);
exports.SessionsModule = SessionsModule;
//# sourceMappingURL=sessions.module.js.map