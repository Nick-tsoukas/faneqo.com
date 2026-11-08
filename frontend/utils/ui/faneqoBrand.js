/**
 * Faneqo brand + application material tokens.
 * Application surfaces consume these. Public artist pages must not.
 */
export const FANEQO_GREEN = '#39FF14'
export const FANEQO_PURPLE = '#9100FF'
export const FANEQO_MAGENTA = '#FF00FF'
export const FANEQO_SEA = '#45D6A7'
export const FANEQO_TEAL = '#23C7C3'

export const faneqoBrand = {
  green: FANEQO_GREEN,
  purple: FANEQO_PURPLE,
  magenta: FANEQO_MAGENTA,
  appBg: '#050506',
  canvas: '#07080A',
  surface: '#0B0C10',
  surfaceRaised: '#111217',
  surfaceHover: '#14161B',
  surfaceTinted: '#0D0B10',
  border: 'rgba(255, 255, 255, 0.07)',
  borderStrong: 'rgba(255, 255, 255, 0.11)',
  arrow: 'rgba(57, 255, 20, 0.82)',
  textPrimary: '#F5F5F6',
  textSecondary: 'rgba(255, 255, 255, 0.58)',
  textMuted: 'rgba(255, 255, 255, 0.38)',
  textDisabled: 'rgba(255, 255, 255, 0.28)',
  stateSuccess: FANEQO_GREEN,
  stateUnread: FANEQO_GREEN,
  // In-flight is teal so neon green keeps meaning "sent" on its own.
  stateProgress: FANEQO_TEAL,
  stateError: '#FCA5A5',
  inkOnGreen: '#052e16',
  formCtaFrom: FANEQO_SEA,
  formCtaTo: FANEQO_TEAL,
  inkOnFormCta: '#06251F',
  gradientFormCta: `linear-gradient(135deg, ${FANEQO_SEA} 0%, ${FANEQO_TEAL} 100%)`,
  gradientCta: `linear-gradient(135deg, ${FANEQO_GREEN} 0%, #2EE6B8 48%, ${FANEQO_PURPLE} 100%)`,
  gradientTab: `linear-gradient(90deg, ${FANEQO_GREEN} 0%, #2EE6B8 55%, ${FANEQO_PURPLE} 100%)`,
}

export const faneqoCssVars = {
  '--fq-green': FANEQO_GREEN,
  '--fq-purple': FANEQO_PURPLE,
  '--fq-magenta': FANEQO_MAGENTA,
  '--fq-app-bg': faneqoBrand.appBg,
  '--fq-canvas': faneqoBrand.canvas,
  '--fq-surface': faneqoBrand.surface,
  '--fq-surface-raised': faneqoBrand.surfaceRaised,
  '--fq-surface-hover': faneqoBrand.surfaceHover,
  '--fq-surface-tinted': faneqoBrand.surfaceTinted,
  '--fq-border': faneqoBrand.border,
  '--fq-border-strong': faneqoBrand.borderStrong,
  '--fq-arrow': faneqoBrand.arrow,
  '--fq-surface-base': faneqoBrand.appBg,
  '--fq-surface-rail': faneqoBrand.surface,
  '--fq-surface-thread': faneqoBrand.canvas,
  '--fq-surface-composer': faneqoBrand.surface,
  '--fq-border-subtle': faneqoBrand.border,
  '--fq-text-primary': faneqoBrand.textPrimary,
  '--fq-text-secondary': faneqoBrand.textSecondary,
  '--fq-text-muted': faneqoBrand.textMuted,
  '--fq-text-disabled': faneqoBrand.textDisabled,
  '--fq-state-success': faneqoBrand.stateSuccess,
  '--fq-state-unread': faneqoBrand.stateUnread,
  '--fq-state-progress': faneqoBrand.stateProgress,
  '--fq-state-error': faneqoBrand.stateError,
  '--fq-form-cta-from': faneqoBrand.formCtaFrom,
  '--fq-form-cta-to': faneqoBrand.formCtaTo,
  '--fq-ink-on-form-cta': faneqoBrand.inkOnFormCta,
  '--fq-gradient-form-cta': faneqoBrand.gradientFormCta,
  '--fq-gradient-primary': faneqoBrand.gradientCta,
  '--fq-gradient-tab': faneqoBrand.gradientTab,
  '--fq-ink-on-green': faneqoBrand.inkOnGreen,
}
