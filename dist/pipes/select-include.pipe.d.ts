import { PipeTransform } from '@nestjs/common';
export declare class SelectIncludePipe implements PipeTransform {
    transform(value: string): Record<string, boolean> | undefined;
}
