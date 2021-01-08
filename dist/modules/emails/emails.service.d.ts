import type { Prisma } from '@prisma/client';
import { Email } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
export declare class EmailsService {
    private prisma;
    private users;
    private auth;
    constructor(prisma: PrismaService, users: UsersService, auth: AuthService);
    createEmail(userId: number, data: Omit<Omit<Prisma.EmailCreateInput, 'emailSafe'>, 'user'>): Promise<Email>;
    getEmails(userId: number, params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.EmailWhereUniqueInput;
        where?: Prisma.EmailWhereInput;
        orderBy?: Prisma.EmailOrderByInput;
    }): Promise<Expose<Email>[]>;
    getEmail(userId: number, id: number): Promise<Expose<Email>>;
    deleteEmail(userId: number, id: number): Promise<Expose<Email>>;
}
