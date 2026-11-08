<template>
  <article
    class="board"
    :class="`is-${styleId}`"
    :data-format="formatId"
    :style="vars"
    :aria-label="ariaLabel"
  >
    <!-- Bold Insight: the headline is the poster. Setup lines, then one accent line. -->
    <template v-if="styleId === 'bold'">
      <p v-if="category" class="eyebrow">{{ category }}</p>
      <div class="poster">
        <h1 class="poster__setup" :style="setupStyle">
          <span v-for="(line, i) in setupLines" :key="i">{{ line }}</span>
        </h1>
        <p class="poster__punch" :style="punchStyle">
          <span v-for="(line, i) in punchLines" :key="i">{{ line }}</span>
        </p>
        <span v-if="support" class="poster__rule" aria-hidden="true" />
        <p v-if="support" class="poster__support">{{ support }}</p>
      </div>
    </template>

    <!-- Music Playbook: a titled note, then a numbered takeaway and the explanation. -->
    <template v-else>
      <header class="note__head">
        <p v-if="category" class="eyebrow">{{ category }}</p>
        <span class="note__rule" aria-hidden="true" />
      </header>
      <div class="note">
        <h1 class="note__title" :style="titleStyle">
          <span v-for="(line, i) in titleLines" :key="i">{{ line }}</span>
        </h1>
        <div v-if="insight" class="take">
          <span class="take__num" aria-hidden="true">01</span>
          <p class="take__text">{{ insight }}</p>
        </div>
        <p v-if="support" class="note__body">{{ support }}</p>
      </div>
    </template>

    <footer class="sig">
      <img class="sig__mark" src="/faneqo-wordmark.svg" alt="Faneqo" />
      <span class="sig__site">{{ site }}</span>
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { boardVars } from '@/features/ads/studio/board.js'
import { insightStyle } from '@/features/ads/studio/families.js'
import { isAdFormat } from '@/features/ads/formats.js'

/**
 * Music Industry Insights. Two single-frame editorial compositions:
 * Bold Insight (the headline is the poster) and Music Playbook (title,
 * numbered takeaway, explanation). Copy is content, never hardcoded.
 */
const props = defineProps({
  format: { type: String, default: 'feed' },
  content: { type: Object, required: true },
  snapshot: { type: Object, default: null },
  scene: { type: Number, default: 0 },
})

const LAYOUTS = {
  post: { setup: 72, punch: 128, title: 68, take: 40, body: 28, 'sig-bottom': 72 },
  feed: { setup: 68, punch: 124, title: 64, take: 40, body: 28, 'sig-bottom': 64 },
  story: { setup: 76, punch: 136, title: 76, take: 44, body: 32, 'sig-bottom': 336 },
  square: { setup: 52, punch: 92, title: 52, take: 32, body: 24, 'sig-bottom': 56 },
}

const formatId = computed(() => (isAdFormat(props.format) ? props.format : 'feed'))
const vars = computed(() => boardVars(formatId.value, LAYOUTS))
const c = computed(() => props.content || {})
const styleId = computed(() => insightStyle(c.value))
const category = computed(() => String(c.value.category || '').trim())
const support = computed(() => String(c.value.support || '').trim())
const insight = computed(() => String(c.value.insight || '').trim())
const site = computed(() => String(c.value.site || 'faneqo.com').trim() || 'faneqo.com')
const statement = computed(() => String(c.value.statement || '').trim())

/** Break copy into lines. An explicit newline is honored; otherwise words wrap near `maxChars`. */
function breakLines(text, maxChars, maxLines) {
  const raw = String(text || '').trim()
  if (!raw) return []
  const explicit = raw.split(/\n+/).map((line) => line.trim()).filter(Boolean)
  const source = explicit.length > 1 ? explicit : [raw]
  const lines = []
  for (const part of source) {
    const words = part.split(/\s+/).filter(Boolean)
    let current = ''
    for (const word of words) {
      const next = current ? `${current} ${word}` : word
      if (current && next.length > maxChars) {
        lines.push(current)
        current = word
      } else current = next
    }
    if (current) lines.push(current)
  }
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines - 1)
  kept.push(lines.slice(maxLines - 1).join(' '))
  return kept
}

/** A one-word leftover ("LIST.", "ONE.") is a stub. Pull the previous word down onto it. */
function isStub(line) {
  const words = String(line || '').trim().split(/\s+/).filter(Boolean)
  return words.length === 1 && words[0].replace(/[^A-Za-z0-9]/g, '').length <= 6
}

function balanceLines(lines) {
  if (lines.length < 2 || !isStub(lines[lines.length - 1])) return lines
  const next = lines.slice()
  const prevWords = next[next.length - 2].trim().split(/\s+/).filter(Boolean)
  if (prevWords.length < 2) return lines
  const moved = prevWords.pop()
  next[next.length - 2] = prevWords.join(' ')
  next[next.length - 1] = `${moved} ${next[next.length - 1]}`
  return next
}

const chars = computed(() => (formatId.value === 'square' ? 14 : formatId.value === 'story' ? 16 : 15))
const authoredBreaks = computed(() => /\n/.test(statement.value))

