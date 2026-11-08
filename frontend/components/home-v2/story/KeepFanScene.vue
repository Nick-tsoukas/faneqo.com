<template>
  <article class="v2-keep" data-rel="keep">
    <div class="v2-keep__stage">
      <p class="v2-keep__count" aria-hidden="true">
        <span class="v2-rel-count-before">{{ demo.fanCountBefore }}</span>
        <span class="v2-rel-count-after">{{ demo.fanCountAfter }}</span>
      </p>
      <div class="v2-keep-from" data-sarah-from>
        <div class="v2-keep-layer" data-sarah-layer>
          <HomeV2StorySarahIdentity :fan="demo.fan" variant="list" />
        </div>
      </div>
      <HomeV2StoryFanList :demo="demo" />
    </div>
    <h2 class="v2-keep__title">{{ demo.copy.keep.title }}</h2>
  </article>
</template>

<script setup>
import HomeV2StoryFanList from '@/components/home-v2/HomeV2StoryFanList.vue'
import HomeV2StorySarahIdentity from '@/components/home-v2/HomeV2StorySarahIdentity.vue'

defineProps({
  demo: { type: Object, required: true },
})
</script>

<style scoped>
.v2-keep {
  width: min(100%, 26rem);
  margin: 0;
  padding: 2.2rem 0 3.4rem;
}

.v2-keep__count {
  position: relative;
  height: 4.6rem;
  margin: 0 0 1.05rem;
  font-size: 4.6rem;
  font-weight: 800;
  letter-spacing: -0.08em;
  line-height: 1;
}

.v2-rel-count-before,
.v2-rel-count-after {
  position: absolute;
  left: 0;
  top: 0;
}

.v2-rel-count-after {
  color: #45d6a7;
  opacity: 0;
}

.v2-keep-from {
  margin-bottom: 0.35rem;
}

.v2-keep-layer {
  padding: 0.35rem 0.15rem;
}

.v2-keep-layer.is-landed {
  width: 100%;
  padding: 0;
}

.v2-keep__title {
  margin: 1.7rem 0 0;
  font-size: clamp(2.6rem, 10vw, 3.6rem);
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.9;
}

@media (min-width: 1024px) {
  .v2-keep {
    width: min(100%, 32rem);
    padding: 3rem 0 4.8rem;
  }

  .v2-keep__count {
    height: 6.2rem;
    font-size: 6.2rem;
  }
}
</style>
