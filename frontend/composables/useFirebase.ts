import { useMarketingAttribution } from '~/composables/useMarketingAttribution'

export const useFirebase = () => {
  const { $firebase } = useNuxtApp()
  const auth = $firebase.auth
  const provider = $firebase.provider
  const strapiAuth = useStrapiAuth()
  const router = useRouter()
  const { reportConversion } = useMetaTracking()
  
  async function loginWithGoogle({ postLoginPath = '' }: { postLoginPath?: string } = {}) {
    try {
      const { signInWithPopup, signOut } = await import('firebase/auth')
      
      // Get marketing attribution before signup
      const { getValidRefCode, clearMarketingAttribution } = useMarketingAttribution()
      const refCode = getValidRefCode()
      
      // Sign out first to force account picker to show
      await signOut(auth)
      
      // Force account selection every time
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      const result = await signInWithPopup(auth, provider)
      const user = result.user
  
      if (!user?.email) {
        alert('Google did not return an email address.')
        return
      }
  
      // The ID token is the only identity the server trusts. Email, name and
      // uid are derived server-side from this token, never sent in the body.
      const idToken = await user.getIdToken(true)
  
      // Call Nuxt server route (not Strapi) - handles Stripe customer + trial creation
      const res = await $fetch<{
        jwt?: string
        accountCreated?: boolean
        trialStarted?: boolean
      }>('/api/stripe/confirm-social', {
        method: 'POST',
        body: { refCode },
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      })
  
      if (res?.jwt) {
        if (res.accountCreated) {
          // Hashed by /api/meta/capi. Not sent to confirm-social.
          const artistEmail = user.email
          await reportConversion({
            eventName: 'CompleteRegistration',
            eventKey: 'signup_completed',
            email: artistEmail,
            customData: { content_name: 'Faneqo account', status: 'success' },
          })
          if (res.trialStarted) {
            await reportConversion({
              eventName: 'StartTrial',
              eventKey: 'trial_started',
              email: artistEmail,
              customData: { content_name: 'Faneqo Pro trial', currency: 'USD' },
            })
          }
        }
        // Clear marketing attribution after successful signup
        if (refCode) {
          clearMarketingAttribution()
          console.log('[confirm-social] Cleared marketing attribution after signup')
        }
        await strapiAuth.setToken(res.jwt)
        await strapiAuth.fetchUser()
        const { postAuthInviteRedirect } = useBandTeam()
        router.push(postAuthInviteRedirect() || postLoginPath || '/dashboard')
      } else {
        console.error('[confirm-social] Missing JWT in response')
        alert('Signup succeeded, but we couldn’t log you in. Please try again.')
      }
    } catch (err: any) {
      console.error('Google login error:', err)
      console.error('Error message:', err?.message)
      console.error('Error data:', err?.data)
      console.error('Error status:', err?.status || err?.statusCode)
      
      // Re-throw so calling code can handle loading state
      throw err
    }
  }
  

  return { loginWithGoogle }
}
