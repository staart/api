export interface Organization {
  id?: number;
  name?: string;
  username?: string;
  invitationDomain?: string;
  stripeCustomerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
