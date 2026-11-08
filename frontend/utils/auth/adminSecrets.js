/**
 * Secret selection for trusted server-to-server calls into Strapi.
 *
 * Two different credentials exist and they are not interchangeable:
 *
 * - STRAPI_API_TOKEN authenticates Strapi's standard content API (/api/users,
 *   /api/qrs, ...).
 * - USER_ADMIN_SECRET authenticates the custom /api/user-admin/* routes
 *   (JWT issuance for verified social logins, billing-field updates).
 *
 * There is no fallback from one to the other. The Strapi controller accepts
 * only USER_ADMIN_SECRET of at least MIN_USER_ADMIN_SECRET_LENGTH characters,
 * so this side requires the same: a missing or short secret resolves to '' and
 * callers fail closed. Neither value may ever be exposed through public
 * runtime config.
 */

export const MIN_USER_ADMIN_SECRET_LENGTH = 32

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * @returns {{ secret: string, source: 'USER_ADMIN_SECRET'|null, reason?: 'missing'|'too_short' }}
 */
export function resolveUserAdminSecret({ userAdminSecret } = {}) {
  const secret = clean(userAdminSecret)
  if (!secret) return { secret: '', source: null, reason: 'missing' }
  if (secret.length < MIN_USER_ADMIN_SECRET_LENGTH) return { secret: '', source: null, reason: 'too_short' }
  return { secret, source: 'USER_ADMIN_SECRET' }
}
