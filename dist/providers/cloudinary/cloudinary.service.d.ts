/// <reference types="node" />
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse } from 'cloudinary';
export declare class CloudinaryService {
    private configService;
    private logger;
    constructor(configService: ConfigService);
    upload(buffer: Buffer | string, folder: string): Promise<UploadApiResponse>;
}
