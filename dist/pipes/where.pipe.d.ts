import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
export declare class WherePipe implements PipeTransform {
    transform(value: string, metadata: ArgumentMetadata): Record<string, number | string> | undefined;
}
