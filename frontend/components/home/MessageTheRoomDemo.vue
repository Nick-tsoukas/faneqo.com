<template>
  <div
    ref="rootEl"
    class="mtr-demo"
    role="img"
    :aria-label="ariaLabel"
  >
    <!-- Context header -->
    <div class="mtr-header">
      <div class="mtr-header-left">
        <span class="mtr-live-dot" aria-hidden="true"></span>
        <div class="min-w-0">
          <p class="mtr-band">Burning Thunder @ The Vic</p>
          <p class="mtr-context">Post-show message</p>
        </div>
      </div>
      <div class="mtr-badge">
        <span class="mtr-badge-count">42</span>
        <span class="mtr-badge-label">checked-in fans</span>
      </div>
    </div>

    <!-- Message type chip -->
    <div class="mtr-type-row">
      <span class="mtr-type-chip">{{ currentExample.label }}</span>
      <span class="mtr-type-hint">Sending to checked-in fans</span>
    </div>

    <!-- Composer -->
    <div class="mtr-composer" :class="{ 'mtr-composer--sent': phase === 'sent' }">
      <div class="mtr-composer-label">Your message</div>
      <div class="mtr-message-box">
        <p class="mtr-message-text">
          <span>{{ displayedText }}</span><span
            v-if="phase === 'typing'"
            class="mtr-cursor"
            aria-hidden="true"
          />
        </p>
      </div>

      <!-- Optional soft link preview during merch example -->
      <div
        v-if="currentExample.showLinkPreview && displayedText.length > 24"
        class="mtr-link-preview"
      >
        <span class="mtr-link-icon" aria-hidden="true">↗</span>
        <span class="mtr-link-text">badflower.store / merch</span>
      </div>

      <div class="mtr-actions">
        <div class="mtr-pills">
          <span class="mtr-pill">Reach them again</span>
        </div>
        <button
          type="button"
          class="mtr-send"
          :class="{
            'mtr-send--ready': phase === 'ready',
            'mtr-send--sending': phase === 'sending',
            'mtr-send--sent': phase === 'sent',
          }"
          tabindex="-1"
          aria-hidden="true"
        >
          <template v-if="phase === 'sending'">Sending…</template>
          <template v-else-if="phase === 'sent'">
            <span class="mtr-send-check">✓</span> Sent
          </template>
          <template v-else>
            Send
            <svg class="mtr-send-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </template>
        </button>
      </div>
    </div>

    <!-- Sent confirmation -->
    <Transition name="mtr-fade">
      <div v-if="phase === 'sent'" class="mtr-sent-bar">
        <span class="mtr-sent-icon" aria-hidden="true">✓</span>
        Sent to 42 fans who were in the room
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const EXAMPLES = [
  {
    id: 'thanks',
    label: 'Thank you',
    text: 'Thanks for coming out tonight Chicago. You made the room electric.',
    showLinkPreview: false,
  },
  {
    id: 'merch',
    label: 'Merch follow-up',
    text: 'Loved having you at the show. Grab official merch here before it’s gone.',
    showLinkPreview: true,
  },
  {
    id: 'next',
    label: 'Next show',
    text: 'We’re back Aug 14 at The Vic — get tickets now before they disappear.',
    showLinkPreview: false,
  },
]

const rootEl = ref(null)
const exampleIndex = ref(0)
const displayedText = ref('')
/** @type {import('vue').Ref<'idle'|'typing'|'ready'|'sending'|'sent'>} */
const phase = ref('idle')
const inView = ref(false)

const currentExample = computed(() => EXAMPLES[exampleIndex.value] || EXAMPLES[0])
const ariaLabel = computed(
  () =>
    `Animated demo: messaging 42 checked-in fans. Example: ${currentExample.value.label}. ${currentExample.value.text}`
)

let timers = []
let observer = null
let running = false
let reduceMotion = false

function clearTimers() {
  for (const t of timers) clearTimeout(t)
  timers = []
}

function wait(ms) {
  return new Promise((resolve) => {
    const id = setTimeout(resolve, ms)
    timers.push(id)
  })
}

async function typeMessage(fullText) {
  phase.value = 'typing'
  displayedText.value = ''
  const chars = [...fullText]
  for (let i = 0; i < chars.length; i++) {
    if (!running) return
    displayedText.value += chars[i]
    // Slightly varied cadence — punctuation pauses feel natural
    const ch = chars[i]
    let delay = 22 + Math.random() * 18
    if (ch === ' ') delay = 28
    if (ch === ',' || ch === '—') delay = 120
    if (ch === '.' || ch === '!') delay = 180
    await wait(delay)
  }
}

async function runCycle() {
  if (!running) return

  if (reduceMotion) {
    // Instant full message + soft sent state; still rotates slowly
    displayedText.value = currentExample.value.text
    phase.value = 'ready'
    await wait(900)
    if (!running) return
    phase.value = 'sending'
    await wait(500)
    if (!running) return
    phase.value = 'sent'
    await wait(2800)
    if (!running) return
    exampleIndex.value = (exampleIndex.value + 1) % EXAMPLES.length
    phase.value = 'idle'
    displayedText.value = ''
    await wait(400)
    if (running) runCycle()
    return
  }

  phase.value = 'idle'
  displayedText.value = ''
  await wait(450)
  if (!running) return

  await typeMessage(currentExample.value.text)
  if (!running) return

  phase.value = 'ready'
  await wait(700)
  if (!running) return

  phase.value = 'sending'
  await wait(650)
  if (!running) return

  phase.value = 'sent'
  await wait(2600)
  if (!running) return

  // Soft clear into next example
  exampleIndex.value = (exampleIndex.value + 1) % EXAMPLES.length
  phase.value = 'idle'
  displayedText.value = ''
  await wait(500)
  if (running) runCycle()
}

