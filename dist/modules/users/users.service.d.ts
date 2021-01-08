import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { User } from '@prisma/client';
import { MailService } from '../../providers/mail/mail.service';
import { Expose } from '../../providers/prisma/prisma.interface';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { TokensService } from '../../providers/tokens/tokens.service';
import { AuthService } from '../auth/auth.service';
import { PasswordUpdateInput } from './users.interface';
export declare class UsersService {
    private prisma;
    private auth;
    private email;
    private configService;
    private tokensService;
    private metaConfig;
    private securityConfig;
    constructor(prisma: PrismaService, auth: AuthService, email: MailService, configService: ConfigService, tokensService: TokensService);
    getUser(id: number): Promise<Expose<User>>;
    getUsers(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.UserWhereUniqueInput;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByInput;
    }): Promise<Expose<User>[]>;
    createUser(data: Prisma.UserCreateInput): Promise<User>;
    updateUser(id: number, data: Omit<Prisma.UserUpdateInput, 'password'> & PasswordUpdateInput): Promise<Expose<User>>;
    deactivateUser(id: number): Promise<Expose<User>>;
    requestMerge(userId: number, email: string): Promise<{
        queued: true;
    }>;
}
