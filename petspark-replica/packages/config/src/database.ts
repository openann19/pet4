/**
 * Database configuration for PETSPARK
 */

// Common database schema constants
const UUID_TYPE = 'uuid';
const VARCHAR_TYPE = 'varchar';
const TEXT_TYPE = 'text';
const BOOLEAN_TYPE = 'boolean';
const TIMESTAMP_TYPE = 'timestamp';
const DECIMAL_TYPE = 'decimal';
const JSONB_TYPE = 'jsonb';
const UUID_DEFAULT = 'gen_random_uuid()';
const CURRENT_TIMESTAMP = 'CURRENT_TIMESTAMP';
const EMPTY_JSON = '{}';

// Helper functions for environment variable access
function getEnvString(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getEnvInt(key: string, defaultValue: string): number {
  return parseInt(process.env[key] || defaultValue, 10);
}

function getEnvBool(key: string): boolean {
  return process.env[key] === 'true';
}

export const DATABASE_CONFIG = {
  // PostgreSQL configuration
  postgresql: {
    host: getEnvString('DB_HOST', 'localhost'),
    port: getEnvInt('DB_PORT', '5432'),
    database: getEnvString('DB_NAME', 'petspark'),
    username: getEnvString('DB_USER', 'postgres'),
    password: getEnvString('DB_PASSWORD', ''),
    ssl: getEnvBool('DB_SSL'),
    sslMode: getEnvString('DB_SSL_MODE', 'require'),
    connectionTimeoutMillis: getEnvInt('DB_CONNECTION_TIMEOUT', '10000'),
    idleTimeoutMillis: getEnvInt('DB_IDLE_TIMEOUT', '30000'),
    max: getEnvInt('DB_MAX_CONNECTIONS', '20'),
    min: getEnvInt('DB_MIN_CONNECTIONS', '5'),
    acquireTimeoutMillis: getEnvInt('DB_ACQUIRE_TIMEOUT', '60000'),
    createTimeoutMillis: getEnvInt('DB_CREATE_TIMEOUT', '30000'),
    destroyTimeoutMillis: getEnvInt('DB_DESTROY_TIMEOUT', '5000'),
    reapIntervalMillis: getEnvInt('DB_REAP_INTERVAL', '1000'),
    createRetryIntervalMillis: getEnvInt('DB_CREATE_RETRY_INTERVAL', '200'),
  },
  
  // Redis configuration
  redis: {
    host: getEnvString('REDIS_HOST', 'localhost'),
    port: getEnvInt('REDIS_PORT', '6379'),
    password: getEnvString('REDIS_PASSWORD', '') || undefined,
    database: getEnvInt('REDIS_DB', '0'),
    connectTimeout: getEnvInt('REDIS_CONNECT_TIMEOUT', '10000'),
    commandTimeout: getEnvInt('REDIS_COMMAND_TIMEOUT', '5000'),
    retryDelayOnFailover: getEnvInt('REDIS_RETRY_DELAY', '100'),
    maxRetriesPerRequest: getEnvInt('REDIS_MAX_RETRIES', '3'),
    lazyConnect: true,
    keepAlive: 30000,
    family: 4,
    keyPrefix: getEnvString('REDIS_KEY_PREFIX', 'petspark:'),
  },
  
  // MongoDB configuration (for alternative storage)
  mongodb: {
    uri: getEnvString('MONGODB_URI', 'mongodb://localhost:27017/petspark'),
    options: {
      maxPoolSize: getEnvInt('MONGO_MAX_POOL_SIZE', '20'),
      minPoolSize: getEnvInt('MONGO_MIN_POOL_SIZE', '5'),
      maxIdleTimeMS: getEnvInt('MONGO_MAX_IDLE_TIME', '30000'),
      serverSelectionTimeoutMS: getEnvInt('MONGO_SERVER_SELECTION_TIMEOUT', '30000'),
      socketTimeoutMS: getEnvInt('MONGO_SOCKET_TIMEOUT', '45000'),
      connectTimeoutMS: getEnvInt('MONGO_CONNECT_TIMEOUT', '10000'),
      heartbeatFrequencyMS: getEnvInt('MONGO_HEARTBEAT_FREQUENCY', '10000'),
      retryWrites: true,
      retryReads: true,
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority', j: true },
    },
  },
  
  // Database schema configuration
  schema: {
    // Users table
    users: {
      tableName: 'users',
      columns: {
        id: { type: UUID_TYPE, primary: true, default: UUID_DEFAULT },
        email: { type: VARCHAR_TYPE, length: 255, unique: true, notNull: true },
        username: { type: VARCHAR_TYPE, length: 50, unique: true, notNull: true },
        displayName: { type: VARCHAR_TYPE, length: 100, notNull: true },
        passwordHash: { type: VARCHAR_TYPE, length: 255, notNull: true },
        avatar: { type: VARCHAR_TYPE, length: 500, nullable: true },
        bio: { type: TEXT_TYPE, nullable: true },
        verified: { type: BOOLEAN_TYPE, default: false },
        premium: { type: BOOLEAN_TYPE, default: false },
        premiumExpiresAt: { type: TIMESTAMP_TYPE, nullable: true },
        lastLoginAt: { type: TIMESTAMP_TYPE, nullable: true },
        isActive: { type: BOOLEAN_TYPE, default: true },
        isPrivate: { type: BOOLEAN_TYPE, default: false },
        locationLatitude: { type: DECIMAL_TYPE, precision: 9, scale: 6, nullable: true },
        locationLongitude: { type: DECIMAL_TYPE, precision: 9, scale: 6, nullable: true },
        locationCity: { type: VARCHAR_TYPE, length: 100, nullable: true },
        locationCountry: { type: VARCHAR_TYPE, length: 100, nullable: true },
        preferences: { type: JSONB_TYPE, default: EMPTY_JSON },
        settings: { type: JSONB_TYPE, default: EMPTY_JSON },
        createdAt: { type: TIMESTAMP_TYPE, default: CURRENT_TIMESTAMP },
        updatedAt: { type: TIMESTAMP_TYPE, default: CURRENT_TIMESTAMP },
      },
      indexes: [
        { columns: ['email'], unique: true },
        { columns: ['username'], unique: true },
        { columns: ['createdAt'] },
        { columns: ['lastLoginAt'] },
        { columns: ['locationLatitude', 'locationLongitude'] },
        { columns: ['premium'] },
        { columns: ['verified'] },
        { columns: ['isActive'] },
      ],
    },
    
    // Pets table
    pets: {
      tableName: 'pets',
      columns: {
        id: { type: 'uuid', primary: true, default: UUID_DEFAULT },
        ownerId: { type: 'uuid', references: 'users.id', notNull: true },
        name: { type: 'varchar', length: 100, notNull: true },
        type: { type: 'varchar', length: 50, notNull: true },
        breed: { type: 'varchar', length: 100, nullable: true },
        age: { type: 'integer', notNull: true },
        gender: { type: 'varchar', length: 20, notNull: true },
        weight: { type: 'decimal', precision: 5, scale: 2, nullable: true },
        description: { type: 'text', nullable: true },
        images: { type: 'jsonb', default: '[]' },
        tags: { type: 'jsonb', default: '[]' },
        verified: { type: 'boolean', default: false },
        isActive: { type: 'boolean', default: true },
        locationLatitude: { type: 'decimal', precision: 9, scale: 6, nullable: true },
        locationLongitude: { type: 'decimal', precision: 9, scale: 6, nullable: true },
        locationCity: { type: 'varchar', length: 100, nullable: true },
        locationCountry: { type: 'varchar', length: 100, nullable: true },
        viewCount: { type: 'integer', default: 0 },
        likeCount: { type: 'integer', default: 0 },
        createdAt: { type: TIMESTAMP_TYPE, default: CURRENT_TIMESTAMP },
        updatedAt: { type: TIMESTAMP_TYPE, default: CURRENT_TIMESTAMP },
      },
      indexes: [
        { columns: ['ownerId'] },
        { columns: ['type'] },
        { columns: ['age'] },
        { columns: ['gender'] },
        { columns: ['breed'] },
        { columns: ['tags'], using: 'gin' },
        { columns: ['locationLatitude', 'locationLongitude'] },
        { columns: ['verified'] },
        { columns: ['isActive'] },
        { columns: ['createdAt'] },
        { columns: ['likeCount'] },
        { columns: ['viewCount'] },
      ],
    },
    
    // Posts table
    posts: {
      tableName: 'posts',
      columns: {
        id: { type: 'uuid', primary: true, default: UUID_DEFAULT },
        authorId: { type: 'uuid', references: 'users.id', notNull: true },
        petId: { type: 'uuid', references: 'pets.id', nullable: true },
        content: { type: 'text', notNull: true },
        images: { type: 'jsonb', default: '[]' },
        tags: { type: 'jsonb', default: '[]' },
        likeCount: { type: 'integer', default: 0 },
        commentCount: { type: 'integer', default: 0 },
        shareCount: { type: 'integer', default: 0 },
        viewCount: { type: 'integer', default: 0 },
        isPublic: { type: 'boolean', default: true },
        isActive: { type: 'boolean', default: true },
        createdAt: { type: TIMESTAMP_TYPE, default: CURRENT_TIMESTAMP },
        updatedAt: { type: TIMESTAMP_TYPE, default: CURRENT_TIMESTAMP },
      },
      indexes: [
        { columns: ['authorId'] },
        { columns: ['petId'] },
        { columns: ['createdAt'] },
        { columns: ['likeCount'] },
        { columns: ['commentCount'] },
        { columns: ['viewCount'] },
        { columns: ['isPublic'] },
        { columns: ['isActive'] },
        { columns: ['tags'], using: 'gin' },
      ],
    },
    
    // Comments table
    comments: {
      tableName: 'comments',
      columns: {
        id: { type: 'uuid', primary: true, default: UUID_DEFAULT },
        postId: { type: 'uuid', references: 'posts.id', notNull: true },
        authorId: { type: 'uuid', references: 'users.id', notNull: true },
        content: { type: 'text', notNull: true },
        likeCount: { type: 'integer', default: 0 },
        isActive: { type: 'boolean', default: true },
        createdAt: { type: TIMESTAMP_TYPE, default: CURRENT_TIMESTAMP },
        updatedAt: { type: TIMESTAMP_TYPE, default: CURRENT_TIMESTAMP },
      },
      indexes: [
        { columns: ['postId'] },
        { columns: ['authorId'] },
        { columns: ['createdAt'] },
        { columns: ['isActive'] },
      ],
    },
    
    // Likes table
    likes: {
      tableName: 'likes',
      columns: {
        id: { type: 'uuid', primary: true, default: UUID_DEFAULT },
        userId: { type: 'uuid', references: 'users.id', notNull: true },
        targetType: { type: 'varchar', length: 50, notNull: true }, // 'post', 'comment', 'pet'
        targetId: { type: 'uuid', notNull: true },
        createdAt: { type: TIMESTAMP_TYPE, default: CURRENT_TIMESTAMP },
      },
      indexes: [
        { columns: ['userId'] },
        { columns: ['targetType', 'targetId'] },
        { columns: ['createdAt'] },
        { columns: ['userId', 'targetType', 'targetId'], unique: true },
      ],
    },
    
    // Chat rooms table
    chatRooms: {
      tableName: 'chat_rooms',
      columns: {
        id: { type: 'uuid', primary: true, default: UUID_DEFAULT },
        name: { type: 'varchar', length: 200, nullable: true },
        type: { type: 'varchar', length: 50, notNull: true }, // 'direct', 'group'
        isPrivate: { type: 'boolean', default: true },
        isActive: { type: 'boolean', default: true },
        lastMessageAt: { type: TIMESTAMP_TYPE, nullable: true },
        createdAt: { type: TIMESTAMP_TYPE, default: CURRENT_TIMESTAMP },
        updatedAt: { type: TIMESTAMP_TYPE, default: CURRENT_TIMESTAMP },
      },
      indexes: [
        { columns: ['type'] },
        { columns: ['isPrivate'] },
        { columns: ['isActive'] },
        { columns: ['lastMessageAt'] },
        { columns: ['createdAt'] },
      ],
    },
    
    // Chat participants table
    chatParticipants: {
      tableName: 'chat_participants',
      columns: {
        id: { type: 'uuid', primary: true, default: UUID_DEFAULT },
        roomId: { type: 'uuid', references: 'chat_rooms.id', notNull: true },
        userId: { type: 'uuid', references: 'users.id', notNull: true },
        role: { type: 'varchar', length: 50, default: 'member' }, // 'admin', 'member'
        joinedAt: { type: TIMESTAMP_TYPE, default: CURRENT_TIMESTAMP },
        lastReadAt: { type: TIMESTAMP_TYPE, nullable: true },
        isActive: { type: 'boolean', default: true },
      },
      indexes: [
        { columns: ['roomId'] },
        { columns: ['userId'] },
        { columns: ['joinedAt'] },
        { columns: ['lastReadAt'] },
        { columns: ['isActive'] },
        { columns: ['roomId', 'userId'], unique: true },
      ],
    },
    
    // Messages table
    messages: {
      tableName: 'messages',
      columns: {
        id: { type: 'uuid', primary: true, default: UUID_DEFAULT },
        roomId: { type: 'uuid', references: 'chat_rooms.id', notNull: true },
        authorId: { type: 'uuid', references: 'users.id', notNull: true },
        content: { type: 'text', notNull: true },
        type: { type: 'varchar', length: 50, default: 'text' }, // 'text', 'image', 'video', 'location'
        attachments: { type: 'jsonb', default: '[]' },
        isEdited: { type: 'boolean', default: false },
        editedAt: { type: TIMESTAMP_TYPE, nullable: true },
        isActive: { type: 'boolean', default: true },
        createdAt: { type: TIMESTAMP_TYPE, default: CURRENT_TIMESTAMP },
        updatedAt: { type: TIMESTAMP_TYPE, default: CURRENT_TIMESTAMP },
      },
      indexes: [
        { columns: ['roomId'] },
        { columns: ['authorId'] },
        { columns: ['createdAt'] },
        { columns: ['type'] },
        { columns: ['isActive'] },
      ],
    },
    
    // Notifications table
    notifications: {
      tableName: 'notifications',
      columns: {
        id: { type: 'uuid', primary: true, default: UUID_DEFAULT },
        userId: { type: 'uuid', references: 'users.id', notNull: true },
        type: { type: 'varchar', length: 50, notNull: true },
        title: { type: 'varchar', length: 200, notNull: true },
        body: { type: 'text', notNull: true },
        data: { type: 'jsonb', default: '{}' },
        isRead: { type: 'boolean', default: false },
        readAt: { type: TIMESTAMP_TYPE, nullable: true },
      isActive: { type: 'boolean', default: true },
        createdAt: { type: TIMESTAMP_TYPE, default: CURRENT_TIMESTAMP },
      },
      indexes: [
        { columns: ['userId'] },
        { columns: ['type'] },
        { columns: ['isRead'] },
        { columns: ['readAt'] },
        { columns: ['isActive'] },
        { columns: ['createdAt'] },
      ],
    },
  },
  
  // Migration configuration
  migrations: {
    directory: './migrations',
    tableName: 'migrations',
    schema: 'public',
    singleTransaction: false,
    runMigrations: true,
  },
  
  // Seeding configuration
  seeding: {
    directory: './seeds',
    runSeeds: process.env.NODE_ENV === 'development',
    seedCount: {
      users: parseInt(process.env.SEED_USER_COUNT || '100', 10),
      pets: parseInt(process.env.SEED_PET_COUNT || '300', 10),
      posts: parseInt(process.env.SEED_POST_COUNT || '1000', 10),
      comments: parseInt(process.env.SEED_COMMENT_COUNT || '3000', 10),
    },
  },
  
  // Backup configuration
  backup: {
    enabled: process.env.ENABLE_BACKUPS === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    retention: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    compression: true,
    encryption: process.env.BACKUP_ENCRYPTION === 'true',
    destination: process.env.BACKUP_DESTINATION || './backups',
    s3: {
      bucket: process.env.BACKUP_S3_BUCKET,
      region: process.env.BACKUP_S3_REGION || 'us-east-1',
      accessKeyId: process.env.BACKUP_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.BACKUP_S3_SECRET_ACCESS_KEY,
    },
  },
  
  // Monitoring configuration
  monitoring: {
    enabled: process.env.DB_MONITORING === 'true',
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000', 10),
    logQueries: process.env.DB_LOG_QUERIES === 'true',
    logConnections: process.env.DB_LOG_CONNECTIONS === 'true',
    healthCheck: {
      interval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000', 10),
      timeout: parseInt(process.env.DB_HEALTH_CHECK_TIMEOUT || '5000', 10),
    },
  },
} as const;

// Helper functions
export function getPostgresConfig() {
  return DATABASE_CONFIG.postgresql;
}

export function getRedisConfig() {
  return DATABASE_CONFIG.redis;
}

export function getMongoConfig() {
  return DATABASE_CONFIG.mongodb;
}

export function getSchemaConfig() {
  return DATABASE_CONFIG.schema;
}

export function getMigrationConfig() {
  return DATABASE_CONFIG.migrations;
}

export function getSeedingConfig() {
  return DATABASE_CONFIG.seeding;
}

export function getBackupConfig() {
  return DATABASE_CONFIG.backup;
}

export function getMonitoringConfig() {
  return DATABASE_CONFIG.monitoring;
}

export function getTableName(table: keyof typeof DATABASE_CONFIG.schema): string {
  return DATABASE_CONFIG.schema[table].tableName;
}

export function getTableColumns(table: keyof typeof DATABASE_CONFIG.schema) {
  return DATABASE_CONFIG.schema[table].columns;
}

export function getTableIndexes(table: keyof typeof DATABASE_CONFIG.schema) {
  return DATABASE_CONFIG.schema[table].indexes;
}
