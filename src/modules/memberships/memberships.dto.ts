import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateMembershipDto {
  @IsString()
  @IsIn(['OWNER', 'ADMIN', 'MEMBER'])
  @IsOptional()
  role?: 'OWNER' | 'ADMIN' | 'MEMBER';
}
