import { ConfigService } from '@nestjs/config';
import { Membership } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { MailService } from '../../providers/mail/mail.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { AuthService } from '../auth/auth.service';
import { GroupsService } from '../groups/groups.service';
import { CreateMembershipInput } from './memberships.interface';
export declare class MembershipsService {
    private prisma;
    private auth;
    private email;
    private configService;
    private groupsService;
    private apiKeyService;
    private metaConfig;
    constructor(prisma: PrismaService, auth: AuthService, email: MailService, configService: ConfigService, groupsService: GroupsService, apiKeyService: ApiKeysService);
    getMemberships(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.MembershipWhereUniqueInput;
        where?: Prisma.MembershipWhereInput;
        orderBy?: Prisma.MembershipOrderByInput;
    }): Promise<Expose<Membership>[]>;
    getUserMembership(userId: number, id: number): Promise<Expose<Membership>>;
    getGroupMembership(groupId: number, id: number): Promise<Expose<Membership>>;
    deleteUserMembership(userId: number, id: number): Promise<Expose<Membership>>;
    updateGroupMembership(groupId: number, id: number, data: Prisma.MembershipUpdateInput): Promise<Expose<Membership>>;
    deleteGroupMembership(groupId: number, id: number): Promise<Expose<Membership>>;
    createUserMembership(userId: number, data: Prisma.GroupCreateInput): Promise<Membership & {
        group: import(".prisma/client").Group;
    }>;
    createGroupMembership(ipAddress: string, groupId: number, data: CreateMembershipInput): Promise<Pick<Pick<Pick<Pick<Pick<Membership, "id" | "createdAt" | "role" | "updatedAt" | "userId" | "groupId">, "id" | "createdAt" | "role" | "updatedAt" | "userId" | "groupId">, "id" | "createdAt" | "role" | "updatedAt" | "userId" | "groupId">, "id" | "createdAt" | "role" | "updatedAt" | "userId" | "groupId">, "id" | "createdAt" | "role" | "updatedAt" | "userId" | "groupId">>;
    private verifyDeleteMembership;
}
