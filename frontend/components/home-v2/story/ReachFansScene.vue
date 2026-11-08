<template>
  <article class="v2-reach" data-rel="reach">
    <h2 class="v2-reach__title">{{ demo.copy.reach.title }}</h2>
    <div class="v2-mail" aria-hidden="true">
      <p class="v2-mail__to">{{ demo.email.to }}</p>
      <p class="v2-mail__subject">{{ demo.email.subject }}</p>
      <p class="v2-mail__body">{{ demo.email.body }}</p>
      <div class="v2-mail__action">
        <span class="v2-rel-send">{{ demo.email.send }}</span>
        <span class="v2-rel-sending">{{ demo.email.sending }}</span>
        <span class="v2-rel-sent">✓ {{ demo.email.sent }}</span>
      </div>
    </div>
  </article>
</template>

<script setup>
defineProps({
  demo: { type: Object, required: true },
})
</script>

<style scoped>
.v2-reach {
  width: min(100%, 36rem);
  margin: 0;
  padding: 0.6rem 0 2.2rem;
}

.v2-reach__title {
  margin: 0 0 1.15rem;
  max-width: 12ch;
  font-size: clamp(1.85rem, 7.2vw, 2.35rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.94;
  color: rgba(255, 255, 255, 0.72);
}

.v2-mail__to {
  margin: 0 0 0.55rem;
  font-size: 0.78rem;
  font-weight: 650;
  color: #45d6a7;
}

.v2-mail__subject {
  margin: 0 0 0.7rem;
  font-size: 1.28rem;
  font-weight: 750;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.v2-mail__body {
  margin: 0 0 1.2rem;
  max-width: 32rem;
  font-size: 0.98rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.52);
}

.v2-mail__action {
  position: relative;
  width: 8.5rem;
  min-height: 2.85rem;
}

.v2-rel-send,
.v2-rel-sending,
.v2-rel-sent {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.85rem;
  border-radius: 0.65rem;
  font-weight: 700;
}

.v2-rel-send {
  background: #45d6a7;
  color: #06251f;
}

.v2-rel-sending,
.v2-rel-sent {
  position: absolute;
  inset: 0;
  opacity: 0;
  visibility: hidden;
}

.v2-rel-sending {
  color: rgba(255, 255, 255, 0.48);
}

.v2-rel-sent {
  justify-content: flex-start;
  color: #39ff14;
  font-weight: 650;
}

@media (min-width: 1024px) {
  .v2-reach {
    padding: 1.4rem 0 3rem;
  }

  .v2-mail__subject {
    font-size: 1.55rem;
  }
}
</style>
