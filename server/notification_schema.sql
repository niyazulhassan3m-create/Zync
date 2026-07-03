-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase Migration: Zync powered by Lab-Y Schema
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Zync Workspaces & Service Provider Access Control Table
CREATE TABLE IF NOT EXISTS zync_workspaces (
  workspace_id                          TEXT PRIMARY KEY DEFAULT 'WS-LABY-7842',
  client_name                           TEXT NOT NULL DEFAULT 'Acme Operations Corp',
  email                                 TEXT NOT NULL DEFAULT 'client@acme.com',
  business_requirements                 TEXT,
  request_status                        TEXT NOT NULL DEFAULT 'not_requested', -- 'not_requested' | 'pending_approval' | 'active' | 'inactive'
  service_provider_activation_status    BOOLEAN NOT NULL DEFAULT FALSE, -- 🛡️ MASTER SWITCH (Controlled by Lab-Y only)
  voice_to_action_enabled              BOOLEAN NOT NULL DEFAULT FALSE,
  reminders_enabled                     BOOLEAN NOT NULL DEFAULT FALSE,
  market_intelligence_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  welcome_email_sent                    BOOLEAN NOT NULL DEFAULT FALSE,
  requested_at                          TIMESTAMPTZ,
  activated_at                          TIMESTAMPTZ,
  updated_at                            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial default workspace row
INSERT INTO zync_workspaces (
  workspace_id, client_name, email, business_requirements, request_status, service_provider_activation_status
) VALUES (
  'WS-LABY-7842', 'Acme Operations Corp', 'client@acme.com', 'Automated candidate outreach, voice task creation & market intelligence overlay.', 'not_requested', FALSE
) ON CONFLICT (workspace_id) DO NOTHING;

-- 2. Audit & Communication Dispatch Logs
CREATE TABLE IF NOT EXISTS zync_audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  TEXT NOT NULL DEFAULT 'WS-LABY-7842',
  event_type    TEXT NOT NULL, -- 'REQUEST_SUBMITTED' | 'ACTIVATION_TOGGLED' | 'SERVICE_VALIDATOR_REFUSAL' | 'WELCOME_EMAIL_SENT'
  description   TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zync_audit_logs_created_at
  ON zync_audit_logs (created_at DESC);
