export declare class CreateWebhookDto {
    url: string;
    event: string;
    contentType?: string;
    isActive?: boolean;
    secret?: string;
}
export declare class UpdateWebhookDto {
    url?: string;
    event?: string;
    contentType?: string;
    isActive?: boolean;
    secret?: string;
}
export declare class ReplaceWebhookDto {
    url: string;
    event: string;
    contentType: string;
    isActive: boolean;
    secret: string;
}
