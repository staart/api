import { ApiKey } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { CreateApiKeyDto, ReplaceApiKeyDto, UpdateApiKeyDto } from './api-keys.dto';
import { ApiKeysService } from './api-keys.service';
export declare class ApiKeyGroupController {
    private apiKeysService;
    constructor(apiKeysService: ApiKeysService);
    create(groupId: number, data: CreateApiKeyDto): Promise<Expose<ApiKey>>;
    getAll(groupId: number, skip?: number, take?: number, cursor?: Record<string, number | string>, where?: Record<string, number | string>, orderBy?: Record<string, 'asc' | 'desc'>): Promise<Expose<ApiKey>[]>;
    scopes(groupId: number): Promise<Record<string, string>>;
    get(groupId: number, id: number): Promise<Expose<ApiKey>>;
    update(data: UpdateApiKeyDto, groupId: number, id: number): Promise<Expose<ApiKey>>;
    replace(data: ReplaceApiKeyDto, groupId: number, id: number): Promise<Expose<ApiKey>>;
    remove(groupId: number, id: number): Promise<Expose<ApiKey>>;
    getLogs(groupId: number, id: number, take?: number, cursor?: Record<string, number | string>, where?: Record<string, number | string>): Promise<Record<string, any>[]>;
}
