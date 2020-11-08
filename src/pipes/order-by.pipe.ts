import {
  ArgumentMetadata,
  BadGatewayException,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

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
        const [key, order] = rule.split(' ') as [string, 'asc' | 'desc'];
        if (!['asc', 'desc'].includes(order.toLocaleLowerCase()))
          throw new BadGatewayException('Order should be "ASC" or "DESC"');
        orderBy[key] = order.toLocaleLowerCase() as 'asc' | 'desc';
      });
      return orderBy;
    } catch (_) {
      throw new BadRequestException(
        `"${metadata.data}" should be like "key1 asc, key2 desc", provided "${value}"`,
      );
    }
  }
}
