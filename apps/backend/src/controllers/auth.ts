import type { Request, Response, RequestHandler } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import asyncHandler from 'express-async-handler'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.js'

// Define AuthenticatedRequest here until a better place is found
interface AuthenticatedRequest extends Request {
  userId?: string
  user?: {
    id: string
    email: string
  }
}

const prisma = new PrismaClient()

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
})

/**
 * POST /auth/login
 * Login user and return access + refresh tokens
 */
export const login: RequestHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const body = loginSchema.parse(req.body)

    // Bypass authentication for a hardcoded test user in development
    if (process.env.NODE_ENV !== 'production' && body.email === 'test@petspark.com') {
      const testUser = {
        id: 'cltestuser12345',
        email: 'test@petspark.com',
        displayName: 'Test User',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const accessToken = generateAccessToken({ userId: testUser.id, email: testUser.email })
      const refreshToken = generateRefreshToken({ userId: testUser.id, email: testUser.email })

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false, // Allow non-https for local dev
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
      })

      res.json({
        data: {
          user: testUser,
          accessToken,
          refreshToken,
        },
      })
      return
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      include: { profile: true },
    })

    if (!user) {
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
        code: 'AUTH_001',
      })
      return
    }

    // Verify password
    const isValid = await verifyPassword(user.passwordHash, body.password)
    if (!isValid) {
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
        code: 'AUTH_001',
      })
      return
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email })
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email })

    // Store refresh token in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    })

    // Set refresh token as httpOnly cookie (for web clients)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    })

    // Return user and tokens
    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.profile?.firstName || user.email.split('@')[0],
          emailVerified: user.emailVerified,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        accessToken,
        refreshToken, // Also return in body for mobile clients
      },
    })
  }
)

/**
 * POST /auth/register
 * Register new user
 */
export const register: RequestHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const body = registerSchema.parse(req.body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (existingUser) {
      res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists',
        code: 'AUTH_002',
      })
      return
    }

    // Hash password
    const passwordHash = await hashPassword(body.password)

    // Create user and profile
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        profile: {
          create: {
            firstName: body.displayName,
          },
        },
      },
      include: { profile: true },
    })

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email })
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email })

    // Store refresh token
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    })

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    })

    res.status(201).json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.profile?.firstName || body.displayName,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        accessToken,
        refreshToken,
      },
    })
  }
)

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
export const refresh: RequestHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!refreshToken) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token required',
        code: 'AUTH_003',
      })
      return
    }

    // Verify token
    let payload
    try {
      payload = verifyToken(refreshToken)
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type')
      }
    } catch (error) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid refresh token',
        code: 'AUTH_004',
      })
      return
    }

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Refresh token expired or invalid',
        code: 'AUTH_005',
      })
      return
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
    })
    const newRefreshToken = generateRefreshToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
    })

    // Delete old refresh token and create new one (token rotation)
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: storedToken.id } }),
      prisma.refreshToken.create({
        data: {
          userId: storedToken.userId,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ])

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    })

    res.json({
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    })
  }
)

/**
 * POST /auth/logout
 * Logout user and invalidate refresh token
 */
export const logout: RequestHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (refreshToken) {
      // Delete refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      })
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })

    res.json({
      data: {
        success: true,
      },
    })
  }
)

/**
 * GET /auth/me
 * Get current authenticated user
 */
export const getMe: RequestHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_006',
      })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { profile: true },
    })

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
        code: 'AUTH_007',
      })
      return
    }

    res.json({
      data: {
        id: user.id,
        email: user.email,
        displayName: user.profile?.firstName || user.email.split('@')[0],
        emailVerified: user.emailVerified,
        avatar: user.profile?.avatar || null,
        bio: user.profile?.bio || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    })
  }
)
