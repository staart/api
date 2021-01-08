import { Webhook } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { CreateWebhookDto, ReplaceWebhookDto, UpdateWebhookDto } from './webhooks.dto';
import { WebhooksService } from './webhooks.service';
export declare class WebhookController {
    private webhooksService;
    constructor(webhooksService: WebhooksService);
    create(groupId: number, data: CreateWebhookDto): Promise<Expose<Webhook>>;
    getAll(groupId: number, skip?: number, take?: number, cursor?: Record<string, number | string>, where?: Record<string, number | string>, orderBy?: Record<string, 'asc' | 'desc'>): Promise<Expose<Webhook>[]>;
    scopes(): Promise<Record<string, string>>;
    get(groupId: number, id: number): Promise<Expose<Webhook>>;
    update(data: UpdateWebhookDto, groupId: number, id: number): Promise<Expose<Webhook>>;
    replace(data: ReplaceWebhookDto, groupId: number, id: number): Promise<Expose<Webhook>>;
    remove(groupId: number, id: number): Promise<Expose<Webhook>>;
}
