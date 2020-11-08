import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { WHERE_PIPE_FORMAT } from '../errors/errors.constants';
import { parseObjectLiteral } from '../helpers/parse-object-literal';

/** Convert a string like "id: 12, b: 'Anand'" to { id: 12, name: "Anand" } */
@Injectable()
export class WherePipe implements PipeTransform {
  transform(
    value: string,
    metadata: ArgumentMetadata,
  ): Record<string, number | string> | undefined {
    if (value == null) return undefined;
    try {
      const rules = parseObjectLiteral(value);
      const items: Record<string, number | string> = {};
      rules.forEach((rule) => {
        const num = Number(rule[1]);
        if (!isNaN(num)) items[rule[0]] = num;
        else if (rule[1]) items[rule[0]] = rule[1];
      });
      return items;
    } catch (_) {
      throw new BadRequestException(WHERE_PIPE_FORMAT);
    }
  }
}
