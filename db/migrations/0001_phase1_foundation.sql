-- RIG Phase 1 foundation: Better Auth-compatible identity tables and core product data.
-- Apply with a migration runner in deployment; do not edit an applied migration.

CREATE TABLE "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  "image" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "session" (
  "id" text PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);
CREATE INDEX session_user_id_idx ON "session" ("userId");
CREATE INDEX session_expires_at_idx ON "session" ("expiresAt");

CREATE TABLE "account" (
  "id" text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("providerId", "accountId")
);
CREATE INDEX account_user_id_idx ON "account" ("userId");

CREATE TABLE "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX verification_identifier_idx ON "verification" ("identifier");

CREATE TABLE rig_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  display_name text,
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rig_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'online', 'offline', 'suspended')),
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rig_gateways_status_idx ON rig_gateways (status);

CREATE TABLE rig_gateway_members (
  gateway_id uuid NOT NULL REFERENCES rig_gateways(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  permission text NOT NULL CHECK (permission IN ('owner', 'admin', 'operator', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (gateway_id, user_id)
);
CREATE INDEX rig_gateway_members_user_idx ON rig_gateway_members (user_id);

-- Store only public device identity material and a credential hash; never store a device private key.
CREATE TABLE rig_device_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_id uuid NOT NULL REFERENCES rig_gateways(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  public_key text NOT NULL,
  credential_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE (gateway_id, public_key)
);
CREATE INDEX rig_device_identities_gateway_status_idx ON rig_device_identities (gateway_id, status);

CREATE TABLE rig_connection_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  gateway_id uuid NOT NULL REFERENCES rig_gateways(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'active', 'ended', 'failed')),
  route_mode text NOT NULL DEFAULT 'full' CHECK (route_mode IN ('full', 'home_only')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);
CREATE INDEX rig_connection_sessions_user_created_idx ON rig_connection_sessions (user_id, created_at DESC);
CREATE INDEX rig_connection_sessions_gateway_status_idx ON rig_connection_sessions (gateway_id, status);

CREATE TABLE rig_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('connection', 'device', 'subscription', 'security', 'system')),
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rig_notifications_user_created_idx ON rig_notifications (user_id, created_at DESC);
CREATE INDEX rig_notifications_unread_idx ON rig_notifications (user_id) WHERE read_at IS NULL;

CREATE TABLE rig_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  provider text NOT NULL,
  provider_subscription_id text,
  plan_code text NOT NULL,
  status text NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subscription_id)
);
CREATE INDEX rig_subscriptions_user_status_idx ON rig_subscriptions (user_id, status);

CREATE TABLE rig_audit_events (
  id bigserial PRIMARY KEY,
  actor_user_id text REFERENCES "user"("id") ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rig_audit_events_resource_idx ON rig_audit_events (resource_type, resource_id, created_at DESC);
