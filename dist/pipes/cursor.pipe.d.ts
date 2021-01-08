import { PipeTransform } from '@nestjs/common';
export declare class CursorPipe implements PipeTransform {
    transform(value: string): Record<string, number | string> | undefined;
}
