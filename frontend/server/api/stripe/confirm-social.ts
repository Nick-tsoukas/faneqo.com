import { createError, defineEventHandler, getRequestHeader, readBody } from 'h3'
import { randomBytes } from 'node:crypto'
import { useRuntimeConfig } from '#imports'
import { createStripeCustomerAndTrial } from '~/server/utils/stripe-trial'
import { verifyFirebaseIdToken } from '~/server/utils/firebaseIdTokenVerify'
import { resolveUserAdminSecret } from '~/utils/auth/adminSecrets'
import { runSocialLogin } from '~/utils/auth/socialLogin'

/**
 * Google / social artist login.
 *
 * Identity is established solely by verifying the caller's Firebase ID token.
 * Request body email/name/uid are ignored, and this route never reads, sets or
 * resets an existing user's password. Only `refCode` attribution is read from
 * the body. Failures are logged as reason codes only — no tokens, bodies,
 * emails or credentials.
 */

type StrapiUser = {
  id: number
  username?: string
  email: string
  customerId?: string
  subscriptionId?: string
  subscriptionStatus?: string
  plan?: string
  trialEndsAt?: string | null
  confirmed?: boolean
}

/** High-entropy password so the account has a credential nobody can predict. */
function generateStrapiPassword() {
  return `Fq${randomBytes(48).toString('base64url')}9!`
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl
  const firebaseProjectId = config.public.firebaseProjectId as string | undefined

  // /api/user-admin/* accepts only USER_ADMIN_SECRET; there is no content-API token fallback.
  const { secret: userAdminSecret, reason: secretProblem } = resolveUserAdminSecret({
    userAdminSecret: config.userAdminSecret as string | undefined,
  })

  if (!userAdminSecret) {
    console.error(`[confirm-social] USER_ADMIN_SECRET ${secretProblem === 'too_short' ? 'shorter than 32 characters' : 'not configured'}`)
    throw createError({ statusCode: 500, statusMessage: 'Server configuration error' })
  }
  if (!firebaseProjectId) {
    console.error('[confirm-social] FIREBASE_PROJECT_ID not configured')
    throw createError({ statusCode: 500, statusMessage: 'Server configuration error' })
  }

  const adminHeaders = { Authorization: `Bearer ${userAdminSecret}` }

  let body: Record<string, any> = {}
  try {
    body = (await readBody(event)) || {}
  } catch {
    body = {}
  }

  const result = await runSocialLogin({
    authorizationHeader: getRequestHeader(event, 'authorization') || '',
    body,
    deps: {
      log: console,
      generatePassword: generateStrapiPassword,

      verifyIdToken: (token: string) => verifyFirebaseIdToken(token, firebaseProjectId),

      findUserByEmail: (email: string) =>
        $fetch<StrapiUser[]>(
          `${strapiUrl}/api/user-admin/by-email/${encodeURIComponent(email)}`,
          { headers: adminHeaders }
        ),

      issueJwt: async ({ email }: { email: string; userId: number }) => {
        const res = await $fetch<{ jwt?: string }>(`${strapiUrl}/api/user-admin/issue-jwt`, {
          method: 'POST',
          headers: adminHeaders,
          body: { email },
        })
        return res?.jwt || ''
      },

      registerUser: async (registerBody: Record<string, any>) => {
        const res = await $fetch<{ data: StrapiUser }>(`${strapiUrl}/api/user-admin/register`, {
          method: 'POST',
          headers: adminHeaders,
          body: registerBody,
        })
        return res?.data
      },

      updateUser: (userId: number, data: Record<string, any>) =>
        $fetch(`${strapiUrl}/api/user-admin/${userId}`, {
          method: 'PUT',
          headers: adminHeaders,
          body: data,
        }),

      findMarketerByCode: async (code: string) => {
        const res = await $fetch<{ data: any }>(
          `${strapiUrl}/api/marketer/by-code/${encodeURIComponent(code)}`
        )
        return res?.data?.id || null
      },

      createStripeCustomerAndTrial,
    },
  })

  if (!result.ok) {
    console.warn('[confirm-social] Rejected:', result.error, result.reason || '')
    throw createError({
      statusCode: result.statusCode,
      statusMessage:
        result.statusCode === 401
          ? 'Invalid or missing sign-in token.'
          : result.error === 'billing_setup_failed'
            ? 'Billing setup failed. Please try again.'
            : 'Sign-in failed. Please try again.',
      data: {
        error: result.error,
        ...(result.retryable ? { retryable: true } : {}),
      },
    })
  }

  return {
    jwt: result.jwt,
    billingReady: result.billingReady,
    ...(result.billingExempt ? { billingExempt: true } : {}),
    ...(result.accountCreated
      ? { accountCreated: true, trialStarted: Boolean(result.trialStarted) }
      : {}),
    user: result.user,
  }
})
