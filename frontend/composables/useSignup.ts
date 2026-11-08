// ~/composables/useSignup.ts
import { useFetch, useRuntimeConfig  } from '#app'
import { useMarketingAttribution } from '~/composables/useMarketingAttribution'

export function useSignup() {
  const config      = useRuntimeConfig()
  const strapiBase  = config.public.strapiUrl || ''

  /**
   *  Register a new user with a 30-day trial
   *  Includes marketing attribution if available
   */
  async function registerUser(name: string, email: string, password: string) {
    const url     = `${strapiBase}/api/stripe/register`
    
    // Get marketing attribution if valid
    const { getValidRefCode, clearMarketingAttribution } = useMarketingAttribution()
    const refCode = getValidRefCode()
    
    const payload = { name, email, password, refCode }

    // 🔍 Log exactly what we're sending
    console.log('[registerUser] POST →', url, payload)

    const res  = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    const data = await res.json()

    // 🔍 Log the raw response
    console.log('[registerUser] RESP ←', data)

    if (!res.ok) {
      // Strapi will set data.message on errors
      throw new Error(data?.message || 'Registration failed')
    }

    // Clear attribution after successful signup
    if (refCode) {
      clearMarketingAttribution()
      console.log('[registerUser] Cleared marketing attribution after signup')
    }

    // data.user should be { id, email }
    return data.user
  }

  return { registerUser }
}