function start() {
  if (running) return
  running = true
  runCycle()
}

function stop() {
  running = false
  clearTimers()
}

onMounted(() => {
  if (!process.client) return

  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  observer = new IntersectionObserver(
    ([entry]) => {
      inView.value = !!entry?.isIntersecting
      if (entry?.isIntersecting) start()
      else stop()
    },
    { threshold: 0.35 }
  )

  if (rootEl.value) observer.observe(rootEl.value)
})

onBeforeUnmount(() => {
  stop()
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<style scoped>
.mtr-demo {
  width: 100%;
  border-radius: 1.1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(165deg, rgba(236, 72, 153, 0.08) 0%, transparent 42%),
    linear-gradient(180deg, #121218 0%, #0a0a10 100%);
  box-shadow:
    0 24px 60px -28px rgba(0, 0, 0, 0.9),
    0 0 0 1px rgba(244, 114, 182, 0.08);
  padding: 1rem 1.05rem 1.05rem;
}

.mtr-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.mtr-header-left {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  min-width: 0;
}

.mtr-live-dot {
  margin-top: 0.35rem;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 9999px;
  background: #34d399;
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.18);
  flex-shrink: 0;
}

.mtr-band {
  font-size: 0.82rem;
  font-weight: 650;
  color: #fff;
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.mtr-context {
  margin-top: 0.15rem;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
}

.mtr-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0.35rem 0.6rem;
  border-radius: 0.7rem;
  border: 1px solid rgba(52, 211, 153, 0.28);
  background: rgba(16, 185, 129, 0.1);
  flex-shrink: 0;
}

.mtr-badge-count {
  font-size: 1rem;
  font-weight: 800;
  color: #6ee7b7;
  line-height: 1.1;
}

.mtr-badge-label {
  font-size: 0.58rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(167, 243, 208, 0.75);
}

.mtr-type-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem 0.65rem;
  margin-bottom: 0.7rem;
}

.mtr-type-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.55rem;
  border-radius: 9999px;
  border: 1px solid rgba(244, 114, 182, 0.35);
  background: rgba(236, 72, 153, 0.14);
  color: #f9a8d4;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.mtr-type-hint {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.45);
  font-weight: 500;
}

.mtr-composer {
  border-radius: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.45);
  padding: 0.8rem 0.85rem 0.85rem;
  transition: border-color 0.35s ease, box-shadow 0.35s ease;
}

.mtr-composer--sent {
  border-color: rgba(52, 211, 153, 0.28);
  box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.08);
}

.mtr-composer-label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.38);
  margin-bottom: 0.45rem;
}

.mtr-message-box {
  min-height: 4.6rem;
}

.mtr-message-text {
  font-size: 0.92rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  letter-spacing: -0.01em;
}

.mtr-cursor {
  display: inline-block;
  width: 0.12rem;
  height: 1em;
  margin-left: 1px;
  vertical-align: -0.12em;
  background: #f472b6;
  animation: mtrBlink 0.9s step-end infinite;
}

@keyframes mtrBlink {
  50% {
    opacity: 0;
  }
}

.mtr-link-preview {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.65rem;
  padding: 0.45rem 0.6rem;
  border-radius: 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
}

.mtr-link-icon {
  color: #c084fc;
  font-size: 0.75rem;
}

.mtr-link-text {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 550;
}

.mtr-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.85rem;
}

.mtr-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  min-width: 0;
}

.mtr-pill {
  font-size: 0.65rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 9999px;
  padding: 0.22rem 0.55rem;
}

.mtr-send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-width: 5.5rem;
  padding: 0.55rem 0.95rem;
  border-radius: 0.65rem;
  border: 1px solid rgba(244, 114, 182, 0.35);
  background: linear-gradient(90deg, #ec4899 0%, #a855f7 100%);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  opacity: 0.45;
  transition: opacity 0.25s ease, transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;
  pointer-events: none;
}

.mtr-send--ready {
  opacity: 1;
  transform: translateY(-1px);
  box-shadow: 0 10px 24px -12px rgba(236, 72, 153, 0.7);
}

.mtr-send--sending {
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.16);
  box-shadow: none;
}

.mtr-send--sent {
  opacity: 1;
  background: rgba(16, 185, 129, 0.18);
  border-color: rgba(52, 211, 153, 0.4);
  color: #a7f3d0;
  box-shadow: none;
}

.mtr-send-arrow {
  width: 0.85rem;
  height: 0.85rem;
}

.mtr-send-check {
  font-weight: 800;
}

.mtr-sent-bar {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.7rem;
  padding: 0.55rem 0.7rem;
  border-radius: 0.7rem;
  border: 1px solid rgba(52, 211, 153, 0.28);
  background: rgba(16, 185, 129, 0.1);
  color: #a7f3d0;
  font-size: 0.78rem;
  font-weight: 600;
}

.mtr-sent-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 9999px;
  background: rgba(52, 211, 153, 0.22);
  font-size: 0.7rem;
  font-weight: 800;
}

.mtr-fade-enter-active,
.mtr-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.mtr-fade-enter-from,
.mtr-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@media (max-width: 640px) {
  .mtr-demo {
    padding: 0.9rem;
  }
  .mtr-message-box {
    min-height: 4.1rem;
  }
  .mtr-message-text {
    font-size: 0.86rem;
  }
  .mtr-badge-label {
    font-size: 0.55rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mtr-cursor {
    animation: none;
    opacity: 1;
  }
  .mtr-send--ready {
    transform: none;
  }
}
</style>
