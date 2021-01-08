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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiFactorAuthenticationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt_1 = require("bcrypt");
const errors_constants_1 = require("../../errors/errors.constants");
const mail_service_1 = require("../../providers/mail/mail.service");
const prisma_service_1 = require("../../providers/prisma/prisma.service");
const tokens_service_1 = require("../../providers/tokens/tokens.service");
const twilio_service_1 = require("../../providers/twilio/twilio.service");
const auth_service_1 = require("../auth/auth.service");
let MultiFactorAuthenticationService = class MultiFactorAuthenticationService {
    constructor(prisma, auth, configService, twilioService, emailService, tokensService) {
        this.prisma = prisma;
        this.auth = auth;
        this.configService = configService;
        this.twilioService = twilioService;
        this.emailService = emailService;
        this.tokensService = tokensService;
    }
    async requestTotpMfa(userId) {
        const enabled = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorMethod: true },
        });
        if (!enabled)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        if (enabled.twoFactorMethod !== 'NONE')
            throw new common_1.ConflictException(errors_constants_1.MFA_ENABLED_CONFLICT);
        return this.auth.getTotpQrCode(userId);
    }
    async requestSmsMfa(userId, phone) {
        const enabled = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorMethod: true },
        });
        if (!enabled)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        if (enabled.twoFactorMethod !== 'NONE')
            throw new common_1.ConflictException(errors_constants_1.MFA_ENABLED_CONFLICT);
        const secret = this.tokensService.generateUuid();
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret, twoFactorPhone: phone },
        });
        return this.twilioService.send({
            to: phone,
            body: `${this.auth.getOneTimePassword(secret)} is your ${this.configService.get('meta.appName')} verification code.`,
        });
    }
    async requestEmailMfa(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                twoFactorMethod: true,
                prefersEmail: true,
                name: true,
                id: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        if (user.twoFactorMethod !== 'NONE')
            throw new common_1.ConflictException(errors_constants_1.MFA_ENABLED_CONFLICT);
        const secret = this.tokensService.generateUuid();
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret },
        });
        if (!user.prefersEmail)
            throw new common_1.BadRequestException(errors_constants_1.NO_EMAILS);
        return this.emailService.send({
            to: `"${user.name}" <${user.prefersEmail.emailSafe}>`,
            template: 'auth/enable-email-mfa',
            data: {
                name: user.name,
                code: this.auth.getOneTimePassword(secret),
            },
        });
    }
    async enableMfa(method, userId, token) {
        await this.auth.enableMfaMethod(method, userId, token);
        return this.regenerateBackupCodes(userId);
    }
    async disableMfa(userId) {
        const enabled = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorMethod: true },
        });
        if (!enabled)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        if (enabled.twoFactorMethod === 'NONE')
            throw new common_1.BadRequestException(errors_constants_1.MFA_NOT_ENABLED);
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorMethod: 'NONE', twoFactorSecret: null },
        });
        return this.prisma.expose(user);
    }
    async regenerateBackupCodes(id) {
        var e_1, _a;
        var _b;
        await this.prisma.backupCode.deleteMany({ where: { user: { id } } });
        const codes = [];
        try {
            for (var _c = __asyncValues([...Array(10)]), _d; _d = await _c.next(), !_d.done;) {
                const _ = _d.value;
                const unsafeCode = this.tokensService.generateUuid();
                codes.push(unsafeCode);
                const code = await bcrypt_1.hash(unsafeCode, (_b = this.configService.get('security.saltRounds')) !== null && _b !== void 0 ? _b : 10);
                await this.prisma.backupCode.create({
                    data: { user: { connect: { id } }, code },
                });
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) await _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return codes;
    }
};
MultiFactorAuthenticationService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        config_1.ConfigService,
        twilio_service_1.TwilioService,
        mail_service_1.MailService,
        tokens_service_1.TokensService])
], MultiFactorAuthenticationService);
exports.MultiFactorAuthenticationService = MultiFactorAuthenticationService;
//# sourceMappingURL=multi-factor-authentication.service.js.map