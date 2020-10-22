import {
  PipeTransform,
  Injectable,
  HttpException,
  HttpStatus,
  ArgumentMetadata,
} from '@nestjs/common';

/** Convert a string like "1" to a number, but without NaN */
@Injectable()
export class OptionalIntPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata): number | undefined {
    if (value == null) return undefined;
    const num = Number(value);
    if (isNaN(num))
      throw new HttpException(
        `"${metadata.data}" should be a number, provided "${value}"`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    return num;
  }
}
