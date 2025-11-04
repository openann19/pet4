import type { ProductCatalog } from './payments-types'

export const PRODUCT_CATALOG: ProductCatalog = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  plans: [
    {
      id: 'plan_free',
      tier: 'free',
      name: 'Free',
      description: 'Start matching with basic features',
      priceMonthly: 0,
      priceYearly: 0,
      currency: 'USD',
      entitlements: [],
    },
    {
      id: 'plan_premium',
      tier: 'premium',
      name: 'Premium',
      description: 'Unlock advanced matching features',
      priceMonthly: 9.99,
      priceYearly: 99.99,
      currency: 'USD',
      entitlements: [
        'unlimited_swipes',
        'who_liked_you',
        'video_calls',
        'advanced_filters',
        'read_receipts',
        'rewind',
        'boost_5x',
      ],
      trialDays: 7,
      popular: true,
    },
    {
      id: 'plan_elite',
      tier: 'elite',
      name: 'Elite',
      description: 'Premium features plus priority support',
      priceMonthly: 19.99,
      priceYearly: 199.99,
      currency: 'USD',
      entitlements: [
        'unlimited_swipes',
        'who_liked_you',
        'video_calls',
        'advanced_filters',
        'priority_support',
        'read_receipts',
        'rewind',
        'boost_10x',
        'super_like_10x',
      ],
      trialDays: 14,
    },
  ],
  consumables: [
    {
      id: 'consumable_boost_5',
      key: 'boosts',
      name: '5 Boosts',
      description: 'Boost your profile for 5 sessions',
      quantity: 5,
      price: 4.99,
      currency: 'USD',
    },
    {
      id: 'consumable_boost_10',
      key: 'boosts',
      name: '10 Boosts',
      description: 'Boost your profile for 10 sessions',
      quantity: 10,
      price: 8.99,
      currency: 'USD',
    },
    {
      id: 'consumable_superlike_5',
      key: 'super_likes',
      name: '5 Super Likes',
      description: 'Stand out with 5 Super Likes',
      quantity: 5,
      price: 3.99,
      currency: 'USD',
    },
    {
      id: 'consumable_superlike_10',
      key: 'super_likes',
      name: '10 Super Likes',
      description: 'Stand out with 10 Super Likes',
      quantity: 10,
      price: 6.99,
      currency: 'USD',
    },
  ],
}

export function getPlanById(planId: string) {
  return PRODUCT_CATALOG.plans.find(p => p.id === planId)
}

export function getConsumableById(consumableId: string) {
  return PRODUCT_CATALOG.consumables.find(c => c.id === consumableId)
}

export function getPlanByTier(tier: string) {
  return PRODUCT_CATALOG.plans.find(p => p.tier === tier)
}
