import {
  PipeTransform,
  Injectable,
  HttpException,
  HttpStatus,
  ArgumentMetadata,
} from '@nestjs/common';

/** Convert a string like "id 12, name Anand" to { id: 12, name: "Anand" } */
@Injectable()
export class CursorPipe implements PipeTransform {
  transform(
    value: string,
    metadata: ArgumentMetadata,
  ): Record<string, number | string> | undefined {
    if (value == null) return undefined;
    try {
      const rules = value.split(' ').map(val => val.trim());
      const cursor: Record<string, number | string> = {};
      rules.forEach(rule => {
        const [key, val] = rule.split(' ', 1);
        rules[key] = val;
      });
      return cursor;
    } catch (_) {
      throw new HttpException(
        `"${metadata.data}" should be like "id 12, name Anand", provided "${value}"`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
