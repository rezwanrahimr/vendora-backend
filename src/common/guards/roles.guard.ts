import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log('RolesGuard - Required roles:', requiredRoles);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    console.log('RolesGuard - User in request:', user);
    console.log('RolesGuard - User role:', user?.role);

    if (!user) {
      console.log('RolesGuard - FAILED: No user found');
      return false;
    }

    const hasRole = requiredRoles.some((role) => user.role === role);
    console.log('RolesGuard - Has role:', hasRole);
    return hasRole;
  }
}
