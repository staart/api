import { MxRecord } from 'dns';
import { DnsService } from './dns.service';

const dnsService = new DnsService();

describe('DnsService', () => {
  describe('lookup', () => {
    it('gets MX records', async () => {
      const result = await dnsService.lookup('google.com', 'MX');
      expect(result).toBeDefined();
    });
    it('gets correct MX record', async () => {
      const result = (await dnsService.lookup(
        'google.com',
        'MX',
      )) as MxRecord[];
      expect(
        result.find((i) => i.exchange === 'aspmx.l.google.com'),
      ).toBeTruthy();
    });
  });
});
