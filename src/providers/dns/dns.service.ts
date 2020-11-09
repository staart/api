import { Injectable } from '@nestjs/common';
import dns from 'dns';
import { RecordResult, RecordType } from './dns.interface';

@Injectable()
export class DnsService {
  async lookup(
    hostname: string,
    recordType: RecordType,
  ): Promise<RecordResult> {
    try {
      return await this.unsafeLookup(hostname, recordType);
    } catch (error) {
      return [];
    }
  }

  private unsafeLookup(
    hostname: string,
    recordType: RecordType,
  ): Promise<RecordResult> {
    return new Promise((resolve, reject) => {
      dns.resolve(hostname, recordType, (error, records) => {
        if (error) return reject(error);
        resolve(records);
      });
    });
  }
}
