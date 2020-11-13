import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cloudinary, { UploadApiResponse } from 'cloudinary';
import { Readable, Stream } from 'stream';
import { Configuration } from '../../config/configuration.interface';

/**
 * MultiStream class helps convert buffers to a streams
 * @source https://github.com/gagle/node-streamifier
 */
class MultiStream extends Readable {
  _object: Buffer | string | undefined;
  constructor(object: Buffer | string, options: any = {}) {
    super();
    this._object = object;
    Stream.Readable.call(this, {
      highWaterMark: options.highWaterMark,
      encoding: options.encoding,
    });
  }
  _read() {
    this.push(this._object);
    this._object = undefined;
  }
}

/**
 *
 * @param object - Object to convert
 * @param options - Configuration (encoding and highWaterMark)
 */
const createReadStream = (object: Buffer | string, options?: any) =>
  new MultiStream(object, options);

@Injectable()
export class CloudinaryService {
  private logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    const config = this.configService.get<Configuration['cloudinary']>(
      'cloudinary',
    );
    if (config.cloudName)
      cloudinary.v2.config({
        cloud_name: config.cloudName,
        api_key: config.apiKey,
        api_secret: config.apiSecret,
      });
    else this.logger.warn('Cloudinary API key not found');
  }

  upload(buffer: Buffer | string, folder: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (result) return resolve(result);
          reject(error);
        },
      );
      createReadStream(buffer).pipe(uploadStream);
    });
  }
}
