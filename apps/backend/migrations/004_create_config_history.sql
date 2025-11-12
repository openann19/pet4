-- Migration: Create config_history table for tracking configuration changes
-- Created: 2024-12-19

CREATE TABLE IF NOT EXISTS config_history (
  id VARCHAR(255) PRIMARY KEY,
  "configId" VARCHAR(255) NOT NULL,
  "configType" VARCHAR(50) NOT NULL CHECK ("configType" IN ('business', 'matching', 'map', 'api', 'system')),
  version INTEGER NOT NULL,
  "previousVersion" INTEGER,
  "changedBy" VARCHAR(255) NOT NULL,
  "changedByName" VARCHAR(255),
  changes JSONB NOT NULL,
  "previousConfig" JSONB,
  "newConfig" JSONB NOT NULL,
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_config_history_config FOREIGN KEY ("configId") REFERENCES admin_configs(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_config_history_config_id ON config_history("configId");
CREATE INDEX IF NOT EXISTS idx_config_history_config_type ON config_history("configType");
CREATE INDEX IF NOT EXISTS idx_config_history_version ON config_history(version);
CREATE INDEX IF NOT EXISTS idx_config_history_changed_by ON config_history("changedBy");
CREATE INDEX IF NOT EXISTS idx_config_history_timestamp ON config_history("timestamp");
CREATE INDEX IF NOT EXISTS idx_config_history_type_timestamp ON config_history("configType", "timestamp");

-- Add comments
COMMENT ON TABLE config_history IS 'History of all configuration changes for audit and rollback purposes';
COMMENT ON COLUMN config_history.id IS 'Unique identifier for the history entry';
COMMENT ON COLUMN config_history."configId" IS 'Reference to the admin_configs entry';
COMMENT ON COLUMN config_history."configType" IS 'Type of configuration that was changed';
COMMENT ON COLUMN config_history.version IS 'Version number of the new configuration';
COMMENT ON COLUMN config_history."previousVersion" IS 'Version number of the previous configuration';
COMMENT ON COLUMN config_history."changedBy" IS 'User ID who made the change';
COMMENT ON COLUMN config_history."changedByName" IS 'Display name of the user who made the change';
COMMENT ON COLUMN config_history.changes IS 'JSON object describing what fields changed';
COMMENT ON COLUMN config_history."previousConfig" IS 'Previous configuration snapshot';
COMMENT ON COLUMN config_history."newConfig" IS 'New configuration snapshot';
COMMENT ON COLUMN config_history."ipAddress" IS 'IP address of the requester';
COMMENT ON COLUMN config_history."userAgent" IS 'User agent of the requester';
COMMENT ON COLUMN config_history."timestamp" IS 'Timestamp when the change occurred';
