/**
 * Minimal HMAC-signed token auth (no JWT library).
 *
 * Token format:  `<base64url(payload)>.<hex HMAC-SHA256(secret, base64url(payload))>`
 *
 * Payload is a JSON object: { "sub": "admin", "role": "ADMIN", "iat": <ms> }
 *
 * Verification recomputes the HMAC over the received payload and compares it
 * to the signature with a constant-time compare — a forged payload fails
 * signature verification.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { ConfigService } from "@nestjs/config";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Role } from "./auth.types";

export interface AuthUser {
  sub: string;
  role: Role;
  iat: number;
}

export interface TokenPayload {
  sub: string;
  role: Role;
  iat: number;
}

const ALGO = "sha256";

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

@Injectable()
export class AuthService {
  private readonly secret: string;

  constructor(private readonly config: ConfigService) {
    this.secret = process.env.AUTH_SECRET ?? "dev-insecure-change-me";
    if (this.secret === "dev-insecure-change-me") {
      // eslint-disable-next-line no-console
      console.warn("[auth] AUTH_SECRET not set; using insecure default. Set AUTH_SECRET in .env for real deployments.");
    }
  }

  /** Issue a signed token for the given user. */
  issueToken(user: { sub: string; role: Role }): string {
    const payload: TokenPayload = { sub: user.sub, role: user.role, iat: Date.now() };
    const encoded = base64url(JSON.stringify(payload));
    const signature = createHmac(ALGO, this.secret).update(encoded).digest("hex");
    return `${encoded}.${signature}`;
  }

  /** Verify a token and return the authenticated user, or throw. */
  verifyToken(token: string): AuthUser {
    if (typeof token !== "string" || !token.includes(".")) {
      throw new UnauthorizedException("Invalid token format");
    }

    const dot = token.lastIndexOf(".");
    const encoded = token.slice(0, dot);
    const signature = token.slice(dot + 1);

    if (!encoded || !signature) {
      throw new UnauthorizedException("Invalid token format");
    }

    const expected = createHmac(ALGO, this.secret).update(encoded).digest("hex");
    if (!constantTimeEqual(signature, expected)) {
      throw new UnauthorizedException("Invalid token signature");
    }

    let payload: TokenPayload;
    try {
      payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as TokenPayload;
    } catch {
      throw new UnauthorizedException("Invalid token payload");
    }

    if (!payload || typeof payload.role !== "string" || typeof payload.sub !== "string") {
      throw new UnauthorizedException("Invalid token payload");
    }

    return { sub: payload.sub, role: payload.role as Role, iat: payload.iat ?? 0 };
  }
}