-- Performance Optimization Indexes - Rollback Script
-- Migration: Rollback indexes for optimized JOIN queries
-- Purpose: Safely rollback performance indexes if needed

-- Rollback indexes for posts table (authorId lookups)
DROP INDEX IF EXISTS idx_posts_author_id;

-- Rollback indexes for post reactions (postId lookups)
DROP INDEX IF EXISTS idx_post_reactions_post_id;

-- Rollback indexes for post comments (postId lookups)
DROP INDEX IF EXISTS idx_post_comments_post_id;

-- Rollback indexes for comment reactions (commentId lookups)
DROP INDEX IF EXISTS idx_comment_reactions_comment_id;

-- Rollback indexes for messages (chatId lookups)
DROP INDEX IF EXISTS idx_messages_chat_id;

-- Rollback GIN index for chats participants array (for ANY() queries)
DROP INDEX IF EXISTS idx_chats_participants;

-- Rollback composite index for posts with author and creation time
DROP INDEX IF EXISTS idx_posts_author_created;

-- Rollback composite index for chats with participants and last message time
DROP INDEX IF EXISTS idx_chats_participants_last_message;

-- Rollback indexes for other tables (optional indexes)
DROP INDEX IF EXISTS idx_pets_owner_id;
DROP INDEX IF EXISTS idx_matches_owner_id;
DROP INDEX IF EXISTS idx_sessions_user_id;
DROP INDEX IF EXISTS idx_user_preferences_user_id;
DROP INDEX IF EXISTS idx_payments_user_id;
DROP INDEX IF EXISTS idx_verifications_user_id;
DROP INDEX IF EXISTS idx_consents_user_id;

-- Note: Primary key indexes (idx_users_id) are not dropped as they're essential

-- Comments for documentation
COMMENT ON SCRIPT IS 'Rollback script for performance indexes added in migration 001_add_performance_indexes.sql';
-- Usage: Run this script to rollback all performance indexes if issues arise
