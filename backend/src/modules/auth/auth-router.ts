import { randomUUID } from "node:crypto";
import type { Router as RouterType } from "express";
import { Router } from "express";
import type { Pool } from "pg";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../../common/auth/password.js";
import { createSessionToken, hashSessionToken } from "../../common/auth/session-token.js";
import { withTenantTransaction } from "../../common/authorization/tenant-transaction.js";
import { HttpError } from "../../common/errors/http-error.js";
import { authenticate } from "./auth-middleware.js";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1_000;

const registerSchema = z.object({
  dairyName: z.string().trim().min(1).max(120),
  displayName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  timezone: z.string().trim().min(1).max(80).default("Asia/Kolkata"),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
  dairyId: z.string().uuid().optional(),
});

type MembershipRow = {
  id: string;
  user_id: string;
  dairy_id: string;
  role: "OWNER" | "MANAGER" | "DRIVER" | "SELLER";
};

function requireDatabase(pool: Pool | null): asserts pool is Pool {
  if (!pool) throw new HttpError(503, "DATABASE_UNAVAILABLE", "Authentication is temporarily unavailable");
}

export function createAuthRouter(pool: Pool | null, options: { allowOwnerSelfRegistration?: boolean } = {}): RouterType {
  const router = Router();

  router.post("/register", async (request, response) => {
    if (!options.allowOwnerSelfRegistration) {
      throw new HttpError(404, "NOT_FOUND", "The requested resource was not found");
    }
    requireDatabase(pool);
    const input = registerSchema.parse(request.body);
    const passwordHash = await hashPassword(input.password);
    const dairyId = randomUUID();
    const userId = randomUUID();
    const membershipId = randomUUID();
    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const sessionId = randomUUID();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT set_config('app.dairy_id', $1, true), set_config('app.user_id', $2, true)",
        [dairyId, userId],
      );
      await client.query(
        "INSERT INTO public.dairies (id, name, timezone) VALUES ($1, $2, $3)",
        [dairyId, input.dairyName, input.timezone],
      );
      await client.query(
        "INSERT INTO public.users (id, email, display_name, password_hash) VALUES ($1, $2, $3, $4)",
        [userId, input.email, input.displayName, passwordHash],
      );
      await client.query(
        "INSERT INTO public.dairy_memberships (id, dairy_id, user_id, role) VALUES ($1, $2, $3, 'OWNER')",
        [membershipId, dairyId, userId],
      );
      await client.query(
        "INSERT INTO public.auth_sessions (id, user_id, membership_id, dairy_id, token_hash, expires_at, user_agent) " +
        "VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [sessionId, userId, membershipId, dairyId, hashSessionToken(token), expiresAt, request.get("user-agent")?.slice(0, 512) ?? null],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      const databaseError = error as { code?: string };
      if (databaseError.code === "23505") {
        throw new HttpError(409, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists");
      }
      throw error;
    } finally {
      client.release();
    }

    response.status(201).json({
      accessToken: token,
      tokenType: "Bearer",
      expiresAt: expiresAt.toISOString(),
      user: { id: userId, email: input.email, displayName: input.displayName },
      dairy: { id: dairyId, name: input.dairyName, timezone: input.timezone, role: "OWNER" },
    });
  });

  router.post("/login", async (request, response) => {
    requireDatabase(pool);
    const input = loginSchema.parse(request.body);
    const userResult = await pool.query<{
      id: string;
      email: string;
      display_name: string;
      password_hash: string;
      status: string;
    }>(
      "SELECT id, email, display_name, password_hash, status FROM public.users WHERE lower(email) = $1",
      [input.email],
    );
    const user = userResult.rows[0];
    if (!user || user.status !== "ACTIVE" || !(await verifyPassword(input.password, user.password_hash))) {
      throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
    }

    const memberships = await pool.query<MembershipRow>(
      "SELECT id, user_id, dairy_id, role FROM public.dairy_memberships " +
      "WHERE user_id = $1 AND status = 'ACTIVE' ORDER BY created_at",
      [user.id],
    );
    if (memberships.rows.length === 0) {
      throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
    }

    const membership = input.dairyId
      ? memberships.rows.find((row) => row.dairy_id === input.dairyId)
      : memberships.rows.length === 1 ? memberships.rows[0] : undefined;

    if (!membership && !input.dairyId && memberships.rows.length > 1) {
      response.status(409).json({
        error: {
          code: "DAIRY_SELECTION_REQUIRED",
          message: "Select the dairy account to continue",
          memberships: memberships.rows.map((row) => ({ dairyId: row.dairy_id, role: row.role })),
        },
      });
      return;
    }
    if (!membership) {
      throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
    }

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const sessionId = randomUUID();
    const created = await pool.query(
      "INSERT INTO public.auth_sessions " +
      "(id, user_id, membership_id, dairy_id, token_hash, expires_at, user_agent) " +
      "SELECT $1, m.user_id, m.id, m.dairy_id, $5, $6, $7 " +
      "FROM public.dairy_memberships m JOIN public.users u ON u.id = m.user_id " +
      "WHERE m.id = $2 AND m.user_id = $3 AND m.dairy_id = $4 " +
      "AND m.status = 'ACTIVE' AND u.status = 'ACTIVE' RETURNING id",
      [sessionId, membership.id, user.id, membership.dairy_id, hashSessionToken(token), expiresAt, request.get("user-agent")?.slice(0, 512) ?? null],
    );
    if (created.rowCount !== 1) {
      throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
    }

    response.status(200).json({
      accessToken: token,
      tokenType: "Bearer",
      expiresAt: expiresAt.toISOString(),
      user: { id: user.id, email: user.email, displayName: user.display_name },
      dairy: { id: membership.dairy_id, role: membership.role },
    });
  });

  const authenticateRequest: import("express").RequestHandler = pool
    ? authenticate(pool)
    : (_request, _response, next) => next(new HttpError(503, "DATABASE_UNAVAILABLE", "Authentication is temporarily unavailable"));

  router.get("/me", authenticateRequest, async (request, response) => {
    requireDatabase(pool);
    const auth = request.auth!;
    const result = await withTenantTransaction(pool, { dairyId: auth.dairyId, userId: auth.userId }, (client) =>
      client.query<{ id: string; name: string; timezone: string }>(
        "SELECT id, name, timezone FROM public.dairies WHERE id = $1",
        [auth.dairyId],
      ),
    );
    const dairy = result.rows[0];
    if (!dairy) throw new HttpError(401, "UNAUTHENTICATED", "Authentication is required");
    response.status(200).json({
      user: { id: auth.userId, email: auth.email, displayName: auth.displayName },
      dairy: { ...dairy, role: auth.role },
    });
  });

  router.post("/logout", authenticateRequest, async (request, response) => {
    requireDatabase(pool);
    await pool.query(
      "UPDATE public.auth_sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL",
      [request.auth!.sessionId],
    );
    response.status(204).end();
  });

  return router;
}
