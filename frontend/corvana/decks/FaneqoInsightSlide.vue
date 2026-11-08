<template>
  <article ref="root" class="fq-insight" aria-labelledby="fq-insight-title">
    <div class="fq-stage">
      <h2 id="fq-insight-title" class="fq-insight__title">
        <span>See what moves</span>
        <em>your audience.</em>
      </h2>

      <p class="fq-insight__flag">
        <strong>Sample report.</strong>
        These are the metrics Faneqo reports for an artist; the values are demo data, not a real artist’s results.
      </p>

      <!-- The four totals the analytics page leads with, each with what it counts -->
      <dl class="fq-kpis">
        <div v-for="kpi in kpis" :key="kpi.label" class="fq-kpi">
          <dt>{{ kpi.label }}</dt>
          <dd>{{ kpi.value }}</dd>
          <dd class="fq-kpi__def">{{ kpi.def }}</dd>
        </div>
      </dl>

      <!-- Which moments moved people: two measures, each on its own scale, sharing one timeline -->
      <section class="fq-q fq-q--time">
        <h3 class="fq-q__ask">Which moments move people?</h3>

        <figure class="fq-mini" aria-label="Page views per day, last 30 days">
          <figcaption><span>Page views per day</span><b>peak {{ fmt(viewsPeak) }}</b></figcaption>
          <svg viewBox="0 0 1000 180" preserveAspectRatio="none" aria-hidden="true">
            <line x1="0" x2="1000" y1="180" y2="180" class="fq-mini__base" />
            <path :d="viewsArea" class="fq-mini__area" />
            <path :d="viewsLine" class="fq-mini__line" />
          </svg>
        </figure>

        <figure class="fq-mini fq-mini--bars" aria-label="QR scans per day, last 30 days">
          <figcaption><span>QR scans per day</span><b>peak {{ fmt(scansPeak) }}</b></figcaption>
          <svg viewBox="0 0 1000 90" preserveAspectRatio="none" aria-hidden="true">
            <line x1="0" x2="1000" y1="90" y2="90" class="fq-mini__base" />
            <rect
              v-for="(s, i) in scans"
              :key="i"
              :x="i * step + step * 0.2"
              :y="90 - Math.max(1.5, (s / scansPeak) * 86)"
              :width="step * 0.6"
              :height="Math.max(1.5, (s / scansPeak) * 86)"
              :class="['fq-mini__bar', { 'is-show': i === showDay }]"
            />
          </svg>
        </figure>

        <div class="fq-mini__axis" aria-hidden="true">
          <span>30 days ago</span>
          <span class="fq-mini__show" :style="{ left: `${(showDay + 0.5) / days * 100}%` }">Show night</span>
          <span>Today</span>
        </div>

        <p class="fq-q__finding">
          Show night was the month’s biggest day on both measures: {{ fmt(viewsPeak) }} page views and {{ fmt(scansPeak) }} QR scans.
        </p>
      </section>

      <!-- Where fans come from -->
      <section class="fq-q fq-q--where">
        <h3 class="fq-q__ask">Where are fans coming from?</h3>
        <p class="fq-q__metric">Page views by source</p>
        <div v-for="row in sources" :key="row.name" class="fq-rank__row">
          <span class="fq-rank__name">{{ row.name }}</span>
          <span class="fq-rank__bar"><i :style="{ width: `${row.share / sources[0].share * 100}%` }"></i></span>
          <span class="fq-rank__value">{{ row.share }}%</span>
        </div>
        <p class="fq-q__metric fq-q__metric--gap">Page views by city</p>
        <div v-for="row in cities" :key="row.name" class="fq-rank__row">
          <span class="fq-rank__name">{{ row.name }}</span>
          <span class="fq-rank__bar"><i :style="{ width: `${row.count / cities[0].count * 100}%` }"></i></span>
          <span class="fq-rank__value">{{ fmt(row.count) }}</span>
        </div>
      </section>

      <!-- What gets attention -->
      <section class="fq-q fq-q--what">
        <h3 class="fq-q__ask">What gets their attention?</h3>
        <p class="fq-q__metric">Link clicks by destination</p>
        <div v-for="row in links" :key="row.name" class="fq-rank__row">
          <span class="fq-rank__name">{{ row.name }}</span>
          <span class="fq-rank__bar"><i :style="{ width: `${row.count / links[0].count * 100}%` }"></i></span>
          <span class="fq-rank__value">{{ fmt(row.count) }}</span>
        </div>
        <p class="fq-q__metric fq-q__metric--gap">Plays on the page</p>
        <div v-for="row in plays" :key="row.name" class="fq-rank__row">
          <span class="fq-rank__name">{{ row.name }}</span>
          <span class="fq-rank__bar"><i :style="{ width: `${row.count / plays[0].count * 100}%` }"></i></span>
          <span class="fq-rank__value">{{ fmt(row.count) }}</span>
        </div>
      </section>
    </div>
  </article>