/* Bold: every line but the last is the setup. The last line is the accent, and may itself wrap. */
const boldLines = computed(() => {
  const lines = breakLines(statement.value, chars.value, 5)
  return authoredBreaks.value ? lines : balanceLines(lines)
})
const setupLines = computed(() => boldLines.value.slice(0, -1))
const punchLines = computed(() => {
  const last = boldLines.value[boldLines.value.length - 1] || ''
  if (!last) return []
  const wrapped = breakLines(last, chars.value + 2, 2)
  return authoredBreaks.value ? wrapped : balanceLines(wrapped)
})

const titleLines = computed(() => {
  const lines = breakLines(statement.value, chars.value + 4, 3)
  return authoredBreaks.value ? lines : balanceLines(lines)
})

function fit(lines, fullAt) {
  const longest = Math.max(1, ...lines.map((line) => line.length))
  return Math.max(0.42, Math.min(1, fullAt / longest))
}

const setupStyle = computed(() => ({ fontSize: `calc(var(--setup) * ${fit(setupLines.value, 18)})` }))
const punchStyle = computed(() => ({ fontSize: `calc(var(--punch) * ${fit(punchLines.value, 12)})` }))
const titleStyle = computed(() => ({ fontSize: `calc(var(--title) * ${fit(titleLines.value, 16)})` }))

const ariaLabel = computed(() => [statement.value, insight.value, support.value].filter(Boolean).join('. '))
</script>

<style scoped>
.board {
  position: relative;
  display: flex;
  flex-direction: column;
  width: var(--board-w, 1080px);
  height: var(--board-h, 1350px);
  padding: var(--safe-top) var(--safe-x) var(--sig-bottom);
  overflow: hidden;
  background: #070709;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  box-sizing: border-box;
}

.eyebrow {
  margin: 0;
  color: rgba(247, 249, 252, 0.62);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.28em;
  line-height: 1;
  text-transform: uppercase;
}

/* —— Bold Insight —— */
.is-bold {
  background:
    radial-gradient(90% 50% at 0% 100%, rgba(192, 132, 252, 0.16), transparent 60%),
    #070709;
}

.poster {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
  margin-top: 28px;
}

.poster__setup,
.poster__punch {
  margin: 0;
  text-transform: uppercase;
}

.poster__setup {
  display: flex;
  flex-direction: column;
  color: rgba(247, 249, 252, 0.78);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 0.92;
}

.poster__setup span { display: block; }

.poster__punch {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.86;
}

.poster__punch span {
  display: block;
  width: fit-content;
  max-width: 100%;
  background: linear-gradient(90deg, #ff4ad8 0%, #c084fc 52%, #67e8f9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.poster__rule {
  display: block;
  width: 72px;
  height: 3px;
  margin-top: 36px;
  background: linear-gradient(90deg, #ff4ad8, #c084fc 60%, #67e8f9);
}

.poster__support {
  max-width: 16em;
  margin: 22px 0 0;
  color: rgba(247, 249, 252, 0.82);
  font-size: var(--body);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.25;
  text-wrap: balance;
}

/* —— Music Playbook —— */
.is-playbook { background: #09090b; }

.note__head {
  display: flex;
  gap: 22px;
  align-items: center;
}

.note__rule {
  display: block;
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(247, 249, 252, 0.28), rgba(247, 249, 252, 0));
}

.note {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
  margin-top: 36px;
}

.note__title {
  display: flex;
  flex-direction: column;
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.045em;
  line-height: 0.92;
  text-transform: uppercase;
}

.note__title span { display: block; }

.take {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 28px;
  align-items: start;
  margin-top: 40px;
}

.take__num {
  color: transparent;
  font-size: 72px;
  font-weight: 800;
  letter-spacing: -0.06em;
  line-height: 0.8;
  -webkit-text-stroke: 2px rgba(192, 132, 252, 0.9);
}

.take__text {
  margin: 4px 0 0;
  font-size: var(--take);
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.15;
  text-wrap: balance;
}

.note__body {
  max-width: 28em;
  margin: 28px 0 0;
  color: rgba(247, 249, 252, 0.72);
  font-size: var(--body);
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.35;
  text-wrap: balance;
}

.sig {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 28px;
}

.sig__mark { width: 156px; height: auto; }

.sig__site {
  color: rgba(247, 249, 252, 0.46);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.board[data-format="square"] .eyebrow { font-size: 15px; }
.board[data-format="square"] .poster { margin-top: 16px; }
.board[data-format="square"] .poster__rule { margin-top: 24px; }
.board[data-format="square"] .poster__support { margin-top: 16px; }
.board[data-format="square"] .take { margin-top: 28px; gap: 18px; }
.board[data-format="square"] .take__num { font-size: 52px; }
.board[data-format="square"] .note__body { margin-top: 18px; }
.board[data-format="square"] .sig__mark { width: 132px; }

.board[data-format="story"] .eyebrow { font-size: 20px; }
.board[data-format="story"] .poster__rule { margin-top: 48px; }
.board[data-format="story"] .poster__support { margin-top: 28px; }
.board[data-format="story"] .take { margin-top: 56px; }
.board[data-format="story"] .take__num { font-size: 88px; }
.board[data-format="story"] .note__body { margin-top: 36px; }
.board[data-format="story"] .sig__mark { width: 176px; }
</style>
