export interface Email {
  id?: number;
  email: string;
  userId: number;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
