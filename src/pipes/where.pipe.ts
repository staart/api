import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { WHERE_PIPE_FORMAT } from '../errors/errors.constants';
import { parseObjectLiteral } from '../helpers/parse-object-literal';

/** Convert a string like "id: 12, b: 'Anand'" to { id: 12, name: "Anand" } */
@Injectable()
export class WherePipe implements PipeTransform {
  transform(value: string): Record<string, any> | undefined {
    if (value == null) return undefined;
    try {
      const rules = parseObjectLiteral(value);
      const items: Record<string, any> = {};
      rules.forEach((rule) => {
        const ruleKey = rule[0];
        let ruleValue: any = rule[1];
        if (ruleValue.endsWith(')')) {
          if (ruleValue.startsWith('int('))
            ruleValue = parseInt(/\(([^)]+)\)/.exec(ruleValue)[1]);
          else if (
            ruleValue.startsWith('date(') ||
            ruleValue.startsWith('datetime(')
          )
            ruleValue = new Date(
              /\(([^)]+)\)/.exec(ruleValue)[1],
            ).toISOString();
          else if (ruleValue.startsWith('float('))
            ruleValue = parseFloat(/\(([^)]+)\)/.exec(ruleValue)[1]);
          else if (ruleValue.startsWith('string('))
            ruleValue = /\(([^)]+)\)/.exec(ruleValue)[1];
          else if (
            ruleValue.startsWith('boolean(') ||
            ruleValue.startsWith('bool(')
          )
            ruleValue = /\(([^)]+)\)/.exec(ruleValue)[1] === 'true';
        }
        [
          'lt',
          'lte',
          'gt',
          'gte',
          'equals',
          'not',
          'contains',
          'startsWith',
          'endsWith',
          'every',
          'some',
          'none',
        ].forEach((val) => {
          if (rule[1].startsWith(`${val} `)) {
            const data: Record<string, any> = {};
            data[val] = ruleValue.replace(`${val} `, '');
            if (data[val].includes(':') && !data[val].endsWith(':')) {
              const record: Record<string, any> = {};
              record[data[val].split(':')[0].trim()] = data[val]
                .split(':')[1]
                .trim();
              data[val] = record;
            }
            items[ruleKey] = data;
          }
        });
        if (ruleValue != null && ruleValue !== '')
          items[ruleKey] = items[ruleKey] || ruleValue;
      });
      return items;
    } catch (error) {
      throw new BadRequestException(WHERE_PIPE_FORMAT);
    }
  }
}
