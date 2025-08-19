import type Stripe from 'stripe';

export interface CheckoutSessionParams {
  userId: string;
  userEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface PortalSessionParams {
  customerId: string;
  returnUrl: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | null;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: Date;
}

export interface CustomerData {
  stripeCustomerId: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionPriceId?: string;
  trialEndsAt?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}
