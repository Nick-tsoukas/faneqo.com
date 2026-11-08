import Stripe from 'stripe'
import { useRuntimeConfig } from '#imports'
import {
  mapStripeStatusForUserRow,
  pickBestReusableSubscription,
} from '~/utils/billing/stripeSubscriptionSelect'

type MinimalUser = {
  id: number | string
  email: string
  username: string
}

export async function createStripeCustomerAndTrial(user: MinimalUser) {
  const config = useRuntimeConfig()

  if (!config.stripeSecretKey) {
    console.error('[stripe-trial] STRIPE_SECRET_KEY not configured')
    throw new Error('Stripe configuration error - missing secret key')
  }
  if (!config.stripeDefaultPriceId) {
    console.error('[stripe-trial] STRIPE_DEFAULT_PRICE_ID not configured')
    throw new Error('Stripe configuration error - missing default price ID')
  }

  console.log('[stripe-trial] Creating Stripe customer for user:', user.id, user.email)

  const stripe = new Stripe(config.stripeSecretKey)

  try {
    const existingCustomers = await stripe.customers.list({ email: user.email, limit: 1 })
    let customer
    let subscription
    let createdCustomer = false
    let createdSubscription = false

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
      console.log('[stripe-trial] Found existing Stripe customer:', customer.id)

      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 20,
      })

      subscription = pickBestReusableSubscription(existingSubscriptions.data)
      if (subscription) {
        console.log('[stripe-trial] Found existing subscription:', subscription.id, 'status:', subscription.status)
      }
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          appUserId: String(user.id),
        },
      })
      createdCustomer = true
      console.log('[stripe-trial] Customer created:', customer.id)
    }

    if (!subscription) {
      subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price: config.stripeDefaultPriceId,
          },
        ],
        trial_period_days: 30,
      })
      createdSubscription = true
      console.log('[stripe-trial] Subscription created:', subscription.id)
    }

    return {
      id: customer.id,
      subscriptionId: subscription.id,
      status: subscription.status,
      subscriptionStatus: mapStripeStatusForUserRow(subscription.status),
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      createdCustomer,
      createdSubscription,
    }
  } catch (error: any) {
    console.error('[stripe-trial] Stripe API error:', error?.message)
    console.error('[stripe-trial] Stripe error type:', error?.type)
    console.error('[stripe-trial] Stripe error code:', error?.code)
    throw new Error(`Stripe error: ${error?.message || 'Unknown error'}`)
  }
}
