CREATE TABLE IF NOT EXISTS rig_gateway_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_id uuid REFERENCES rig_gateways(id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'consumed', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  consumed_by text REFERENCES "user"(id) ON DELETE SET NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rig_gateway_enrollments_gateway_idx ON rig_gateway_enrollments(gateway_id);
CREATE INDEX IF NOT EXISTS rig_gateway_enrollments_status_idx ON rig_gateway_enrollments(status);

CREATE TABLE IF NOT EXISTS rig_gateway_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_id uuid NOT NULL REFERENCES rig_gateways(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'unknown',
  status text NOT NULL DEFAULT 'offline',
  lastSeenAt timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rig_gateway_devices_gateway_idx ON rig_gateway_devices(gateway_id);
