<template>
  <section id="analytics" ref="root" class="aud" aria-labelledby="aud-title">
    <div class="aud__inner">
      <header class="aud__head">
        <div>
          <h2 id="aud-title" class="aud__title">
            <span>See what moves</span>
            <span class="aud__accent">your audience.</span>
          </h2>
          <p class="aud__lede">Where fans come from, what they tap and play, and which nights bring them to your page.</p>
        </div>
        <p class="aud__note"><b>Sample report.</b> Every measurement here is one Faneqo reports for artists. The numbers are illustrative, not a real artist’s results.</p>
      </header>

      <!-- The figure line: four totals for the last 30 days, set like a financial page -->
      <dl class="aud__figures">
        <div v-for="kpi in kpis" :key="kpi.label" class="aud-fig">
          <dd class="aud-fig__value">{{ kpi.value }}</dd>
          <dt class="aud-fig__label">{{ kpi.label }}</dt>
          <dd class="aud-fig__def">{{ kpi.def }}</dd>
        </div>
      </dl>

      <!-- 1 · What happened: the month, day by day, each measure on its own scale -->
      <figure class="aud-chart" aria-label="Page views and QR scans per day over the last 30 days">
        <figcaption class="aud-chart__cap">
          <span class="aud-key aud-key--views">Page views per day</span>
          <span class="aud-key aud-key--scans">QR scans per day <i>own scale</i></span>
          <span class="aud-chart__period">Last 30 days</span>
        </figcaption>

        <div class="aud-chart__plot">
          <div class="aud-chart__grid" aria-hidden="true">
            <span v-for="g in grid" :key="g" :style="{ bottom: `${(g / yMax) * 100}%` }"><b>{{ fmt(g) }}</b></span>
          </div>
          <svg class="aud-chart__views" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="aud-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#6fe3f5" stop-opacity="0.28" />
                <stop offset="1" stop-color="#6fe3f5" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path class="aud-chart__area" :d="area" fill="url(#aud-fill)" />
            <path class="aud-chart__line" :d="line" />
          </svg>

          <!-- The one marked day, with its exact values -->
          <div class="aud-mark" :style="{ left: `${showX}%` }" aria-hidden="true">
            <span class="aud-mark__rule"></span>
            <span class="aud-mark__dot" :style="{ bottom: `${(peak / yMax) * 100}%` }"></span>
            <div class="aud-mark__note">
              <b>Show night</b>
              <span>{{ fmt(peak) }} page views</span>
              <span>{{ fmt(scanPeak) }} QR scans</span>
            </div>
          </div>
        </div>

        <svg class="aud-chart__scans" viewBox="0 0 1200 70" preserveAspectRatio="none" aria-hidden="true">
          <rect
            v-for="(s, i) in scans"
            :key="i"
            :x="i * step + step * 0.22"
            :y="70 - Math.max(2, (s / scanPeak) * 66)"
            :width="step * 0.56"
            :height="Math.max(2, (s / scanPeak) * 66)"
            :class="['aud-chart__bar', { 'is-show': i === showDay }]"
          />
        </svg>

        <div class="aud-chart__axis" aria-hidden="true">
          <span>30 days ago</span>
          <span>2 weeks ago</span>
          <span>Today</span>
        </div>
      </figure>

      <!-- 2 and 3 · Where attention came from, and what fans reached for -->
      <div class="aud__reads">
        <section class="aud-read" aria-labelledby="aud-where">
          <h3 id="aud-where" class="aud-read__ask">Where they came from</h3>
          <p class="aud-read__metric">Share of page views by source</p>
          <div class="aud-share" aria-hidden="true">
            <i v-for="row in sources" :key="row.name" :class="`is-${row.key}`" :style="{ width: `${row.share}%` }"></i>
          </div>
          <ul class="aud-legend">
            <li v-for="row in sources" :key="row.name">
              <span class="aud-legend__swatch" :class="`is-${row.key}`" aria-hidden="true"></span>
              <span class="aud-legend__name">{{ row.name }}</span>
              <b>{{ row.share }}%</b>
            </li>
          </ul>
        </section>

        <section class="aud-read" aria-labelledby="aud-what">
          <h3 id="aud-what" class="aud-read__ask">What they reached for</h3>
          <p class="aud-read__metric">Link clicks by destination</p>
          <ol class="aud-rank">
            <li v-for="row in links" :key="row.name">
              <span class="aud-rank__name">{{ row.name }}</span>
              <span class="aud-rank__bar"><i :style="{ width: `${row.count / links[0].count * 100}%` }"></i></span>
              <b>{{ fmt(row.count) }}</b>
            </li>
          </ol>
          <p class="aud-read__plays">Plays on the page: <b>{{ fmt(plays.songs) }}</b> songs, <b>{{ fmt(plays.videos) }}</b> videos</p>
        </section>
      </div>

      <p class="aud__finding">
        In this sample, show night was the month’s biggest day on both measures, and one in five page views came from a QR code.
      </p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useHomeStoryMotion, revealLines, arrive } from '~/composables/home-v2/useHomeStoryMotion'

