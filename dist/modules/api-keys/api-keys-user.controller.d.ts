import { ApiKey } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { CreateApiKeyDto, ReplaceApiKeyDto, UpdateApiKeyDto } from './api-keys.dto';
import { ApiKeysService } from './api-keys.service';
export declare class ApiKeyUserController {
    private apiKeysService;
    constructor(apiKeysService: ApiKeysService);
    create(userId: number, data: CreateApiKeyDto): Promise<Expose<ApiKey>>;
    getAll(userId: number, skip?: number, take?: number, cursor?: Record<string, number | string>, where?: Record<string, number | string>, orderBy?: Record<string, 'asc' | 'desc'>): Promise<Expose<ApiKey>[]>;
    scopes(userId: number): Promise<Record<string, string>>;
    get(userId: number, id: number): Promise<Expose<ApiKey>>;
    update(data: UpdateApiKeyDto, userId: number, id: number): Promise<Expose<ApiKey>>;
    replace(data: ReplaceApiKeyDto, userId: number, id: number): Promise<Expose<ApiKey>>;
    remove(userId: number, id: number): Promise<Expose<ApiKey>>;
    getLogs(userId: number, id: number, take?: number, cursor?: Record<string, number | string>, where?: Record<string, number | string>): Promise<Record<string, any>[]>;
}
