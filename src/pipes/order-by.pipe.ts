import {
  ArgumentMetadata,
  BadGatewayException,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ORDER_BY_ASC_DESC, ORDER_BY_FORMAT } from '../errors/errors.constants';

/** Convert a string like "name asc, address desc" to { name: "asc", address: "desc" } */
@Injectable()
export class OrderByPipe implements PipeTransform {
  transform(
    value: string,
    metadata: ArgumentMetadata,
  ): Record<string, 'asc' | 'desc'> | undefined {
    if (value == null) return undefined;
    try {
      const rules = value.split(',').map((val) => val.trim());
      const orderBy: Record<string, 'asc' | 'desc'> = {};
      rules.forEach((rule) => {
        const [key, order] = rule.split(':') as [string, 'asc' | 'desc'];
        if (!['asc', 'desc'].includes(order.toLocaleLowerCase()))
          throw new BadGatewayException(ORDER_BY_ASC_DESC);
        orderBy[key] = order.toLocaleLowerCase() as 'asc' | 'desc';
      });
      return orderBy;
    } catch (_) {
      throw new BadRequestException(ORDER_BY_FORMAT);
    }
  }
}