// Illustrative values in the shape of GET /analytics/rollups and /analytics/geo
// (page views by day and refSource, link clicks by platform, plays by mediaType,
// QR scans by day). Totals are derived from the series so every number agrees,
// and they match the sample report in the flagship presentation.
const views = [310, 290, 335, 360, 340, 300, 285, 330, 352, 371, 344, 318, 296, 402, 455, 498, 540, 612, 688, 760, 1480, 1110, 842, 690, 604, 548, 512, 486, 470, 452]
const scans = [4, 3, 5, 6, 4, 3, 3, 5, 6, 7, 5, 4, 4, 9, 12, 14, 18, 22, 26, 34, 412, 96, 38, 24, 19, 16, 14, 12, 11, 10]
const links = [
  { name: 'Spotify', count: 1480 },
  { name: 'Tickets', count: 1046 },
  { name: 'Apple Music', count: 712 },
  { name: 'YouTube', count: 674 },
]
const plays = { songs: 1958, videos: 686 }
const sources = [
  { key: 'direct', name: 'Direct', share: 36 },
  { key: 'instagram', name: 'Instagram', share: 27 },
  { key: 'qr', name: 'QR code', share: 21 },
  { key: 'search', name: 'Google', share: 16 },
]

const fmt = (n) => n.toLocaleString('en-US')
const sum = (list) => list.reduce((a, b) => a + b, 0)

const kpis = [
  { label: 'Page views', value: fmt(sum(views)), def: 'Visits to your page' },
  { label: 'Link clicks', value: fmt(sum(links.map((l) => l.count))), def: 'Taps out to music, tickets and socials' },
  { label: 'Song & video plays', value: fmt(plays.songs + plays.videos), def: 'Plays started on your page' },
  { label: 'QR scans', value: fmt(sum(scans)), def: 'Scans of your Faneqo codes' },
]

const peak = Math.max(...views)
const showDay = views.indexOf(peak)
const scanPeak = Math.max(...scans)
const yMax = 1600
const grid = [500, 1000, 1500]
const step = 1200 / views.length
const showX = ((showDay + 0.5) / views.length) * 100
const pts = views.map((v, i) => [i * step + step / 2, 300 - (v / yMax) * 300])
const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
const area = `${line} L${pts.at(-1)[0].toFixed(1)},300 L${pts[0][0].toFixed(1)},300 Z`

// The read builds in the order a person reads it: the claim, the totals, the
// month drawing itself left to right, the marked night, then where and what.
const root = ref(null)
useHomeStoryMotion(root, (tl, { q }) => {
  revealLines(tl, q('.aud__title span'), 0, { stagger: 0.14 })
  arrive(tl, q('.aud__lede, .aud__note'), 0.45, { y: 10, stagger: 0.1 })
  arrive(tl, q('.aud-fig'), 0.7, { y: 22, stagger: 0.1, duration: 0.7 })

  arrive(tl, q('.aud-chart__cap, .aud-chart__grid'), 1.15, { y: 0, duration: 0.5 })
  tl.fromTo(q('.aud-chart__views'), { clipPath: 'inset(0% 100% -5% 0%)' }, { clipPath: 'inset(0% 0% -5% 0%)', duration: 1.7, ease: 'power2.inOut', clearProps: 'clipPath' }, 1.25)
  tl.from(q('.aud-chart__bar'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.45, ease: 'power2.out', stagger: 0.03, clearProps: 'transform' }, 1.4)
  arrive(tl, q('.aud-mark'), 2.55, { y: 8, duration: 0.6 })
  arrive(tl, q('.aud-chart__axis'), 2.6, { y: 0, duration: 0.5 })

  arrive(tl, q('.aud-read'), 2.9, { y: 18, stagger: 0.14 })
  tl.from(q('.aud-share i'), { scaleX: 0, transformOrigin: '0% 50%', duration: 0.6, ease: 'power2.out', stagger: 0.1, clearProps: 'transform' }, 3.1)
  tl.from(q('.aud-rank__bar i'), { scaleX: 0, transformOrigin: '0% 50%', duration: 0.7, ease: 'power2.out', stagger: 0.06, clearProps: 'transform' }, 3.25)
  arrive(tl, q('.aud__finding'), 3.8, { y: 8 })
}, { threshold: 0.12 })
</script>

