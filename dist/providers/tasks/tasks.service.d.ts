import { ConfigService } from '@nestjs/config';
import { ElasticSearchService } from '../elasticsearch/elasticsearch.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class TasksService {
    private prisma;
    private configService;
    private elasticSearchService;
    private trackingConfig;
    private securityConfig;
    constructor(prisma: PrismaService, configService: ConfigService, elasticSearchService: ElasticSearchService);
    private readonly logger;
    deleteOldSessions(): Promise<void>;
    deleteInactiveUsers(): Promise<void>;
    deleteOldLogs(): Promise<import("@elastic/elasticsearch").ApiResponse<Record<string, any>, Record<string, unknown>>>;
}
