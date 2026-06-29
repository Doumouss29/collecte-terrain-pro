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

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  first_name text,
  last_name text,
  role text NOT NULL DEFAULT 'agent',
  status text NOT NULL DEFAULT 'actif',
  organisation_id uuid,
  communes_supervisees jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(lower(email));
