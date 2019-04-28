import { MembershipRole } from "../enum";

export interface Membership {
  id?: number;
  organizationId: number;
  userId: number;
  role: MembershipRole;
  createdAt?: Date;
  updatedAt?: Date;
}
