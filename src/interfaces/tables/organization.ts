export interface Organization {
  id?: number;
  name?: string;
  username?: string;
  forceTwoFactor?: boolean;
  ipRestrictions?: string;
  invitationDomain?: string;
  stripeCustomerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
