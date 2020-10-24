import { STAART_PUBLIC_ENDPOINT } from 'src/app.constants';

export function Public() {
  return (
    target: any,
    _?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    if (descriptor) {
      Reflect.defineMetadata(STAART_PUBLIC_ENDPOINT, true, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(STAART_PUBLIC_ENDPOINT, true, target);
    return target;
  };
}
