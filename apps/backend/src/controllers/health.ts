import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Health check endpoint (liveness probe)
 * Returns 200 if the server is running
 */
export async function healthCheck(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

/**
 * Readiness check endpoint
 * Returns 200 if the server is ready to accept traffic
 * Checks database connectivity
 */
export async function readinessCheck(req: Request, res: Response): Promise<void> {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'disconnected',
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Version information endpoint
 * Returns API version and build information
 */
export async function versionInfo(req: Request, res: Response): Promise<void> {
  res.json({
    version: process.env.npm_package_version || '0.1.0',
    apiVersion: process.env.API_VERSION || 'v1',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
}

