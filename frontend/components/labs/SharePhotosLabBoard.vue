<template>
  <div class="splab">
    <p class="splab__lede">
      Show Recap → Share Photos. Same composer, protected uploader, existing
      Night Story. Artist Updates stay globally hidden.
    </p>

    <div class="splab__toolbar">
      <span class="splab__label">Width</span>
      <div class="splab__pills" role="group" aria-label="Preview width">
        <button
          v-for="w in widths"
          :key="w"
          type="button"
          class="splab__pill"
          :class="{ 'is-on': width === w }"
          :aria-pressed="width === w"
          @click="width = w"
        >
          {{ w }}
        </button>
      </div>
    </div>

    <section class="splab__block">
      <header class="splab__head">
        <p class="splab__kicker">Show Recap</p>
        <h2>After the night</h2>
        <p>Share photos is the post-show action. Not a third equal metric button.</p>
      </header>
      <div class="splab__stage-wrap">
        <div class="splab__stage" :style="{ width: `${width}px` }">
          <div class="splab__recap">
            <p class="splab__recap-label">Latest Show Recap</p>
            <h3>Nashville</h3>
            <p>The Basement East · Oct 18</p>
            <SharePhotosFromTonightCta :recap="recap" from="/fans/recaps/41" force-visible />
          </div>
        </div>
      </div>
    </section>

    <section class="splab__block">
      <header class="splab__head">
        <p class="splab__kicker">General gallery</p>
        <h2>New Gallery</h2>
        <p>Labeled add-photos, flush tray, caption, audience, publish.</p>
      </header>
      <div class="splab__stage-wrap">
        <div class="splab__stage is-composer" :style="{ width: `${width}px` }">
          <ArtistUpdateComposer
            mode="update"
            :band-id="1"
            band-name="Badflower"
            back-to="/galleries"
          />
        </div>
      </div>
    </section>

    <section class="splab__block">
      <header class="splab__head">
        <p class="splab__kicker">Composer tray</p>
        <h2>Flush thumbnails</h2>
        <p>Equal square tiles. Cover lives inside the first frame.</p>
      </header>
      <div class="splab__stage-wrap">
        <div class="splab__stage" :style="{ width: `${width}px` }">
          <FaneqoMediaPreview
            :compact="false"
            :items="trayItems"
            @retry="() => {}"
            @remove="() => {}"
            @move="() => {}"
          />
        </div>
      </div>
    </section>

    <section class="splab__block">
      <header class="splab__head">
        <p class="splab__kicker">Composer</p>
        <h2>Share photos from tonight</h2>
        <p>Show context known. Visibility locked. Photography first.</p>
      </header>
      <div class="splab__stage-wrap">
        <div class="splab__stage is-composer" :style="{ width: `${width}px` }">
          <ArtistUpdateComposer
            mode="show-photos"
            :band-id="1"
            band-name="Badflower"
            :show-recap-id="41"
            city="Nashville"
            venue="The Basement East"
            show-date="2024-10-18"
            back-to="/fans/recaps/41"
            assume-delivery-ready
          />
        </div>
      </div>
    </section>

    <section class="splab__block">
      <header class="splab__head">
        <p class="splab__kicker">Success</p>
        <h2>Photos shared</h2>
        <p>Same Night Story wrapper. Not a fake preview.</p>
      </header>
      <div class="splab__stage-wrap">
        <div class="splab__stage" :style="{ width: `${width}px` }">
          <ShowNightStory v-bind="story" />
          <p class="splab__quiet">People from tonight can see this memory.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ArtistUpdateComposer from '@/components/updates/ArtistUpdateComposer.vue'
import FaneqoMediaPreview from '@/components/media/FaneqoMediaPreview.vue'
import SharePhotosFromTonightCta from '@/components/updates/SharePhotosFromTonightCta.vue'
import ShowNightStory from '@/components/updates/ShowNightStory.vue'
import { GALLERY_LAB_FIXTURES } from '@/config/galleryLab'
import { NIGHT_STORY_LAB_WIDTHS, nightStoryLabAttendee } from '@/config/nightStoryLab'

const widths = NIGHT_STORY_LAB_WIDTHS
const width = ref(390)
const recap = {
  id: 41,
  eventId: 88,
  city: 'Nashville',
  venue: 'The Basement East',
  showTitle: 'Nashville',
}
const story = nightStoryLabAttendee(4)
const trayItems = GALLERY_LAB_FIXTURES.slice(0, 6).map((row, index) => ({
  localId: row.mediaId,
  previewUrl: row.url,
  state: index === 1 ? 'uploading' : index === 2 ? 'preparing' : index === 5 ? 'failed' : 'ready',
  error: index === 5 ? 'Failed' : null,
}))
</script>

<style scoped>
.splab { color: #f7f9fc; }
.splab__lede {
  margin: 0 0 1.5rem;
  max-width: 40rem;
  color: #9aa6b5;
  font-size: 0.92rem;
  line-height: 1.5;
}
.splab__toolbar { margin: 0 0 2rem; }
.splab__label {
  display: block;
  margin-bottom: 0.45rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9aa6b5;
}
.splab__pills { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.splab__pill {
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
.splab__pill.is-on {
  color: #f7f9fc;
  border-color: rgba(255, 255, 255, 0.28);
}
.splab__block { margin: 0 0 3.25rem; }
.splab__kicker {
  margin: 0;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #9aa6b5;
}
.splab__head h2 {
  margin: 0.3rem 0 0.4rem;
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.splab__head p {
  margin: 0 0 1.1rem;
  max-width: 40rem;
  color: #9aa6b5;
  font-size: 0.88rem;
}
.splab__stage-wrap {
  overflow-x: auto;
  padding-bottom: 0.5rem;
}
.splab__stage {
  background: #050608;
  padding: 1.15rem 1rem 1.5rem;
}
.splab__stage.is-composer { padding: 0; }
.splab__tray {
  max-width: 36rem;
  margin: 0 auto;
  padding: 0 1rem 1.5rem;
}
.splab__recap {
  max-width: 24rem;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}
.splab__recap-label {
  margin: 0 0 0.45rem;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.45);
}
.splab__recap h3 {
  margin: 0;
  font-size: 1.1rem;
}
.splab__recap p { margin: 0.2rem 0 0.85rem; color: rgba(247, 249, 252, 0.5); font-size: 0.85rem; }
.splab__quiet {
  margin: 1.1rem 0 0;
  font-size: 0.9rem;
  color: rgba(247, 249, 252, 0.55);
}
</style>
