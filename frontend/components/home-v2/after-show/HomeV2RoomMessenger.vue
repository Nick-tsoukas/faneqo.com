<template>
  <div
    ref="rootEl"
    class="ats-msg"
    role="img"
    :aria-label="ariaLabel"
  >
    <header class="ats-msg__bar">
      <div class="ats-msg__who">
        <span class="ats-msg__pulse" aria-hidden="true"></span>
        <div class="min-w-0">
          <p class="ats-msg__band">{{ script.bandLine }}</p>
          <p class="ats-msg__ctx">{{ script.context }}</p>
        </div>
      </div>
      <div class="ats-msg__count">
        <strong>{{ script.roomCount }}</strong>
        <span>{{ script.roomLabel }}</span>
      </div>
    </header>

    <div class="ats-msg__chips" aria-hidden="true">
      <span
        v-for="(example, index) in script.examples"
        :key="example.id"
        class="ats-msg__chip"
        :class="{ 'is-on': index === exampleIndex }"
      >
        {{ example.label }}
      </span>
    </div>

    <div class="ats-msg__composer" :class="{ 'is-sent': phase === 'sent' }">
      <p class="ats-msg__label">Your message</p>
      <p class="ats-msg__text">
        <span>{{ displayedText }}</span><span
          v-if="phase === 'typing'"
          class="ats-msg__cursor"
          aria-hidden="true"
        />
      </p>
      <div v-if="current.link && displayedText.length > 20" class="ats-msg__link">
        {{ current.link }}
      </div>
      <div v-if="current.photos && displayedText.length > 24" class="ats-msg__gallery" aria-hidden="true">
        <img
          v-for="photo in GALLERY"
          :key="photo.id"
          :src="photo.src"
          alt=""
          width="240"
          height="240"
          loading="lazy"
          decoding="async"
        >
        <span>Gallery · {{ GALLERY.length }}</span>
      </div>
      <div class="ats-msg__actions">
        <span
          class="ats-msg__attach"
          :class="{ 'is-on': current.photos && displayedText.length > 24 }"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 7.5A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v9a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 16.5v-9z" stroke="currentColor" stroke-width="1.7" />
            <path d="M8 14.5l2.4-2.4a1 1 0 011.4 0L15 15.2l1.2-1.2a1 1 0 011.4 0l1.4 1.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="9" cy="9" r="1.15" fill="currentColor" />
          </svg>
        </span>
        <span class="ats-msg__hint">Sending to checked-in fans</span>
        <span
          class="ats-msg__send"
          :class="{
            'is-ready': phase === 'ready',
            'is-sending': phase === 'sending',
            'is-sent': phase === 'sent',
          }"
        >
          <template v-if="phase === 'sending'">Sending…</template>
          <template v-else-if="phase === 'sent'">Sent</template>
          <template v-else>Send</template>
        </span>
      </div>
    </div>

    <p v-if="phase === 'sent' || showThread" class="ats-msg__sent">
      {{ script.sentLine }}
    </p>

    <div v-if="!once && showThread && current.reply" class="ats-msg__thread">
      <div class="ats-msg__bubble is-fan">
        <span class="ats-msg__av">{{ current.reply.initials }}</span>
        <div>
          <p class="ats-msg__fan">{{ current.reply.name }}</p>
          <p>{{ current.reply.text }}</p>
        </div>
      </div>
      <div v-if="current.artist" class="ats-msg__bubble is-mine">
        <p>{{ current.artist }}</p>
      </div>
      <div v-if="showFanBack && current.fanBack" class="ats-msg__bubble is-fan">
        <span class="ats-msg__av">{{ current.reply.initials }}</span>
        <p>{{ current.fanBack }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { afterTheShowMessenger } from '~/utils/home-v2/afterTheShow.js'

const props = defineProps({
  artistName: { type: String, default: 'BADFLOWER' },
  venue: { type: String, default: 'Nashville' },
  // Play the first example once and hold its sent state (homepage V3)
  once: { type: Boolean, default: false },
  // Photos attached to the message; defaults to the original demo set
  gallery: { type: Array, default: null },
})

const script = computed(() => afterTheShowMessenger(props.artistName, props.venue))
const DEFAULT_GALLERY = [
  { id: 'moondough', src: 'https://qrcode101.s3.us-east-1.amazonaws.com/moondoug_6829e46a19.jpg' },
  { id: 'emerge', src: 'https://qrcode101.s3.us-east-1.amazonaws.com/61651_7df7eb9bab.png' },
  { id: 'andydarling', src: 'https://qrcode101.s3.us-east-1.amazonaws.com/andydarling_7d4caf6ff2.webp' },
  { id: 'shannontehya', src: 'https://qrcode101.s3.us-east-1.amazonaws.com/a3f241_692a27b6b7f54cc99d9668ba78417271_mv2_e1e00ed0ca.jpg' },
]
const GALLERY = computed(() => (props.gallery?.length ? props.gallery : DEFAULT_GALLERY))
const rootEl = ref(null)
const exampleIndex = ref(0)
// In once mode the resting state (server render, no script, reduced motion) is the sent message
const displayedText = ref(props.once ? script.value.examples[0].text : '')
const phase = ref(props.once ? 'sent' : 'idle')
const showThread = ref(props.once)
const showFanBack = ref(false)

const current = computed(() => script.value.examples[exampleIndex.value] || script.value.examples[0])
const ariaLabel = computed(
  () => `Animated demo: messaging ${script.value.roomCount} checked-in fans. ${current.value.label}. ${current.value.text}`
)

let timers = []
let observer = null
let running = false
let played = false
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
    const ch = chars[i]
    let delay = 20 + Math.random() * 16
    if (ch === ' ') delay = 26
    if (ch === ',' || ch === '—') delay = 110
    if (ch === '.' || ch === '!') delay = 160
    await wait(delay)
  }
}

