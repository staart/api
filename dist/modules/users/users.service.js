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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt_1 = require("bcrypt");
const errors_constants_1 = require("../../errors/errors.constants");
const safe_email_1 = require("../../helpers/safe-email");
const mail_service_1 = require("../../providers/mail/mail.service");
const prisma_service_1 = require("../../providers/prisma/prisma.service");
const tokens_constants_1 = require("../../providers/tokens/tokens.constants");
const tokens_service_1 = require("../../providers/tokens/tokens.service");
const auth_service_1 = require("../auth/auth.service");
let UsersService = class UsersService {
    constructor(prisma, auth, email, configService, tokensService) {
        this.prisma = prisma;
        this.auth = auth;
        this.email = email;
        this.configService = configService;
        this.tokensService = tokensService;
        this.metaConfig = this.configService.get('meta');
        this.securityConfig = this.configService.get('security');
    }
    async getUser(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        return this.prisma.expose(user);
    }
    async getUsers(params) {
        const { skip, take, cursor, where, orderBy } = params;
        const users = await this.prisma.user.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
        });
        return users.map((user) => this.prisma.expose(user));
    }
    async createUser(data) {
        return this.prisma.user.create({
            data,
        });
    }
    async updateUser(id, data) {
        var _a;
        const transformed = data;
        if (data.newPassword) {
            if (!data.currentPassword)
                throw new common_1.BadRequestException(errors_constants_1.CURRENT_PASSWORD_REQUIRED);
            const previousPassword = (_a = (await this.prisma.user.findUnique({
                where: { id },
                select: { password: true },
            }))) === null || _a === void 0 ? void 0 : _a.password;
            if (previousPassword)
                if (!(await bcrypt_1.compare(data.currentPassword, previousPassword)))
                    throw new common_1.BadRequestException(errors_constants_1.INVALID_CREDENTIALS);
            transformed.password = await this.auth.hashAndValidatePassword(data.newPassword, !!data.ignorePwnedPassword);
        }
        delete transformed.currentPassword;
        delete transformed.newPassword;
        delete transformed.ignorePwnedPassword;
        const updateData = transformed;
        const user = await this.prisma.user.update({
            data: updateData,
            where: { id },
        });
        return this.prisma.expose(user);
    }
    async deactivateUser(id) {
        const user = await this.prisma.user.update({
            where: { id },
            data: { active: false },
        });
        await this.prisma.session.deleteMany({ where: { user: { id } } });
        return this.prisma.expose(user);
    }
    async requestMerge(userId, email) {
        const emailSafe = safe_email_1.safeEmail(email);
        const user = await this.prisma.user.findFirst({
            where: { emails: { some: { emailSafe } } },
            include: { prefersEmail: true },
        });
        if (!user)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        if (user.id === userId)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        const minutes = this.securityConfig.mergeUsersTokenExpiry;
        this.email.send({
            to: `"${user.name}" <${user.prefersEmail.email}>`,
            template: 'auth/mfa-code',
            data: {
                name: user.name,
                minutes,
                link: `${this.metaConfig.frontendUrl}/auth/link/merge-accounts?token=${this.tokensService.signJwt(tokens_constants_1.MERGE_ACCOUNTS_TOKEN, { baseUserId: userId, mergeUserId: user.id }, `${minutes}m`)}`,
            },
        });
        return { queued: true };
    }
};
UsersService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        mail_service_1.MailService,
        config_1.ConfigService,
        tokens_service_1.TokensService])
], UsersService);
exports.UsersService = UsersService;
//# sourceMappingURL=users.service.js.map