<template>
  <div v-if="pkg" class="pub">
    <div v-if="pkg.warnings.length || pkg.rightsStatus !== 'clear'" class="pub__rights" role="status">
      <p class="pub__rights-title">
        <template v-if="pkg.rightsStatus === 'clear'">Rights look clear</template>
        <template v-else>Needs permission before publishing</template>
      </p>
      <ul v-if="pkg.warnings.length" class="pub__warnings">
        <li v-for="w in pkg.warnings" :key="w">{{ w }}</li>
      </ul>
    </div>

    <div class="pub__block">
      <header>
        <h4>Instagram caption</h4>
        <button type="button" class="copy" @click="copy('instagram', pkg.instagram)">{{ copied === 'instagram' ? 'Copied' : 'Copy' }}</button>
      </header>
      <pre>{{ pkg.instagram }}</pre>
    </div>

    <div class="pub__block">
      <header>
        <h4>Facebook caption</h4>
        <button type="button" class="copy" @click="copy('facebook', pkg.facebook)">{{ copied === 'facebook' ? 'Copied' : 'Copy' }}</button>
      </header>
      <pre>{{ pkg.facebook }}</pre>
    </div>

    <div class="pub__block">
      <header>
        <h4>Hashtags</h4>
        <button type="button" class="copy" @click="copy('hashtags', pkg.hashtags.join(' '))">{{ copied === 'hashtags' ? 'Copied' : 'Copy' }}</button>
      </header>
      <p class="pub__tags">{{ pkg.hashtags.join(' ') }}</p>
    </div>

    <div class="pub__block">
      <header>
        <h4>Alt text</h4>
        <button type="button" class="copy" @click="copy('alt', pkg.altText)">{{ copied === 'alt' ? 'Copied' : 'Copy' }}</button>
      </header>
      <p>{{ pkg.altText }}</p>
    </div>

    <div class="pub__block">
      <header>
        <h4>Destination</h4>
        <button type="button" class="copy" @click="copy('url', pkg.url)">{{ copied === 'url' ? 'Copied' : 'Copy' }}</button>
      </header>
      <p class="pub__url">{{ pkg.url }}</p>
    </div>

    <div v-if="pkg.credits.length" class="pub__block">
      <header>
        <h4>Credits</h4>
        <button type="button" class="copy" @click="copy('credits', pkg.credits.join('\n'))">{{ copied === 'credits' ? 'Copied' : 'Copy' }}</button>
      </header>
      <p v-for="c in pkg.credits" :key="c" class="pub__credit">{{ c }}</p>
    </div>

    <p class="pub__note">{{ pkg.note }}</p>
    <p v-if="copyError" class="pub__note is-error" role="alert">{{ copyError }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { buildPublishingPackage } from '@/features/ads/studio/publishing.js'

const props = defineProps({
  creative: { type: Object, required: true },
})

const pkg = computed(() => buildPublishingPackage(props.creative))
const copied = ref('')
const copyError = ref('')
let timer = null

async function copy(key, text) {
  copyError.value = ''
  try {
    await navigator.clipboard.writeText(text)
    copied.value = key
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { copied.value = '' }, 1600)
  } catch {
    copyError.value = 'Clipboard is blocked here. Select the text and copy it by hand.'
  }
}
</script>

<style scoped>
.pub { display: flex; flex-direction: column; gap: 14px; }

.pub__rights {
  padding: 12px 14px;
  border: 1px solid rgba(255, 207, 138, 0.35);
  border-radius: 12px;
  background: rgba(255, 207, 138, 0.06);
}

.pub__rights-title {
  margin: 0;
  color: #ffcf8a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.pub__warnings {
  margin: 8px 0 0;
  padding-left: 18px;
  color: rgba(247, 249, 252, 0.75);
  font-size: 12.5px;
  line-height: 1.45;
}

.pub__block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pub__block header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pub__block h4 {
  margin: 0;
  color: rgba(247, 249, 252, 0.88);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.pub__block pre,
.pub__block p {
  margin: 0;
  color: rgba(247, 249, 252, 0.72);
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.pub__tags { color: #7ee7ff !important; }
.pub__url { color: #f7f9fc !important; }
.pub__credit { font-style: italic; }

.copy {
  padding: 5px 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background: transparent;
  color: rgba(247, 249, 252, 0.8);
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.copy:hover,
.copy:focus-visible { border-color: #f7f9fc; color: #f7f9fc; outline: none; }

.pub__note {
  margin: 0;
  color: rgba(247, 249, 252, 0.42);
  font-size: 12px;
  line-height: 1.45;
}

.pub__note.is-error { color: #ff8aa8; }
</style>
