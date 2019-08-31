export interface Email {
  id?: string;
  email: string;
  userId: string;
  isVerified?: boolean;
  isPrimary?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
