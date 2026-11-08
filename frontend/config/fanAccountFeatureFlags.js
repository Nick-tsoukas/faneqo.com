/**
 * Fan Account Conversion feature flags
 *
 * PRODUCTION: keep prompts false until identity/claiming is validated.
 * Magic-link APIs and account state can remain active independently.
 */

/** Master switch for ambient prompts (return visit, second artist, save). */
export const FAN_ACCOUNT_PROMPTS_ENABLED = false;

/**
 * Contextual Fan Passport invitations after Fan List, Follow, and gallery.
 * Off leaves those actions working and hides only the invitation.
 * Message still asks for an account, because a conversation requires one.
 */
export const FAN_PASSPORT_INVITES_ENABLED = true;

/** Allow evaluating eligibility client-side even when prompts are hidden (debug). */
export const FAN_ACCOUNT_ELIGIBILITY_DEBUG = false;

export function isFanAccountPromptsEnabled() {
  return FAN_ACCOUNT_PROMPTS_ENABLED === true;
}

export function isFanPassportInvitesEnabled() {
  return FAN_PASSPORT_INVITES_ENABLED === true;
}