<style scoped>
.aud {
  --bg: #08090d;
  --ink: #f5f2ee;
  --muted: #a0a3ad;
  --quiet: #6b6e78;
  --hair: rgba(245, 242, 238, 0.1);
  --views: #6fe3f5;
  --scans: #9b87ff;
  position: relative;
  z-index: 10;
  background: var(--bg);
  color: var(--ink);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  font-variant-numeric: tabular-nums;
}

.aud *, .aud *::before, .aud *::after { box-sizing: border-box; }
:where(.aud) :where(p, h2, h3, dl, dd, ul, ol, figure) { margin: 0; padding: 0; }
.aud svg { display: block; }

.aud__inner { max-width: 84rem; margin: 0 auto; padding: clamp(4.5rem, 8vw, 7rem) clamp(1.25rem, 5vw, 4.5rem); }

.aud__head { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); align-items: end; gap: 1.5rem 4rem; }

.aud__title { font-size: clamp(2.5rem, 5vw, 4.8rem); font-weight: 800; letter-spacing: -0.045em; line-height: 0.96; }
.aud__title span { display: block; }

.aud__accent {
  background: linear-gradient(90deg, #6fe3f5, #9b87ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.aud__lede { max-width: 34rem; margin-top: 1.25rem; color: var(--muted); font-size: clamp(1.0625rem, 1.3vw, 1.2rem); line-height: 1.55; }

.aud__note { max-width: 24rem; padding-left: 1rem; border-left: 1px solid var(--hair); color: var(--quiet); font-size: 0.875rem; line-height: 1.55; }
.aud__note b { color: var(--muted); font-weight: 600; }

/* The figure line */
.aud__figures {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: clamp(2.5rem, 5vw, 3.5rem);
  border-top: 1px solid rgba(245, 242, 238, 0.28);
  border-bottom: 1px solid var(--hair);
}

.aud-fig { display: flex; flex-direction: column; padding: 1.6rem 1.5rem 1.5rem 0; }
.aud-fig + .aud-fig { padding-left: 1.5rem; border-left: 1px solid var(--hair); }
.aud-fig__value { order: 1; font-size: clamp(2.4rem, 4.4vw, 4.2rem); font-weight: 650; letter-spacing: -0.045em; line-height: 1; }
.aud-fig__label { order: 2; margin-top: 0.75rem; font-size: 1rem; font-weight: 600; }
.aud-fig__def { order: 3; margin-top: 0.2rem; color: var(--quiet); font-size: 0.875rem; line-height: 1.4; }

/* The chart: the dominant element */
.aud-chart { margin-top: clamp(2.5rem, 5vw, 3.5rem); }

.aud-chart__cap { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1.75rem; font-size: 0.875rem; font-weight: 500; }
.aud-chart__period { margin-left: auto; color: var(--quiet); }

.aud-key::before { content: ''; display: inline-block; margin-right: 0.55rem; vertical-align: middle; border-radius: 2px; }
.aud-key--views::before { width: 1.1rem; height: 3px; background: var(--views); }
.aud-key--scans::before { width: 0.45rem; height: 0.8rem; background: var(--scans); }
.aud-key i { margin-left: 0.3rem; color: var(--quiet); font-style: normal; }

.aud-chart__plot { position: relative; height: clamp(14rem, 22vw, 19rem); margin-top: 1.25rem; }

.aud-chart__grid { position: absolute; inset: 0; }
.aud-chart__grid span { position: absolute; left: 0; right: 0; border-top: 1px dashed rgba(245, 242, 238, 0.08); }
.aud-chart__grid b { position: absolute; left: 0; bottom: 0.3rem; color: var(--quiet); font-size: 0.75rem; font-weight: 500; }

.aud-chart__views { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.aud-chart__line { fill: none; stroke: var(--views); stroke-width: 2.5; stroke-linejoin: round; vector-effect: non-scaling-stroke; }

.aud-mark { position: absolute; top: 0; bottom: 0; width: 0; }
.aud-mark__rule { position: absolute; top: 0; bottom: -6.2rem; left: 0; border-left: 1px solid rgba(245, 242, 238, 0.35); }
.aud-mark__dot { position: absolute; left: -0.4rem; width: 0.8rem; height: 0.8rem; margin-bottom: -0.4rem; border-radius: 999px; background: var(--views); box-shadow: 0 0 0 0.3rem rgba(111, 227, 245, 0.18); }

.aud-mark__note {
  position: absolute;
  top: 0;
  left: 1rem;
  display: grid;
  gap: 0.1rem;
  padding: 0.7rem 0.9rem;
  border-radius: 0.6rem;
  background: #111318;
  box-shadow: inset 0 0 0 1px var(--hair);
  white-space: nowrap;
  font-size: 0.875rem;
}

.aud-mark__note b { font-weight: 650; }
.aud-mark__note span { color: var(--muted); }

.aud-chart__scans { width: 100%; height: 4.4rem; margin-top: 1.4rem; overflow: visible; }
.aud-chart__bar { fill: rgba(155, 135, 255, 0.32); }
.aud-chart__bar.is-show { fill: var(--scans); }

.aud-chart__axis { display: flex; justify-content: space-between; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--hair); color: var(--quiet); font-size: 0.8125rem; }

/* The two reads */
.aud__reads { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(2rem, 5vw, 5rem); margin-top: clamp(3rem, 6vw, 4.5rem); }

.aud-read__ask { font-size: clamp(1.35rem, 2vw, 1.75rem); font-weight: 750; letter-spacing: -0.03em; }
.aud-read__metric { margin-top: 0.3rem; color: var(--quiet); font-size: 0.875rem; }

.aud-share { display: flex; gap: 3px; height: 0.9rem; margin-top: 1.4rem; overflow: hidden; border-radius: 999px; }
.aud-share i { display: block; height: 100%; }

.is-direct { background: #f5f2ee; }
.is-instagram { background: #9b87ff; }
.is-qr { background: #6fe3f5; }
.is-search { background: #4b4f5c; }

.aud-legend { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 2rem; margin-top: 1.1rem; list-style: none; }
.aud-legend li { display: flex; align-items: center; gap: 0.6rem; padding: 0.65rem 0; border-top: 1px solid var(--hair); font-size: 0.9375rem; }
.aud-legend__swatch { flex: none; width: 0.6rem; height: 0.6rem; border-radius: 2px; }
.aud-legend__name { flex: 1; color: var(--muted); }
.aud-legend b { font-weight: 650; }

.aud-rank { margin-top: 1.1rem; list-style: none; }
.aud-rank li { display: grid; grid-template-columns: 7rem 1fr 3.75rem; align-items: center; gap: 1rem; padding: 0.65rem 0; border-top: 1px solid var(--hair); font-size: 0.9375rem; }
.aud-rank__name { color: var(--muted); }
.aud-rank__bar { height: 0.3rem; border-radius: 999px; background: rgba(245, 242, 238, 0.07); }
.aud-rank__bar i { display: block; height: 100%; border-radius: inherit; background: #f5f2ee; }
.aud-rank b { font-weight: 650; text-align: right; }

.aud-read__plays { margin-top: 1rem; padding-top: 0.9rem; border-top: 1px solid var(--hair); color: var(--muted); font-size: 0.9375rem; }
.aud-read__plays b { color: var(--ink); font-weight: 650; }

.aud__finding { max-width: 46rem; margin-top: clamp(2.5rem, 5vw, 3.5rem); font-size: clamp(1.125rem, 1.5vw, 1.35rem); font-weight: 500; letter-spacing: -0.01em; line-height: 1.5; }

@media (max-width: 960px) {
  .aud__head { grid-template-columns: 1fr; }
  .aud__figures { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .aud-fig:nth-child(3) { padding-left: 0; border-left: 0; }
  .aud-fig:nth-child(n + 3) { border-top: 1px solid var(--hair); }
  .aud__reads { grid-template-columns: 1fr; }
}

@media (max-width: 560px) {
  .aud-fig { padding: 1.2rem 0.75rem 1.2rem 0; }
  .aud-fig + .aud-fig { padding-left: 0.9rem; }
  .aud-fig:nth-child(3) { padding-left: 0; }
  .aud-fig__value { font-size: 2.1rem; }
  .aud-fig__label { font-size: 0.9375rem; }
  .aud-fig__def { font-size: 0.8125rem; }
  .aud-chart__period { margin-left: 0; width: 100%; }
  .aud-chart__plot { height: 13rem; }
  .aud-mark__note { left: auto; right: 0.9rem; padding: 0.5rem 0.65rem; font-size: 0.8125rem; }
  .aud-mark__rule { bottom: -5.6rem; }
  .aud-chart__scans { height: 3.6rem; }
  .aud-legend { grid-template-columns: 1fr; }
  .aud-rank li { grid-template-columns: 6rem 1fr 3.25rem; gap: 0.75rem; }
}
</style>
