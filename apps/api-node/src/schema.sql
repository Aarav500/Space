-- OrbitShield Database Schema
-- Run: psql $DATABASE_URL < src/schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Organizations ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(255) NOT NULL,
  email            VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) UNIQUE,
  plan             VARCHAR(50) DEFAULT 'free',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Users ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email            VARCHAR(255) UNIQUE NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  role             VARCHAR(20) DEFAULT 'admin',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Satellites ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS satellites (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  norad_id         INTEGER UNIQUE NOT NULL,
  name             VARCHAR(255) NOT NULL,
  orbit_type       VARCHAR(20) NOT NULL DEFAULT 'LEO',
  tle_line1        TEXT,
  tle_line2        TEXT,
  tle_epoch        TIMESTAMPTZ,
  current_risk_score DECIMAL(10,8) DEFAULT 0,
  risk_level       VARCHAR(20) DEFAULT 'nominal',
  last_updated     TIMESTAMPTZ DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_satellites_norad_id ON satellites(norad_id);
CREATE INDEX IF NOT EXISTS idx_satellites_org_id ON satellites(org_id);

-- ─── Conjunction Events ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conjunction_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_sat_id   UUID NOT NULL REFERENCES satellites(id) ON DELETE CASCADE,
  secondary_norad_id INTEGER NOT NULL,
  secondary_name   VARCHAR(255),
  tca              TIMESTAMPTZ NOT NULL,
  miss_distance_km DECIMAL(12,6) NOT NULL,
  relative_velocity_kms DECIMAL(10,4),
  collision_probability DECIMAL(10,8) NOT NULL,
  source           VARCHAR(50) NOT NULL,
  cdm_id           VARCHAR(100),
  raw_cdm          JSONB,
  status           VARCHAR(20) DEFAULT 'active',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conjunction_events_tca ON conjunction_events(tca);
CREATE INDEX IF NOT EXISTS idx_conjunction_events_primary_sat ON conjunction_events(primary_sat_id, tca);

-- ─── Risk Snapshots ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS risk_snapshots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  satellite_id     UUID NOT NULL REFERENCES satellites(id) ON DELETE CASCADE,
  snapshot_time    TIMESTAMPTZ NOT NULL,
  risk_score       DECIMAL(10,8) NOT NULL,
  ml_prediction_72h DECIMAL(10,8),
  kp_index         DECIMAL(4,2),
  f107_flux        DECIMAL(8,2),
  active_conjunctions INTEGER DEFAULT 0,
  pricing_rate_cents INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_snapshots_satellite_time ON risk_snapshots(satellite_id, snapshot_time DESC);

-- ─── Coverage Policies ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coverage_policies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  satellite_id     UUID NOT NULL REFERENCES satellites(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  coverage_start   TIMESTAMPTZ NOT NULL,
  coverage_end     TIMESTAMPTZ,
  hourly_premium_cents INTEGER NOT NULL,
  max_payout_cents BIGINT NOT NULL,
  trigger_pc_threshold DECIMAL(10,8) DEFAULT 0.001,
  status           VARCHAR(20) DEFAULT 'active',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Space Weather ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS space_weather (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_time TIMESTAMPTZ NOT NULL UNIQUE,
  kp_index         DECIMAL(4,2) NOT NULL,
  f107_flux        DECIMAL(8,2),
  storm_level      VARCHAR(10),
  source           VARCHAR(50) DEFAULT 'noaa_swpc',
  raw_data         JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_space_weather_time ON space_weather(observation_time DESC);

-- ─── Alert Configs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alert_configs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  satellite_id     UUID REFERENCES satellites(id) ON DELETE CASCADE,
  pc_threshold     DECIMAL(10,8) NOT NULL DEFAULT 0.0001,
  channels         JSONB NOT NULL DEFAULT '["email"]',
  enabled          BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Alert History ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  satellite_id     UUID REFERENCES satellites(id) ON DELETE CASCADE,
  conjunction_event_id UUID REFERENCES conjunction_events(id),
  alert_type       VARCHAR(50) NOT NULL,
  message          TEXT NOT NULL,
  severity         VARCHAR(20) DEFAULT 'warning',
  acknowledged     BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
