/**
 * Account billing copy from the user's actual Stripe Price.
 * Never invent $7 / $12. If price truth is missing, return null.
 */

const INTERVAL_LABELS = {
  day: 'day',
  week: 'week',
  month: 'month',
  year: 'year',
}

export function formatStripeMoney(unitAmount, currency, locale = 'en-US') {
  if (unitAmount == null || !Number.isFinite(Number(unitAmount))) return null
  if (!currency) return null
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: String(currency).toUpperCase(),
    }).format(Number(unitAmount) / 100)
  } catch {
    return null
  }
}

export function formatBillingInterval(interval, intervalCount = 1) {
  if (!interval) return null
  const count = Number(intervalCount) > 0 ? Number(intervalCount) : 1
  const base = INTERVAL_LABELS[interval] || String(interval)
  if (count === 1) return base
  return `${count} ${base}s`
}

export function formatPricePerInterval(price, locale = 'en-US') {
  if (!price) return null
  const money = formatStripeMoney(price.unitAmount, price.currency, locale)
  const interval = formatBillingInterval(price.interval, price.intervalCount)
  if (!money || !interval) return null
  return `${money}/${interval}`
}

export function formatAccountRenewalCopy(billing, locale = 'en-US') {
  if (billing?.billingExempt || billing?.entitlement === 'lifetime_pro') return null
  const subscription = billing?.subscription
  const priced = formatPricePerInterval(subscription?.price, locale)
  if (!priced) return null
  const status = billing?.status || subscription?.status
  if (status === 'trialing') return `After trial: ${priced}`
  return `Renews at ${priced}`
}
