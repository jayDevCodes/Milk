CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 100),
  password_hash text NOT NULL CHECK (password_hash LIKE '$argon2id$v=19$%'),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_unique ON public.users (lower(email));

CREATE TABLE public.dairy_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dairy_id uuid NOT NULL REFERENCES public.dairies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'DRIVER', 'SELLER')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dairy_id, user_id),
  UNIQUE (id, user_id, dairy_id)
);

CREATE INDEX dairy_memberships_user_status_idx
  ON public.dairy_memberships (user_id, status, created_at);

CREATE TABLE public.auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  dairy_id uuid NOT NULL,
  token_hash char(64) NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  user_agent text CHECK (user_agent IS NULL OR char_length(user_agent) <= 512),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (membership_id, user_id, dairy_id)
    REFERENCES public.dairy_memberships (id, user_id, dairy_id) ON DELETE CASCADE,
  CHECK (expires_at > created_at)
);

CREATE INDEX auth_sessions_user_expiry_idx
  ON public.auth_sessions (user_id, expires_at)
  WHERE revoked_at IS NULL;

ALTER TABLE public.dairies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dairies FORCE ROW LEVEL SECURITY;

CREATE POLICY dairies_tenant_scope ON public.dairies
  USING (id = NULLIF(current_setting('app.dairy_id', true), '')::uuid)
  WITH CHECK (id = NULLIF(current_setting('app.dairy_id', true), '')::uuid);
