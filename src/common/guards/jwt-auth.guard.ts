import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import type { AuthenticatedUser } from "../interfaces/authenticated-user.interface";

type RequestWithAuth = Request & {
  user?: AuthenticatedUser;
  cookies?: Record<string, string>;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException("Missing authentication token");
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthenticatedUser>(
        token,
        {
          secret: this.configService.get<string>("JWT_SECRET"),
        },
      );
      request.user = payload;
    } catch {
      throw new UnauthorizedException(
        "Invalid or expired authentication token",
      );
    }

    return true;
  }

  private extractTokenFromHeader(request: RequestWithAuth): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    if (type === "Bearer") {
      return token;
    }

    const cookies = request.cookies as Record<string, string> | undefined;
    return cookies?.["access_token"];
  }
}
