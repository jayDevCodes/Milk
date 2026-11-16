# Step 04 Research: Authentication, roles and tenant security

- Research checked: 2026-11-16
- Repository: https://github.com/jayDevCodes/Milk

## Decisions

### Password storage

Use Argon2id, not SHA-256, bcrypt or a custom password primitive. OWASP's current password-storage guidance recommends Argon2id with at least 19 MiB memory, two iterations and parallelism 1. The backend's Node.js 26 runtime provides native asynchronous crypto.argon2 and crypto.argon2Sync APIs (added in Node 24.7), so the project can use Argon2id without an extra native npm module or install-time lifecycle script. The implementation uses the OWASP minimum parameters, a random 16-byte salt, 32-byte output and PHC-compatible storage.

### Sessions

The Android clients need server-side revocation and logout. Use a random 256-bit opaque bearer token, not a self-contained JWT that cannot be revoked without an additional denylist. Store only SHA-256(token) in the database, expire sessions after 30 days and revoke on logout. The token is returned once and must be stored by the Android clients in Keystore-backed secure storage. Do not put tokens in URLs, query strings or logs.

### Identity and tenant membership

A global user identity can hold memberships in multiple dairies. Each membership has one of OWNER, MANAGER, DRIVER or SELLER and an ACTIVE/SUSPENDED status. Login with one membership selects it automatically; if there are several, the client must explicitly choose a dairy ID. Seller codes remain identifiers only and are not credentials.

### Database tenant boundary

PostgreSQL Row-Level Security (RLS) is the database-level safety net for tenant-owned data. The backend sets transaction-local app.dairy_id and app.user_id settings from the authenticated session inside a transaction. The dairy root table has RLS enabled and forced, proving that the owner role cannot accidentally bypass policy merely because it owns the table. Future tenant-owned tables must add equivalent policies; never run tenant queries outside the helper.

The app's database login must be a non-superuser, non-BYPASSRLS role with only the required grants. The current local Compose/CI user is the database owner for migration testing, but FORCE ROW LEVEL SECURITY is enabled; production role creation/grants and privilege-separation review remain deployment acceptance work.

### Authorization

Authentication proves the current identity and active membership. Authorization is separate: role gates must deny by default, and each resource operation must also check dairy ownership and assignment. A DRIVER or SELLER must never gain OWNER access merely by submitting another dairy ID or role in a request body. Business resource/assignment checks are introduced with the Step 5 and later modules.

## Official references checked

- Node.js 26 crypto Argon2 API: https://nodejs.org/api/crypto.html#cryptoargon2algorithm-parameters-callback
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- PostgreSQL 18 Row Security Policies: https://www.postgresql.org/docs/18/ddl-rowsecurity.html
- PostgreSQL CREATE POLICY: https://www.postgresql.org/docs/18/sql-createpolicy.html
- PostgreSQL configuration setting functions: https://www.postgresql.org/docs/18/functions-admin.html
- PostgreSQL UUID type: https://www.postgresql.org/docs/18/datatype-uuid.html

## Implementation scope

- Migration 003: users, dairy memberships, hashed bearer sessions and forced RLS on the dairy root.
- Native Node Argon2id password hashing and constant-time verification.
- Atomic first-owner registration, login with optional dairy selection, current-identity endpoint and server-side logout.
- Auth middleware that rechecks user/membership status and expiry on every request.
- Role authorization helper and tenant transaction context.
- Integration tests for auth lifecycle, duplicate registration, role decisions and cross-dairy RLS isolation.

## Production registration guard

Owner self-registration is a development convenience only. The API enables it by default only when NODE_ENV=development; production defaults to a hidden 404 route unless OWNER_SELF_REGISTRATION_ENABLED=true is explicitly set. The example .env and Docker Compose configuration enable it for local development. Do not enable it for a public pilot until verified onboarding and distributed abuse controls are ready.

## Final CI verification

- Backend CI: https://github.com/jayDevCodes/Milk/actions/runs/43804419638 — passed. Strict type-check, fresh PostgreSQL 18.7/PostGIS 3.7 migrations, all 9 tests (0 failures), production TypeScript build, compiled migration idempotency and production readiness smoke test passed.
- Repository guardrails: https://github.com/jayDevCodes/Milk/actions/runs/43804419775 — passed.

## Explicit follow-up hardening

Before public production onboarding, add distributed login/register rate limits, verified-email or phone-OTP workflows, password reset, short-lived access plus rotating refresh tokens if the threat model requires them, audit events, and a dedicated non-owner database role. Do not claim these are implemented by this milestone.
