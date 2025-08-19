// lib/services/billing-service.ts
export async function getBillingInfo(userId: string) {
  // TODO: 実装
  return {
    plan: 'free',
    nextBillingDate: null,
  }
}

export async function cancelSubscription(userId: string) {
  // TODO: 実装
  console.log('Canceling subscription for:', userId)
}