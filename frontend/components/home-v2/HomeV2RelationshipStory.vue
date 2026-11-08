<template>
  <section
    id="home-v2-relationship-story"
    ref="rootEl"
    class="v2-rel"
    aria-label="Someone shows up. You keep them."
  >
    <div class="v2-rel__void" aria-hidden="true"></div>
    <ShowModeScene :demo="demo" />
    <KeepFanScene :demo="demo" />
    <ReachFansScene :demo="demo" />
    <TalkScene :demo="demo" />
    <RememberScene :demo="demo" />

    <article class="v2-still" aria-label="The show ended. The connection didn’t.">
      <p class="v2-still__ended">{{ demo.ending.line1 }}</p>
      <p class="v2-still__stay">
        <span>The connection</span>
        didn’t.
      </p>
    </article>
  </section>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import ShowModeScene from '@/components/home-v2/story/ShowModeScene.vue'
import KeepFanScene from '@/components/home-v2/story/KeepFanScene.vue'
import ReachFansScene from '@/components/home-v2/story/ReachFansScene.vue'
import TalkScene from '@/components/home-v2/story/TalkScene.vue'
import RememberScene from '@/components/home-v2/story/RememberScene.vue'
import { HOME_V2_STORY_DEMO } from '~/utils/home-v2/relationshipStoryData.js'
import { useHomeV2RelationshipStory } from '~/composables/home-v2/useHomeV2RelationshipStory.js'

const demo = HOME_V2_STORY_DEMO
const rootEl = ref(null)
let revertStory = null

onMounted(async () => {
  await nextTick()
  if (!rootEl.value) return
  revertStory = useHomeV2RelationshipStory(rootEl)
})

onUnmounted(() => {
  revertStory?.()
  revertStory = null
})
</script>

<style scoped>
.v2-rel {
  position: relative;
  z-index: 10;
  padding: 0 1.25rem 0;
  color: #f5f5f6;
  background: #050506;
}

.v2-rel__void {
  height: clamp(1.1rem, 4vh, 2.6rem);
}

.v2-still {
  width: 100%;
  min-height: 82svh;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 5rem 0 5.5rem;
}

.v2-still__ended {
  margin: 0 0 0.32em;
  font-size: clamp(1.9rem, 8vw, 2.8rem);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.05em;
  color: rgba(255, 255, 255, 0.26);
}

.v2-still__stay {
  margin: 0;
  font-size: clamp(3.2rem, 12.8vw, 5.2rem);
  font-weight: 800;
  line-height: 0.84;
  letter-spacing: -0.065em;
}

.v2-still__stay span {
  display: block;
}

@media (min-width: 1024px) {
  .v2-rel {
    padding: 0 1.5rem;
  }

  .v2-rel__void {
    height: clamp(1.6rem, 5vh, 3.2rem);
  }

  .v2-still {
    width: 100%;
    min-height: 88vh;
    padding: 7.5rem 0 8rem;
  }

  .v2-still__ended {
    font-size: clamp(2.8rem, 4vw, 4rem);
  }

  .v2-still__stay {
    font-size: clamp(5.4rem, 8vw, 8rem);
  }
}
</style>
