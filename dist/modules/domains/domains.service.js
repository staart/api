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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const got_1 = __importDefault(require("got"));
const url_1 = require("url");
const errors_constants_1 = require("../../errors/errors.constants");
const dns_service_1 = require("../../providers/dns/dns.service");
const prisma_service_1 = require("../../providers/prisma/prisma.service");
const tokens_service_1 = require("../../providers/tokens/tokens.service");
const domains_constants_1 = require("./domains.constants");
let DomainsService = class DomainsService {
    constructor(prisma, tokensService, dnsService, configService) {
        this.prisma = prisma;
        this.tokensService = tokensService;
        this.dnsService = dnsService;
        this.configService = configService;
    }
    async createDomain(groupId, data) {
        try {
            const fullUrl = new url_1.URL(data.domain);
            data.domain = fullUrl.hostname;
        }
        catch (error) { }
        if (!/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(data.domain))
            throw new common_1.BadRequestException(errors_constants_1.INVALID_DOMAIN);
        const verificationCode = this.tokensService.generateUuid();
        const currentProfilePicture = await this.prisma.group.findUnique({
            where: { id: groupId },
            select: { profilePictureUrl: true },
        });
        const parsedProfilePicture = new url_1.URL(currentProfilePicture.profilePictureUrl);
        if (parsedProfilePicture.hostname === 'ui-avatars.com')
            try {
                const img = await got_1.default('https://logo.clearbit.com/${data.domain}', {
                    responseType: 'buffer',
                });
                if (img.body.byteLength > 1)
                    await this.prisma.group.update({
                        where: { id: groupId },
                        data: {
                            profilePictureUrl: `https://logo.clearbit.com/${data.domain}`,
                        },
                    });
            }
            catch (error) { }
        return this.prisma.domain.create({
            data: Object.assign(Object.assign({}, data), { verificationCode, group: { connect: { id: groupId } } }),
        });
    }
    async getDomains(groupId, params) {
        const { skip, take, cursor, where, orderBy } = params;
        const domains = await this.prisma.domain.findMany({
            skip,
            take,
            cursor,
            where: Object.assign(Object.assign({}, where), { group: { id: groupId } }),
            orderBy,
        });
        return domains.map((group) => this.prisma.expose(group));
    }
    async getDomain(groupId, id) {
        const domain = await this.prisma.domain.findUnique({
            where: { id },
        });
        if (!domain)
            throw new common_1.NotFoundException(errors_constants_1.DOMAIN_NOT_FOUND);
        if (domain.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        return this.prisma.expose(domain);
    }
    async verifyDomain(groupId, id, method) {
        const domain = await this.prisma.domain.findUnique({
            where: { id },
        });
        if (!domain)
            throw new common_1.NotFoundException(errors_constants_1.DOMAIN_NOT_FOUND);
        if (domain.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        if (method === domains_constants_1.DOMAIN_VERIFICATION_TXT) {
            const txtRecords = await this.dnsService.lookup(domain.domain, 'TXT');
            if (JSON.stringify(txtRecords).includes(domain.verificationCode)) {
                await this.prisma.domain.update({
                    where: { id },
                    data: { isVerified: true },
                });
            }
            else
                throw new common_1.BadRequestException(errors_constants_1.DOMAIN_NOT_VERIFIED);
        }
        else {
            let verified = false;
            try {
                const { body } = await got_1.default(`http://${domain.domain}/.well-known/${this.configService.get('meta.domainVerificationFile' !== null && 'meta.domainVerificationFile' !== void 0 ? 'meta.domainVerificationFile' : 'staart-verify.txt')}`);
                verified = body.includes(domain.verificationCode);
            }
            catch (error) { }
            if (verified) {
                await this.prisma.domain.update({
                    where: { id },
                    data: { isVerified: true },
                });
            }
            else
                throw new common_1.BadRequestException(errors_constants_1.DOMAIN_NOT_VERIFIED);
        }
        return domain;
    }
    async deleteDomain(groupId, id) {
        const testDomain = await this.prisma.domain.findUnique({
            where: { id },
        });
        if (!testDomain)
            throw new common_1.NotFoundException(errors_constants_1.DOMAIN_NOT_FOUND);
        if (testDomain.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        const domain = await this.prisma.domain.delete({
            where: { id },
        });
        return this.prisma.expose(domain);
    }
};
DomainsService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tokens_service_1.TokensService,
        dns_service_1.DnsService,
        config_1.ConfigService])
], DomainsService);
exports.DomainsService = DomainsService;
//# sourceMappingURL=domains.service.js.map