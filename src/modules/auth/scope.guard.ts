import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessTokenParsed } from './auth.interface';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const scopes = this.reflector.get<string[]>('scopes', context.getHandler());
    console.log(scopes);
    if (!scopes) return true;
    const request = context.switchToHttp().getRequest();
    const user: AccessTokenParsed = request.user;

    // return user.scopes.includes(scopes);
  }
}
