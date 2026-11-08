<template>
  <article
    class="board"
    :data-format="formatId"
    :style="boardStyle"
    :aria-label="`${post.headlineTop} ${post.headlineAccent}. ${post.artistName}.`"
  >
    <header class="series">
      <p>{{ post.seriesLabel }}</p>
    </header>

    <h1>
      <span class="line">{{ post.headlineTop }}</span>
      <span class="line line--accent">{{ post.headlineAccent }}</span>
    </h1>

    <div class="hero">
      <img class="hero__photo" :src="post.heroImage" :style="{ objectPosition: post.heroPosition || 'center 18%' }" alt="" />
      <div class="hero__shade" />
    </div>

    <div class="product" inert>
      <img class="product__art" :src="post.songArt" alt="" />
      <div class="product__copy">
        <strong>{{ post.songTitle }}</strong>
        <span>{{ post.artistName }}</span>
      </div>
      <div class="product__play" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M9 6.8v10.4L18.2 12 9 6.8z" />
        </svg>
      </div>
    </div>

    <h2>{{ post.artistName }}</h2>
    <p class="desc">{{ post.artistDescription }}</p>

    <div class="badge">
      <i />
      <span>{{ post.primaryBadgeText }}</span>
    </div>

    <footer class="foot">
      <img class="foot__mark" src="/faneqo-wordmark.svg" alt="Faneqo" />
      <span class="foot__rule" />
      <div class="foot__action">
        <div class="foot__cta">
          <span>{{ post.footerCTA }}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
          </svg>
        </div>
        <p class="foot__site">{{ post.footerWebsite }}</p>
      </div>
    </footer>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { AD_FORMATS, AD_SAFE_ZONES, isAdFormat } from '@/features/ads/formats.js'

const props = defineProps({
  format: { type: String, default: 'post' },
  post: { type: Object, required: true },
})

/**
 * One composition, three canvases. Every vertical position is a variable so
 * each format is art-directed on purpose instead of stretched or cropped.
 * Horizontal safe inset is 80px everywhere; the story also clears
 * Instagram's top and bottom chrome.
 */
const LAYOUTS = {
  post: {
    series: 96, headline: 156, heroTop: 340, heroHeight: 640,
    product: 896, name: 1016, desc: 1092, badge: 1152, footBottom: 96,
  },
  feed: {
    series: 96, headline: 156, heroTop: 340, heroHeight: 560,
    product: 816, name: 936, desc: 1012, badge: 1072, footBottom: 96,
  },
  story: {
    series: 290, headline: 346, heroTop: 540, heroHeight: 680,
    product: 1130, name: 1252, desc: 1328, badge: 1388, footBottom: 344,
  },
}

const formatId = computed(() => (isAdFormat(props.format) ? props.format : 'post'))

const boardStyle = computed(() => {
  const layout = LAYOUTS[formatId.value]
  const canvas = AD_FORMATS[formatId.value]
  return {
    '--board-h': `${canvas.height}px`,
    '--safe-x': `${AD_SAFE_ZONES.post.side}px`,
    '--series-top': `${layout.series}px`,
    '--headline-top': `${layout.headline}px`,
    '--hero-top': `${layout.heroTop}px`,
    '--hero-h': `${layout.heroHeight}px`,
    '--product-top': `${layout.product}px`,
    '--name-top': `${layout.name}px`,
    '--desc-top': `${layout.desc}px`,
    '--badge-top': `${layout.badge}px`,
    '--foot-bottom': `${layout.footBottom}px`,
  }
})
</script>

<style scoped>
.board {
  position: relative;
  width: 1080px;
  height: var(--board-h, 1440px);
  overflow: hidden;
  background: #050506;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.board[data-format='feed'] { height: 1350px; }
.board[data-format='post'] { height: 1440px; }
.board[data-format='story'] { height: 1920px; }

.series {
  position: absolute;
  top: var(--series-top);
  left: var(--safe-x);
}

.series p {
  margin: 0;
  color: #7ee7ff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

h1 {
  position: absolute;
  top: var(--headline-top);
  right: var(--safe-x);
  left: var(--safe-x);
  margin: 0;
  font-size: 84px;
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.88;
  text-transform: uppercase;
}

.line {
  display: block;
}

.line--accent {
  background: linear-gradient(90deg, #ff4ad8 0%, #c084fc 46%, #67e8f9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero {
  position: absolute;
  top: var(--hero-top);
  right: 0;
  left: 0;
  height: var(--hero-h);
  overflow: hidden;
}

.hero__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(5, 5, 6, 0.5) 0%,
    rgba(5, 5, 6, 0) 14%,
    rgba(5, 5, 6, 0) 38%,
    rgba(5, 5, 6, 0.4) 54%,
    rgba(5, 5, 6, 0.88) 68%,
    #050506 78%,
    #050506 100%
  );
}

.product {
  position: absolute;
  top: var(--product-top);
  right: var(--safe-x);
  left: var(--safe-x);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 20px;
}

.product__art {
  width: 88px;
  height: 88px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
}

.product__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.product__copy strong {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.product__copy span {
  color: rgba(247, 249, 252, 0.62);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.product__play {
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: #f4f6f8;
  color: #050506;
}

.product__play svg {
  width: 28px;
  height: 28px;
  margin-left: 3px;
  fill: currentColor;
}

h2 {
  position: absolute;
  top: var(--name-top);
  right: var(--safe-x);
  left: var(--safe-x);
  margin: 0;
  font-size: 58px;
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.95;
  text-transform: uppercase;
}

.desc {
  position: absolute;
  top: var(--desc-top);
  right: var(--safe-x);
  left: var(--safe-x);
  margin: 0;
  color: rgba(247, 249, 252, 0.72);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.badge {
  position: absolute;
  top: var(--badge-top);
  left: var(--safe-x);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 0 18px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.badge i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4ad8;
}

.foot {
  position: absolute;
  right: var(--safe-x);
  bottom: var(--foot-bottom);
  left: var(--safe-x);
  display: grid;
  grid-template-columns: auto 1px minmax(0, 1fr);
  align-items: center;
  gap: 24px;
}

.foot__mark {
  width: 168px;
  height: auto;
}

.foot__rule {
  width: 1px;
  height: 52px;
  background: rgba(255, 255, 255, 0.14);
}

.foot__action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.foot__cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 18px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.foot__cta svg {
  width: 16px;
  height: 16px;
}

.foot__site {
  margin: 0;
  color: rgba(247, 249, 252, 0.42);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
}
</style>
