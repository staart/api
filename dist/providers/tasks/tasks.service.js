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
var TasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const elasticsearch_service_1 = require("../elasticsearch/elasticsearch.service");
const prisma_service_1 = require("../prisma/prisma.service");
let TasksService = TasksService_1 = class TasksService {
    constructor(prisma, configService, elasticSearchService) {
        this.prisma = prisma;
        this.configService = configService;
        this.elasticSearchService = elasticSearchService;
        this.trackingConfig = this.configService.get('tracking');
        this.securityConfig = this.configService.get('security');
        this.logger = new common_1.Logger(TasksService_1.name);
    }
    async deleteOldSessions() {
        const now = new Date();
        now.setDate(now.getDate() - this.securityConfig.unusedRefreshTokenExpiryDays);
        const deleted = await this.prisma.session.deleteMany({
            where: { updatedAt: { lte: now } },
        });
        if (deleted.count)
            this.logger.debug(`Deleted ${deleted.count} expired sessions`);
    }
    async deleteInactiveUsers() {
        const now = new Date();
        now.setDate(now.getDate() - this.securityConfig.inactiveUserDeleteDays);
        const deleted = await this.prisma.user.deleteMany({
            where: {
                active: false,
                sessions: { every: { updatedAt: { lte: now } } },
            },
        });
        if (deleted.count)
            this.logger.debug(`Deleted ${deleted.count} inactive users`);
    }
    async deleteOldLogs() {
        if (this.trackingConfig.deleteOldLogs)
            return this.elasticSearchService.deleteOldRecords(this.trackingConfig.index, this.trackingConfig.deleteOldLogsDays);
    }
};
__decorate([
    schedule_1.Cron(schedule_1.CronExpression.EVERY_DAY_AT_1PM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "deleteOldSessions", null);
__decorate([
    schedule_1.Cron(schedule_1.CronExpression.EVERY_DAY_AT_2PM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "deleteInactiveUsers", null);
__decorate([
    schedule_1.Cron(schedule_1.CronExpression.EVERY_DAY_AT_3PM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "deleteOldLogs", null);
TasksService = TasksService_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        elasticsearch_service_1.ElasticSearchService])
], TasksService);
exports.TasksService = TasksService;
//# sourceMappingURL=tasks.service.js.map