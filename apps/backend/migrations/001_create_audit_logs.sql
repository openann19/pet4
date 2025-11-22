-- Migration: Create audit_logs table for GDPR compliance
-- Created: 2024-11-09

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  "userId" VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('export', 'delete', 'consent_read', 'consent_update')),
  resource VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failure')),
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  metadata JSONB,
  error TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs("userId", action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_action ON audit_logs(timestamp, action);

-- Add comments
COMMENT ON TABLE audit_logs IS 'Audit logs for GDPR operations';
COMMENT ON COLUMN audit_logs.id IS 'Unique identifier for the audit log entry';
COMMENT ON COLUMN audit_logs."userId" IS 'User ID who performed the action';
COMMENT ON COLUMN audit_logs.action IS 'Type of GDPR operation (export, delete, consent_read, consent_update)';
COMMENT ON COLUMN audit_logs.resource IS 'Resource identifier (e.g., user:123, user:123:consent:analytics)';
COMMENT ON COLUMN audit_logs.status IS 'Operation status (success or failure)';
COMMENT ON COLUMN audit_logs."ipAddress" IS 'IP address of the requester';
COMMENT ON COLUMN audit_logs."userAgent" IS 'User agent of the requester';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional metadata about the operation';
COMMENT ON COLUMN audit_logs.error IS 'Error message if operation failed';
COMMENT ON COLUMN audit_logs.timestamp IS 'Timestamp when the operation occurred';
