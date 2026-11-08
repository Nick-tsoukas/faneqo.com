/**
 * Team Access — owner invite lifecycle + my-access overview.
 * Product permissions for managers/viewers are enforced on the Strapi API
 * via resolveBandAccess; this composable talks to team + band-access endpoints.
 */

export const PENDING_INVITE_TOKEN_KEY = 'faneqo_pending_invite_token';
export const PENDING_INVITE_ACTIVE_KEY = 'faneqo_pending_invite_active';
export const PENDING_INVITE_STARTED_AT_KEY = 'faneqo_pending_invite_started_at';

/** How long an invite auth round-trip may redirect after login/signup. */
export const PENDING_INVITE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function lsGet(key) {
  if (!process.client) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsRemove(key) {
  if (!process.client) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Persist token and mark invite auth-redirect as active (call from /invite/accept). */
export function storePendingInviteToken(token) {
  if (!process.client || !token) return;
  try {
    localStorage.setItem(PENDING_INVITE_TOKEN_KEY, String(token));
    localStorage.setItem(PENDING_INVITE_ACTIVE_KEY, '1');
    localStorage.setItem(PENDING_INVITE_STARTED_AT_KEY, String(Date.now()));
  } catch {
    // ignore quota / private mode
  }
}

export function readPendingInviteToken() {
  return lsGet(PENDING_INVITE_TOKEN_KEY) || null;
}

/** Clear token + active flag + timestamp (success, terminal errors, dismiss). */
export function clearPendingInviteToken() {
  lsRemove(PENDING_INVITE_TOKEN_KEY);
  lsRemove(PENDING_INVITE_ACTIVE_KEY);
  lsRemove(PENDING_INVITE_STARTED_AT_KEY);
}

/**
 * Stop post-auth hijack but keep token for retry on the accept page
 * (e.g. transient server error while URL still has ?token=).
 */
export function deactivateInviteRedirect() {
  lsRemove(PENDING_INVITE_ACTIVE_KEY);
}

function isInviteRedirectActive() {
  return lsGet(PENDING_INVITE_ACTIVE_KEY) === '1';
}

function isInviteRedirectFresh() {
  const raw = lsGet(PENDING_INVITE_STARTED_AT_KEY);
  if (!raw) return false;
  const started = Number(raw);
  if (!Number.isFinite(started) || started <= 0) return false;
  return Date.now() - started <= PENDING_INVITE_TTL_MS;
}

/** True only for an active, non-expired invite auth round-trip. */
export function hasActiveInviteRedirect() {
  return Boolean(readPendingInviteToken() && isInviteRedirectActive() && isInviteRedirectFresh());
}

/**
 * Build a safe login/signup path that returns to accept with the token in the URL.
 * Prefer this over localStorage-only when leaving /invite/accept.
 */
export function inviteAuthPath(authPath, rawToken) {
  if (!rawToken || (authPath !== '/login' && authPath !== '/signup')) return authPath;
  const acceptPath = `/invite/accept?token=${encodeURIComponent(String(rawToken))}`;
  return `${authPath}?redirect=${encodeURIComponent(acceptPath)}`;
}

/** If ?redirect=/invite/accept?token=..., activate that invite flow and return the path. */
export function activateInviteFromRedirectParam(redirectParam) {
  const explicit = safeInviteLoginRedirect(redirectParam);
  if (!explicit) return null;
  try {
    const url = new URL(explicit, 'https://faneqo.com');
    const token = url.searchParams.get('token');
    if (token) storePendingInviteToken(token);
  } catch {
    // still return explicit path; accept page can read token from URL
  }
  return explicit;
}

/**
 * After login/signup/Google: return invite accept path only for an
 * active, recent invite flow. Stale/legacy tokens are cleared and ignored
 * so normal login is never permanently hijacked.
 */
export function postAuthInviteRedirect() {
  const token = readPendingInviteToken();
  if (!token) return null;

  // Legacy leftover (token only, no active/timestamp) or expired flow.
  if (!isInviteRedirectActive() || !isInviteRedirectFresh()) {
    clearPendingInviteToken();
    return null;
  }

  return `/invite/accept?token=${encodeURIComponent(token)}`;
}

/**
 * Safe post-login redirect from ?redirect= (Switch account).
 * Only allows /invite/accept paths — no open redirects.
 */
export function safeInviteLoginRedirect(redirectParam) {
  const path = Array.isArray(redirectParam) ? redirectParam[0] : redirectParam;
  if (typeof path !== 'string' || !path.startsWith('/invite/accept')) return null;
  // Reject protocol-relative or weird schemes smuggled after the path.
  if (path.includes('://') || path.startsWith('//')) return null;
  return path;
}

export const useBandTeam = () => {
  const config = useRuntimeConfig();
  const token = useStrapiToken();
  const baseUrl = config.public.strapiUrl || 'http://localhost:1337';

  const authHeaders = () => ({
    Authorization: `Bearer ${token.value}`,
  });

  const getBandTeam = async (bandId) => {
    const response = await $fetch(`${baseUrl}/api/bands/${bandId}/team`, {
      headers: authHeaders(),
    });
    return response?.data || null;
  };

  const inviteBandMember = async (bandId, { email, role }) => {
    const normalizedRole = String(role || '').toLowerCase();
    if (normalizedRole !== 'manager' && normalizedRole !== 'viewer') {
      const err = new Error('Role must be manager or viewer.');
      err.data = { error: 'invalid_role', message: 'Role must be manager or viewer.' };
      err.statusCode = 400;
      throw err;
    }
    const response = await $fetch(`${baseUrl}/api/bands/${bandId}/invites`, {
      method: 'POST',
      headers: authHeaders(),
      body: { email, role: normalizedRole },
    });
    return response?.data || null;
  };

  const resendBandInvite = async (bandId, inviteId) => {
    const response = await $fetch(
      `${baseUrl}/api/bands/${bandId}/invites/${inviteId}/resend`,
      {
        method: 'POST',
        headers: authHeaders(),
      }
    );
    return response?.data || null;
  };

  const revokeBandInvite = async (bandId, inviteId) => {
    const response = await $fetch(`${baseUrl}/api/bands/${bandId}/invites/${inviteId}/revoke`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return response?.data || null;
  };

  const updateBandMemberRole = async (bandId, memberId, role) => {
    const normalizedRole = String(role || '').toLowerCase();
    if (normalizedRole !== 'manager' && normalizedRole !== 'viewer') {
      const err = new Error('Role must be manager or viewer.');
      err.data = { error: 'invalid_role', message: 'Role must be manager or viewer.' };
      err.statusCode = 400;
      throw err;
    }
    const response = await $fetch(
      `${baseUrl}/api/bands/${bandId}/members/${memberId}/role`,
      {
        method: 'POST',
        headers: authHeaders(),
        body: { role: normalizedRole },
      }
    );
    return response?.data || null;
  };

  const removeBandMember = async (bandId, memberId) => {
    const response = await $fetch(`${baseUrl}/api/bands/${bandId}/members/${memberId}/remove`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return response?.data || null;
  };

  const acceptInvite = async (rawToken) => {
    const response = await $fetch(`${baseUrl}/api/invites/accept`, {
      method: 'POST',
      headers: authHeaders(),
      body: { token: rawToken },
    });
    // Defense in depth: never treat a soft error payload as success.
    if (response?.error && !response?.data) {
      const err = new Error(response.message || 'Unable to accept invite.');
      err.data = response;
      err.statusCode = 400;
      throw err;
    }
    if (!response?.data && response?.error) {
      const err = new Error(response.message || 'Unable to accept invite.');
      err.data = response;
      err.statusCode = 400;
      throw err;
    }
    if (!response?.data) {
      const err = new Error('Unable to accept invite.');
      err.data = { error: 'invalid_response', message: 'Unable to accept invite.' };
      err.statusCode = 500;
      throw err;
    }
    return response.data;
  };

  const getMyBandAccess = async () => {
    const response = await $fetch(`${baseUrl}/api/me/band-access`, {
      headers: authHeaders(),
    });
    return response?.data || { owned: [], teamAccess: [] };
  };

  return {
    getBandTeam,
    inviteBandMember,
    resendBandInvite,
    revokeBandInvite,
    updateBandMemberRole,
    removeBandMember,
    acceptInvite,
    getMyBandAccess,
    storePendingInviteToken,
    readPendingInviteToken,
    clearPendingInviteToken,
    deactivateInviteRedirect,
    postAuthInviteRedirect,
    safeInviteLoginRedirect,
    hasActiveInviteRedirect,
    inviteAuthPath,
    activateInviteFromRedirectParam,
  };
};
