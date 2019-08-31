import { MembershipRole } from "../enum";

export interface Membership {
  id?: string;
  organizationId: string;
  userId: string;
  role: MembershipRole;
  createdAt?: Date;
  updatedAt?: Date;
}
