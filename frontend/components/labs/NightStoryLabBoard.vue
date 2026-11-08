<template>
  <div class="nslab">
    <p class="nslab__lede">
      Night Story wraps the production gallery. Same
      <code>FaneqoMediaGrid</code> <code>variant="gallery"</code>.
      Authorization and YOU WERE THERE are server-shaped here. Artist Updates
      stay hidden in product.
    </p>

    <div class="nslab__toolbar">
      <span class="nslab__label">Width</span>
      <div class="nslab__pills" role="group" aria-label="Preview width">
        <button
          v-for="w in widths"
          :key="w"
          type="button"
          class="nslab__pill"
          :class="{ 'is-on': width === w }"
          :aria-pressed="width === w"
          @click="width = w"
        >
          {{ w }}
        </button>
      </div>
    </div>

    <section class="nslab__block">
      <header class="nslab__head">
        <p class="nslab__kicker">Attendee</p>
        <h2>Attendee memory</h2>
        <p>Photography first. Place and verification as caption.</p>
      </header>
      <div class="nslab__stage-wrap">
        <div class="nslab__stage" :style="{ width: `${width}px` }">
          <ShowNightStory v-bind="attendee" />
        </div>
      </div>
    </section>

    <section class="nslab__block">
      <header class="nslab__head">
        <p class="nslab__kicker">Manual show</p>
        <h2>Campaign night, same memory</h2>
        <p>No Event row. Still one night. Gallery is not duplicated.</p>
      </header>
      <div class="nslab__stage-wrap">
        <div class="nslab__stage" :style="{ width: `${width}px` }">
          <ShowNightStory v-bind="manual" />
        </div>
      </div>
    </section>

    <section class="nslab__block">
      <header class="nslab__head">
        <p class="nslab__kicker">No photographs</p>
        <h2>The night still holds</h2>
        <p>Place, date, and YOU WERE THERE. No empty image slot.</p>
      </header>
      <div class="nslab__stage-wrap">
        <div class="nslab__stage" :style="{ width: `${width}px` }">
          <ShowNightStory v-bind="noPhotos" />
        </div>
      </div>
    </section>

    <section class="nslab__block">
      <header class="nslab__head">
        <p class="nslab__kicker">Non-attendee</p>
        <h2>Locked, no media bytes</h2>
        <p>No blurred photos. No protected URLs. Type holds the night.</p>
      </header>
      <div class="nslab__stage-wrap">
        <div class="nslab__stage" :style="{ width: `${width}px` }">
          <ShowNightStory v-bind="locked" />
        </div>
      </div>
    </section>

    <section class="nslab__block">
      <header class="nslab__head">
        <p class="nslab__kicker">Account required</p>
        <h2>Quiet ask</h2>
        <p>Not punitive. Still no images.</p>
      </header>
      <div class="nslab__stage-wrap">
        <div class="nslab__stage" :style="{ width: `${width}px` }">
          <ShowNightStory v-bind="account">
            <template #locked-action>
              <a href="/fan" class="nslab__action">Verify / create your free account</a>
            </template>
          </ShowNightStory>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ShowNightStory from '@/components/updates/ShowNightStory.vue'
import {
  NIGHT_STORY_LAB_WIDTHS,
  nightStoryLabAccountRequired,
  nightStoryLabAttendee,
  nightStoryLabLocked,
  nightStoryLabManual,
  nightStoryLabNoPhotos,
} from '@/config/nightStoryLab'

const widths = NIGHT_STORY_LAB_WIDTHS
const width = ref(390)
const attendee = nightStoryLabAttendee(4)
const manual = nightStoryLabManual()
const noPhotos = nightStoryLabNoPhotos()
const locked = nightStoryLabLocked()
const account = nightStoryLabAccountRequired()
</script>

<style scoped>
.nslab {
  color: #f7f9fc;
}
.nslab__lede {
  margin: 0 0 1.5rem;
  max-width: 40rem;
  color: #9aa6b5;
  font-size: 0.92rem;
  line-height: 1.5;
}
.nslab__lede code {
  font-size: 0.82em;
}
.nslab__toolbar { margin: 0 0 2rem; }
.nslab__label {
  display: block;
  margin-bottom: 0.45rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9aa6b5;
}
.nslab__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.nslab__pill {
  min-width: 2.75rem;
  min-height: 2.75rem;
  padding: 0 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0b0e14;
  color: #9aa6b5;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}
.nslab__pill.is-on {
  color: #f7f9fc;
  border-color: rgba(255, 255, 255, 0.28);
}
.nslab__block { margin: 0 0 3.25rem; }
.nslab__kicker {
  margin: 0;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #9aa6b5;
}
.nslab__head h2 {
  margin: 0.3rem 0 0.4rem;
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.nslab__head p {
  margin: 0 0 1.1rem;
  max-width: 40rem;
  color: #9aa6b5;
  font-size: 0.88rem;
}
.nslab__stage-wrap {
  overflow-x: auto;
  padding-bottom: 0.5rem;
}
.nslab__stage {
  background: #050608;
  padding: 1.15rem 1rem 1.5rem;
}
.nslab__action {
  margin: 0;
}
</style>
