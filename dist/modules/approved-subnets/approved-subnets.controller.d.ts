import { ApprovedSubnet } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { ApprovedSubnetsService } from './approved-subnets.service';
export declare class ApprovedSubnetController {
    private approvedSubnetsService;
    constructor(approvedSubnetsService: ApprovedSubnetsService);
    getAll(userId: number, skip?: number, take?: number, cursor?: Record<string, number | string>, where?: Record<string, number | string>, orderBy?: Record<string, 'asc' | 'desc'>): Promise<Expose<ApprovedSubnet>[]>;
    get(userId: number, id: number): Promise<Expose<ApprovedSubnet>>;
    remove(userId: number, id: number): Promise<Expose<ApprovedSubnet>>;
}
