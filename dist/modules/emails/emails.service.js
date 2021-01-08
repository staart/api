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
exports.EmailsService = void 0;
const common_1 = require("@nestjs/common");
const errors_constants_1 = require("../../errors/errors.constants");
const safe_email_1 = require("../../helpers/safe-email");
const prisma_service_1 = require("../../providers/prisma/prisma.service");
const auth_service_1 = require("../auth/auth.service");
const users_service_1 = require("../users/users.service");
let EmailsService = class EmailsService {
    constructor(prisma, users, auth) {
        this.prisma = prisma;
        this.users = users;
        this.auth = auth;
    }
    async createEmail(userId, data) {
        const emailSafe = safe_email_1.safeEmail(data.email);
        const result = await this.prisma.email.create({
            data: Object.assign(Object.assign({}, data), { emailSafe, user: { connect: { id: userId } } }),
        });
        await this.auth.sendEmailVerification(data.email);
        return result;
    }
    async getEmails(userId, params) {
        const { skip, take, cursor, where, orderBy } = params;
        const emails = await this.prisma.email.findMany({
            skip,
            take,
            cursor,
            where: Object.assign(Object.assign({}, where), { user: { id: userId } }),
            orderBy,
        });
        return emails.map((user) => this.prisma.expose(user));
    }
    async getEmail(userId, id) {
        const email = await this.prisma.email.findUnique({
            where: { id },
        });
        if (!email)
            throw new common_1.NotFoundException(errors_constants_1.EMAIL_NOT_FOUND);
        if (email.userId !== userId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        return this.prisma.expose(email);
    }
    async deleteEmail(userId, id) {
        const testEmail = await this.prisma.email.findUnique({
            where: { id },
        });
        if (!testEmail)
            throw new common_1.NotFoundException(errors_constants_1.EMAIL_NOT_FOUND);
        if (testEmail.userId !== userId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { prefersEmail: true },
        });
        if (!user)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        if (user.prefersEmail.id === id) {
            const otherEmails = (await this.prisma.email.findMany({ where: { user: { id: userId } } })).filter((i) => i.id !== id);
            if (!otherEmails.length)
                throw new common_1.BadRequestException(errors_constants_1.EMAIL_DELETE_PRIMARY);
            await this.prisma.user.update({
                where: { id: userId },
                data: { prefersEmail: { connect: { id: otherEmails[0].id } } },
            });
        }
        const email = await this.prisma.email.delete({
            where: { id },
        });
        return this.prisma.expose(email);
    }
};
EmailsService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService,
        auth_service_1.AuthService])
], EmailsService);
exports.EmailsService = EmailsService;
//# sourceMappingURL=emails.service.js.map