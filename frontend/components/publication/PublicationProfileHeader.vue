<template>
  <header class="publication-header" :style="accentStyle">
    <!-- contain_blur: centered logo + blurred backdrop (default for publications) -->
    <div
      v-if="isContainBlur"
      class="publication-hero publication-hero--contain contain_blur relative w-full rounded-2xl overflow-hidden bg-black"
      :class="{ 'publication-hero--titled': hasHeroText }"
    >
      <template v-if="band.bandImg?.url">
        <img
          :src="band.bandImg.url"
          alt=""
          aria-hidden="true"
          class="hero-bg absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-35"
          :style="heroBgStyle"
        />
        <div class="absolute inset-0 bg-black/65" aria-hidden="true" />
      </template>
      <div v-else class="absolute inset-0 bg-gradient-to-br from-white/10 to-black/60" />

      <div class="relative z-10 flex h-full flex-col">
        <!-- The name is in the logo: keep a page heading for screen readers and search -->
        <h1 v-if="band.isBandNameInLogo" class="sr-only">{{ band.name }}</h1>
        <div class="absolute top-4 left-4 right-4 sm:top-5 sm:left-5 sm:right-5 flex items-center gap-2 flex-wrap z-30">
          <span class="pub-badge-hero">Music Publication</span>
        </div>

        <div
          v-if="band.bandImg?.url"
          class="hero-fg flex flex-1 justify-center px-8 pt-14 sm:px-14 sm:pt-16 min-h-0"
          :class="hasHeroText ? 'items-end pb-2 sm:pb-3' : 'items-center pb-9 sm:pb-11'"
        >
          <img
            :src="band.bandImg.url"
            :alt="`${band.name} logo`"
            class="hero-logo h-auto w-auto max-w-[82%] sm:max-w-[72%] object-contain drop-shadow-lg"
          />
        </div>
        <div v-else class="flex-1 min-h-[72px] sm:min-h-[88px]" aria-hidden="true" />

        <div v-if="hasHeroText" class="shrink-0 px-6 pb-6 pt-2 sm:px-8 sm:pb-7 bg-gradient-to-t from-black via-black/80 to-transparent">
          <h1
            v-if="!band.isBandNameInLogo"
            class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight publication-text-glow text-center"
          >
            {{ band.name }}
          </h1>
          <p
            v-if="band.biotagline"
            class="mt-1.5 text-sm sm:text-base font-medium text-[var(--pub-accent,#34d399)] text-center"
          >
            {{ band.biotagline }}
          </p>
        </div>
      </div>
    </div>

    <!-- cinematic_cover: full-width banner using Cybered image position/zoom -->
    <div
      v-else
      class="publication-hero publication-hero--cinematic relative w-full rounded-2xl overflow-hidden bg-black"
    >
      <img
        v-if="band.bandImg?.url"
        :src="band.bandImg.url"
        :alt="`${band.name} image`"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out"
        :style="heroCinematicStyle"
      />
      <div v-else class="absolute inset-0 bg-gradient-to-br from-white/10 to-black/60" />

      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      <div class="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />

      <div class="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center gap-2 flex-wrap z-30">
        <span class="pub-badge-hero">Music Publication</span>
      </div>

      <div class="absolute bottom-0 left-0 right-0 p-5 sm:p-8 z-20">
        <h1 v-if="band.isBandNameInLogo" class="sr-only">{{ band.name }}</h1>
        <h1
          v-else
          class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight publication-text-glow"
        >
          {{ band.name }}
        </h1>
        <p
          v-if="band.biotagline"
          class="mt-2 text-sm sm:text-base font-medium text-[var(--pub-accent,#34d399)]"
        >
          {{ band.biotagline }}
        </p>
      </div>
    </div>

    <p
      v-if="band.bio"
      class="text-center text-white/70 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-light mt-5 px-2"
    >
      {{ band.bio }}
    </p>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import {
  getPublicationHeaderImageMode,
  PUBLICATION_HEADER_IMAGE_MODE,
} from '@/utils/publicationProfile';

const props = defineProps({
  band: { type: Object, required: true },
  accentColor: { type: String, default: '#34d399' },
});

const accentStyle = computed(() => ({
  '--pub-accent': props.accentColor,
}));

const isContainBlur = computed(
  () => getPublicationHeaderImageMode(props.band) === PUBLICATION_HEADER_IMAGE_MODE.CONTAIN_BLUR
);

// Name or tagline under the logo; when neither shows, the logo gets the whole hero
const hasHeroText = computed(() => !props.band.isBandNameInLogo || !!props.band.biotagline);

const heroBgStyle = computed(() => {
  const x = props.band.cyberedImagePositionX ?? 50;
  const y = props.band.cyberedImagePositionY ?? 50;
  return {
    objectPosition: `${x}% ${y}%`,
  };
});

const heroCinematicStyle = computed(() => {
  const x = props.band.cyberedImagePositionX ?? 50;
  const y = props.band.cyberedImagePositionY ?? 50;
  const zoom = props.band.cyberedImageZoom ?? 1;
  return {
    objectPosition: `${x}% ${y}%`,
    transform: `scale(${zoom})`,
    transformOrigin: `${x}% ${y}%`,
  };
});
</script>

<style scoped>
/* Logo-led hero: the station or publication mark is the headline. --hero-text
   adds room for the name/tagline row when it shows. */
.publication-hero--contain {
  --hero-text: 0px;
  height: calc(260px + var(--hero-text));
}

.publication-hero--titled {
  --hero-text: 72px;
}

.hero-logo {
  max-height: min(156px, 100%);
}

@media (min-width: 640px) {
  .publication-hero--contain {
    height: calc(290px + var(--hero-text));
  }

  .hero-logo {
    max-height: min(170px, 100%);
  }
}

@media (min-width: 768px) {
  .publication-hero--contain {
    height: calc(320px + var(--hero-text));
  }

  .publication-hero--titled {
    --hero-text: 84px;
  }

  .hero-logo {
    max-height: min(200px, 100%);
  }
}

@media (min-width: 1024px) {
  .publication-hero--contain {
    height: calc(340px + var(--hero-text));
  }

  .hero-logo {
    max-height: min(216px, 100%);
  }
}

.publication-hero--cinematic {
  height: 360px;
}

@media (min-width: 768px) {
  .publication-hero--cinematic {
    height: 420px;
  }
}

@media (min-width: 1024px) {
  .publication-hero--cinematic {
    height: 480px;
  }
}

.contain_blur .hero-bg {
  transform: scale(1.12);
}

.publication-text-glow {
  text-shadow:
    0 0 12px color-mix(in srgb, var(--pub-accent, #34d399) 30%, transparent),
    0 0 24px color-mix(in srgb, var(--pub-accent, #34d399) 15%, transparent);
}

.pub-badge-hero {
  @apply inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide backdrop-blur-md shadow-lg shadow-black/20;
  color: var(--pub-accent, #34d399);
  border: 1px solid color-mix(in srgb, var(--pub-accent, #34d399) 35%, transparent);
  background: color-mix(in srgb, var(--pub-accent, #34d399) 12%, rgba(0, 0, 0, 0.5));
}
</style>
