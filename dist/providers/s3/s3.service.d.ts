/// <reference types="node" />
import { ConfigService } from '@nestjs/config';
import AWS from 'aws-sdk';
export declare class S3Service {
    private configService;
    client?: AWS.S3;
    private logger;
    constructor(configService: ConfigService);
    upload(name: string, body: Buffer, bucket?: string): Promise<AWS.S3.ManagedUpload.SendData>;
}
