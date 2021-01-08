import type { Prisma } from '@prisma/client';
import { Group } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
export declare class GroupsService {
    private prisma;
    constructor(prisma: PrismaService);
    createGroup(userId: number, data: Omit<Omit<Prisma.GroupCreateInput, 'group'>, 'user'>): Promise<Group & {
        memberships: (import(".prisma/client").Membership & {
            group: Group;
        })[];
    }>;
    getGroups(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.GroupWhereUniqueInput;
        where?: Prisma.GroupWhereInput;
        orderBy?: Prisma.GroupOrderByInput;
    }): Promise<Expose<Group>[]>;
    getGroup(id: number, { select, include, }: {
        select?: Record<string, boolean>;
        include?: Record<string, boolean>;
    }): Promise<Expose<Group>>;
    updateGroup(id: number, data: Prisma.GroupUpdateInput): Promise<Expose<Group>>;
    replaceGroup(id: number, data: Prisma.GroupCreateInput): Promise<Expose<Group>>;
    deleteGroup(id: number): Promise<Expose<Group>>;
    getSubgroups(id: number, params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.GroupWhereUniqueInput;
        where?: Prisma.GroupWhereInput;
        orderBy?: Prisma.GroupOrderByInput;
    }): Promise<Expose<Group>[]>;
}
