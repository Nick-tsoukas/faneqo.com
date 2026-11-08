<template>
  <article class="v2-rem-beat" data-rel="remember">
    <div class="v2-rem" aria-hidden="true">
      <p class="v2-rem__caption">{{ demo.remember.caption }}</p>
      <div class="v2-rem__grid">
        <figure
          v-for="(photo, index) in demo.remember.photos"
          :key="photo.id"
          class="v2-rem__cell"
          :class="{ 'is-hero': index === 0 }"
        >
          <img :src="photo.src" alt="" :style="{ objectPosition: photo.pos }" loading="lazy">
        </figure>
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
.v2-rem-beat {
  margin-inline: -1.25rem;
  padding: 0.4rem 0 0;
}

.v2-rem__caption {
  width: calc(100% - 2.5rem);
  max-width: 22rem;
  margin: 0 1.25rem 0.7rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.95rem 0.95rem 0.95rem 0.22rem;
  background: #15161c;
  font-size: 0.9rem;
  line-height: 1.35;
}

.v2-rem__grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.16rem;
}

.v2-rem__cell {
  margin: 0;
  overflow: hidden;
  aspect-ratio: 1;
  background: #111;
}

.v2-rem__cell.is-hero {
  grid-column: 1 / -1;
  aspect-ratio: 16 / 10;
}

.v2-rem__cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.v2-rem.is-expanded .v2-rem__caption {
  display: none;
}

.v2-rem.is-expanded .v2-rem__grid {
  display: block;
}

.v2-rem.is-expanded .v2-rem__cell.is-hero {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  aspect-ratio: auto;
  height: 100svh;
}

.v2-rem.is-expanded .v2-rem__cell:not(.is-hero) {
  display: none;
}

@media (min-width: 1024px) {
  .v2-rem-beat {
    margin-inline: -1.5rem;
  }

  .v2-rem__caption {
    margin-left: 1.5rem;
  }

  .v2-rem.is-expanded .v2-rem__cell.is-hero {
    height: 100vh;
  }
}
</style>
