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
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const errors_constants_1 = require("../../errors/errors.constants");
const prisma_service_1 = require("../../providers/prisma/prisma.service");
let SessionsService = class SessionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSessions(userId, params) {
        const { skip, take, cursor, where, orderBy } = params;
        const sessions = await this.prisma.session.findMany({
            skip,
            take,
            cursor,
            where: Object.assign(Object.assign({}, where), { user: { id: userId } }),
            orderBy,
        });
        return sessions.map((user) => this.prisma.expose(user));
    }
    async getSession(userId, id) {
        const session = await this.prisma.session.findUnique({
            where: { id },
        });
        if (!session)
            throw new common_1.NotFoundException(errors_constants_1.SESSION_NOT_FOUND);
        if (session.userId !== userId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        if (!session)
            throw new common_1.NotFoundException(errors_constants_1.SESSION_NOT_FOUND);
        return this.prisma.expose(session);
    }
    async deleteSession(userId, id) {
        const testSession = await this.prisma.session.findUnique({
            where: { id },
        });
        if (!testSession)
            throw new common_1.NotFoundException(errors_constants_1.SESSION_NOT_FOUND);
        if (testSession.userId !== userId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        const session = await this.prisma.session.delete({
            where: { id },
        });
        return this.prisma.expose(session);
    }
};
SessionsService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsService);
exports.SessionsService = SessionsService;
//# sourceMappingURL=sessions.service.js.map