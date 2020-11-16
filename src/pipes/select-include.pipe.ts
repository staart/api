import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { SELECT_INCLUDE_PIPE_FORMAT } from '../errors/errors.constants';
import { object } from 'dot-object';

/**
 * Convert a string like "id,createdAt,user.name,user.id"
 * => { id: true, createdAt: true, user: { name: true, id: true } }
 */
@Injectable()
export class SelectIncludePipe implements PipeTransform {
  transform(value: string): Record<string, boolean> | undefined {
    if (value == null) return undefined;
    try {
      const testRecord: Record<string, boolean> = {};
      value.split(',').forEach((i) => {
        if (/^[a-z0-9\.]+$/i.test(i.trim())) testRecord[i.trim()] = true;
      });
      return object(testRecord) as Record<string, boolean>;
    } catch (_) {
      throw new BadRequestException(SELECT_INCLUDE_PIPE_FORMAT);
    }
  }
}
