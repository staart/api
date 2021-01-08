export declare class CreateGroupDto {
    autoJoinDomain?: boolean;
    forceTwoFactor?: boolean;
    ipRestrictions?: string;
    name: string;
    onlyAllowDomain?: boolean;
    profilePictureUrl?: string;
}
export declare class UpdateGroupDto {
    autoJoinDomain?: boolean;
    forceTwoFactor?: boolean;
    ipRestrictions?: string;
    name?: string;
    onlyAllowDomain?: boolean;
    profilePictureUrl?: string;
}
export declare class ReplaceGroupDto {
    autoJoinDomain: boolean;
    forceTwoFactor: boolean;
    ipRestrictions: string;
    name: string;
    onlyAllowDomain: boolean;
    profilePictureUrl: string;
    attributes: Record<string, any>;
}
