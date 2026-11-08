<template>
  <div class="bg-black min-h-screen pt-[var(--header-height)]">
    <div v-if="loading" class="flex items-center justify-center min-h-[50vh]">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="max-w-3xl mx-auto px-6 py-10">
      <div class="text-red-400 text-lg">{{ error }}</div>
      <NuxtLink to="/dashboard" class="text-purple-400 hover:underline mt-4 inline-block">
        ← Back to Dashboard
      </NuxtLink>
    </div>

    <div v-else class="max-w-3xl mx-auto px-6 py-10">
      <!-- Header -->
      <div class="flex items-center justify-between gap-4 mb-8">
        <div>
          <NuxtLink
            :to="`/editband/${bandId}`"
            class="text-purple-400 hover:underline text-sm mb-2 inline-block"
          >
            ← Back to Edit Band
          </NuxtLink>
          <h1 class="text-3xl font-bold text-white">Edit Layout</h1>
          <p class="text-white/60 mt-1">
            Customize how your band page looks to fans
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            v-if="!isDefault"
            type="button"
            class="px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/5 transition text-sm"
            :disabled="saving"
            @click="resetToDefault"
          >
            Reset to Default
          </button>
          <button
            type="button"
            class="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50"
            :disabled="saving || isDefault"
            @click="saveLayout"
          >
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Status Messages -->
      <div v-if="saveSuccess" class="mb-6 p-4 rounded-lg bg-emerald-900/30 border border-emerald-500/30 text-emerald-200">
        Layout saved successfully!
      </div>
      <div v-if="saveError" class="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-500/30 text-red-200">
        {{ saveError }}
      </div>

      <!-- Sections Editor -->
      <div class="mb-10">
        <h2 class="text-xl font-semibold text-white mb-4">Page Sections</h2>
        <p class="text-white/50 text-sm mb-4">
          Drag to reorder. Toggle visibility with the switch. Hero (image, name, bio) is always shown first.
        </p>

        <div class="space-y-2">
          <div
            v-for="(section, index) in localSections"
            :key="section.id"
            class="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 group"
            :class="{ 'opacity-50': !section.enabled }"
            draggable="true"
            @dragstart="onDragStart($event, index, 'sections')"
            @dragover.prevent="onDragOver($event, index, 'sections')"
            @drop="onDrop($event, index, 'sections')"
            @dragend="onDragEnd"
          >
            <div class="cursor-grab text-white/40 hover:text-white/70 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <div class="text-white font-medium">{{ getSectionLabel(section.id) }}</div>
            </div>

            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="section.enabled"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Streaming Buttons Order -->
      <div class="mb-10">
        <h2 class="text-xl font-semibold text-white mb-4">Streaming Link Buttons Order</h2>
        <p class="text-white/50 text-sm mb-4">
          Drag to reorder how streaming platform buttons appear on your page.
        </p>

        <div class="space-y-2">
          <div
            v-for="(platformId, index) in localStreamingOrder"
            :key="platformId"
            class="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5"
            draggable="true"
            @dragstart="onDragStart($event, index, 'streaming')"
            @dragover.prevent="onDragOver($event, index, 'streaming')"
            @drop="onDrop($event, index, 'streaming')"
            @dragend="onDragEnd"
          >
            <div class="cursor-grab text-white/40 hover:text-white/70 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <div class="text-white font-medium capitalize">{{ getStreamingLabel(platformId) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Social Buttons Order -->
      <div class="mb-10">
        <h2 class="text-xl font-semibold text-white mb-4">Social Media Link Buttons Order</h2>
        <p class="text-white/50 text-sm mb-4">
          Drag to reorder how social media buttons appear on your page.
        </p>

        <div class="space-y-2">
          <div
            v-for="(platformId, index) in localSocialOrder"
            :key="platformId"
            class="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5"
            draggable="true"
            @dragstart="onDragStart($event, index, 'social')"
            @dragover.prevent="onDragOver($event, index, 'social')"
            @drop="onDrop($event, index, 'social')"
            @dragend="onDragEnd"
          >
            <div class="cursor-grab text-white/40 hover:text-white/70 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <div class="text-white font-medium capitalize">{{ getSocialLabel(platformId) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom Buttons Order -->
      <div v-if="localCustomButtons.length > 0" class="mb-10">
        <h2 class="text-xl font-semibold text-white mb-4">Custom Link Buttons Order</h2>
        <p class="text-white/50 text-sm mb-4">
          Drag to reorder your custom link buttons.
        </p>

        <div class="space-y-2">
          <div
            v-for="(button, index) in localCustomButtons"
            :key="button.id || index"
            class="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5"
            draggable="true"
            @dragstart="onDragStart($event, index, 'customButtons')"
            @dragover.prevent="onDragOver($event, index, 'customButtons')"
            @drop="onDrop($event, index, 'customButtons')"
            @dragend="onDragEnd"
          >
            <div class="cursor-grab text-white/40 hover:text-white/70 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
              </svg>
            </div>

            <div class="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <img 
                v-if="button.customIcon?.url" 
                :src="button.customIcon.url" 
                :alt="button.title"
                class="w-full h-full object-cover"
              />
              <svg v-else class="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <div class="text-white font-medium">{{ button.title }}</div>
              <div v-if="button.subtitle" class="text-white/50 text-sm truncate">{{ button.subtitle }}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRuntimeConfig } from '#imports';
