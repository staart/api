export declare class CreateApiKeyDto {
    description?: string;
    name?: string;
    scopes?: string[];
    ipRestrictions?: string[];
    referrerRestrictions?: string[];
}
export declare class UpdateApiKeyDto {
    description?: string;
    name?: string;
    scopes?: string[];
    ipRestrictions?: string[];
    referrerRestrictions?: string[];
}
export declare class ReplaceApiKeyDto {
    description: string;
    name: string;
    scopes: string[];
    ipRestrictions: string[];
    referrerRestrictions: string[];
}
