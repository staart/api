import { Injectable } from '@nestjs/common';
import { pwnedPassword } from 'hibp';

@Injectable()
export class PwnedService {
  async isPasswordSafe(password: string): Promise<boolean> {
    try {
      const numberOfPwned = await this.unsafeCheckPwnedPassword(password);
      return !numberOfPwned;
    } catch (error) {
      return true;
    }
  }

  private async unsafeCheckPwnedPassword(password: string): Promise<number> {
    return pwnedPassword(password);
  }
}