import { useStrapiToken } from '#imports';
import {
  normalizeLayoutConfig,
  isDefaultConfig,
  createSaveableConfig,
  SECTION_LABELS,
} from '@/utils/bandLayout';

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const token = useStrapiToken();

const bandId = computed(() => route.params.id);

const loading = ref(true);
const error = ref('');
const saving = ref(false);
const saveSuccess = ref(false);
const saveError = ref('');

const bandSlug = ref('');
const bandName = ref('');
const bandGenre = ref('');
const bandBio = ref('');

const localSections = ref([]);
const localStreamingOrder = ref([]);
const localSocialOrder = ref([]);
const localEventHubOrder = ref([]);
const localCustomButtons = ref([]);
const savedImageFit = ref(undefined);

const dragState = ref({
  type: null,
  fromIndex: null,
});

const streamingLabels = {
  youtube: 'YouTube',
  youtubeMusic: 'YouTube Music',
  spotify: 'Spotify',
  appleMusic: 'Apple Music',
  reverbnation: 'Reverbnation',
  soundcloud: 'SoundCloud',
  bandcamp: 'Bandcamp',
  twitch: 'Twitch',
  deezer: 'Deezer',
};

const socialLabels = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter / X',
  tiktok: 'TikTok',
};

const isDefault = computed(() => {
  const currentConfig = {
    version: 1,
    sections: localSections.value.map((s) => ({ id: s.id, enabled: s.enabled })),
    buttons: {
      streaming: [...localStreamingOrder.value],
      social: [...localSocialOrder.value],
      eventHubs: [...localEventHubOrder.value],
    },
  };
  return isDefaultConfig(currentConfig);
});

function getSectionLabel(id) {
  return SECTION_LABELS[id] || id;
}

function getStreamingLabel(id) {
  return streamingLabels[id] || id;
}

function getSocialLabel(id) {
  return socialLabels[id] || id;
}

function onDragStart(event, index, type) {
  dragState.value = { type, fromIndex: index };
  event.dataTransfer.effectAllowed = 'move';
}

function onDragOver(event, index, type) {
  if (dragState.value.type !== type) return;
  event.dataTransfer.dropEffect = 'move';
}

function onDrop(event, toIndex, type) {
  if (dragState.value.type !== type) return;
  
  const fromIndex = dragState.value.fromIndex;
  if (fromIndex === toIndex) return;

  let arr;
  if (type === 'sections') {
    arr = localSections.value;
  } else if (type === 'streaming') {
    arr = localStreamingOrder.value;
  } else if (type === 'social') {
    arr = localSocialOrder.value;
  } else if (type === 'customButtons') {
    arr = localCustomButtons.value;
  }

  if (!arr) return;
  const item = arr.splice(fromIndex, 1)[0];
  arr.splice(toIndex, 0, item);
}

