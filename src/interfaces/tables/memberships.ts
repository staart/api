import { MembershipRole } from "../enum";
import { User } from "./user";

export interface Membership {
  id?: string;
  organizationId: string;
  userId: string;
  role: MembershipRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MembershipWithUser extends Membership {
  user: User;
}
