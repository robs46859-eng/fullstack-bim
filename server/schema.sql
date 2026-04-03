CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  vertical TEXT DEFAULT 'bim',
  status TEXT DEFAULT 'active',
  repo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  task_class TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  risk_level TEXT DEFAULT 'low',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  model_name TEXT,
  provider TEXT DEFAULT 'anthropic',
  status TEXT DEFAULT 'pending',
  latency_ms INTEGER,
  token_input INTEGER,
  token_output INTEGER,
  cost_usd NUMERIC(10,6),
  output_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_run_id UUID REFERENCES task_runs(id),
  decision TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
