import { PwnedService } from './pwned.service';

const pwnedService = new PwnedService();

describe('PwnedService', () => {
  describe('isPasswordSafe', () => {
    it('unsafe password', async () => {
      const safe = await pwnedService.isPasswordSafe('password123');
      expect(safe).toBeFalsy();
    });
    it('safe password', async () => {
      const safe = await pwnedService.isPasswordSafe(
        Math.random().toString(36).slice(2),
      );
      expect(safe).toBeTruthy();
    });
  });
});
