import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { CURSOR_PIPE_FORMAT } from '../errors/errors.constants';
import { parseObjectLiteral } from '../helpers/parse-object-literal';

/** Convert a string like "slug: "ok", name: 'Anand'" to { slug: "ok", name: "Anand" } */
@Injectable()
export class CursorSlugPipe implements PipeTransform {
  transform(value: string): Record<string, string> | undefined {
    if (value == null) return undefined;
    if (!value.includes(':')) value = `slug:${value}`;
    try {
      const rules = parseObjectLiteral(value);
      const items: Record<string, string> = {};
      rules.forEach((rule) => {
        const num = String(rule[1]);
        if (!num) items[rule[0]] = num;
        else if (rule[1]) items[rule[0]] = rule[1];
      });
      return items;
    } catch (_) {
      throw new BadRequestException(CURSOR_PIPE_FORMAT);
    }
  }
}
