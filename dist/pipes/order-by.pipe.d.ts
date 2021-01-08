import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
export declare class OrderByPipe implements PipeTransform {
    transform(value: string, metadata: ArgumentMetadata): Record<string, 'asc' | 'desc'> | undefined;
}
