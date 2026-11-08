<template>
  <article
    class="board"
    :class="{ 'is-feed': format === 'feed' }"
    aria-label="Still using a basic link in bio? Faneqo."
    :data-format="format"
  >
    <div class="board__copy">
      <p class="kicker">Artists deserve better</p>
      <h1>
        <span>Still using a</span>
        <span>basic link in bio?</span>
      </h1>
      <p class="support">Turn one link into a real artist page.</p>
      <p class="secondary">More than links. A home for your music and fans.</p>
      <p class="brand">Faneqo</p>
      <p class="site">faneqo.com</p>
    </div>

    <div class="compare" aria-hidden="true">
      <div class="basic">
        <span>Listen</span>
        <span>Website</span>
        <span>Social</span>
      </div>
      <div class="page" inert>
        <img :src="heroSrc" alt="" />
        <div class="page__shade" />
        <p class="page__name">{{ artistName }}</p>
        <div class="page__follow">Follow</div>
      </div>
    </div>

  </article>
</template>

<script setup>
import { FALLBACK_SNAPSHOT } from '~/composables/useHomepageDemoArtist.js'

defineProps({
  format: { type: String, default: 'feed' },
})

const artistName = FALLBACK_SNAPSHOT.name
const heroSrc = FALLBACK_SNAPSHOT.heroImage
</script>

<style scoped>
.board {
  position: relative;
  width: 1080px;
  height: 1920px;
  overflow: hidden;
  background: #050506;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.board.is-feed {
  height: 1350px;
}

.board__copy {
  position: absolute;
  top: 248px;
  right: 64px;
  left: 64px;
}

.kicker {
  margin: 0 0 28px;
  color: #7ee7ff;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 78px;
  font-weight: 800;
  letter-spacing: -0.048em;
  line-height: 0.92;
  text-transform: uppercase;
}

h1 span {
  display: block;
}

.support {
  margin: 36px 0 0;
  color: #f7f9fc;
  font-size: 36px;
  font-weight: 500;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.secondary {
  margin: 14px 0 0;
  color: rgba(247, 249, 252, 0.52);
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.brand,
.site {
  margin: 28px 0 0;
  color: rgba(247, 249, 252, 0.72);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.34em;
  text-transform: uppercase;
}

.site {
  margin-top: 8px;
  color: rgba(247, 249, 252, 0.46);
  letter-spacing: 0.16em;
}

.compare {
  position: absolute;
  top: 760px;
  right: 64px;
  bottom: 300px;
  left: 64px;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 28px;
  align-items: stretch;
}

.basic {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 18px;
  padding-bottom: 8px;
}

.basic span {
  display: block;
  padding: 22px 24px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(247, 249, 252, 0.28);
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.page {
  position: relative;
  height: auto;
  min-height: 0;
  overflow: hidden;
  border-radius: 48px;
  background: #0c0d12;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.45),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.page img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 12%;
}

.page__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 5, 6, 0.05) 20%, rgba(5, 5, 6, 0.15) 48%, rgba(5, 5, 6, 0.88) 78%, #050506 100%);
}

.page__name {
  position: absolute;
  right: 36px;
  bottom: 132px;
  left: 36px;
  margin: 0;
  font-size: 52px;
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.9;
  text-transform: uppercase;
}

.page__follow {
  position: absolute;
  right: 36px;
  bottom: 40px;
  left: 36px;
  display: grid;
  place-items: center;
  min-height: 72px;
  border-radius: 999px;
  background: #eceef2;
  color: #0c0d12;
  font-size: 24px;
  font-weight: 700;
}

.is-feed .board__copy {
  top: 136px;
  right: 48px;
  left: 48px;
}

.is-feed .kicker {
  margin-bottom: 14px;
  font-size: 18px;
}

.is-feed h1 {
  font-size: 64px;
}

.is-feed .support {
  margin-top: 16px;
  font-size: 28px;
}

.is-feed .secondary {
  display: none;
}

.is-feed .brand {
  margin-top: 16px;
}

.is-feed .compare {
  top: 452px;
  right: 40px;
  bottom: 40px;
  left: 40px;
  grid-template-columns: 168px minmax(0, 1fr);
  gap: 20px;
}

.is-feed .basic {
  gap: 12px;
  padding-bottom: 12px;
}

.is-feed .basic span {
  padding: 16px 14px;
  font-size: 18px;
}

.is-feed .page {
  border-radius: 36px;
}

.is-feed .page__name {
  font-size: 44px;
  bottom: 112px;
}

.is-feed .page__follow {
  right: 24px;
  bottom: 28px;
  left: 24px;
  min-height: 64px;
  font-size: 22px;
}
</style>
