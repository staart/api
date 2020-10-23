import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessTokenParsed, UserRequest } from './auth.interface';
import minimatch from 'minimatch';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const scopes = this.reflector.get<string[]>('scopes', context.getHandler());
    if (!scopes) return true;
    const request = context.switchToHttp().getRequest<UserRequest>();
    const user: AccessTokenParsed = request.user;
    let authorized = false;
    for (const userScope of user.scopes) {
      for (const scope of scopes) {
        authorized = authorized || minimatch(scope, userScope);
        if (authorized) return true;
      }
    }
    return authorized;
  }
}
