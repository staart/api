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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovedSubnetsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt_1 = require("bcrypt");
const ip_anonymize_1 = __importDefault(require("ip-anonymize"));
const errors_constants_1 = require("../../errors/errors.constants");
const geolocation_service_1 = require("../../providers/geolocation/geolocation.service");
const prisma_service_1 = require("../../providers/prisma/prisma.service");
let ApprovedSubnetsService = class ApprovedSubnetsService {
    constructor(prisma, configService, geolocationService) {
        this.prisma = prisma;
        this.configService = configService;
        this.geolocationService = geolocationService;
    }
    async getApprovedSubnets(userId, params) {
        const { skip, take, cursor, where, orderBy } = params;
        const ApprovedSubnet = await this.prisma.approvedSubnet.findMany({
            skip,
            take,
            cursor,
            where: Object.assign(Object.assign({}, where), { user: { id: userId } }),
            orderBy,
        });
        return ApprovedSubnet.map((user) => this.prisma.expose(user));
    }
    async getApprovedSubnet(userId, id) {
        const ApprovedSubnet = await this.prisma.approvedSubnet.findUnique({
            where: { id },
        });
        if (!ApprovedSubnet)
            throw new common_1.NotFoundException(errors_constants_1.APPROVED_SUBNET_NOT_FOUND);
        if (ApprovedSubnet.userId !== userId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        if (!ApprovedSubnet)
            throw new common_1.NotFoundException(errors_constants_1.APPROVED_SUBNET_NOT_FOUND);
        return this.prisma.expose(ApprovedSubnet);
    }
    async deleteApprovedSubnet(userId, id) {
        const testApprovedSubnet = await this.prisma.approvedSubnet.findUnique({
            where: { id },
        });
        if (!testApprovedSubnet)
            throw new common_1.NotFoundException(errors_constants_1.APPROVED_SUBNET_NOT_FOUND);
        if (testApprovedSubnet.userId !== userId)
            throw new common_1.UnauthorizedException(errors_constants_1.UNAUTHORIZED_RESOURCE);
        const ApprovedSubnet = await this.prisma.approvedSubnet.delete({
            where: { id },
        });
        return this.prisma.expose(ApprovedSubnet);
    }
    async approveNewSubnet(userId, ipAddress) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const subnet = await bcrypt_1.hash(ip_anonymize_1.default(ipAddress), (_a = this.configService.get('security.saltRounds')) !== null && _a !== void 0 ? _a : 10);
        const location = await this.geolocationService.getLocation(ipAddress);
        const approved = await this.prisma.approvedSubnet.create({
            data: {
                user: { connect: { id: userId } },
                subnet,
                city: (_c = (_b = location === null || location === void 0 ? void 0 : location.city) === null || _b === void 0 ? void 0 : _b.names) === null || _c === void 0 ? void 0 : _c.en,
                region: (_f = (_e = (_d = location === null || location === void 0 ? void 0 : location.subdivisions) === null || _d === void 0 ? void 0 : _d.pop()) === null || _e === void 0 ? void 0 : _e.names) === null || _f === void 0 ? void 0 : _f.en,
                timezone: (_g = location === null || location === void 0 ? void 0 : location.location) === null || _g === void 0 ? void 0 : _g.time_zone,
                countryCode: (_h = location === null || location === void 0 ? void 0 : location.country) === null || _h === void 0 ? void 0 : _h.iso_code,
            },
        });
        return this.prisma.expose(approved);
    }
    async upsertNewSubnet(userId, ipAddress) {
        var e_1, _a;
        const subnet = ip_anonymize_1.default(ipAddress);
        const previousSubnets = await this.prisma.approvedSubnet.findMany({
            where: { user: { id: userId } },
        });
        try {
            for (var previousSubnets_1 = __asyncValues(previousSubnets), previousSubnets_1_1; previousSubnets_1_1 = await previousSubnets_1.next(), !previousSubnets_1_1.done;) {
                const item = previousSubnets_1_1.value;
                if (await bcrypt_1.compare(subnet, item.subnet))
                    return this.prisma.expose(item);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (previousSubnets_1_1 && !previousSubnets_1_1.done && (_a = previousSubnets_1.return)) await _a.call(previousSubnets_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return this.approveNewSubnet(userId, ipAddress);
    }
};
ApprovedSubnetsService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        geolocation_service_1.GeolocationService])
], ApprovedSubnetsService);
exports.ApprovedSubnetsService = ApprovedSubnetsService;
//# sourceMappingURL=approved-subnets.service.js.map