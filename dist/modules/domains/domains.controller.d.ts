import { Domain } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { CreateDomainDto } from './domains.dto';
import { DomainsService } from './domains.service';
export declare class DomainController {
    private domainsService;
    constructor(domainsService: DomainsService);
    create(groupId: number, data: CreateDomainDto): Promise<Expose<Domain>>;
    getAll(groupId: number, skip?: number, take?: number, cursor?: Record<string, number | string>, where?: Record<string, number | string>, orderBy?: Record<string, 'asc' | 'desc'>): Promise<Expose<Domain>[]>;
    get(groupId: number, id: number): Promise<Expose<Domain>>;
    remove(groupId: number, id: number): Promise<Expose<Domain>>;
    verifyTxt(groupId: number, id: number): Promise<Expose<Domain>>;
    verifyHtml(groupId: number, id: number): Promise<Expose<Domain>>;
}
