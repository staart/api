import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { STAART_PUBLIC_ENDPOINT } from 'src/app.constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  public canActivate(context: ExecutionContext) {
    const decoratorSkip =
      this.reflector.get(STAART_PUBLIC_ENDPOINT, context.getClass()) ||
      this.reflector.get(STAART_PUBLIC_ENDPOINT, context.getHandler());
    if (decoratorSkip) return true;
    return super.canActivate(context);
  }
}