</template>

<script setup>
import { ref } from 'vue'
import { useSceneMotion, revealLines, arrive } from './motion/useSceneMotion.js'
// Demo values in the exact shape of GET /analytics/rollups and /analytics/geo
// (qrserver src/api/analytics/controllers/analytics.js): totals, daily series,
// page views by refSource and city, link clicks by platform, plays by mediaType.
// Replace with an approved artist snapshot before external use.
const days = 30
const showDay = 20
const views = [310, 290, 335, 360, 340, 300, 285, 330, 352, 371, 344, 318, 296, 402, 455, 498, 540, 612, 688, 760, 1480, 1110, 842, 690, 604, 548, 512, 486, 470, 452]
const scans = [4, 3, 5, 6, 4, 3, 3, 5, 6, 7, 5, 4, 4, 9, 12, 14, 18, 22, 26, 34, 412, 96, 38, 24, 19, 16, 14, 12, 11, 10]

const fmt = (n) => n.toLocaleString('en-US')
const sum = (list) => list.reduce((a, b) => a + b, 0)

const viewsPeak = Math.max(...views)
const scansPeak = Math.max(...scans)
const step = 1000 / days
const pts = views.map((v, i) => [i * step + step / 2, 180 - (v / viewsPeak) * 168])
const viewsLine = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
const viewsArea = `${viewsLine} L${pts.at(-1)[0].toFixed(1)},180 L${pts[0][0].toFixed(1)},180 Z`

const links = [
  { name: 'Spotify', count: 1480 },
  { name: 'Tickets', count: 1046 },
  { name: 'Apple Music', count: 712 },
  { name: 'YouTube', count: 674 },
]

const plays = [
  { name: 'Songs', count: 1958 },
  { name: 'Videos', count: 686 },
]

const kpis = [
  { label: 'Page views', value: fmt(sum(views)), def: 'Visits to the artist’s page' },
  { label: 'Link clicks', value: fmt(sum(links.map((l) => l.count))), def: 'Taps out to music, tickets and socials' },
  { label: 'Song & video plays', value: fmt(sum(plays.map((p) => p.count))), def: 'Plays started on the page' },
  { label: 'QR scans', value: fmt(sum(scans)), def: 'Scans of the artist’s Faneqo codes' },
]

const sources = [
  { name: 'Direct', share: 36 },
  { name: 'Instagram', share: 27 },
  { name: 'QR code', share: 21 },
  { name: 'Google', share: 16 },
]

const cities = [
  { name: 'Nashville', count: 2140 },
  { name: 'Chicago', count: 1386 },
  { name: 'Austin', count: 1102 },
]

