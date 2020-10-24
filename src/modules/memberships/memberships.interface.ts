import { MembershipRole } from '@prisma/client';

export interface CreateMembershipInput {
  name: string;
  email: string;
  role?: MembershipRole;
}