function onDragEnd() {
  dragState.value = { type: null, fromIndex: null };
}

async function fetchBand() {
  loading.value = true;
  error.value = '';

  try {
    const res = await $fetch(`${config.public.strapiUrl}/api/bands/${bandId.value}?populate=customButtons.customIcon`, {
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
    });

    const data = res?.data?.attributes || res?.data || res;
    bandSlug.value = data.slug || '';
    bandName.value = data.name || '';
    bandGenre.value = data.genre || '';
    bandBio.value = data.bio || '';

    const normalized = normalizeLayoutConfig(data.layoutConfig);
    
    localSections.value = normalized.sections.map((s) => ({ ...s }));
    localStreamingOrder.value = [...normalized.buttons.streaming];
    localSocialOrder.value = [...normalized.buttons.social];
    localEventHubOrder.value = [...normalized.buttons.eventHubs];
    savedImageFit.value = normalized.imageFit;
    
    // Load custom buttons
    const customButtonsData = data.customButtons || [];
    localCustomButtons.value = customButtonsData.map((btn, idx) => ({
      id: btn.id || idx,
      title: btn.title || '',
      subtitle: btn.subtitle || '',
      url: btn.url || '',
      iconName: btn.iconName || '',
      customIcon: btn.customIcon?.data?.attributes || btn.customIcon || null,
    }));
  } catch (err) {
    console.error('[layout] fetch error', err);
    error.value = 'Failed to load band data. Please try again.';
  } finally {
    loading.value = false;
  }
}

async function saveLayout() {
  saving.value = true;
  saveSuccess.value = false;
  saveError.value = '';

  try {
    const layoutConfigData = createSaveableConfig({
      version: 1,
      sections: localSections.value,
      buttons: {
        streaming: localStreamingOrder.value,
        social: localSocialOrder.value,
        eventHubs: localEventHubOrder.value,
      },
      ...(savedImageFit.value ? { imageFit: savedImageFit.value } : {}),
    });

    const res = await fetch(`${config.public.strapiUrl}/api/bands/${bandId.value}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({
        data: {
          name: bandName.value,
          genre: bandGenre.value,
          bio: bandBio.value,
          layoutConfig: layoutConfigData,
          layoutVersion: 1,
        },
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('[layout] save error response', json);
      throw new Error(json?.error?.message || 'Save failed');
    }

    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
    }, 3000);
  } catch (err) {
    console.error('[layout] save error', err);
    saveError.value = err.message || 'Failed to save layout. Please try again.';
  } finally {
    saving.value = false;
  }
}

async function resetToDefault() {
  saving.value = true;
  saveSuccess.value = false;
  saveError.value = '';

  try {
    const res = await fetch(`${config.public.strapiUrl}/api/bands/${bandId.value}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({
        data: {
          name: bandName.value,
          genre: bandGenre.value,
          bio: bandBio.value,
          layoutConfig: savedImageFit.value
            ? { version: 1, imageFit: savedImageFit.value }
            : null,
          layoutVersion: 1,
        },
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('[layout] reset error response', json);
      throw new Error(json?.error?.message || 'Reset failed');
    }

    const normalized = normalizeLayoutConfig(null);
    localSections.value = normalized.sections.map((s) => ({ ...s }));
    localStreamingOrder.value = [...normalized.buttons.streaming];
    localSocialOrder.value = [...normalized.buttons.social];
    localEventHubOrder.value = [...normalized.buttons.eventHubs];

    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
    }, 3000);
  } catch (err) {
    console.error('[layout] reset error', err);
    saveError.value = err.message || 'Failed to reset layout. Please try again.';
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  if (!token.value) {
    router.push('/login');
    return;
  }
  fetchBand();
});
</script>

<style scoped>
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