// Information becoming legible, in reading order. Totals appear as they are
// (no counting through numbers that never existed); each chart is drawn from
// its own data, on its own scale, left to right in time.
const root = ref(null)
useSceneMotion(root, (tl, { q }) => {
  revealLines(tl, q('.fq-insight__title span, .fq-insight__title em'), 0)
  arrive(tl, q('.fq-insight__flag'), 0.55, { x: 12, y: 0 })
  arrive(tl, q('.fq-kpi'), 0.75, { y: 16, stagger: 0.12, duration: 0.6 })

  const ask = q('.fq-q__ask')
  arrive(tl, ask[0], 1.45, { y: 10 })
  arrive(tl, q('.fq-q--time .fq-mini figcaption'), 1.6, { y: 6, stagger: 0.25 })
  tl.fromTo(q('.fq-q--time .fq-mini:not(.fq-mini--bars) svg'),
    { clipPath: 'inset(0% 100% -10% 0%)' },
    { clipPath: 'inset(0% 0% -10% 0%)', duration: 1.6, ease: 'power2.inOut', clearProps: 'clipPath' }, 1.7)
  tl.from(q('.fq-mini__bar'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.5, ease: 'power2.out', stagger: 0.035, clearProps: 'transform' }, 2.4)
  arrive(tl, q('.fq-mini__axis'), 3.3, { y: 0, duration: 0.5 })

  arrive(tl, ask[1], 2.2, { y: 10 })
  arrive(tl, q('.fq-q--where .fq-q__metric, .fq-q--where .fq-rank__row'), 2.35, { y: 8, stagger: 0.05, duration: 0.45 })
  tl.from(q('.fq-q--where .fq-rank__bar i'), { scaleX: 0, transformOrigin: '0% 50%', duration: 0.8, ease: 'power2.out', stagger: 0.05, clearProps: 'transform' }, 2.5)

  arrive(tl, ask[2], 2.8, { y: 10 })
  arrive(tl, q('.fq-q--what .fq-q__metric, .fq-q--what .fq-rank__row'), 2.95, { y: 8, stagger: 0.05, duration: 0.45 })
  tl.from(q('.fq-q--what .fq-rank__bar i'), { scaleX: 0, transformOrigin: '0% 50%', duration: 0.8, ease: 'power2.out', stagger: 0.05, clearProps: 'transform' }, 3.1)

  arrive(tl, q('.fq-q__finding'), 3.8, { y: 10 })
})
</script>

<style scoped>
.fq-insight {
  --u: calc(min(100cqw, 177.78cqh) / 1920);
  --paper: #f3f0ea;
  --ink: #16141a;
  --muted: #625d57;
  --hair: rgba(22, 20, 26, 0.12);
  --scan: #5b46d6;
  --serif: 'DM Serif Display', 'Iowan Old Style', Georgia, serif;
  box-sizing: border-box;
  container-type: size;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--paper);
  color: var(--ink);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
}

.fq-insight *, .fq-insight *::before, .fq-insight *::after { box-sizing: border-box; }
:where(.fq-insight) :where(p, h2, h3, dl, dd, figure) { margin: 0; }
.fq-insight svg { display: block; }

.fq-stage {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(1920 * var(--u));
  height: calc(1080 * var(--u));
  transform: translate(-50%, -50%);
}

.fq-insight__title {
  position: absolute;
  left: calc(128 * var(--u));
  top: calc(88 * var(--u));
  font-family: var(--serif);
  font-size: calc(84 * var(--u));
  font-weight: 400;
  letter-spacing: -0.022em;
  line-height: 0.98;
}

.fq-insight__title span,
.fq-insight__title em { display: block; }
.fq-insight__title em { font-style: italic; }

.fq-insight__flag {
  position: absolute;
  right: calc(128 * var(--u));
  top: calc(104 * var(--u));
  width: calc(470 * var(--u));
  padding-left: calc(20 * var(--u));
  border-left: 2px solid var(--ink);
  color: var(--muted);
  font-size: calc(17 * var(--u));
  line-height: 1.5;
}

.fq-insight__flag strong { color: var(--ink); font-weight: 600; }

/* KPI strip */
.fq-kpis {
  position: absolute;
  left: calc(128 * var(--u));
  top: calc(296 * var(--u));
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  width: calc(1664 * var(--u));
  border-top: 2px solid var(--ink);
}

.fq-kpi { padding-top: calc(16 * var(--u)); }

.fq-kpi dt {
  font-size: calc(18 * var(--u));
  font-weight: 600;
}

.fq-kpi dd {
  margin-top: calc(2 * var(--u));
  font-size: calc(64 * var(--u));
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.08;
}

.fq-kpi dd.fq-kpi__def {
  margin-top: calc(4 * var(--u));
  color: var(--muted);
  font-size: calc(16 * var(--u));
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.4;
}

/* The three questions */
.fq-q {
  position: absolute;
  top: calc(512 * var(--u));
}

.fq-q--time { left: calc(128 * var(--u)); width: calc(740 * var(--u)); }
.fq-q--where { left: calc(952 * var(--u)); width: calc(400 * var(--u)); }
.fq-q--what { left: calc(1392 * var(--u)); width: calc(400 * var(--u)); }

.fq-q__ask {
  margin-bottom: calc(20 * var(--u));
  font-family: var(--serif);
  font-size: calc(30 * var(--u));
  font-weight: 400;
  letter-spacing: -0.01em;
  line-height: 1.1;
}

