import { Email } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { CreateEmailDto } from './emails.dto';
import { EmailsService } from './emails.service';
export declare class EmailController {
    private emailsService;
    constructor(emailsService: EmailsService);
    create(userId: number, data: CreateEmailDto): Promise<Expose<Email>>;
    getAll(userId: number, skip?: number, take?: number, cursor?: Record<string, number | string>, where?: Record<string, number | string>, orderBy?: Record<string, 'asc' | 'desc'>): Promise<Expose<Email>[]>;
    get(userId: number, id: number): Promise<Expose<Email>>;
    remove(userId: number, id: number): Promise<Expose<Email>>;
}
