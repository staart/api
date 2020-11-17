import { SetMetadata } from '@nestjs/common';

export const RateLimit = (rateLimit: number) =>
  SetMetadata('rateLimit', rateLimit);
