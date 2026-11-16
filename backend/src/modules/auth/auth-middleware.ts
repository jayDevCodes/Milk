import type { Pool } from "pg";
import type { RequestHandler } from "express";
import { hashSessionToken } from "../../common/auth/session-token.js";
import { HttpError } from "../../common/errors/http-error.js";
import type { DairyRole } from "./auth-context.js";

const BEARER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

export function authenticate(pool: Pool): RequestHandler {
  return async (request, _response, next) => {
    const authorization = request.get("authorization") ?? "";
    const match = /^Bearer ([A-Za-z0-9_-]+)$/u.exec(authorization);
    if (!match || !BEARER_TOKEN_PATTERN.test(match[1]!)) {
      next(new HttpError(401, "UNAUTHENTICATED", "Authentication is required"));
      return;
    }

    const result = await pool.query<{
      session_id: string;
      user_id: string;
      email: string;
      display_name: string;
      dairy_id: string;
      role: DairyRole;
    }>(
      "SELECT s.id AS session_id, u.id AS user_id, u.email, u.display_name, m.dairy_id, m.role " +
      "FROM public.auth_sessions s " +
      "JOIN public.users u ON u.id = s.user_id " +
      "JOIN public.dairy_memberships m ON m.id = s.membership_id " +
      "AND m.user_id = s.user_id AND m.dairy_id = s.dairy_id " +
      "WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now() " +
      "AND u.status = 'ACTIVE' AND m.status = 'ACTIVE'",
      [hashSessionToken(match[1]!)],
    );

    const session = result.rows[0];
    if (!session) {
      next(new HttpError(401, "UNAUTHENTICATED", "Authentication is required"));
      return;
    }

    request.auth = {
      sessionId: session.session_id,
      userId: session.user_id,
      email: session.email,
      displayName: session.display_name,
      dairyId: session.dairy_id,
      role: session.role,
    };
    next();
  };
}

export function isRoleAllowed(role: DairyRole, allowed: readonly DairyRole[]): boolean {
  return allowed.includes(role);
}

export function requireRoles(...allowed: DairyRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) {
      next(new HttpError(401, "UNAUTHENTICATED", "Authentication is required"));
      return;
    }
    if (!isRoleAllowed(request.auth.role, allowed)) {
      next(new HttpError(403, "FORBIDDEN", "You do not have permission to perform this action"));
      return;
    }
    next();
  };
}
