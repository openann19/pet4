-- Migration: Create admin_audit_logs table for tracking admin actions
-- Created: 2024-12-19

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  "adminId" VARCHAR(255) NOT NULL,
  "adminName" VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  "targetType" VARCHAR(100) NOT NULL,
  "targetId" VARCHAR(255),
  details JSONB,
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs("adminId");
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_type ON admin_audit_logs("targetType");
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_id ON admin_audit_logs("targetId");
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_timestamp ON admin_audit_logs("timestamp");
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_timestamp ON admin_audit_logs("adminId", "timestamp");
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action_timestamp ON admin_audit_logs(action, "timestamp");

-- Add comments
COMMENT ON TABLE admin_audit_logs IS 'Audit logs for admin actions (separate from GDPR audit logs)';
COMMENT ON COLUMN admin_audit_logs.id IS 'Unique identifier for the audit log entry';
COMMENT ON COLUMN admin_audit_logs."adminId" IS 'User ID of the admin who performed the action';
COMMENT ON COLUMN admin_audit_logs."adminName" IS 'Display name of the admin who performed the action';
COMMENT ON COLUMN admin_audit_logs.action IS 'Type of action performed (e.g., config_broadcast, user_update, etc.)';
COMMENT ON COLUMN admin_audit_logs."targetType" IS 'Type of target (e.g., business_config, user, etc.)';
COMMENT ON COLUMN admin_audit_logs."targetId" IS 'ID of the target resource';
COMMENT ON COLUMN admin_audit_logs.details IS 'Additional details about the action as JSON';
COMMENT ON COLUMN admin_audit_logs."ipAddress" IS 'IP address of the requester';
COMMENT ON COLUMN admin_audit_logs."userAgent" IS 'User agent of the requester';
COMMENT ON COLUMN admin_audit_logs."timestamp" IS 'Timestamp when the action occurred';
