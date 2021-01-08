import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
export declare class OptionalIntPipe implements PipeTransform {
    transform(value: string, metadata: ArgumentMetadata): number | undefined;
}
