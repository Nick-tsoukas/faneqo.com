<template>
  <article
    class="board"
    :class="{ 'is-feed': format === 'feed' }"
    aria-label="Stop renting your audience. Faneqo."
    :data-format="format"
  >
    <img class="board__photo" src="/labs/featured-gallery/morgan-wade.jpg" alt="" />
    <div class="board__veil" aria-hidden="true" />
    <div class="board__copy">
      <img class="board__mark" src="/faneqo-wordmark.svg" alt="Faneqo" />
      <p class="kicker">For independent artists</p>
      <h1>
        <span>Stop renting</span>
        <span>your audience.</span>
      </h1>
      <p class="support">Followers are borrowed. Fans you can reach are yours.</p>
      <p class="brand">Faneqo</p>
      <p class="site">faneqo.com</p>
    </div>
  </article>
</template>

<script setup>
defineProps({
  format: { type: String, default: 'feed' },
})
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

.board__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 68% 28%;
}

.is-feed .board__photo {
  object-position: 62% 22%;
}

.board__veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(5, 5, 6, 0.28) 0%, rgba(5, 5, 6, 0.05) 34%, rgba(5, 5, 6, 0.2) 52%, rgba(5, 5, 6, 0.82) 70%, #050506 88%),
    linear-gradient(90deg, rgba(5, 5, 6, 0.35) 0%, rgba(5, 5, 6, 0) 42%);
}

.is-feed .board__veil {
  background:
    linear-gradient(180deg, rgba(5, 5, 6, 0.2) 0%, rgba(5, 5, 6, 0.02) 36%, rgba(5, 5, 6, 0.35) 62%, #050506 92%),
    linear-gradient(90deg, rgba(5, 5, 6, 0.28) 0%, rgba(5, 5, 6, 0) 46%);
}

.board__copy {
  position: absolute;
  right: 72px;
  bottom: 340px;
  left: 72px;
}

.is-feed .board__copy {
  right: 56px;
  bottom: 148px;
  left: 56px;
}

.board__mark {
  display: block;
  width: 156px;
  height: auto;
  margin-bottom: 28px;
}

.is-feed .board__mark {
  width: 140px;
  margin-bottom: 22px;
}

.kicker {
  margin: 0 0 22px;
  color: #7ee7ff;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.is-feed .kicker {
  margin-bottom: 16px;
  font-size: 18px;
}

h1 {
  margin: 0;
  font-size: 104px;
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.88;
  text-transform: uppercase;
}

.is-feed h1 {
  font-size: 92px;
}

h1 span {
  display: block;
}

.support {
  max-width: 820px;
  margin: 28px 0 0;
  color: rgba(247, 249, 252, 0.78);
  font-size: 32px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.is-feed .support {
  margin-top: 20px;
  font-size: 30px;
}

.brand,
.site {
  margin: 32px 0 0;
  color: #f7f9fc;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.34em;
  text-transform: uppercase;
}

.site {
  margin-top: 8px;
  color: rgba(247, 249, 252, 0.55);
  letter-spacing: 0.18em;
}

.is-feed .brand {
  margin-top: 24px;
}
</style>
