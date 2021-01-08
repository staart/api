import { Group } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { ReplaceGroupDto, UpdateGroupDto } from './groups.dto';
import { GroupsService } from './groups.service';
export declare class GroupController {
    private groupsService;
    constructor(groupsService: GroupsService);
    getAll(skip?: number, take?: number, cursor?: Record<string, number | string>, where?: Record<string, number | string>, orderBy?: Record<string, 'asc' | 'desc'>): Promise<Expose<Group>[]>;
    get(id: number, select?: Record<string, boolean>, include?: Record<string, boolean>): Promise<Expose<Group>>;
    update(data: UpdateGroupDto, id: number): Promise<Expose<Group>>;
    replace(data: ReplaceGroupDto, id: number): Promise<Expose<Group>>;
    remove(id: number): Promise<Expose<Group>>;
    getSubgroups(id: number, skip?: number, take?: number, cursor?: Record<string, number | string>, where?: Record<string, number | string>, orderBy?: Record<string, 'asc' | 'desc'>): Promise<Expose<Group>[]>;
}