async function runCycle() {
  if (!running) return
  showThread.value = false
  showFanBack.value = false

  if (props.once && reduceMotion) {
    displayedText.value = current.value.text
    phase.value = 'sent'
    showThread.value = true
    return
  }

  if (reduceMotion) {
    displayedText.value = current.value.text
    phase.value = 'sent'
    showThread.value = true
    showFanBack.value = !!current.value.fanBack
    await wait(3200)
    if (!running) return
    exampleIndex.value = (exampleIndex.value + 1) % script.value.examples.length
    if (running) runCycle()
    return
  }

  phase.value = 'idle'
  displayedText.value = ''
  await wait(400)
  if (!running) return

  await typeMessage(current.value.text)
  if (!running) return

  phase.value = 'ready'
  await wait(620)
  if (!running) return

  phase.value = 'sending'
  await wait(520)
  if (!running) return

  phase.value = 'sent'
  await wait(380)
  if (!running) return

  showThread.value = true
  await wait(current.value.artist ? 900 : 1400)
  if (!running) return

  if (current.value.fanBack) {
    showFanBack.value = true
    await wait(1600)
    if (!running) return
  }

  await wait(900)
  if (!running) return
  if (props.once) {
    running = false
    played = true
    return
  }

  exampleIndex.value = (exampleIndex.value + 1) % script.value.examples.length
  phase.value = 'idle'
  displayedText.value = ''
  showThread.value = false
  showFanBack.value = false
  await wait(360)
  if (running) runCycle()
}

function start() {
  if (running || played) return
  running = true
  runCycle()
}

function stop() {
  running = false
  clearTimers()
}

onMounted(() => {
  if (typeof window === 'undefined') return
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) start()
      else if (!props.once) stop()
    },
    { threshold: 0.32 }
  )
  if (rootEl.value) observer.observe(rootEl.value)
})

onBeforeUnmount(() => {
  stop()
  observer?.disconnect()
  observer = null
})
</script>

<style scoped>
.ats-msg {
  width: 100%;
  min-height: 0;
  border-radius: 1.35rem;
  border: 1px solid rgba(76, 166, 255, 0.16);
  background:
    linear-gradient(165deg, rgba(76, 166, 255, 0.08) 0%, transparent 42%),
    #0b0e14;
  padding: 1.15rem 1.1rem 1.2rem;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    0 16px 36px rgba(0, 0, 0, 0.34),
    0 44px 80px -18px rgba(0, 0, 0, 0.72);
}

.ats-msg__bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.ats-msg__who {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  min-width: 0;
}

.ats-msg__pulse {
  margin-top: 0.38rem;
  width: 0.45rem;
  height: 0.45rem;
  flex-shrink: 0;
  border-radius: 999px;
  background: #62f29d;
  box-shadow: 0 0 0 4px rgba(98, 242, 157, 0.16);
}

.ats-msg__band {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 750;
  letter-spacing: -0.02em;
  color: #f7f9fc;
}

.ats-msg__ctx {
  margin: 0.18rem 0 0;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
}

.ats-msg__count {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0.42rem 0.65rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(196, 181, 253, 0.28);
  background: rgba(139, 108, 255, 0.1);
  box-shadow: 0 12px 24px -14px rgba(139, 108, 255, 0.55);
  animation: ats-count-float 4.2s ease-in-out infinite;
}

@keyframes ats-count-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.ats-msg__count strong {
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1;
  color: #f7f9fc;
}

.ats-msg__count span {
  margin-top: 0.15rem;
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(196, 181, 253, 0.86);
}

.ats-msg__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.9rem 0 0.8rem;
}

.ats-msg__chip {
  padding: 0.24rem 0.58rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ats-msg__chip.is-on {
  border-color: rgba(57, 213, 255, 0.4);
  background: rgba(76, 166, 255, 0.14);
  color: #39d5ff;
}

.ats-msg__composer {
  border-radius: 1.05rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0a0b10;
  padding: 0.9rem 0.95rem 0.95rem;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.28),
    0 14px 28px -16px rgba(0, 0, 0, 0.8);
}

.ats-msg__composer.is-sent {
  border-color: rgba(69, 214, 167, 0.28);
}

.ats-msg__label {
  margin: 0 0 0.4rem;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.36);
}

.ats-msg__text {
  margin: 0;
  min-height: 3.6rem;
  font-size: 0.92rem;
  line-height: 1.5;
  letter-spacing: -0.015em;
  color: rgba(247, 249, 252, 0.92);
}

