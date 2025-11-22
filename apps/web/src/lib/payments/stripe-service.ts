import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';
import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { ENV } from '@/config/env';
import { createLogger } from '@/lib/logger';

// Payment types
export interface PaymentProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval?: 'month' | 'year';
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  product: PaymentProduct;
}

const logger = createLogger('StripeService');

class StripeServiceImpl {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;

  async init(): Promise<Stripe> {
    if (this.stripe) return this.stripe;

    const publicKey = ENV.VITE_STRIPE_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error('Stripe public key is not configured');
    }
    this.stripe = await loadStripe(publicKey);
    if (!this.stripe) {
      throw new Error('Failed to load Stripe');
    }

    logger.info('Stripe initialized successfully');
    return this.stripe;
  }

  async createPaymentIntent(productId: string): Promise<{
    clientSecret: string;
    intent: PaymentIntent;
  }> {
    try {
      const response = await APIClient.post<{
        clientSecret: string;
        intent: PaymentIntent;
      }>(ENDPOINTS.PAYMENTS.CREATE_INTENT, { productId });

      return response.data;
    } catch (error) {
      logger.error('Failed to create payment intent', error, { productId });
      throw error;
    }
  }

  async confirmPayment(
    clientSecret: string,
    paymentMethodId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const stripe = await this.init();

    try {
      const result = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: window.location.origin + '/payment/success',
          ...(paymentMethodId ? { payment_method: paymentMethodId } : {}),
        },
      });

      if (result.error) {
        logger.error('Payment confirmation failed', result.error);
        return { success: false, error: result.error.message ?? 'Payment confirmation failed' };
      }

      // On redirect, this won't be reached
      // For non-redirect flows, notify backend
      logger.info('Payment confirmed successfully');
      return { success: true };
    } catch (error) {
      logger.error('Payment confirmation error', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  async createElements(clientSecret: string): Promise<StripeElements> {
    const stripe = await this.init();

    this.elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#0570de',
          colorBackground: '#ffffff',
          colorText: '#30313d',
          colorDanger: '#df1b41',
          fontFamily: 'Ideal Sans, system-ui, sans-serif',
          spacingUnit: '2px',
          borderRadius: '4px',
        },
      },
    });

    return this.elements;
  }

  async getProducts(): Promise<PaymentProduct[]> {
    const response = await APIClient.get<PaymentProduct[]>(ENDPOINTS.PAYMENTS.PRODUCTS);
    return response.data;
  }

  async getSubscriptions(): Promise<Subscription[]> {
    const response = await APIClient.get<Subscription[]>(ENDPOINTS.PAYMENTS.SUBSCRIPTIONS);
    return response.data;
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await APIClient.delete(ENDPOINTS.PAYMENTS.CANCEL_SUBSCRIPTION(subscriptionId));
    logger.info('Subscription cancelled', { subscriptionId });
  }

  // In-App Purchase validation (for mobile)
  async validateAppleReceipt(receiptData: string): Promise<{
    valid: boolean;
    products: string[];
  }> {
    const response = await APIClient.post<{
      valid: boolean;
      products: string[];
    }>('/payments/apple/validate', { receiptData });

    return response.data;
  }

  async validateGooglePurchase(
    packageName: string,
    productId: string,
    purchaseToken: string
  ): Promise<{ valid: boolean }> {
    const response = await APIClient.post<{ valid: boolean }>('/payments/google/validate', {
      packageName,
      productId,
      purchaseToken,
    });

    return response.data;
  }
}

export const stripeService = new StripeServiceImpl();
