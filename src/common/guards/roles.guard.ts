import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthenticatedUser } from "../interfaces/authenticated-user.interface";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException("User not authenticated");
    }

    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException(
        "You do not have permission to access this resource",
      );
    }

    return true;
  }
}
