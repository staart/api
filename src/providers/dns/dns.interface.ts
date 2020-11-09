import { AnyRecord, MxRecord, NaptrRecord, SoaRecord, SrvRecord } from 'dns';

export type RecordType =
  | 'A'
  | 'AAAA'
  | 'ANY'
  | 'CNAME'
  | 'MX'
  | 'NAPTR'
  | 'NS'
  | 'PTR'
  | 'SOA'
  | 'SRV'
  | 'TXT';

export type RecordResult =
  | Array<string>
  | Array<MxRecord>
  | Array<NaptrRecord>
  | SoaRecord
  | Array<SrvRecord>
  | Array<Array<string>>
  | Array<AnyRecord>;
