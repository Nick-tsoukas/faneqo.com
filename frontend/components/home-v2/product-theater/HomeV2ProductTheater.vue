<template>
  <section
    id="features"
    ref="rootEl"
    class="v2-theater"
    aria-label="Your band’s headquarters"
  >
    <header class="v2-theater__mobile-intro">
      <p class="v2-theater__eyebrow">Artist Page</p>
      <h2 class="v2-theater__title">
        Your band’s
        <span>headquarters.</span>
      </h2>
    </header>

    <div class="v2-theater-pin">
      <div class="v2-theater__rail">
        <header class="v2-theater__copy">
          <p class="v2-theater__eyebrow">Artist Page</p>
          <h2 class="v2-theater__title">
            Your band’s
            <span>headquarters.</span>
          </h2>
          <p class="v2-theater__line">{{ scenes[0].line }}</p>
        </header>

        <nav class="v2-theater__chapters" aria-label="Product chapters">
          <div
            v-for="(scene, index) in scenes"
            :key="scene.id"
            class="v2-theater__chapter"
            :class="{ 'is-current': index === 0, 'is-future': index > 0 }"
          >
            <span class="v2-theater__chapter-num">{{ scene.num }}</span>
            <span class="v2-theater__chapter-label">{{ scene.label }}</span>
          </div>
        </nav>
      </div>

      <div class="v2-theater__stage">
        <article
          v-for="scene in scenes"
          :key="scene.id"
          class="v2-theater__scene"
          :class="{ 'is-active': scene.id === 'music' }"
          :data-scene="scene.id"
        >
          <header class="v2-theater__scene-head">
            <p class="v2-theater__scene-num">{{ scene.num }} {{ scene.label }}</p>
            <p class="v2-theater__scene-line">{{ scene.line }}</p>
          </header>
          <component :is="sceneViews[scene.id]" :artist="artist" />
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { homeV2ProductScenes } from '~/utils/home-v2/productTheater.js'
import { useHomeV2ProductTheater } from '~/composables/home-v2/useHomeV2ProductTheater.js'
import ProductMusicScene from '@/components/home-v2/product-theater/scenes/ProductMusicScene.vue'
import ProductVideoScene from '@/components/home-v2/product-theater/scenes/ProductVideoScene.vue'
import ProductFanListScene from '@/components/home-v2/product-theater/scenes/ProductFanListScene.vue'
import ProductSupportScene from '@/components/home-v2/product-theater/scenes/ProductSupportScene.vue'
import ProductShowModeScene from '@/components/home-v2/product-theater/scenes/ProductShowModeScene.vue'

defineProps({
  artist: { type: Object, required: true },
})

const sceneViews = {
  music: ProductMusicScene,
  video: ProductVideoScene,
  fanList: ProductFanListScene,
  support: ProductSupportScene,
  showMode: ProductShowModeScene,
}

const rootEl = ref(null)
const scenes = homeV2ProductScenes()
let revertTheater = null

onMounted(async () => {
  await nextTick()
  if (!rootEl.value) return
  revertTheater = useHomeV2ProductTheater(rootEl)
})

onUnmounted(() => {
  revertTheater?.()
  revertTheater = null
})
</script>

<style scoped>
.v2-theater {
  position: relative;
  z-index: 10;
  padding: 1.1rem 1.15rem 2.25rem;
  color: #f5f5f6;
  background: #050506;
}

.v2-theater-pin {
  width: min(100%, 1480px);
  margin-inline: auto;
}

.v2-theater__mobile-intro {
  margin: 0 0 1.65rem;
}

.v2-theater__rail {
  display: none;
}

.v2-theater__eyebrow {
  margin: 0 0 0.45rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #f472b6;
}

.v2-theater__title {
  margin: 0;
  font-size: clamp(1.7rem, 6.4vw, 2.15rem);
  font-weight: 800;
  line-height: 0.98;
  letter-spacing: -0.04em;
}

.v2-theater__title span {
  background: linear-gradient(90deg, #f472b6, #c084fc);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.v2-theater__line {
  margin: 0.5rem 0 0;
  min-height: 1.3em;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.48);
}

.v2-theater__stage {
  display: grid;
  gap: 2.75rem;
}

.v2-theater__scene {
  min-width: 0;
}

.v2-theater__scene-head {
  margin: 0 0 0.85rem;
}

.v2-theater__scene-num {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #45d6a7;
}

.v2-theater__scene-line {
  margin: 0.28rem 0 0;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.5);
}

.v2-theater.is-reduced .v2-theater__stage {
  gap: 2.5rem;
}

@media (min-width: 1024px) {
  .v2-theater {
    padding: 1.75rem 1.5rem 0;
  }

  .v2-theater-pin {
    display: grid;
    grid-template-columns: minmax(13.5rem, 0.24fr) minmax(0, 1fr);
    align-items: start;
    gap: 1.75rem 2rem;
  }

  .v2-theater__mobile-intro {
    display: none;
  }

  .v2-theater__rail {
    display: block;
  }

  .v2-theater.is-reduced .v2-theater__rail {
    display: none;
  }

  .v2-theater.is-reduced .v2-theater__mobile-intro {
    display: block;
    margin-bottom: 1.25rem;
  }

  .v2-theater__title {
    font-size: clamp(1.85rem, 2.4vw, 2.45rem);
  }

  .v2-theater__chapters {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    margin: 1.35rem 0 0;
  }

  .v2-theater__chapter {
    display: inline-flex;
    align-items: baseline;
    gap: 0.45rem;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.28);
    white-space: nowrap;
  }

  .v2-theater__chapter-num {
    color: rgba(255, 255, 255, 0.2);
  }

  .v2-theater__chapter.is-current {
    color: #fff;
  }

  .v2-theater__chapter.is-current .v2-theater__chapter-num {
    color: #45d6a7;
  }

  .v2-theater__chapter.is-past {
    color: rgba(255, 255, 255, 0.34);
  }

  .v2-theater__chapter.is-past .v2-theater__chapter-num {
    color: rgba(69, 214, 167, 0.4);
  }

  .v2-theater__stage {
    position: relative;
    overflow: hidden;
    overflow-y: hidden;
    height: min(72vh, calc(100svh - var(--header-height, 70px) - 2rem), 820px);
    max-height: 820px;
    padding: 1.35rem 1.4rem;
    border-radius: 1.2rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: #050506;
  }

  .v2-theater__scene {
    position: absolute;
    inset: 1.35rem 1.4rem;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .v2-theater__scene > :last-child {
    flex: 1;
    min-height: 0;
  }

  .v2-theater__scene-head {
    display: none;
  }

  .v2-theater.is-reduced .v2-theater-pin {
    display: block;
  }

  .v2-theater.is-reduced .v2-theater__stage {
    height: auto;
    max-height: none;
    overflow: hidden;
    display: grid;
    gap: 2.75rem;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .v2-theater.is-reduced .v2-theater__scene {
    position: relative;
    inset: auto;
  }

  .v2-theater.is-reduced .v2-theater__scene-head {
    display: block;
  }
}
</style>
