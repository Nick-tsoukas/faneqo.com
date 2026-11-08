<template>
  <div class="auth-shell">
    <header class="auth-shell__bar" :class="{ 'is-empty': !backTo }">
      <div class="auth-shell__bar-inner">
        <button
          v-if="backTo"
          type="button"
          class="auth-shell__back"
          aria-label="Go back"
          @click="goBack"
        >
          <svg class="auth-shell__back-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <span v-else class="auth-shell__bar-spacer" aria-hidden="true" />
      </div>
    </header>

    <main class="auth-shell__main">
      <div class="auth-shell__stage">
        <div class="auth-shell__brand">
          <NuxtLink to="/" class="auth-shell__brand-link" aria-label="Faneqo home">
            <img
              src="/faneqo-logo.png"
              alt=""
              class="auth-shell__brand-logo"
              width="2401"
              height="748"
            />
          </NuxtLink>
          <p class="auth-shell__brand-copy">
            <span class="auth-shell__brand-copy-lead">Bands don't need more links. </span>
            <span class="auth-shell__brand-copy-end">They need fans.</span>
          </p>
        </div>

        <div class="auth-shell__column">
          <NuxtLink to="/" class="auth-shell__wordmark" aria-label="Faneqo home">
            <img src="/faneqo-wordmark.svg" alt="Faneqo" class="auth-shell__logo" width="120" height="45" />
          </NuxtLink>
          <slot />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { isAuthPresentationPath, readSafeAuthReturnTo } from '~/utils/auth/safeAuthReturnTo'

const props = defineProps({
  backFallback: { type: String, default: '' },
})

const route = useRoute()
const router = useRouter()

const backTo = computed(() => {
  const fromQuery = readSafeAuthReturnTo(route.query, { fallback: null })
  if (fromQuery) return fromQuery
  const fallback = String(props.backFallback || '').trim()
  return readSafeAuthReturnTo({ redirect: fallback }, { fallback: null })
})

function previousHistoryPath() {
  if (typeof window === 'undefined') return ''
  const back = window.history.state?.back
  if (typeof back === 'string') return back
  if (back && typeof back === 'object') {
    return String(back.fullPath || back.path || '')
  }
  return ''
}

function goBack() {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    const prev = previousHistoryPath()
    if (!prev || !isAuthPresentationPath(prev)) {
      router.back()
      return
    }
  }
  router.replace(backTo.value || '/')
}
</script>

<style scoped>
.auth-shell {
  --auth-bg: #050506;
  --auth-field: #0d0f13;
  --auth-raised: #0a0b0e;
  --auth-text: #f5f5f6;
  --auth-secondary: rgba(245, 245, 246, 0.62);
  --auth-muted: rgba(245, 245, 246, 0.4);
  --auth-placeholder: rgba(245, 245, 246, 0.32);
  --auth-border: rgba(255, 255, 255, 0.08);
  --auth-border-hover: rgba(255, 255, 255, 0.14);
  --auth-ink: #08090a;
  --auth-error: #fca5a5;
  --auth-focus: #c084fc;
  --auth-motion: 0.16s ease;

  min-height: 100dvh;
  background: var(--auth-bg);
  color: var(--auth-text);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.auth-shell__bar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--auth-bg);
}

.auth-shell__bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding:
    calc(0.25rem + env(safe-area-inset-top, 0px))
    12px
    0;
}

.auth-shell__bar.is-empty .auth-shell__bar-inner {
  min-height: env(safe-area-inset-top, 0px);
  padding-top: env(safe-area-inset-top, 0px);
}

.auth-shell__bar-spacer {
  width: 44px;
  height: 1px;
}

.auth-shell__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-left: -8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--auth-secondary);
  cursor: pointer;
}

.auth-shell__back-icon {
  width: 22px;
  height: 22px;
}

.auth-shell__back:hover {
  color: var(--auth-text);
}

.auth-shell__back:focus-visible,
.auth-shell__wordmark:focus-visible,
.auth-shell__brand-link:focus-visible {
  outline: 2px solid var(--auth-focus);
  outline-offset: 3px;
  border-radius: 8px;
}

.auth-shell__wordmark {
  display: inline-flex;
  align-items: center;
  margin: 0 0 1.15rem;
  line-height: 0;
}

.auth-shell__logo {
  display: block;
  width: 94px;
  height: auto;
}

.auth-shell__brand {
  display: none;
}

.auth-shell__main {
  padding:
    0.75rem
    20px
    calc(1.75rem + env(safe-area-inset-bottom, 0px));
}

