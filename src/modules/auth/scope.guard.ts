import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import minimatch from 'minimatch';
import { AccessTokenParsed, UserRequest } from './auth.interface';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const scopes = this.reflector.get<string[]>('scopes', context.getHandler());
    const request = context.switchToHttp().getRequest<UserRequest>();
    if (!scopes) return true;
    const user: AccessTokenParsed = request.user;
    let authorized = false;
    if (!user) return false;
    for (const userScope of user.scopes) {
      for (let scope of scopes) {
        for (const key in request.params)
          scope = scope.replace(`{${key}}`, request.params[key]);
        authorized = authorized || minimatch(scope, userScope);
        if (authorized) return true;
      }
    }
    return authorized;
  }
}
