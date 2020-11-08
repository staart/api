export interface PasswordUpdateInput {
  currentPassword?: string;
  newPassword?: string;
  ignorePwnedPassword?: boolean;
}
