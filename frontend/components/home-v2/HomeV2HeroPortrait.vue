<template>
  <div class="v2-portrait" aria-hidden="true">
    <picture v-if="artist.heroImage && desktopOnly">
      <source media="(min-width: 1024px)" :srcset="artist.heroImage" type="image/webp">
      <img
        class="v2-portrait__img"
        :alt="`${artist.name}`"
        :style="{ objectPosition: artist.heroObjectPosition || 'center 10%' }"
        width="1000"
        height="1500"
        decoding="async"
      >
    </picture>
    <img
      v-else-if="artist.heroImage"
      class="v2-portrait__img"
      :src="artist.heroImage"
      :alt="`${artist.name}`"
      :style="{ objectPosition: artist.heroObjectPosition || 'center 10%' }"
      width="1000"
      height="1500"
      decoding="async"
      loading="eager"
      fetchpriority="high"
    >
    <div class="v2-portrait__shade"></div>
  </div>
</template>

<script setup>
defineProps({
  artist: { type: Object, required: true },
  desktopOnly: { type: Boolean, default: false },
})
</script>

<style scoped>
.v2-portrait {
  position: relative;
  overflow: hidden;
  aspect-ratio: 3 / 4;
  width: 100%;
  pointer-events: none;
  user-select: none;
  background: #07080a;
}

.v2-portrait picture {
  position: absolute;
  inset: 0;
}

.v2-portrait__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 10%;
}

.v2-portrait__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, #000 0%, rgba(0, 0, 0, 0.12) 32%, transparent 58%);
}
</style>
