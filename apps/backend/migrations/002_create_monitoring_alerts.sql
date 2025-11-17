-- Migration: Create monitoring_alerts table for GDPR monitoring
-- Created: 2024-11-09

CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id VARCHAR(255) PRIMARY KEY,
  level VARCHAR(50) NOT NULL CHECK (level IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  context JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_level ON monitoring_alerts(level);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_timestamp ON monitoring_alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_level_timestamp ON monitoring_alerts(level, timestamp);

-- Add comments
COMMENT ON TABLE monitoring_alerts IS 'Monitoring alerts for GDPR operations';
COMMENT ON COLUMN monitoring_alerts.id IS 'Unique identifier for the alert';
COMMENT ON COLUMN monitoring_alerts.level IS 'Alert level (info, warning, error, critical)';
COMMENT ON COLUMN monitoring_alerts.message IS 'Alert message';
COMMENT ON COLUMN monitoring_alerts.context IS 'Additional context about the alert';
COMMENT ON COLUMN monitoring_alerts.timestamp IS 'Timestamp when the alert was generated';
