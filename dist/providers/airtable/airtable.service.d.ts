import { ConfigService } from '@nestjs/config';
import Airtable from 'airtable';
export declare class AirtableService {
    private configService;
    client?: Airtable;
    private logger;
    constructor(configService: ConfigService);
}
