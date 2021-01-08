import { RecordResult, RecordType } from './dns.interface';
export declare class DnsService {
    lookup(hostname: string, recordType: RecordType): Promise<RecordResult>;
    private unsafeLookup;
}
