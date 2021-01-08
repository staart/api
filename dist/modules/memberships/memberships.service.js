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
exports.MembershipsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const errors_constants_1 = require("../../errors/errors.constants");
const safe_email_1 = require("../../helpers/safe-email");
const mail_service_1 = require("../../providers/mail/mail.service");
const prisma_service_1 = require("../../providers/prisma/prisma.service");
const api_keys_service_1 = require("../api-keys/api-keys.service");
const auth_service_1 = require("../auth/auth.service");
const groups_service_1 = require("../groups/groups.service");
let MembershipsService = class MembershipsService {
    constructor(prisma, auth, email, configService, groupsService, apiKeyService) {
        this.prisma = prisma;
        this.auth = auth;
        this.email = email;
        this.configService = configService;
        this.groupsService = groupsService;
        this.apiKeyService = apiKeyService;
        this.metaConfig = this.configService.get('meta');
    }
    async getMemberships(params) {
        const { skip, take, cursor, where, orderBy } = params;
        const memberships = await this.prisma.membership.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
            include: { group: true, user: true },
        });
        return memberships.map((user) => this.prisma.expose(user));
    }
    async getUserMembership(userId, id) {
        const membership = await this.prisma.membership.findUnique({
            where: { id },
            include: { group: true },
        });
        if (!membership)
            throw new common_1.NotFoundException(errors_constants_1.MEMBERSHIP_NOT_FOUND);
        if (membership.userId !== userId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        return this.prisma.expose(membership);
    }
    async getGroupMembership(groupId, id) {
        const membership = await this.prisma.membership.findUnique({
            where: { id },
            include: { user: true },
        });
        if (!membership)
            throw new common_1.NotFoundException(errors_constants_1.MEMBERSHIP_NOT_FOUND);
        if (membership.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        return this.prisma.expose(membership);
    }
    async deleteUserMembership(userId, id) {
        const testMembership = await this.prisma.membership.findUnique({
            where: { id },
        });
        if (!testMembership)
            throw new common_1.NotFoundException(errors_constants_1.MEMBERSHIP_NOT_FOUND);
        if (testMembership.userId !== userId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        await this.verifyDeleteMembership(testMembership.groupId, id);
        const membership = await this.prisma.membership.delete({
            where: { id },
        });
        await this.apiKeyService.removeUnauthorizedScopesForUser(userId);
        return this.prisma.expose(membership);
    }
    async updateGroupMembership(groupId, id, data) {
        const testMembership = await this.prisma.membership.findUnique({
            where: { id },
        });
        if (!testMembership)
            throw new common_1.NotFoundException(errors_constants_1.MEMBERSHIP_NOT_FOUND);
        if (testMembership.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        if (testMembership.role === 'OWNER' && data.role !== 'OWNER') {
            const otherOwners = (await this.prisma.membership.findMany({
                where: { group: { id: groupId }, role: 'OWNER' },
            })).filter((i) => i.id !== id);
            if (!otherOwners.length)
                throw new common_1.BadRequestException(errors_constants_1.CANNOT_UPDATE_ROLE_SOLE_OWNER);
        }
        const membership = await this.prisma.membership.update({
            where: { id },
            data,
            include: { user: true },
        });
        await this.apiKeyService.removeUnauthorizedScopesForUser(testMembership.userId);
        return this.prisma.expose(membership);
    }
    async deleteGroupMembership(groupId, id) {
        const testMembership = await this.prisma.membership.findUnique({
            where: { id },
        });
        if (!testMembership)
            throw new common_1.NotFoundException(errors_constants_1.MEMBERSHIP_NOT_FOUND);
        if (testMembership.groupId !== groupId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        await this.verifyDeleteMembership(testMembership.groupId, id);
        const membership = await this.prisma.membership.delete({
            where: { id },
            include: { user: true },
        });
        await this.apiKeyService.removeUnauthorizedScopesForUser(testMembership.userId);
        return this.prisma.expose(membership);
    }
    async createUserMembership(userId, data) {
        const created = await this.groupsService.createGroup(userId, data);
        return created.memberships[0];
    }
    async createGroupMembership(ipAddress, groupId, data) {
        const emailSafe = safe_email_1.safeEmail(data.email);
        const userResult = await this.prisma.user.findFirst({
            where: { emails: { some: { emailSafe } } },
        });
        let user = userResult
            ? this.prisma.expose(userResult)
            : null;
        if (!user)
            user = await this.auth.register(ipAddress, Object.assign({ name: data.email }, data));
        const result = await this.prisma.membership.create({
            data: {
                role: data.role,
                group: { connect: { id: groupId } },
                user: { connect: { id: user.id } },
            },
            include: { group: { select: { name: true } } },
        });
        this.email.send({
            to: `"${user.name}" <${data.email}>`,
            template: 'groups/invitation',
            data: {
                name: user.name,
                group: result.group.name,
                link: `${this.metaConfig.frontendUrl}/groups/${groupId}`,
            },
        });
        return this.prisma.expose(result);
    }
    async verifyDeleteMembership(groupId, membershipId) {
        const memberships = await this.prisma.membership.findMany({
            where: { group: { id: groupId } },
        });
        if (memberships.length === 1)
            throw new common_1.BadRequestException(errors_constants_1.CANNOT_DELETE_SOLE_MEMBER);
        const membership = await this.prisma.membership.findUnique({
            where: { id: membershipId },
        });
        if (!membership)
            throw new common_1.NotFoundException(errors_constants_1.MEMBERSHIP_NOT_FOUND);
        if (membership.role === 'OWNER' &&
            memberships.filter((i) => i.role === 'OWNER').length === 1)
            throw new common_1.BadRequestException(errors_constants_1.CANNOT_DELETE_SOLE_OWNER);
    }
};
MembershipsService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        auth_service_1.AuthService,
        mail_service_1.MailService,
        config_1.ConfigService,
        groups_service_1.GroupsService,
        api_keys_service_1.ApiKeysService])
], MembershipsService);
exports.MembershipsService = MembershipsService;
//# sourceMappingURL=memberships.service.js.map