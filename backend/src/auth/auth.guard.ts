import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { verifyJwt } from './auth.utils';
import { NO_AUTH_REQUIRED_KEY } from './no-auth-required.decorator';
import { ROLES_KEY } from './roles.decorator';
import { ForbiddenException } from '@nestjs/common';

type AuthenticatedRequest = Request & {
  user: Record<string, unknown>;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const noAuthRequired = this.reflector.getAllAndOverride<boolean>(NO_AUTH_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (noAuthRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('MISSING_TOKEN');
    }

    const token = authorization.slice('Bearer '.length).trim();

    if (!token) {
      throw new UnauthorizedException('MISSING_TOKEN');
    }

    try {
      request.user = verifyJwt(token);

      const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);

      if (requiredRoles && !requiredRoles.includes(request.user.role as string)) {
        throw new ForbiddenException('INSUFFICIENT_PERMISSIONS');
      }
      return true;
    } catch {
      throw new UnauthorizedException('INVALID_TOKEN');
    }
  }
}