.fq-q__metric {
  margin-bottom: calc(6 * var(--u));
  color: var(--muted);
  font-size: calc(16 * var(--u));
  font-weight: 500;
}

.fq-q__metric--gap { margin-top: calc(26 * var(--u)); }

.fq-q__finding {
  margin-top: calc(26 * var(--u));
  max-width: calc(640 * var(--u));
  font-size: calc(20 * var(--u));
  font-weight: 500;
  line-height: 1.45;
}

/* Small multiples */
.fq-mini + .fq-mini { margin-top: calc(18 * var(--u)); }

.fq-mini figcaption {
  display: flex;
  justify-content: space-between;
  margin-bottom: calc(8 * var(--u));
  color: var(--muted);
  font-size: calc(16 * var(--u));
  font-weight: 500;
}

.fq-mini figcaption b { color: var(--ink); font-weight: 600; }
.fq-mini svg { width: 100%; height: calc(150 * var(--u)); overflow: visible; }
.fq-mini--bars svg { height: calc(74 * var(--u)); }

.fq-mini__base { stroke: var(--hair); stroke-width: 1; vector-effect: non-scaling-stroke; }
.fq-mini__area { fill: rgba(22, 20, 26, 0.06); }
.fq-mini__line { fill: none; stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.fq-mini__bar { fill: rgba(91, 70, 214, 0.38); }
.fq-mini__bar.is-show { fill: var(--scan); }

.fq-mini__axis {
  position: relative;
  display: flex;
  justify-content: space-between;
  margin-top: calc(10 * var(--u));
  color: var(--muted);
  font-size: calc(15 * var(--u));
}

.fq-mini__show {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  color: var(--ink);
  font-weight: 600;
}

/* Ranked lists */
.fq-rank__row {
  display: grid;
  grid-template-columns: calc(124 * var(--u)) 1fr calc(64 * var(--u));
  align-items: center;
  gap: calc(14 * var(--u));
  padding: calc(7 * var(--u)) 0;
  border-top: 1px solid var(--hair);
  font-size: calc(18 * var(--u));
}

.fq-rank__bar { height: calc(6 * var(--u)); border-radius: 999px; background: rgba(22, 20, 26, 0.07); }
.fq-rank__bar i { display: block; height: 100%; border-radius: inherit; background: var(--ink); }
.fq-rank__value { font-weight: 600; text-align: right; }

/* ---------- Phone ---------- */
@media (max-width: 900px), (max-aspect-ratio: 5/4) {
  .fq-insight { --u: 1px; overflow-x: hidden; overflow-y: auto; }

  .fq-stage {
    position: relative;
    left: auto;
    top: auto;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 34rem;
    height: auto;
    margin-inline: auto;
    padding: calc(2.5rem + env(safe-area-inset-top, 0px)) 1.25rem calc(6.5rem + env(safe-area-inset-bottom, 0px));
    transform: none;
  }

  .fq-insight__title,
  .fq-insight__flag,
  .fq-kpis,
  .fq-q { position: relative; left: auto; right: auto; top: auto; width: auto; }

  .fq-insight__title { font-size: clamp(2.6rem, 12vw, 3.6rem); }
  .fq-insight__flag { margin-top: 1.25rem; padding-left: 0.75rem; font-size: 0.875rem; }

  .fq-kpis { grid-template-columns: 1fr 1fr; column-gap: 1rem; margin-top: 1.75rem; }
  .fq-kpi { padding: 0.8rem 0; }
  .fq-kpi dt { font-size: 0.875rem; }
  .fq-kpi dd { font-size: 2rem; }
  .fq-kpi dd.fq-kpi__def { font-size: 0.8125rem; }

  .fq-q { margin-top: 2.25rem; }
  .fq-q__ask { margin-bottom: 0.75rem; font-size: 1.5rem; }
  .fq-q__metric { font-size: 0.8125rem; }
  .fq-q__metric--gap { margin-top: 1.25rem; }
  .fq-q__finding { margin-top: 1rem; font-size: 1rem; }

  .fq-mini figcaption { font-size: 0.8125rem; }
  .fq-mini svg { height: 7rem; }
  .fq-mini--bars svg { height: 3.5rem; }
  .fq-mini__axis { font-size: 0.75rem; }

  .fq-rank__row { grid-template-columns: 6.5rem 1fr 3.5rem; gap: 0.6rem; font-size: 0.9375rem; }
}
</style>
