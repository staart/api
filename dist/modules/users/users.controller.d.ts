import { User } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { UpdateUserDto } from './users.dto';
import { UsersService } from './users.service';
export declare class UserController {
    private usersService;
    constructor(usersService: UsersService);
    getAll(skip?: number, take?: number, cursor?: Record<string, number | string>, where?: Record<string, number | string>, orderBy?: Record<string, 'asc' | 'desc'>): Promise<Expose<User>[]>;
    get(id: number): Promise<Expose<User>>;
    update(id: number, data: UpdateUserDto): Promise<Expose<User>>;
    remove(id: number): Promise<Expose<User>>;
    mergeRequest(id: number, email: string): Promise<{
        queued: true;
    }>;
}
