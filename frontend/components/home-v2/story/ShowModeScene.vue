<template>
  <article class="v2-room" data-rel="show">
    <p class="v2-room__kicker">{{ demo.copy.show.kicker }}</p>
    <h2 class="v2-room__title">
      Someone<br>shows up.
    </h2>
    <HomeV2StoryShowMode :demo="demo" />
  </article>
</template>

<script setup>
import HomeV2StoryShowMode from '@/components/home-v2/HomeV2StoryShowMode.vue'

defineProps({
  demo: { type: Object, required: true },
})
</script>

<style scoped>
.v2-room {
  width: min(100%, 22rem);
  margin: 0;
  padding: 2.4rem 0 3.2rem;
}

.v2-room__kicker {
  margin: 0 0 0.55rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(69, 214, 167, 0.7);
}

.v2-room__title {
  margin: 0 0 2.1rem;
  font-size: clamp(3.15rem, 13.5vw, 4.6rem);
  font-weight: 800;
  line-height: 0.86;
  letter-spacing: -0.06em;
}

@media (min-width: 1024px) {
  .v2-room {
    width: min(100%, 28rem);
    padding: 3.5rem 0 4.5rem;
  }

  .v2-room__title {
    font-size: clamp(4.4rem, 6vw, 6.2rem);
  }
}
</style>
