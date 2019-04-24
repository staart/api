export interface Email {
  id?: number;
  email: string;
  userId: number;
  isVerified?: boolean;
  isPrimary?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
