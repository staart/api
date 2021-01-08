import { Membership } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { CreateGroupMembershipDto, UpdateMembershipDto } from './memberships.dto';
import { MembershipsService } from './memberships.service';
export declare class GroupMembershipController {
    private membershipsService;
    constructor(membershipsService: MembershipsService);
    create(ip: string, groupId: number, data: CreateGroupMembershipDto): Promise<Expose<Membership>>;
    getAll(groupId: number, skip?: number, take?: number, cursor?: Record<string, number | string>, where?: Record<string, number | string>, orderBy?: Record<string, 'asc' | 'desc'>): Promise<Expose<Membership>[]>;
    get(groupId: number, id: number): Promise<Expose<Membership>>;
    update(data: UpdateMembershipDto, groupId: number, id: number): Promise<Expose<Membership>>;
    remove(groupId: number, id: number): Promise<Expose<Membership>>;
}
