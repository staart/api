import type { Prisma } from '@prisma/client';
import { Session } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
export declare class SessionsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSessions(userId: number, params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.SessionWhereUniqueInput;
        where?: Prisma.SessionWhereInput;
        orderBy?: Prisma.SessionOrderByInput;
    }): Promise<Expose<Session>[]>;
    getSession(userId: number, id: number): Promise<Expose<Session>>;
    deleteSession(userId: number, id: number): Promise<Expose<Session>>;
}
