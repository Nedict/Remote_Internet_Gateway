CREATE TABLE IF NOT EXISTS rig_rate_limits (
  bucket_key text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts >= 0),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS rig_rate_limits_expiry_idx ON rig_rate_limits (expires_at);

CREATE INDEX IF NOT EXISTS rig_device_identities_gateway_seen_idx
  ON rig_device_identities (gateway_id, last_seen_at DESC);
