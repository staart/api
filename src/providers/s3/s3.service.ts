import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AWSError, S3 } from 'aws-sdk';
import { Configuration } from '../../config/configuration.interface';

@Injectable()
export class S3Service {
  client?: S3;
  private logger = new Logger(S3Service.name);

  constructor(private configService: ConfigService) {
    const config = this.configService.get<Configuration['s3']>('s3');
    if (config.accessKeyId)
      this.client = new S3({
        apiVersion: '2006-03-01',
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        region: config.region,
      });
    else this.logger.warn('No S3 API key set');
  }

  /** Get a signed URL to access an S3 object for 5 minutes */
  signedUrl(bucket: string, key: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.client.getSignedUrl(
        'getObject',
        {
          Bucket: bucket,
          Key: key,
          Expires: 300,
        },
        (error: AWSError, data: string) => {
          if (error) return reject(error);
          resolve(data);
        },
      );
    });
  }

  /** Get a policy to upload to S3 directly */
  postPolicy(bucket: string, key: string): Promise<S3.PresignedPost> {
    return new Promise<S3.PresignedPost>((resolve, reject) => {
      this.client.createPresignedPost(
        {
          Bucket: bucket,
          Fields: {
            key,
          },
          Expires: 300,
        },
        (error: AWSError, data: S3.PresignedPost) => {
          if (error) return reject(error);
          resolve(data);
        },
      );
    });
  }

  upload(
    name: string,
    body: Buffer,
    bucket?: string,
    publicRead?: true,
  ): Promise<S3.ManagedUpload.SendData> {
    return new Promise<S3.ManagedUpload.SendData>((resolve, reject) => {
      this.client.upload(
        {
          Bucket: bucket,
          Key: name,
          Body: body,
          ACL: publicRead ? 'public-read' : undefined,
        },
        (error: AWSError, data: S3.ManagedUpload.SendData) => {
          if (error) return reject(error);
          resolve(data);
        },
      );
    });
  }

  get(bucket: string, name: string): Promise<S3.GetObjectOutput> {
    return new Promise((resolve, reject) => {
      this.client.getObject(
        {
          Bucket: bucket,
          Key: name,
        },
        (error: AWSError, data: S3.Types.GetObjectOutput) => {
          if (error) return reject(error);
          resolve(data);
        },
      );
    });
  }
}
