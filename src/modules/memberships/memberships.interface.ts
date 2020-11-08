import { MembershipRole } from '@prisma/client';

export interface CreateMembershipInput {
  email: string;
  name?: string;
  role?: MembershipRole;
}
