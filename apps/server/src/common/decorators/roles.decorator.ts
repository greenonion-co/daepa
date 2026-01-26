import { BR_ACCESS, USER_ROLE } from 'src/user/user.constant';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { applyDecorators, ForbiddenException } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: USER_ROLE[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<USER_ROLE[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: JwtUserPayload }>();

    if (!user) {
      throw new ForbiddenException('사용자 정보가 없습니다.');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    return true;
  }
}

export const BrAccessOnly = () => {
  return applyDecorators(Roles(...BR_ACCESS), UseGuards(RolesGuard));
};
