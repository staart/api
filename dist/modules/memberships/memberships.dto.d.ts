export declare class UpdateMembershipDto {
    role?: 'OWNER' | 'ADMIN' | 'MEMBER';
}
export declare class CreateGroupMembershipDto {
    email: string;
    name?: string;
    role?: 'OWNER' | 'ADMIN' | 'MEMBER';
}
