import { UserRole } from "../enum";

export interface Membership {
  id: number;
  organizationId: number;
  userId: number;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
