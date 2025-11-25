-- Performance Migration Validation Script
-- Run this script to validate that the performance indexes are working correctly
-- Use with: psql -d your_database -f validate-performance-migration.sql

-- Test getUserPosts query with EXPLAIN ANALYZE
\echo '=== Testing getUserPosts Query Performance ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
  p.id,
  p."authorId" as "authorId",
  p.content,
  p."mediaUrls" as "mediaUrls",
  p.visibility,
  p.status,
  p."createdAt" as "createdAt",
  p."updatedAt" as "updatedAt",
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'userId', pr."userId",
        'type', pr.type,
        'createdAt', pr."createdAt"
      ) ORDER BY pr."createdAt" DESC
    ) FILTER (WHERE pr."userId" IS NOT NULL),
    '[]'
  ) as reactions,
  COALESCE(
    (
      SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', c.id,
          'userId', c."userId",
          'content', c.content,
          'createdAt', c."createdAt",
          'updatedAt', c."updatedAt",
          'reactions', COALESCE(
            (
              SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'userId', cr."userId",
                  'type', cr.type,
                  'createdAt', cr."createdAt"
                ) ORDER BY cr."createdAt" DESC
              ) FILTER (WHERE cr."userId" IS NOT NULL)
            ),
            '[]'
          )
        ) ORDER BY c."createdAt" ASC
      )
      FROM post_comments c
      LEFT JOIN comment_reactions cr ON c.id = cr."commentId"
      WHERE c."postId" = p.id
    ),
    '[]'
  ) as comments
FROM posts p
LEFT JOIN post_reactions pr ON p.id = pr."postId"
WHERE p."authorId" = 'test-user-id'
GROUP BY p.id, p."authorId", p.content, p."mediaUrls", p.visibility, p.status, p."createdAt", p."updatedAt"
ORDER BY p."createdAt" DESC
LIMIT 10;

-- Test getUserChats query with EXPLAIN ANALYZE
\echo '=== Testing getUserChats Query Performance ==='
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
  c.id,
  c."matchId" as "matchId",
  c.participants,
  c."lastMessageAt" as "lastMessageAt",
  c."createdAt" as "createdAt",
  c."updatedAt" as "updatedAt",
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', m.id,
        'senderId', m."senderId",
        'content', m.content,
        'type', m.type,
        'mediaUrl', m."mediaUrl",
        'readAt', m."readAt",
        'createdAt', m."createdAt",
        'updatedAt', m."updatedAt"
      ) ORDER BY m."createdAt" ASC
    ) FILTER (WHERE m.id IS NOT NULL),
    '[]'
  ) as messages
FROM chats c
LEFT JOIN messages m ON c.id = m."chatId"
WHERE $1 = ANY(c.participants)
GROUP BY c.id, c."matchId", c.participants, c."lastMessageAt", c."createdAt", c."updatedAt"
ORDER BY c."lastMessageAt" DESC NULLS LAST, c."createdAt" DESC
LIMIT 10;

-- Verify indexes exist and are being used
\echo '=== Verifying Index Usage ==='
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- Check index sizes
\echo '=== Index Sizes ==='
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as size,
  pg_relation_size(indexname::regclass) as size_bytes
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY size_bytes DESC;

-- Table statistics
\echo '=== Table Statistics ==='
SELECT
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename IN ('posts', 'chats', 'messages', 'post_reactions', 'post_comments', 'comment_reactions')
ORDER BY live_tuples DESC;

\echo '=== Migration Validation Complete ==='
\echo 'Review the output above to ensure:'
\echo '1. Queries are using index scans (not sequential scans)'
\echo '2. Execution times are reasonable (< 100ms for typical queries)'
\echo '3. Index sizes are appropriate for the data volume'
\echo '4. All expected indexes are present and being used'
