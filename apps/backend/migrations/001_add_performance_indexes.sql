-- Performance Optimization Indexes
-- Migration: Add indexes for optimized JOIN queries
-- Purpose: Improve performance of getUserPosts and getUserChats queries

-- Index for posts table (authorId lookups)
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts("authorId");

-- Index for post reactions (postId lookups)
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions("postId");

-- Index for post comments (postId lookups)
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments("postId");

-- Index for comment reactions (commentId lookups)
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions("commentId");

-- Index for messages (chatId lookups)
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages("chatId");

-- GIN index for chats participants array (for ANY() queries)
CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats USING GIN(participants);

-- Index for users table (id lookups - should exist but ensuring)
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-- Index for pets table (ownerId lookups)
CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON pets("ownerId");

-- Index for matches table (ownerId lookups)
CREATE INDEX IF NOT EXISTS idx_matches_owner_id ON matches("ownerId");

-- Composite index for posts with author and creation time (common query pattern)
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts("authorId", "createdAt" DESC);

-- Composite index for chats with participants and last message time
CREATE INDEX IF NOT EXISTS idx_chats_participants_last_message ON chats USING GIN(participants) INCLUDE ("lastMessageAt");

-- Index for sessions table (userId lookups)
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions("userId");

-- Index for user preferences (userId lookups)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences("userId");

-- Index for payments (userId lookups)
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments("userId");

-- Index for verifications (userId lookups)
CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON verifications("userId");

-- Index for consents (userId lookups)
CREATE INDEX IF NOT EXISTS idx_consents_user_id ON consents("userId");

-- Add comments for documentation
COMMENT ON INDEX idx_posts_author_id IS 'Optimize posts lookup by author for getUserPosts';
COMMENT ON INDEX idx_post_reactions_post_id IS 'Optimize reactions lookup for post aggregation';
COMMENT ON INDEX idx_post_comments_post_id IS 'Optimize comments lookup for post aggregation';
COMMENT ON INDEX idx_comment_reactions_comment_id IS 'Optimize comment reactions lookup';
COMMENT ON INDEX idx_messages_chat_id IS 'Optimize messages lookup for getUserChats';
COMMENT ON INDEX idx_chats_participants IS 'Optimize chat lookup by participants array';
COMMENT ON INDEX idx_posts_author_created IS 'Optimize ordered posts by author';
