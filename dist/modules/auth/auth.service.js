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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt_1 = require("bcrypt");
const crypto_1 = require("crypto");
const source_1 = __importDefault(require("got/dist/source"));
const ip_anonymize_1 = __importDefault(require("ip-anonymize"));
const otplib_1 = require("otplib");
const qrcode_1 = __importDefault(require("qrcode"));
const randomcolor_1 = __importDefault(require("randomcolor"));
const ua_parser_js_1 = require("ua-parser-js");
const errors_constants_1 = require("../../errors/errors.constants");
const safe_email_1 = require("../../helpers/safe-email");
const geolocation_service_1 = require("../../providers/geolocation/geolocation.service");
const mail_service_1 = require("../../providers/mail/mail.service");
const prisma_service_1 = require("../../providers/prisma/prisma.service");
const pwned_service_1 = require("../../providers/pwned/pwned.service");
const tokens_constants_1 = require("../../providers/tokens/tokens.constants");
const tokens_service_1 = require("../../providers/tokens/tokens.service");
const twilio_service_1 = require("../../providers/twilio/twilio.service");
const approved_subnets_service_1 = require("../approved-subnets/approved-subnets.service");
let AuthService = class AuthService {
    constructor(prisma, email, configService, pwnedService, tokensService, geolocationService, approvedSubnetsService, twilioService) {
        this.prisma = prisma;
        this.email = email;
        this.configService = configService;
        this.pwnedService = pwnedService;
        this.tokensService = tokensService;
        this.geolocationService = geolocationService;
        this.approvedSubnetsService = approvedSubnetsService;
        this.twilioService = twilioService;
        this.securityConfig = this.configService.get('security');
        this.metaConfig = this.configService.get('meta');
        this.authenticator = otplib_1.authenticator.create({
            window: [
                this.securityConfig.totpWindowPast,
                this.securityConfig.totpWindowFuture,
            ],
        });
    }
    async login(ipAddress, userAgent, email, password, code) {
        var _a;
        const emailSafe = safe_email_1.safeEmail(email);
        const user = await this.prisma.user.findFirst({
            where: { emails: { some: { emailSafe } } },
            include: {
                emails: true,
                prefersEmail: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        if (!user.active)
            await this.prisma.user.update({
                where: { id: user.id },
                data: { active: true },
            });
        if (!((_a = user.emails.find((i) => i.emailSafe === emailSafe)) === null || _a === void 0 ? void 0 : _a.isVerified))
            throw new common_1.UnauthorizedException(errors_constants_1.UNVERIFIED_EMAIL);
        if (!password || !user.password)
            return this.mfaResponse(user, 'EMAIL');
        if (!user.prefersEmail)
            throw new common_1.BadRequestException(errors_constants_1.NO_EMAILS);
        if (!(await bcrypt_1.compare(password, user.password)))
            throw new common_1.UnauthorizedException(errors_constants_1.INVALID_CREDENTIALS);
        if (code)
            return this.loginUserWithTotpCode(ipAddress, userAgent, user.id, code);
        if (user.twoFactorMethod !== 'NONE')
            return this.mfaResponse(user);
        await this.checkLoginSubnet(ipAddress, userAgent, user.checkLocationOnLogin, user.id);
        return this.loginResponse(ipAddress, userAgent, user);
    }
    async register(ipAddress, _data) {
        var e_1, _a;
        var _b, _c;
        const { email } = _data, data = __rest(_data, ["email"]);
        const emailSafe = safe_email_1.safeEmail(email);
        const testUser = await this.prisma.user.findFirst({
            where: { emails: { some: { emailSafe } } },
        });
        if (testUser)
            throw new common_1.ConflictException(errors_constants_1.EMAIL_USER_CONFLICT);
        const ignorePwnedPassword = !!data.ignorePwnedPassword;
        delete data.ignorePwnedPassword;
        if (data.name)
            data.name = data.name
                .split(' ')
                .map((word, index) => {
                var _a, _b;
                return index === 0 || index === data.name.split(' ').length
                    ? ((_a = word.charAt(0)) !== null && _a !== void 0 ? _a : '').toUpperCase() +
                        ((_b = word.slice(1)) !== null && _b !== void 0 ? _b : '').toLowerCase()
                    : word;
            })
                .join(' ');
        if (data.password)
            data.password = await this.hashAndValidatePassword(data.password, ignorePwnedPassword);
        let initials = data.name.trim().substr(0, 2).toUpperCase();
        if (data.name.includes(' '))
            initials = data.name
                .split(' ')
                .map((i) => i.trim().substr(0, 1))
                .join('')
                .toUpperCase();
        data.profilePictureUrl = (_b = data.profilePictureUrl) !== null && _b !== void 0 ? _b : `https://ui-avatars.com/api/?name=${initials}&background=${randomcolor_1.default({
            luminosity: 'light',
        }).replace('#', '')}&color=000000`;
        try {
            for (var _d = __asyncValues([email, emailSafe]), _e; _e = await _d.next(), !_e.done;) {
                const emailString = _e.value;
                const md5Email = crypto_1.createHash('md5').update(emailString).digest('hex');
                try {
                    const img = await source_1.default(`https://www.gravatar.com/avatar/${md5Email}?d=404`, { responseType: 'buffer' });
                    if (img.body.byteLength > 1)
                        data.profilePictureUrl = `https://www.gravatar.com/avatar/${md5Email}?d=mp`;
                }
                catch (error) { }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_e && !_e.done && (_a = _d.return)) await _a.call(_d);
            }
            finally { if (e_1) throw e_1.error; }
        }
        const user = await this.prisma.user.create({
            data: Object.assign(Object.assign({}, data), { emails: {
                    create: { email: email, emailSafe },
                } }),
            include: { emails: { select: { id: true } } },
        });
        if ((_c = user.emails[0]) === null || _c === void 0 ? void 0 : _c.id)
            await this.prisma.user.update({
                where: { id: user.id },
                data: { prefersEmail: { connect: { id: user.emails[0].id } } },
            });
        await this.sendEmailVerification(email);
        await this.approvedSubnetsService.approveNewSubnet(user.id, ipAddress);
        return this.prisma.expose(user);
    }
    async sendEmailVerification(email, resend = false) {
        const emailSafe = safe_email_1.safeEmail(email);
        const emailDetails = await this.prisma.email.findFirst({
            where: { emailSafe },
            include: { user: true },
        });
        if (!emailDetails)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        if (emailDetails.isVerified)
            throw new common_1.ConflictException(errors_constants_1.EMAIL_VERIFIED_CONFLICT);
        this.email.send({
            to: `"${emailDetails.user.name}" <${email}>`,
            template: resend
                ? 'auth/resend-email-verification'
                : 'auth/email-verification',
            data: {
                name: emailDetails.user.name,
                days: 7,
                link: `${this.metaConfig.frontendUrl}/auth/link/verify-email?token=${this.tokensService.signJwt(tokens_constants_1.EMAIL_VERIFY_TOKEN, { id: emailDetails.id }, '7d')}`,
            },
        });
        return { queued: true };
    }
    async refresh(ipAddress, userAgent, token) {
        if (!token)
            throw new common_1.UnprocessableEntityException(errors_constants_1.NO_TOKEN_PROVIDED);
        const session = await this.prisma.session.findFirst({
            where: { token },
            include: { user: true },
        });
        if (!session)
            throw new common_1.NotFoundException(errors_constants_1.SESSION_NOT_FOUND);
        await this.prisma.session.updateMany({
            where: { token },
            data: { ipAddress, userAgent },
        });
        return {
            accessToken: await this.getAccessToken(session.user),
            refreshToken: token,
        };
    }
    async logout(token) {
        if (!token)
            throw new common_1.UnprocessableEntityException(errors_constants_1.NO_TOKEN_PROVIDED);
        const session = await this.prisma.session.findFirst({
            where: { token },
            select: { id: true, user: { select: { id: true } } },
        });
        if (!session)
            throw new common_1.NotFoundException(errors_constants_1.SESSION_NOT_FOUND);
        await this.prisma.session.delete({
            where: { id: session.id },
        });
    }
    async approveSubnet(ipAddress, userAgent, token) {
        if (!token)
            throw new common_1.UnprocessableEntityException(errors_constants_1.NO_TOKEN_PROVIDED);
        const { id } = this.tokensService.verify(tokens_constants_1.APPROVE_SUBNET_TOKEN, token);
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        await this.approvedSubnetsService.approveNewSubnet(id, ipAddress);
        return this.loginResponse(ipAddress, userAgent, user);
    }
    async getTotpQrCode(userId) {
        var _a;
        const secret = this.tokensService.generateUuid();
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret },
        });
        const otpauth = this.authenticator.keyuri(userId.toString(), (_a = this.metaConfig.appName) !== null && _a !== void 0 ? _a : '', secret);
        return qrcode_1.default.toDataURL(otpauth);
    }
    async enableMfaMethod(method, userId, code) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true, twoFactorMethod: true },
        });
        if (!user)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        if (user.twoFactorMethod !== 'NONE')
            throw new common_1.ConflictException(errors_constants_1.MFA_ENABLED_CONFLICT);
        if (!user.twoFactorSecret)
            user.twoFactorSecret = this.tokensService.generateUuid();
        if (!this.authenticator.check(code, user.twoFactorSecret))
            throw new common_1.UnauthorizedException(errors_constants_1.INVALID_MFA_CODE);
        const result = await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorMethod: method, twoFactorSecret: user.twoFactorSecret },
        });
        return this.prisma.expose(result);
    }
    async loginWithTotp(ipAddress, userAgent, token, code) {
        const { id } = this.tokensService.verify(tokens_constants_1.MULTI_FACTOR_TOKEN, token);
        return this.loginUserWithTotpCode(ipAddress, userAgent, id, code);
    }
    async loginWithEmailToken(ipAddress, userAgent, token) {
        const { id } = this.tokensService.verify(tokens_constants_1.EMAIL_MFA_TOKEN, token);
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        await this.approvedSubnetsService.upsertNewSubnet(id, ipAddress);
        return this.loginResponse(ipAddress, userAgent, user);
    }
    async requestPasswordReset(email) {
        const emailSafe = safe_email_1.safeEmail(email);
        const emailDetails = await this.prisma.email.findFirst({
            where: { emailSafe },
            include: { user: true },
        });
        if (!emailDetails)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        this.email.send({
            to: `"${emailDetails.user.name}" <${email}>`,
            template: 'auth/password-reset',
            data: {
                name: emailDetails.user.name,
                minutes: 30,
                link: `${this.metaConfig.frontendUrl}/auth/link/reset-password?token=${this.tokensService.signJwt(tokens_constants_1.PASSWORD_RESET_TOKEN, { id: emailDetails.user.id }, '30m')}`,
            },
        });
        return { queued: true };
    }
    async resetPassword(ipAddress, userAgent, token, password, ignorePwnedPassword) {
        const { id } = this.tokensService.verify(tokens_constants_1.PASSWORD_RESET_TOKEN, token);
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        password = await this.hashAndValidatePassword(password, !!ignorePwnedPassword);
        await this.prisma.user.update({ where: { id }, data: { password } });
        await this.approvedSubnetsService.upsertNewSubnet(id, ipAddress);
        return this.loginResponse(ipAddress, userAgent, user);
    }
    async verifyEmail(ipAddress, userAgent, token) {
        var e_2, _a;
        const { id } = this.tokensService.verify(tokens_constants_1.EMAIL_VERIFY_TOKEN, token);
        const result = await this.prisma.email.update({
            where: { id },
            data: { isVerified: true },
            include: { user: true },
        });
        const groupsToJoin = await this.prisma.group.findMany({
            where: {
                autoJoinDomain: true,
                domains: {
                    some: { isVerified: true, domain: result.emailSafe.split('@')[1] },
                },
            },
            select: { id: true, name: true },
        });
        try {
            for (var groupsToJoin_1 = __asyncValues(groupsToJoin), groupsToJoin_1_1; groupsToJoin_1_1 = await groupsToJoin_1.next(), !groupsToJoin_1_1.done;) {
                const group = groupsToJoin_1_1.value;
                await this.prisma.membership.create({
                    data: {
                        user: { connect: { id: result.user.id } },
                        group: { connect: { id: group.id } },
                        role: 'MEMBER',
                    },
                });
                this.email.send({
                    to: `"${result.user.name}" <${result.email}>`,
                    template: 'groups/invitation',
                    data: {
                        name: result.user.name,
                        group: group.name,
                        link: `${this.metaConfig.frontendUrl}/groups/${group.id}`,
                    },
                });
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (groupsToJoin_1_1 && !groupsToJoin_1_1.done && (_a = groupsToJoin_1.return)) await _a.call(groupsToJoin_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return this.loginResponse(ipAddress, userAgent, result.user);
    }
    getOneTimePassword(secret) {
        return this.authenticator.generate(secret);
    }
    async loginUserWithTotpCode(ipAddress, userAgent, id, code) {
        var e_3, _a;
        var _b, _c, _d, _e, _f, _g, _h;
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { prefersEmail: true },
        });
        if (!user)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        if (user.twoFactorMethod === 'NONE' || !user.twoFactorSecret)
            throw new common_1.BadRequestException(errors_constants_1.MFA_NOT_ENABLED);
        if (this.authenticator.check(code, user.twoFactorSecret))
            return this.loginResponse(ipAddress, userAgent, user);
        const backupCodes = await this.prisma.backupCode.findMany({
            where: { user: { id } },
        });
        let usedBackupCode = false;
        try {
            for (var backupCodes_1 = __asyncValues(backupCodes), backupCodes_1_1; backupCodes_1_1 = await backupCodes_1.next(), !backupCodes_1_1.done;) {
                const backupCode = backupCodes_1_1.value;
                if (await bcrypt_1.compare(code, backupCode.code)) {
                    if (!usedBackupCode) {
                        if (backupCode.isUsed)
                            throw new common_1.UnauthorizedException(errors_constants_1.MFA_BACKUP_CODE_USED);
                        usedBackupCode = true;
                        await this.prisma.backupCode.update({
                            where: { id: backupCode.id },
                            data: { isUsed: true },
                        });
                        const location = await this.geolocationService.getLocation(ipAddress);
                        const locationName = [
                            (_c = (_b = location === null || location === void 0 ? void 0 : location.city) === null || _b === void 0 ? void 0 : _b.names) === null || _c === void 0 ? void 0 : _c.en,
                            (_f = (_e = ((_d = location === null || location === void 0 ? void 0 : location.subdivisions) !== null && _d !== void 0 ? _d : [])[0]) === null || _e === void 0 ? void 0 : _e.names) === null || _f === void 0 ? void 0 : _f.en,
                            (_h = (_g = location === null || location === void 0 ? void 0 : location.country) === null || _g === void 0 ? void 0 : _g.names) === null || _h === void 0 ? void 0 : _h.en,
                        ]
                            .filter((i) => i)
                            .join(', ') || 'Unknown location';
                        if (user.prefersEmail)
                            this.email.send({
                                to: `"${user.name}" <${user.prefersEmail.email}>`,
                                template: 'auth/used-backup-code',
                                data: {
                                    name: user.name,
                                    locationName,
                                    link: `${this.metaConfig.frontendUrl}/users/${id}/sessions`,
                                },
                            });
                    }
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (backupCodes_1_1 && !backupCodes_1_1.done && (_a = backupCodes_1.return)) await _a.call(backupCodes_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        if (!usedBackupCode)
            throw new common_1.UnauthorizedException(errors_constants_1.INVALID_MFA_CODE);
        return this.loginResponse(ipAddress, userAgent, user);
    }
    async getAccessToken(user) {
        const scopes = await this.getScopes(user);
        const payload = {
            sub: `acct:${user.id}@${this.securityConfig.issuerDomain}`,
            scopes,
        };
        return this.tokensService.signJwt(tokens_constants_1.LOGIN_ACCESS_TOKEN, payload, this.securityConfig.accessTokenExpiry);
    }
    async loginResponse(ipAddress, userAgent, user) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const token = this.tokensService.generateUuid();
        const ua = new ua_parser_js_1.UAParser(userAgent);
        const location = await this.geolocationService.getLocation(ipAddress);
        await this.prisma.session.create({
            data: {
                token,
                ipAddress,
                city: (_b = (_a = location === null || location === void 0 ? void 0 : location.city) === null || _a === void 0 ? void 0 : _a.names) === null || _b === void 0 ? void 0 : _b.en,
                region: (_e = (_d = (_c = location === null || location === void 0 ? void 0 : location.subdivisions) === null || _c === void 0 ? void 0 : _c.pop()) === null || _d === void 0 ? void 0 : _d.names) === null || _e === void 0 ? void 0 : _e.en,
                timezone: (_f = location === null || location === void 0 ? void 0 : location.location) === null || _f === void 0 ? void 0 : _f.time_zone,
                countryCode: (_g = location === null || location === void 0 ? void 0 : location.country) === null || _g === void 0 ? void 0 : _g.iso_code,
                userAgent,
                browser: `${(_h = ua.getBrowser().name) !== null && _h !== void 0 ? _h : ''} ${(_j = ua.getBrowser().version) !== null && _j !== void 0 ? _j : ''}`.trim() || undefined,
                operatingSystem: `${(_k = ua.getOS().name) !== null && _k !== void 0 ? _k : ''} ${(_l = ua.getOS().version) !== null && _l !== void 0 ? _l : ''}`
                    .replace('Mac OS', 'macOS')
                    .trim() || undefined,
                user: { connect: { id: user.id } },
            },
        });
        return {
            accessToken: await this.getAccessToken(user),
            refreshToken: token,
        };
    }
    async mfaResponse(user, forceMethod) {
        var _a;
        const mfaTokenPayload = {
            type: user.twoFactorMethod,
            id: user.id,
        };
        const totpToken = this.tokensService.signJwt(tokens_constants_1.MULTI_FACTOR_TOKEN, mfaTokenPayload, this.securityConfig.mfaTokenExpiry);
        if (user.twoFactorMethod === 'EMAIL' || forceMethod === 'EMAIL') {
            this.email.send({
                to: `"${user.name}" <${user.prefersEmail.email}>`,
                template: 'auth/mfa-code',
                data: {
                    name: user.name,
                    minutes: parseInt(this.securityConfig.mfaTokenExpiry),
                    link: `${this.metaConfig.frontendUrl}/auth/link/login%2Ftoken?token=${this.tokensService.signJwt(tokens_constants_1.EMAIL_MFA_TOKEN, { id: user.id }, this.securityConfig.mfaTokenExpiry)}`,
                },
            });
        }
        else if (user.twoFactorMethod === 'SMS' || forceMethod === 'SMS') {
            if (!user.twoFactorPhone)
                throw new common_1.BadRequestException(errors_constants_1.MFA_PHONE_NOT_FOUND);
            this.twilioService.send({
                to: user.twoFactorPhone,
                body: `${this.getOneTimePassword(user.twoFactorSecret)} is your ${(_a = this.metaConfig.appName) !== null && _a !== void 0 ? _a : ''} verification code.`,
            });
        }
        return { totpToken, type: user.twoFactorMethod, multiFactorRequired: true };
    }
    async checkLoginSubnet(ipAddress, _, checkLocationOnLogin, id) {
        var e_4, _a;
        var _b, _c, _d, _e, _f, _g, _h;
        if (!checkLocationOnLogin)
            return;
        const subnet = ip_anonymize_1.default(ipAddress);
        const previousSubnets = await this.prisma.approvedSubnet.findMany({
            where: { user: { id } },
        });
        let isApproved = false;
        try {
            for (var previousSubnets_1 = __asyncValues(previousSubnets), previousSubnets_1_1; previousSubnets_1_1 = await previousSubnets_1.next(), !previousSubnets_1_1.done;) {
                const item = previousSubnets_1_1.value;
                if (!isApproved)
                    if (await bcrypt_1.compare(subnet, item.subnet))
                        isApproved = true;
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (previousSubnets_1_1 && !previousSubnets_1_1.done && (_a = previousSubnets_1.return)) await _a.call(previousSubnets_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
        if (!isApproved) {
            const user = await this.prisma.user.findUnique({
                where: { id },
                select: { name: true, prefersEmail: true },
            });
            if (!user)
                throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
            const location = await this.geolocationService.getLocation(ipAddress);
            const locationName = [
                (_c = (_b = location === null || location === void 0 ? void 0 : location.city) === null || _b === void 0 ? void 0 : _b.names) === null || _c === void 0 ? void 0 : _c.en,
                (_f = (_e = ((_d = location === null || location === void 0 ? void 0 : location.subdivisions) !== null && _d !== void 0 ? _d : [])[0]) === null || _e === void 0 ? void 0 : _e.names) === null || _f === void 0 ? void 0 : _f.en,
                (_h = (_g = location === null || location === void 0 ? void 0 : location.country) === null || _g === void 0 ? void 0 : _g.names) === null || _h === void 0 ? void 0 : _h.en,
            ]
                .filter((i) => i)
                .join(', ') || 'Unknown location';
            if (user.prefersEmail)
                this.email.send({
                    to: `"${user.name}" <${user.prefersEmail.email}>`,
                    template: 'auth/approve-subnets',
                    data: {
                        name: user.name,
                        locationName,
                        minutes: 30,
                        link: `${this.metaConfig.frontendUrl}/auth/link/reset-password?token=${this.tokensService.signJwt(tokens_constants_1.APPROVE_SUBNET_TOKEN, { id }, '30m')}`,
                    },
                });
            throw new common_1.UnauthorizedException(errors_constants_1.UNVERIFIED_LOCATION);
        }
    }
    async hashAndValidatePassword(password, ignorePwnedPassword) {
        var _a, _b;
        if (!ignorePwnedPassword) {
            if (!this.securityConfig.passwordPwnedCheck)
                return await bcrypt_1.hash(password, (_a = this.securityConfig.saltRounds) !== null && _a !== void 0 ? _a : 10);
            if (!(await this.pwnedService.isPasswordSafe(password)))
                throw new common_1.BadRequestException(errors_constants_1.COMPROMISED_PASSWORD);
        }
        return await bcrypt_1.hash(password, (_b = this.securityConfig.saltRounds) !== null && _b !== void 0 ? _b : 10);
    }
    async getScopes(user) {
        var e_5, _a;
        if (user.role === "SUDO")
            return ["*"];
        const scopes = [`user-${user.id}:*`];
        const memberships = await this.prisma.membership.findMany({
            where: { user: { id: user.id } },
            select: { id: true, role: true, group: { select: { id: true } } },
        });
        try {
            for (var memberships_1 = __asyncValues(memberships), memberships_1_1; memberships_1_1 = await memberships_1.next(), !memberships_1_1.done;) {
                const membership = memberships_1_1.value;
                scopes.push(`membership-${membership.id}:*`);
                const ids = [
                    membership.group.id,
                    ...(await this.recursivelyGetSubgroupIds(membership.group.id)),
                ];
                ids.forEach((id) => {
                    if (membership.role === 'OWNER')
                        scopes.push(`group-${id}:*`);
                    if (membership.role === 'ADMIN')
                        scopes.push(`group-${id}:write-*`);
                    if (membership.role !== 'OWNER')
                        scopes.push(`group-${id}:read-*`);
                });
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (memberships_1_1 && !memberships_1_1.done && (_a = memberships_1.return)) await _a.call(memberships_1);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return scopes;
    }
    async recursivelyGetSubgroupIds(groupId) {
        var e_6, _a, e_7, _b;
        const subgroups = await this.prisma.group.findMany({
            where: { parent: { id: groupId } },
            select: {
                id: true,
                parent: { select: { id: true } },
                subgroups: { select: { id: true } },
            },
        });
        const ids = subgroups.map((i) => i.id);
        try {
            for (var subgroups_1 = __asyncValues(subgroups), subgroups_1_1; subgroups_1_1 = await subgroups_1.next(), !subgroups_1_1.done;) {
                const group = subgroups_1_1.value;
                try {
                    for (var _c = (e_7 = void 0, __asyncValues(group.subgroups)), _d; _d = await _c.next(), !_d.done;) {
                        const subgroup = _d.value;
                        const recurisiveIds = await this.recursivelyGetSubgroupIds(subgroup.id);
                        ids.push(...recurisiveIds);
                    }
                }
                catch (e_7_1) { e_7 = { error: e_7_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_b = _c.return)) await _b.call(_c);
                    }
                    finally { if (e_7) throw e_7.error; }
                }
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (subgroups_1_1 && !subgroups_1_1.done && (_a = subgroups_1.return)) await _a.call(subgroups_1);
            }
            finally { if (e_6) throw e_6.error; }
        }
        return ids;
    }
    async mergeUsers(token) {
        let baseUserId = undefined;
        let mergeUserId = undefined;
        try {
            const result = this.tokensService.verify(tokens_constants_1.MERGE_ACCOUNTS_TOKEN, token);
            baseUserId = result.baseUserId;
            mergeUserId = result.mergeUserId;
        }
        catch (error) { }
        if (!baseUserId || !mergeUserId)
            throw new common_1.BadRequestException(errors_constants_1.USER_NOT_FOUND);
        return this.merge(baseUserId, mergeUserId);
    }
    async merge(baseUserId, mergeUserId) {
        var e_8, _a, e_9, _b;
        const baseUser = await this.prisma.user.findUnique({
            where: { id: baseUserId },
        });
        const mergeUser = await this.prisma.user.findUnique({
            where: { id: mergeUserId },
        });
        if (!baseUser || !mergeUser)
            throw new common_1.NotFoundException(errors_constants_1.USER_NOT_FOUND);
        const combinedUser = {};
        [
            'checkLocationOnLogin',
            'countryCode',
            'gender',
            'name',
            'notificationEmails',
            'active',
            'prefersLanguage',
            'prefersColorScheme',
            'prefersReducedMotion',
            'profilePictureUrl',
            'role',
            'timezone',
            'twoFactorMethod',
            'twoFactorPhone',
            'twoFactorSecret',
            'attributes',
        ].forEach((key) => {
            if (mergeUser[key] != null)
                combinedUser[key] = mergeUser[key];
        });
        await this.prisma.user.update({
            where: { id: baseUserId },
            data: combinedUser,
        });
        try {
            for (var _c = __asyncValues([
                this.prisma.membership,
                this.prisma.email,
                this.prisma.session,
                this.prisma.approvedSubnet,
                this.prisma.backupCode,
                this.prisma.identity,
                this.prisma.auditLog,
                this.prisma.apiKey,
            ]), _d; _d = await _c.next(), !_d.done;) {
                const dataType = _d.value;
                try {
                    for (var _e = (e_9 = void 0, __asyncValues(await dataType.findMany({
                        where: { user: { id: mergeUserId } },
                        select: { id: true },
                    }))), _f; _f = await _e.next(), !_f.done;) {
                        const item = _f.value;
                        await dataType.update({
                            where: { id: item.id },
                            data: { user: { connect: { id: baseUserId } } },
                        });
                    }
                }
                catch (e_9_1) { e_9 = { error: e_9_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) await _b.call(_e);
                    }
                    finally { if (e_9) throw e_9.error; }
                }
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) await _a.call(_c);
            }
            finally { if (e_8) throw e_8.error; }
        }
        await this.prisma.user.delete({ where: { id: mergeUser.id } });
        return { success: true };
    }
};
AuthService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService,
        config_1.ConfigService,
        pwned_service_1.PwnedService,
        tokens_service_1.TokensService,
        geolocation_service_1.GeolocationService,
        approved_subnets_service_1.ApprovedSubnetsService,
        twilio_service_1.TwilioService])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map