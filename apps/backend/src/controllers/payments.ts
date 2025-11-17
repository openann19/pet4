import { Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import {
  createPaymentIntent,
  createSubscription as createStripeSubscription,
  cancelSubscription as cancelStripeSubscription,
  getOrCreateCustomer,
  listProducts,
} from '../services/stripe-service.js';

const prisma = new PrismaClient();

// Validation schemas
const createIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('usd'),
  productId: z.string().optional(),
});

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  paymentMethodId: z.string().optional(),
});

const createSubscriptionSchema = z.object({
  priceId: z.string(),
  plan: z.string(),
});

/**
 * GET /payments/products
 * Get available products
 */
export const getProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const products = await listProducts();

  res.json({
    data: products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.default_price
        ? typeof product.default_price === 'object' && 'unit_amount' in product.default_price
          ? (product.default_price.unit_amount || 0) / 100
          : 0
        : 0,
      currency: product.default_price
        ? typeof product.default_price === 'object' && 'currency' in product.default_price
          ? product.default_price.currency || 'usd'
          : 'usd'
        : 'usd',
      interval: product.default_price
        ? typeof product.default_price === 'object' && 'recurring' in product.default_price && product.default_price.recurring
          ? product.default_price.recurring.interval || null
          : null
        : null,
    })),
  });
});

/**
 * POST /payments/create-intent
 * Create payment intent
 */
export const createIntent = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = createIntentSchema.parse(req.body);

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
  });

  if (!user) {
    res.status(404).json({
      error: 'Not Found',
      message: 'User not found',
      code: 'USER_001',
    });
    return;
  }

  // Get or create Stripe customer
  const customer = await getOrCreateCustomer(user.id, user.email);

  // Create payment intent
  const intent = await createPaymentIntent(body.amount, body.currency, {
    userId: user.id,
    productId: body.productId || '',
  });

  res.json({
    data: {
      id: intent.id,
      amount: intent.amount / 100,
      currency: intent.currency,
      status: intent.status,
      clientSecret: intent.client_secret,
    },
  });
});

/**
 * POST /payments/confirm
 * Confirm payment
 */
export const confirmPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = confirmPaymentSchema.parse(req.body);

  // In production, you would retrieve and confirm the payment intent here
  // For now, we'll just return success
  res.json({
    data: {
      success: true,
      paymentIntentId: body.paymentIntentId,
    },
  });
});

/**
 * GET /payments/subscriptions
 * Get user subscriptions
 */
export const getSubscriptions = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    data: subscriptions.map((sub) => ({
      id: sub.id,
      userId: sub.userId,
      stripeId: sub.stripeId || null,
      status: sub.status,
      plan: sub.plan,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || null,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
    })),
  });
});

/**
 * POST /payments/subscription
 * Create subscription
 */
export const createSubscription = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const body = createSubscriptionSchema.parse(req.body);

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
  });

  if (!user) {
    res.status(404).json({
      error: 'Not Found',
      message: 'User not found',
      code: 'USER_001',
    });
    return;
  }

  // Get or create Stripe customer
  const customer = await getOrCreateCustomer(user.id, user.email);

  // Create subscription in Stripe
  const stripeSubscription = await createStripeSubscription(customer.id, body.priceId, {
    userId: user.id,
    plan: body.plan,
  });

  // Create subscription record in database
  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      stripeId: stripeSubscription.id,
      status: stripeSubscription.status,
      plan: body.plan,
      currentPeriodEnd: stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : null,
    },
  });

  res.status(201).json({
    data: {
      id: subscription.id,
      userId: subscription.userId,
      stripeId: subscription.stripeId,
      status: subscription.status,
      plan: subscription.plan,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    },
  });
});

/**
 * DELETE /payments/subscriptions/:id
 * Cancel subscription
 */
export const cancelSubscription = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  const { id } = req.params;

  const subscription = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!subscription) {
    res.status(404).json({
      error: 'Not Found',
      message: 'Subscription not found',
      code: 'PAY_001',
    });
    return;
  }

  if (subscription.userId !== req.userId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You can only cancel your own subscriptions',
      code: 'PAY_002',
    });
    return;
  }

  // Cancel in Stripe if stripeId exists
  if (subscription.stripeId) {
    await cancelStripeSubscription(subscription.stripeId);
  }

  // Update in database
  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      status: 'canceled',
    },
  });

  res.json({
    data: {
      id: updated.id,
      status: updated.status,
      success: true,
    },
  });
});

/**
 * GET /payments/entitlements
 * Get user entitlements
 */
export const getEntitlements = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  // Get active subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: req.userId,
      status: 'active',
    },
  });

  res.json({
    data: {
      hasActiveSubscription: !!subscription,
      plan: subscription?.plan || 'free',
      features: {
        unlimitedMatches: subscription?.plan === 'premium' || subscription?.plan === 'pro',
        advancedFilters: subscription?.plan === 'premium' || subscription?.plan === 'pro',
        prioritySupport: subscription?.plan === 'pro',
        adFree: subscription?.plan === 'premium' || subscription?.plan === 'pro',
      },
    },
  });
});

/**
 * PUT /payments/entitlements
 * Update entitlements (admin only - for manual adjustments)
 */
export const updateEntitlements = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_006',
    });
    return;
  }

  // TODO: Check if user is admin
  // For now, return error
  res.status(403).json({
    error: 'Forbidden',
    message: 'Only admins can update entitlements',
    code: 'PAY_003',
  });
});

