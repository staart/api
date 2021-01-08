/// <reference types="node" />
import { AnyRecord, MxRecord, NaptrRecord, SoaRecord, SrvRecord } from 'dns';
export declare type RecordType = 'A' | 'AAAA' | 'ANY' | 'CNAME' | 'MX' | 'NAPTR' | 'NS' | 'PTR' | 'SOA' | 'SRV' | 'TXT';
export declare type RecordResult = Array<string> | Array<MxRecord> | Array<NaptrRecord> | SoaRecord | Array<SrvRecord> | Array<Array<string>> | Array<AnyRecord>;
