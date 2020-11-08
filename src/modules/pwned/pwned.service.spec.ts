import { PwnedService } from './pwned.service';
import { randomBytes } from 'crypto';

const pwnedService = new PwnedService();

describe('PwnedService', () => {
  describe('isPasswordSafe', () => {
    it('unsafe password', async () => {
      const safe = await pwnedService.isPasswordSafe('password123');
      expect(safe).toBeFalsy();
    });
    it('safe password', async () => {
      const safe = await pwnedService.isPasswordSafe(
        randomBytes(10).toString(),
      );
      expect(safe).toBeTruthy();
    });
  });
});
