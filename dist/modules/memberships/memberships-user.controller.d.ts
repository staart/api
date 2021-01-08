import { Membership } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { CreateGroupDto } from '../groups/groups.dto';
import { MembershipsService } from './memberships.service';
export declare class UserMembershipController {
    private membershipsService;
    constructor(membershipsService: MembershipsService);
    create(userId: number, data: CreateGroupDto): Promise<Expose<Membership>>;
    getAll(userId: number, skip?: number, take?: number, cursor?: Record<string, number | string>, where?: Record<string, number | string>, orderBy?: Record<string, 'asc' | 'desc'>): Promise<Expose<Membership>[]>;
    get(userId: number, id: number): Promise<Expose<Membership>>;
    remove(userId: number, id: number): Promise<Expose<Membership>>;
}