.ats-msg__cursor {
  display: inline-block;
  width: 0.12rem;
  height: 1em;
  margin-left: 1px;
  vertical-align: -0.12em;
  background: #39d5ff;
  animation: atsBlink 0.9s step-end infinite;
}

@keyframes atsBlink {
  50% { opacity: 0; }
}

.ats-msg__link {
  margin-top: 0.55rem;
  padding: 0.42rem 0.58rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.72rem;
}

.ats-msg__gallery {
  position: relative;
  display: flex;
  align-items: flex-end;
  height: 5.1rem;
  margin-top: 0.75rem;
  padding-left: 0.15rem;
}

.ats-msg__gallery img {
  display: block;
  width: 4.55rem;
  height: 4.55rem;
  object-fit: cover;
  margin-left: -0.85rem;
  border: 2px solid #0a0b10;
  border-radius: 0.7rem;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.4),
    0 12px 22px -10px rgba(0, 0, 0, 0.85);
}

.ats-msg__gallery img:first-child {
  margin-left: 0;
}

.ats-msg__gallery img:nth-child(2) {
  transform: translateY(-6px) rotate(4deg);
  z-index: 2;
}

.ats-msg__gallery img:nth-child(3) {
  transform: translateY(3px) rotate(-3deg);
}

.ats-msg__gallery img:nth-child(4) {
  transform: translateY(-4px) rotate(2.5deg);
  z-index: 1;
}

.ats-msg__gallery span {
  position: absolute;
  left: 0.2rem;
  bottom: -0.15rem;
  z-index: 3;
  padding: 0.18rem 0.48rem;
  border-radius: 999px;
  background: rgba(5, 6, 10, 0.78);
  color: #fff;
  font-size: 0.56rem;
  font-weight: 750;
  letter-spacing: 0.04em;
  box-shadow: 0 8px 16px -10px rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(8px);
}

.ats-msg__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  margin-top: 0.8rem;
}

.ats-msg__attach {
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  flex-shrink: 0;
  border-radius: 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.45);
}

.ats-msg__attach svg {
  width: 1.05rem;
  height: 1.05rem;
}

.ats-msg__attach.is-on {
  border-color: rgba(76, 166, 255, 0.35);
  background: rgba(76, 166, 255, 0.12);
  color: #39d5ff;
  box-shadow: 0 10px 18px -12px rgba(57, 213, 255, 0.55);
}

.ats-msg__hint {
  flex: 1;
  min-width: 0;
  font-size: 0.68rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
}

.ats-msg__send {
  display: inline-flex;
  min-width: 4.8rem;
  justify-content: center;
  padding: 0.5rem 0.9rem;
  border-radius: 0.65rem;
  border: 1px solid rgba(244, 114, 182, 0.32);
  background: linear-gradient(90deg, #ec4899, #a855f7);
  color: #fff;
  font-size: 0.76rem;
  font-weight: 800;
  opacity: 0.4;
}

.ats-msg__send.is-ready {
  opacity: 1;
}

.ats-msg__send.is-sending {
  opacity: 0.85;
  background: #1a1b24;
  border-color: rgba(255, 255, 255, 0.14);
}

.ats-msg__send.is-sent {
  opacity: 1;
  background: rgba(69, 214, 167, 0.14);
  border-color: rgba(69, 214, 167, 0.38);
  color: #a7f3d0;
}

.ats-msg__sent {
  margin: 0.7rem 0 0;
  padding: 0.55rem 0.7rem;
  border-radius: 0.7rem;
  border: 1px solid rgba(69, 214, 167, 0.26);
  background: rgba(69, 214, 167, 0.08);
  color: #a7f3d0;
  font-size: 0.78rem;
  font-weight: 650;
}

.ats-msg__thread {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-top: 0.85rem;
}

.ats-msg__bubble {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  max-width: 92%;
  padding: 0.65rem 0.75rem;
  border-radius: 0.85rem;
  font-size: 0.84rem;
  line-height: 1.4;
  color: #f7f9fc;
}

.ats-msg__bubble p {
  margin: 0;
}

.ats-msg__bubble.is-fan {
  align-self: flex-start;
  background: #0a0b10;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.ats-msg__bubble.is-mine {
  align-self: flex-end;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.22), rgba(139, 108, 255, 0.2));
  border: 1px solid rgba(244, 114, 182, 0.22);
}

.ats-msg__av {
  display: flex;
  width: 1.55rem;
  height: 1.55rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(69, 214, 167, 0.12);
  color: #62f29d;
  font-size: 0.55rem;
  font-weight: 800;
}

.ats-msg__fan {
  margin: 0 0 0.18rem !important;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

@media (min-width: 1024px) {
  .ats-msg {
    min-height: 28rem;
    padding: 1.25rem 1.25rem 1.3rem;
  }

  .ats-msg__text {
    min-height: 4.4rem;
    font-size: 0.95rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ats-msg__cursor {
    animation: none;
  }

  .ats-msg__count {
    animation: none;
  }

  .ats-msg__gallery img {
    transform: none;
  }
}
</style>
