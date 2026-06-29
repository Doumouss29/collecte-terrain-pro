CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS base44_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_base44_records_entity
  ON base44_records(entity);
CREATE INDEX IF NOT EXISTS idx_base44_records_data_gin
  ON base44_records USING gin(data jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_base44_records_email
  ON base44_records ((data->>'email'))
  WHERE data ? 'email';

-- L'utilisateur administrateur est créé automatiquement au premier appel /api/auth/me.
