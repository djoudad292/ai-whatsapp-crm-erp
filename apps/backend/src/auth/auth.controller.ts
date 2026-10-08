import { Body, Controller, Get, Post, Req, UseGuards, HttpException, HttpStatus } from "@nestjs/common";
type Request = any;
import { AuthService } from "./auth.service";
import { findUser } from "./users";
import { AuthGuard } from "./auth.guard";

interface LoginBody {
  username?: string;
  password?: string;
}

@Controller("api/auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  login(@Body() body: LoginBody) {
    const username = body?.username;
    const password = body?.password;
    if (!username || !password) {
      throw new HttpException(
        { error: "invalid_credentials", message: "username and password are required" },
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = findUser(username, password);
    if (!user) {
      throw new HttpException(
        { error: "invalid_credentials", message: "Invalid username or password" },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = this.auth.issueToken({ sub: user.sub, role: user.role });
    return { token, role: user.role, sub: user.sub };
  }

  @Post("logout")
  logout() {
    // Stateless tokens: nothing to invalidate server-side.
    return { ok: true };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  me(@Req() req: any) {
    const user = (req as any).user;
    return { sub: user.sub, role: user.role };
  }
}