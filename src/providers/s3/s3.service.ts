import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AWS from 'aws-sdk';
import { Configuration } from '../../config/configuration.interface';

@Injectable()
export class S3Service {
  client?: AWS.S3;
  private logger = new Logger(S3Service.name);

  constructor(private configService: ConfigService) {
    const config = this.configService.get<Configuration['s3']>('s3');
    if (config.accessKeyId)
      this.client = new AWS.S3({
        apiVersion: '2006-03-01',
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        region: config.region,
      });
    else this.logger.warn('No S3 API key set');
  }

  upload(
    name: string,
    body: Buffer,
    bucket?: string,
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    return new Promise((resolve, reject) => {
      this.client.upload(
        {
          Bucket: bucket,
          Key: name,
          Body: body,
        },
        (error: any, data: any) => {
          if (error) return reject(error);
          resolve(data);
        },
      );
    });
  }
}
