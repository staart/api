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
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const randomcolor_1 = __importDefault(require("randomcolor"));
const errors_constants_1 = require("../../errors/errors.constants");
const prisma_service_1 = require("../../providers/prisma/prisma.service");
let GroupsService = class GroupsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createGroup(userId, data) {
        var _a;
        let initials = data.name.trim().substr(0, 2).toUpperCase();
        if (data.name.includes(' '))
            initials = data.name
                .split(' ')
                .map((i) => i.trim().substr(0, 1))
                .join('')
                .toUpperCase();
        data.profilePictureUrl = (_a = data.profilePictureUrl) !== null && _a !== void 0 ? _a : `https://ui-avatars.com/api/?name=${initials}&background=${randomcolor_1.default({
            luminosity: 'light',
        }).replace('#', '')}&color=000000`;
        return this.prisma.group.create({
            include: { memberships: { include: { group: true } } },
            data: Object.assign(Object.assign({}, data), { memberships: {
                    create: { role: 'OWNER', user: { connect: { id: userId } } },
                } }),
        });
    }
    async getGroups(params) {
        const { skip, take, cursor, where, orderBy } = params;
        const groups = await this.prisma.group.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
        });
        return groups.map((user) => this.prisma.expose(user));
    }
    async getGroup(id, { select, include, }) {
        const group = await this.prisma.group.findUnique({
            where: { id },
            select,
            include,
        });
        if (!group)
            throw new common_1.NotFoundException(errors_constants_1.GROUP_NOT_FOUND);
        return this.prisma.expose(group);
    }
    async updateGroup(id, data) {
        const testGroup = await this.prisma.group.findUnique({
            where: { id },
        });
        if (!testGroup)
            throw new common_1.NotFoundException(errors_constants_1.GROUP_NOT_FOUND);
        const group = await this.prisma.group.update({
            where: { id },
            data,
        });
        return this.prisma.expose(group);
    }
    async replaceGroup(id, data) {
        const testGroup = await this.prisma.group.findUnique({
            where: { id },
        });
        if (!testGroup)
            throw new common_1.NotFoundException(errors_constants_1.GROUP_NOT_FOUND);
        const group = await this.prisma.group.update({
            where: { id },
            data,
        });
        return this.prisma.expose(group);
    }
    async deleteGroup(id) {
        const testGroup = await this.prisma.group.findUnique({
            where: { id },
        });
        if (!testGroup)
            throw new common_1.NotFoundException(errors_constants_1.GROUP_NOT_FOUND);
        const group = await this.prisma.group.delete({
            where: { id },
        });
        return this.prisma.expose(group);
    }
    async getSubgroups(id, params) {
        const { skip, take, cursor, where, orderBy } = params;
        const groups = await this.prisma.group.findMany({
            skip,
            take,
            cursor,
            where: Object.assign(Object.assign({}, where), { parent: { id } }),
            orderBy,
        });
        return groups.map((user) => this.prisma.expose(user));
    }
};
GroupsService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GroupsService);
exports.GroupsService = GroupsService;
//# sourceMappingURL=groups.service.js.map