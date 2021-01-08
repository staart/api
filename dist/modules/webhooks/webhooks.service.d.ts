import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { Webhook } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
export declare class WebhooksService {
    private prisma;
    private configService;
    private readonly logger;
    private queue;
    constructor(prisma: PrismaService, configService: ConfigService);
    createWebhook(groupId: number, data: Omit<Omit<Prisma.WebhookCreateInput, 'webhook'>, 'group'>): Promise<Webhook>;
    getWebhooks(groupId: number, params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.WebhookWhereUniqueInput;
        where?: Prisma.WebhookWhereInput;
        orderBy?: Prisma.WebhookOrderByInput;
    }): Promise<Expose<Webhook>[]>;
    getWebhook(groupId: number, id: number): Promise<Expose<Webhook>>;
    updateWebhook(groupId: number, id: number, data: Prisma.WebhookUpdateInput): Promise<Expose<Webhook>>;
    replaceWebhook(groupId: number, id: number, data: Prisma.WebhookCreateInput): Promise<Expose<Webhook>>;
    deleteWebhook(groupId: number, id: number): Promise<Expose<Webhook>>;
    getWebhookScopes(): Promise<Record<string, string>>;
    triggerWebhook(groupId: number, event: string): void;
    private callWebhook;
}