.auth-shell__column {
  width: min(100%, 410px);
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .auth-shell {
    --auth-logo-src-h: 6rem;
    box-sizing: border-box;
    min-height: 100dvh;
    padding-top: var(--header-height);
  }

  .auth-shell__bar {
    display: none;
  }

  .auth-shell__main {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100dvh - var(--header-height));
    padding: 2.5vh 2.25rem 4.5vh;
  }

  .auth-shell__stage {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 27.5rem;
    align-items: center;
    column-gap: clamp(2.75rem, 4.5vw, 5rem);
    width: min(100%, 72rem);
  }

  .auth-shell__brand {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    justify-self: center;
    width: max-content;
    max-width: 100%;
    min-width: 0;
    padding: 0;
    background: none;
    border: 0;
    box-shadow: none;
  }

  /* Same crop as Header .header-logo — 560/748 hides the lockup tagline. */
  .auth-shell__brand-link {
    display: block;
    height: calc(var(--auth-logo-src-h) * 560 / 748);
    overflow: hidden;
    line-height: 0;
  }

  .auth-shell__brand-logo {
    display: block;
    height: var(--auth-logo-src-h);
    width: auto;
    max-width: none;
    filter: none;
  }

  .auth-shell__brand-copy {
    /* Match the transparent left pad in /faneqo-logo.png so copy sits under the F. */
    margin: 1.2rem 0 0;
    padding-left: calc(var(--auth-logo-src-h) * 138 / 748);
    max-width: 20.5rem;
  }

  .auth-shell__brand-copy-lead,
  .auth-shell__brand-copy-end {
    display: block;
  }

  .auth-shell__brand-copy-lead {
    color: var(--auth-secondary);
    font-size: 1.0625rem;
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.35;
  }

  .auth-shell__brand-copy-end {
    margin-top: 0.18rem;
    color: var(--auth-text);
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.3;
  }

  .auth-shell__wordmark {
    display: none;
  }

  .auth-shell__column {
    width: 27.5rem;
    margin: 0;
  }
}

@media (min-width: 1024px) and (max-height: 800px) {
  .auth-shell {
    --auth-logo-src-h: 5.25rem;
  }

  .auth-shell__main {
    padding: 1.1rem 2rem 1.5rem;
  }

  .auth-shell__brand-copy {
    margin-top: 0.95rem;
  }

  .auth-shell__brand-copy-lead {
    font-size: 1rem;
  }

  .auth-shell__brand-copy-end {
    font-size: 1.0625rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-shell {
    --auth-motion: 0.01ms;
  }
}
</style>

<style>
.auth-shell .auth-title {
  margin: 0 0 0.7rem;
  color: #f5f5f6;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.05;
  overflow-wrap: anywhere;
}

.auth-shell .auth-error {
  margin: 0 0 1rem;
  color: #fca5a5;
  font-size: 0.875rem;
  line-height: 1.45;
  transition: opacity 0.16s ease;
}

.auth-shell .auth-success {
  margin: 0 0 1rem;
  color: #86efac;
  font-size: 0.875rem;
  line-height: 1.45;
}

.auth-shell .auth-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  height: 52px;
  margin-top: 1.15rem;
  padding: 0 1rem;
  border: 0;
  border-radius: 14px;
  background: #f3f3f4;
  color: #08090a;
  font: inherit;
  font-size: 1rem;
  font-weight: 650;
  cursor: pointer;
  transition: filter 0.16s ease, transform 0.16s ease;
}

.auth-shell .auth-cta:hover:not(:disabled) {
  filter: brightness(0.97);
}

.auth-shell .auth-cta:active:not(:disabled) {
  filter: brightness(0.93);
  transform: translateY(1px);
}

.auth-shell .auth-cta:disabled {
  opacity: 0.55;
  cursor: default;
}

.auth-shell .auth-cta:focus-visible {
  outline: 2px solid #c084fc;
  outline-offset: 3px;
}

.auth-shell .auth-or {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  margin: 1.5rem 0;
  color: rgba(245, 245, 246, 0.5);
  font-size: 0.75rem;
}

.auth-shell .auth-or::before,
.auth-shell .auth-or::after {
  content: "";
  width: 68px;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
}

.auth-shell .auth-switch {
  margin: 2rem 0 0;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.9375rem;
  text-align: center;
}

.auth-shell .auth-switch a {
  color: #f5f5f6;
  font-weight: 600;
  text-decoration: none;
}

.auth-shell .auth-switch a:hover {
  text-decoration: underline;
}

.auth-shell .auth-switch a:focus-visible {
  outline: 2px solid #c084fc;
  outline-offset: 3px;
  border-radius: 6px;
}

.auth-shell .auth-quiet {
  margin: 0.85rem 0 0;
  color: rgba(245, 245, 246, 0.4);
  font-size: 0.8125rem;
  text-align: center;
}

.auth-shell .auth-forgot {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin: -6px 0;
  padding: 0;
  color: rgba(245, 245, 246, 0.62);
  font-size: 0.8125rem;
  font-weight: 500;
  text-decoration: none;
}

.auth-shell .auth-forgot:hover {
  color: #f5f5f6;
}

.auth-shell .auth-forgot:focus-visible {
  outline: 2px solid #c084fc;
  outline-offset: 3px;
  border-radius: 6px;
}

.auth-shell .auth-ghost {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: rgba(245, 245, 246, 0.62);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.auth-shell .auth-ghost:hover:not(:disabled) {
  color: #f5f5f6;
}

.auth-shell .auth-ghost:disabled {
  opacity: 0.55;
  cursor: default;
}

.auth-shell .auth-ghost:focus-visible {
  outline: 2px solid #c084fc;
  outline-offset: 3px;
  border-radius: 6px;
}

@media (min-width: 1024px) {
  .auth-shell .auth-title {
    font-size: 1.875rem;
    letter-spacing: -0.03em;
    line-height: 1.12;
    margin-bottom: 0.8rem;
  }

  .auth-shell .auth-switch {
    margin-top: 1.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-shell .auth-cta {
    transition: none;
  }
}
</style>
