<template>
  <div class="editorial-showcase-editor space-y-5">
    <!-- 1. Visibility -->
    <div class="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div class="flex items-start gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div class="min-w-0">
            <h4 class="text-white font-semibold">Show on profile</h4>
            <p class="text-white/50 text-sm mt-0.5">Feature selected articles, interviews, reviews, videos, and photo galleries on your profile.</p>
          </div>
        </div>

        <label class="flex items-center gap-3 shrink-0 cursor-pointer self-start sm:self-center">
          <span class="text-sm font-medium" :class="enabledModel ? 'text-white' : 'text-white/50'">{{ enabledModel ? 'On' : 'Off' }}</span>
          <span class="relative">
            <input v-model="enabledModel" type="checkbox" class="sr-only peer" aria-label="Show Editorial Showcase on profile" />
            <span class="block w-12 h-7 bg-white/15 rounded-full peer peer-checked:bg-emerald-500 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-400/50"></span>
            <span class="absolute left-[3px] top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></span>
          </span>
        </label>
      </div>

      <!-- Status -->
      <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          :class="statusPill.class"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="statusPill.dot"></span>
          {{ statusPill.label }}
        </span>
        <span v-if="!enabledModel && itemsModel.length" class="text-white/40 text-xs">
          {{ itemsModel.length }} saved {{ itemsModel.length === 1 ? 'story is' : 'stories are' }} kept and will reappear when you re-enable.
        </span>
        <span v-else-if="enabledModel && completeItems.length === 0" class="text-amber-400/90 text-xs">
          Add at least one complete story — nothing appears publicly until you do.
        </span>
      </div>
    </div>

    <!-- Publication header image (always available for entitled accounts) -->
    <div class="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
      <div>
        <h4 class="text-white font-semibold">Publication header image</h4>
        <p class="text-white/45 text-sm mt-0.5">Uses your band image from the Band Image section. Applies when Editorial Showcase is enabled on your public profile.</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Publication header image style">
        <label
          class="relative flex cursor-pointer rounded-xl border p-4 transition"
          :class="headerImageModeModel === HEADER_MODES.CONTAIN_BLUR
            ? 'border-emerald-500/50 bg-emerald-500/[0.08] ring-1 ring-emerald-500/30'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20'"
        >
          <input
            v-model="headerImageModeModel"
            type="radio"
            class="sr-only"
            :value="HEADER_MODES.CONTAIN_BLUR"
          />
          <div class="min-w-0">
            <span class="text-white font-medium text-sm">Logo contain + blur</span>
            <span class="ml-2 text-[10px] uppercase tracking-wider text-emerald-400/90 font-semibold">Recommended</span>
            <p class="text-white/50 text-xs mt-1.5 leading-relaxed">Centered logo on a dark backdrop. Best for square logos and magazine marks.</p>
          </div>
        </label>
        <label
          class="relative flex cursor-pointer rounded-xl border p-4 transition"
          :class="headerImageModeModel === HEADER_MODES.CINEMATIC_COVER
            ? 'border-emerald-500/50 bg-emerald-500/[0.08] ring-1 ring-emerald-500/30'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20'"
        >
          <input
            v-model="headerImageModeModel"
            type="radio"
            class="sr-only"
            :value="HEADER_MODES.CINEMATIC_COVER"
          />
          <div class="min-w-0">
            <span class="text-white font-medium text-sm">Cinematic cover</span>
            <p class="text-white/50 text-xs mt-1.5 leading-relaxed">Full-width banner image. Uses Adjust Banner Image position and zoom from Band Image.</p>
          </div>
        </label>
      </div>
    </div>

    <template v-if="enabledModel">
      <!-- 2. Publication settings -->
      <div class="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
        <div>
          <h4 class="text-white font-semibold">Publication settings</h4>
          <p class="text-white/45 text-sm mt-0.5">Control the section heading and the link to your full archive.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-field min-w-0">
            <label for="ed-section-title" class="form-label">Section title</label>
            <input id="ed-section-title" v-model="sectionTitleModel" type="text" class="form-input" placeholder="Latest from our publication" maxlength="80" />
          </div>
          <div class="form-field min-w-0">
            <label for="ed-archive-label" class="form-label">Archive button label</label>
            <input id="ed-archive-label" v-model="archiveLabelModel" type="text" class="form-input" placeholder="Explore more coverage" maxlength="60" />
          </div>
          <div class="form-field min-w-0 md:col-span-2">
            <label for="ed-archive-url" class="form-label">Archive URL <span class="text-white/40 font-normal">(optional)</span></label>
            <input
              id="ed-archive-url"
              v-model="archiveUrlModel"
              type="url"
              class="form-input"
              :class="{ 'form-input-error': archiveUrlError }"
              :aria-invalid="archiveUrlError ? 'true' : 'false'"
              :aria-describedby="archiveUrlError ? 'ed-archive-url-error' : 'ed-archive-url-help'"
              placeholder="https://example.com"
              @blur="validateArchiveUrl"
            />
            <p v-if="archiveUrlError" id="ed-archive-url-error" class="form-error">{{ archiveUrlError }}</p>
            <p v-else id="ed-archive-url-help" class="form-help">Links the archive button to your publication's main page.</p>
          </div>
        </div>
      </div>

      <!-- 3. Stories -->
      <div class="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2.5">
              <h4 class="text-white font-semibold">Stories</h4>
              <span class="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs font-semibold tabular-nums">{{ itemsModel.length }} of {{ EDITORIAL_MAX_ITEMS }}</span>
            </div>
            <p class="text-white/45 text-sm mt-0.5">Choose up to six items. One story will be featured prominently on your profile.</p>
          </div>
          <button
            v-if="itemsModel.length < EDITORIAL_MAX_ITEMS"
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition shadow-sm shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isAdding"
            @click="startAdd"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add story
          </button>
          <span v-else class="text-white/40 text-xs">Maximum of {{ EDITORIAL_MAX_ITEMS }} reached</span>
        </div>

        <!-- New-story form (top, contextual) -->
        <div v-if="isAdding" class="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b border-emerald-500/20 bg-emerald-500/[0.04]">
            <h5 class="text-white font-semibold text-sm">New story</h5>
            <button type="button" class="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition" aria-label="Close" @click="closeForm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="p-4 space-y-4">
            <EditorialItemFormFields
              v-model="formData"
              :errors="formErrors"
              :image-preview="formImagePreview"
              @blur-url="normalizeFormUrl"
              @image-selected="onImageSelected"
              @image-removed="onImageRemoved"
            />
            <div class="flex flex-wrap gap-2 pt-1">
              <button type="button" class="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition" @click="saveForm">Add story</button>
              <button type="button" class="px-5 py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-white/80 hover:bg-white/10 text-sm font-medium transition" @click="closeForm">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="itemsModel.length === 0 && !isAdding" class="text-center py-10 px-6 rounded-xl border border-dashed border-white/12 bg-white/[0.015]">
          <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center">
            <svg class="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h5 class="text-white font-semibold">No stories added yet</h5>
          <p class="text-white/50 text-sm mt-1 max-w-md mx-auto">Add your first article, interview, review, video, or gallery to begin building your editorial profile.</p>
          <button type="button" class="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition" @click="startAdd">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add first story
          </button>
        </div>

        <!-- Story list -->
        <div v-if="itemsModel.length > 0" class="space-y-2.5">
          <div
            v-for="(item, index) in itemsModel"
            :key="item._localId || item.id || index"
            class="rounded-xl border transition overflow-hidden"
            :class="editingIndex === index ? 'border-emerald-500/45 bg-emerald-500/[0.06] ring-1 ring-emerald-500/30' : 'border-white/10 bg-black/20 hover:border-white/20'"
          >
            <div class="flex items-stretch gap-3 p-3">
              <!-- Reorder -->
              <div class="flex flex-col justify-center gap-1 shrink-0">
                <button
                  type="button"
                  class="w-9 h-9 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-white/40"
                  :disabled="index === 0"
                  :aria-label="`Move ${item.title || 'story'} up`"
                  @click="moveItem(index, -1)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" /></svg>
                </button>
                <button
                  type="button"
                  class="w-9 h-9 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-white/40"
                  :disabled="index === itemsModel.length - 1"
                  :aria-label="`Move ${item.title || 'story'} down`"
                  @click="moveItem(index, 1)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>

              <!-- Thumbnail -->
              <div class="w-24 sm:w-28 shrink-0 aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center self-center">
                <img v-if="itemImagePreview(item)" :src="itemImagePreview(item)" :alt="item.title || 'Story cover'" class="w-full h-full object-cover" />
                <svg v-else class="w-6 h-6 text-white/20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0 self-center">
                <h5 class="text-white font-semibold text-sm sm:text-[15px] leading-snug line-clamp-2">{{ item.title || 'Untitled story' }}</h5>
                <div class="flex items-center gap-1.5 flex-wrap mt-1.5">
                  <span v-if="item.isFeatured" class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wide">Featured</span>
                  <span v-else-if="index === 0 && !hasExplicitFeatured && isCompleteEditorialItem(item)" class="px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-[10px] font-bold uppercase tracking-wide" title="Becomes the featured lead story on save">Lead</span>
                  <span class="px-2 py-0.5 rounded-full bg-white/[0.07] text-white/55 text-[10px] font-medium uppercase tracking-wide">{{ getEditorialTypeLabel(item.contentType) }}</span>
                  <span v-if="item.category" class="px-2 py-0.5 rounded-full bg-white/[0.07] text-white/55 text-[10px] font-medium">{{ item.category }}</span>
                  <span v-if="!isCompleteEditorialItem(item)" class="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-semibold">Incomplete</span>
                </div>
                <p class="text-white/35 text-xs truncate mt-1.5">{{ displayDomain(item.url) }}</p>
              </div>

              <!-- Actions -->
              <div class="flex items-center shrink-0 self-center">
                <template v-if="confirmDeleteKey === (item._localId || item.id || index)">
                  <div class="flex items-center gap-1.5">
                    <button type="button" class="px-3 h-9 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition" @click="confirmRemove(index)">Delete</button>
                    <button type="button" class="px-3 h-9 rounded-lg bg-white/[0.06] border border-white/10 text-white/70 hover:bg-white/10 text-xs transition" @click="confirmDeleteKey = null">Cancel</button>
                  </div>
                </template>
                <template v-else>
                  <button
                    type="button"
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition"
                    :aria-label="`Edit ${item.title || 'story'}`"
                    title="Edit"
                    @click="startEdit(index)"
                  >
                    <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button
                    type="button"
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white/50 hover:text-red-400 hover:bg-red-500/15 transition"
                    :aria-label="`Delete ${item.title || 'story'}`"
                    title="Delete"
                    @click="confirmDeleteKey = (item._localId || item.id || index)"
                  >
                    <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </template>
              </div>
            </div>

            <!-- Inline edit form -->
            <div v-if="editingIndex === index" class="border-t border-emerald-500/20 p-4 space-y-4 bg-black/25">
              <EditorialItemFormFields
                v-model="formData"
                :errors="formErrors"
                :image-preview="formImagePreview"
                @blur-url="normalizeFormUrl"
                @image-selected="onImageSelected"
                @image-removed="onImageRemoved"
              />
              <div class="flex flex-wrap gap-2 pt-1">
                <button type="button" class="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition" @click="saveForm">Update story</button>
                <button type="button" class="px-5 py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-white/80 hover:bg-white/10 text-sm font-medium transition" @click="closeForm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Optional compact preview -->
      <div v-if="previewFeatured" class="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div class="flex items-center gap-2 mb-3">
          <h4 class="text-white font-semibold">Profile preview</h4>
          <span class="text-white/35 text-xs">approximate</span>
        </div>
        <div class="rounded-xl border border-white/10 bg-black/30 p-4">
          <p class="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">{{ previewSectionTitle }}</p>
          <div class="rounded-lg overflow-hidden border border-white/10 bg-white/[0.03]">
            <div class="aspect-video bg-white/5 flex items-center justify-center overflow-hidden">
              <img v-if="itemImagePreview(previewFeatured)" :src="itemImagePreview(previewFeatured)" :alt="previewFeatured.title" class="w-full h-full object-cover" />
              <svg v-else class="w-8 h-8 text-white/20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div class="p-3">
              <span class="text-emerald-300/80 text-[10px] font-bold uppercase tracking-wide">{{ getEditorialTypeLabel(previewFeatured.contentType) }}</span>
              <p class="text-white font-semibold text-sm mt-1 line-clamp-2">{{ previewFeatured.title }}</p>
              <p v-if="previewFeatured.excerpt" class="text-white/45 text-xs mt-1 line-clamp-2">{{ previewFeatured.excerpt }}</p>
            </div>
          </div>
          <div v-if="previewSupporting" class="mt-2.5 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
            <div class="w-16 aspect-video rounded overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">
              <img v-if="itemImagePreview(previewSupporting)" :src="itemImagePreview(previewSupporting)" :alt="previewSupporting.title" class="w-full h-full object-cover" />
              <svg v-else class="w-4 h-4 text-white/20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div class="min-w-0">
              <span class="text-white/40 text-[10px] font-bold uppercase tracking-wide">{{ getEditorialTypeLabel(previewSupporting.contentType) }}</span>
              <p class="text-white/80 text-xs font-medium truncate">{{ previewSupporting.title }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { normalizeLink, isValidHttpUrl } from '@/utils/normalizeLink';
import {
  EDITORIAL_MAX_ITEMS,
  EDITORIAL_EXCERPT_MAX,
  createEmptyEditorialItem,
  getEditorialTypeLabel,
  resolveEditorialImageUrl,
  validateEditorialItem,
  isCompleteEditorialItem,
} from '@/utils/editorialShowcase';
import {
  DEFAULT_PUBLICATION_HEADER_IMAGE_MODE,
  PUBLICATION_HEADER_IMAGE_MODE,
} from '@/utils/publicationProfile';
import EditorialItemFormFields from '@/components/editorial/EditorialItemFormFields.vue';

const HEADER_MODES = PUBLICATION_HEADER_IMAGE_MODE;

const props = defineProps({
  enabled: { type: Boolean, default: false },
  sectionTitle: { type: String, default: '' },
  archiveUrl: { type: String, default: '' },
  archiveLabel: { type: String, default: '' },
  publicationHeaderImageMode: { type: String, default: DEFAULT_PUBLICATION_HEADER_IMAGE_MODE },
  items: { type: Array, default: () => [] },
  strapiBaseUrl: { type: String, default: '' },
});

const emit = defineEmits([
  'update:enabled', 'update:sectionTitle', 'update:archiveUrl', 'update:archiveLabel',
  'update:publicationHeaderImageMode', 'update:items',
  'image-upload', 'image-remove',
]);

const enabledModel = computed({ get: () => props.enabled, set: (v) => emit('update:enabled', v) });
const sectionTitleModel = computed({ get: () => props.sectionTitle, set: (v) => emit('update:sectionTitle', v) });
const archiveUrlModel = computed({ get: () => props.archiveUrl, set: (v) => emit('update:archiveUrl', v) });
const archiveLabelModel = computed({ get: () => props.archiveLabel, set: (v) => emit('update:archiveLabel', v) });
const headerImageModeModel = computed({
  get: () => props.publicationHeaderImageMode || DEFAULT_PUBLICATION_HEADER_IMAGE_MODE,
  set: (v) => emit('update:publicationHeaderImageMode', v),
});
const itemsModel = computed({ get: () => props.items, set: (v) => emit('update:items', v) });

const isAdding = ref(false);
const editingIndex = ref(null);
const formData = ref(createEmptyEditorialItem());
const formErrors = ref({});
const archiveUrlError = ref('');
const confirmDeleteKey = ref(null);

let localIdCounter = 0;
function nextLocalId() {
  localIdCounter += 1;
  return `ed-${Date.now()}-${localIdCounter}`;
}

const completeItems = computed(() => itemsModel.value.filter(isCompleteEditorialItem));
const hasExplicitFeatured = computed(() => itemsModel.value.some((i) => i.isFeatured));

const statusPill = computed(() => {
  if (!enabledModel.value) {
    return { label: 'Hidden from profile', class: 'bg-white/[0.06] text-white/55', dot: 'bg-white/40' };
  }
  if (completeItems.value.length === 0) {
    return { label: 'Hidden — add a story', class: 'bg-amber-500/15 text-amber-300', dot: 'bg-amber-400' };
  }
  return { label: 'Visible on profile', class: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-400' };
});

const previewSectionTitle = computed(() => (sectionTitleModel.value || '').trim() || 'Latest from our publication');
const previewFeatured = computed(() => completeItems.value.find((i) => i.isFeatured) || completeItems.value[0] || null);
const previewSupporting = computed(() => completeItems.value.find((i) => i !== previewFeatured.value) || null);

function itemImagePreview(item) {
  if (item?.imagePreviewUrl) return item.imagePreviewUrl;
  return resolveEditorialImageUrl(item?.image, props.strapiBaseUrl);
}

const formImagePreview = computed(() => formData.value.imagePreviewUrl || itemImagePreview(formData.value) || '');

function displayDomain(url) {
  if (!url) return 'No URL';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function validateArchiveUrl() {
  if (!archiveUrlModel.value.trim()) { archiveUrlError.value = ''; return true; }
  if (!isValidHttpUrl(archiveUrlModel.value)) { archiveUrlError.value = 'Enter a valid http:// or https:// URL.'; return false; }
  emit('update:archiveUrl', normalizeLink(archiveUrlModel.value));
  archiveUrlError.value = '';
  return true;
}

function normalizeFormUrl() {
  if (formData.value.url.trim() && isValidHttpUrl(formData.value.url)) formData.value.url = normalizeLink(formData.value.url);
}

function resetForm() { formData.value = createEmptyEditorialItem(); formErrors.value = {}; }

function startAdd() {
  if (itemsModel.value.length >= EDITORIAL_MAX_ITEMS) return;
  editingIndex.value = null;
  confirmDeleteKey.value = null;
  resetForm();
  isAdding.value = true;
}

function startEdit(index) {
  isAdding.value = false;
  confirmDeleteKey.value = null;
  editingIndex.value = index;
  formData.value = { ...createEmptyEditorialItem(), ...JSON.parse(JSON.stringify(itemsModel.value[index])) };
  formErrors.value = {};
}

function closeForm() {
  isAdding.value = false;
  editingIndex.value = null;
  resetForm();
}

function validateForm() {
  formErrors.value = validateEditorialItem(formData.value);
  return Object.keys(formErrors.value).length === 0;
}

function validateForSave() {
  if (!validateArchiveUrl()) return false;
  if (enabledModel.value && completeItems.value.length === 0) return false;
  return true;
}

function saveForm() {
  if (!validateForm()) return;
  normalizeFormUrl();
  const next = [...itemsModel.value];
  const localId = formData.value._localId || nextLocalId();
  const entry = {
    ...formData.value,
    _localId: localId,
    title: formData.value.title.trim(),
    url: normalizeLink(formData.value.url),
    category: (formData.value.category || '').trim(),
    excerpt: (formData.value.excerpt || '').trim().slice(0, EDITORIAL_EXCERPT_MAX),
  };

  if (entry.isFeatured) {
    next.forEach((it, idx) => { if (editingIndex.value !== idx) it.isFeatured = false; });
  }

  if (editingIndex.value !== null) next[editingIndex.value] = { ...next[editingIndex.value], ...entry };
  else next.push(entry);

  if (formData.value._pendingImageFile) emit('image-upload', { localId, file: formData.value._pendingImageFile });
  else if (formData.value._removeImage) emit('image-remove', { localId });

  emit('update:items', next);
  closeForm();
}

function confirmRemove(index) {
  const removed = itemsModel.value[index];
  confirmDeleteKey.value = null;
  if (removed?._localId) emit('image-remove', { localId: removed._localId });
  emit('update:items', itemsModel.value.filter((_, i) => i !== index));
  if (editingIndex.value === index) closeForm();
  else if (editingIndex.value !== null && index < editingIndex.value) editingIndex.value -= 1;
}

function moveItem(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= itemsModel.value.length) return;
  const next = [...itemsModel.value];
  [next[index], next[target]] = [next[target], next[index]];
  emit('update:items', next);
  if (editingIndex.value === index) editingIndex.value = target;
  else if (editingIndex.value === target) editingIndex.value = index;
}

function onImageSelected(file) {
  if (!file) return;
  formData.value._pendingImageFile = file;
  formData.value._removeImage = false;
  formData.value.imagePreviewUrl = URL.createObjectURL(file);
}

function onImageRemoved() {
  formData.value._pendingImageFile = null;
  formData.value.imagePreviewUrl = null;
  formData.value.image = null;
  formData.value._removeImage = true;
}

defineExpose({ validateArchiveUrl, validateForSave });
</script>

<style scoped>
/*
 * Local dark form treatment for the Editorial Showcase editor.
 * Reuses the Edit Band `.form-*` class names but defines them here because the
 * page-level scoped styles do not penetrate into this child component (or its
 * nested EditorialItemFormFields). Focus accent is editorial emerald.
 * `:deep()` is used so the rules also reach the nested form-fields controls.
 */
.editorial-showcase-editor :deep(.form-field) {
  @apply space-y-2;
}

.editorial-showcase-editor :deep(.form-label) {
  @apply block text-sm font-medium text-white/80;
}

.editorial-showcase-editor :deep(.form-input) {
  @apply w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white
         placeholder:text-white/40 transition duration-200
         hover:border-white/20
         focus:border-emerald-400/60 focus:bg-black/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/15;
}

.editorial-showcase-editor :deep(.form-input:disabled) {
  @apply opacity-60 cursor-not-allowed hover:border-white/10;
}

.editorial-showcase-editor :deep(.form-input.form-input-error),
.editorial-showcase-editor :deep(.form-input[aria-invalid='true']) {
  @apply border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20;
}

.editorial-showcase-editor :deep(.form-textarea) {
  @apply resize-y;
}

.editorial-showcase-editor :deep(.form-help) {
  @apply text-white/40 text-xs mt-1;
}

.editorial-showcase-editor :deep(.form-error) {
  @apply text-red-400 text-xs mt-1;
}

/* Keep Chrome/Edge autofill dark instead of white/yellow. Scoped to this editor only. */
.editorial-showcase-editor :deep(input:-webkit-autofill),
.editorial-showcase-editor :deep(input:-webkit-autofill:hover),
.editorial-showcase-editor :deep(input:-webkit-autofill:focus),
.editorial-showcase-editor :deep(input:-webkit-autofill:active),
.editorial-showcase-editor :deep(textarea:-webkit-autofill),
.editorial-showcase-editor :deep(select:-webkit-autofill) {
  -webkit-text-fill-color: #ffffff;
  -webkit-box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.4) inset;
  caret-color: #ffffff;
  border-color: rgba(255, 255, 255, 0.1);
  transition: background-color 9999s ease-in-out 0s;
}
</style>
