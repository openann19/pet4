-- Migration: Create admin_configs table for storing system configurations
-- Created: 2024-12-19

CREATE TABLE IF NOT EXISTS admin_configs (
  id VARCHAR(255) PRIMARY KEY,
  "configType" VARCHAR(50) NOT NULL CHECK ("configType" IN ('business', 'matching', 'map', 'api', 'system')),
  version INTEGER NOT NULL DEFAULT 1,
  config JSONB NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedBy" VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  UNIQUE("configType", "isActive") WHERE "isActive" = true
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_configs_type ON admin_configs("configType");
CREATE INDEX IF NOT EXISTS idx_admin_configs_active ON admin_configs("isActive");
CREATE INDEX IF NOT EXISTS idx_admin_configs_updated_at ON admin_configs("updatedAt");
CREATE INDEX IF NOT EXISTS idx_admin_configs_type_active ON admin_configs("configType", "isActive");

-- Add comments
COMMENT ON TABLE admin_configs IS 'System configuration storage for admin-managed settings';
COMMENT ON COLUMN admin_configs.id IS 'Unique identifier for the config entry';
COMMENT ON COLUMN admin_configs."configType" IS 'Type of configuration (business, matching, map, api, system)';
COMMENT ON COLUMN admin_configs.version IS 'Configuration version number';
COMMENT ON COLUMN admin_configs.config IS 'Configuration data as JSON';
COMMENT ON COLUMN admin_configs."createdAt" IS 'Timestamp when the config was created';
COMMENT ON COLUMN admin_configs."updatedAt" IS 'Timestamp when the config was last updated';
COMMENT ON COLUMN admin_configs."updatedBy" IS 'User ID who last updated the config';
COMMENT ON COLUMN admin_configs."isActive" IS 'Whether this config is currently active (only one active config per type)';
