ALTER TABLE rig_gateway_enrollments
  ADD COLUMN IF NOT EXISTS challenge_hash text,
  ADD COLUMN IF NOT EXISTS challenge_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS rig_gateway_enrollments_pending_expiry_idx
  ON rig_gateway_enrollments (expires_at)
  WHERE status = 'pending';

-- A setup code may issue at most five proof-of-possession challenges.
-- The existing attempts column is incremented atomically by the challenge API.
