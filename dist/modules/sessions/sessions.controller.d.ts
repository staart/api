import { Session } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { SessionsService } from './sessions.service';
export declare class SessionController {
    private sessionsService;
    constructor(sessionsService: SessionsService);
    getAll(userId: number, skip?: number, take?: number, cursor?: Record<string, number | string>, where?: Record<string, number | string>, orderBy?: Record<string, 'asc' | 'desc'>): Promise<Expose<Session>[]>;
    get(userId: number, id: number): Promise<Expose<Session>>;
    remove(userId: number, id: number): Promise<Expose<Session>>;
}
