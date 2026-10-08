import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";

interface AuthenticatedRequest extends Request {
  user: { sub: string; role: string };
}

/**
 * Guard that validates the `Authorization: Bearer <token>` header and attaches
 * the decoded user to `req.user`.
 *
 * Usage: `@UseGuards(AuthGuard)` on a controller/route.
 * For role-based access, combine with `RolesGuard` (see `RolesGuard`).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>() as AuthenticatedRequest;
    const header = (req.headers as any)["authorization"];
    if (!header || !header.startsWith("Bearer ")) throw new UnauthorizedException("Missing bearer token");
    const token = header.slice(7);
    const payload = await this.auth.verifyToken(token);
    req.user = payload;
    return true;
  }
}
