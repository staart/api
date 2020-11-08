import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

/** Convert a string like "1" to a number, but without NaN */
@Injectable()
export class OptionalIntPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata): number | undefined {
    if (value == null) return undefined;
    const num = Number(value);
    if (isNaN(num))
      throw new BadRequestException(
        `"${metadata.data}" should be a number, provided "${value}"`,
      );
    return num;
  }
}
