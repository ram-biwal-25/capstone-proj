-- FarmWard PostgreSQL schema
-- Target: PostgreSQL 15+
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE animal_species AS ENUM ('pig', 'poultry');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE access_role AS ENUM ('owner', 'manager', 'veterinarian');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE assessment_risk AS ENUM ('low', 'moderate', 'high', 'critical', 'not_assessed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE response_status AS ENUM ('done', 'follow_up', 'not_applicable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS app_user (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT app_user_email_nonempty CHECK (length(trim(email)) > 3)
);

CREATE TABLE IF NOT EXISTS farm (
  farm_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_name TEXT NOT NULL,
  species animal_species NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT farm_name_nonempty CHECK (length(trim(farm_name)) > 1)
);

CREATE TABLE IF NOT EXISTS farm_access (
  user_id UUID NOT NULL REFERENCES app_user(user_id) ON DELETE RESTRICT,
  farm_id UUID NOT NULL REFERENCES farm(farm_id) ON DELETE RESTRICT,
  role access_role NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, farm_id)
);

CREATE TABLE IF NOT EXISTS assessment (
  assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farm(farm_id) ON DELETE RESTRICT,
  submitted_by UUID NOT NULL REFERENCES app_user(user_id) ON DELETE RESTRICT,
  assessed_on DATE NOT NULL,
  risk_level assessment_risk NOT NULL,
  completion_percent NUMERIC(5,2) NOT NULL,
  submission_key UUID NOT NULL UNIQUE,
  checklist_version TEXT NOT NULL,
  checklist_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT assessment_completion_range CHECK (completion_percent >= 0 AND completion_percent <= 100),
  CONSTRAINT assessment_date_not_future CHECK (assessed_on <= CURRENT_DATE),
  CONSTRAINT assessment_snapshot_object CHECK (jsonb_typeof(checklist_snapshot) = 'object')
);

CREATE TABLE IF NOT EXISTS assessment_response (
  response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessment(assessment_id) ON DELETE CASCADE,
  criterion_code TEXT NOT NULL,
  criterion_label TEXT NOT NULL,
  status response_status NOT NULL,
  note TEXT,
  CONSTRAINT response_code_nonempty CHECK (length(trim(criterion_code)) > 0),
  CONSTRAINT response_label_nonempty CHECK (length(trim(criterion_label)) > 0),
  CONSTRAINT one_response_per_criterion UNIQUE (assessment_id, criterion_code)
);

CREATE INDEX IF NOT EXISTS idx_farm_access_farm ON farm_access(farm_id);
CREATE INDEX IF NOT EXISTS idx_assessment_farm_date ON assessment(farm_id, assessed_on DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_submitter_created ON assessment(submitted_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_risk ON assessment(risk_level);
CREATE INDEX IF NOT EXISTS idx_response_assessment ON assessment_response(assessment_id);
CREATE INDEX IF NOT EXISTS idx_response_follow_up ON assessment_response(status) WHERE status = 'follow_up';

COMMIT;
