<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/80 backdrop-blur-sm"
        @click="close"
      ></div>

      <!-- Modal -->
      <div class="relative w-full max-w-lg bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 class="text-xl font-bold text-white">Import Fans</h2>
            <p class="text-white/50 text-sm mt-1">Upload a CSV file with email addresses</p>
          </div>
          <button
            @click="close"
            class="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg class="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Upload Area -->
          <div
            v-if="!importResult"
            class="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-white/40 transition-colors cursor-pointer"
            @click="triggerFileInput"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="handleDrop"
            :class="{ 'border-pink-500/50 bg-pink-500/5': isDragging }"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".csv,.txt"
              class="hidden"
              @change="handleFileSelect"
            />

            <div v-if="!selectedFile && !loading">
              <svg class="w-12 h-12 mx-auto text-white/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="text-white font-medium mb-1">Drop your CSV file here</p>
              <p class="text-white/50 text-sm">or click to browse</p>
            </div>

            <div v-else-if="selectedFile && !loading">
              <svg class="w-12 h-12 mx-auto text-emerald-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-white font-medium mb-1">{{ selectedFile.name }}</p>
              <p class="text-white/50 text-sm">{{ parsedFans.length }} valid emails found</p>
            </div>

            <div v-else-if="loading">
              <div class="w-12 h-12 mx-auto mb-4 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
              <p class="text-white font-medium">Importing fans...</p>
            </div>
          </div>

          <!-- Import Result -->
          <div v-if="importResult" class="space-y-4">
            <div class="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <svg class="w-6 h-6 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-emerald-400 font-medium">Import Complete</p>
                <p class="text-white/60 text-sm">{{ importResult.imported }} fans added to your list</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="p-4 bg-white/5 rounded-xl text-center">
                <p class="text-2xl font-bold text-white">{{ importResult.totalRows }}</p>
                <p class="text-white/50 text-sm">Total Rows</p>
              </div>
              <div class="p-4 bg-white/5 rounded-xl text-center">
                <p class="text-2xl font-bold text-emerald-400">{{ importResult.imported }}</p>
                <p class="text-white/50 text-sm">Imported</p>
              </div>
              <div class="p-4 bg-white/5 rounded-xl text-center">
                <p class="text-2xl font-bold text-amber-400">{{ importResult.duplicates }}</p>
                <p class="text-white/50 text-sm">Duplicates</p>
              </div>
              <div class="p-4 bg-white/5 rounded-xl text-center">
                <p class="text-2xl font-bold text-red-400">{{ importResult.invalid }}</p>
                <p class="text-white/50 text-sm">Invalid</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            v-if="!importResult"
            @click="close"
            class="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            v-if="selectedFile && !loading && !importResult"
            @click="doImport"
            class="px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Import {{ parsedFans.length }} Fans
          </button>
          <button
            v-if="importResult"
            @click="close"
            class="px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useFans } from '~/composables/useFans';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  /** Import writes to exactly this band's Fan List — never an inferred one. */
  bandId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'imported']);

const { parseCSV, importFans } = useFans();

const fileInput = ref(null);
const selectedFile = ref(null);
const parsedFans = ref([]);
const loading = ref(false);
const isDragging = ref(false);
const importResult = ref(null);

function close() {
  emit('update:modelValue', false);
}

function reset() {
  selectedFile.value = null;
  parsedFans.value = [];
  loading.value = false;
  importResult.value = null;
}

watch(() => props.modelValue, (val) => {
  if (val) {
    reset();
  }
});

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileSelect(event) {
  const file = event.target.files?.[0];
  if (file) {
    processFile(file);
  }
}

function handleDrop(event) {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    processFile(file);
  }
}

async function processFile(file) {
  selectedFile.value = file;
  const text = await file.text();
  parsedFans.value = parseCSV(text);
}

async function doImport() {
  if (parsedFans.value.length === 0) return;
  if (!props.bandId) return;

  loading.value = true;
  try {
    const result = await importFans(parsedFans.value, props.bandId);
    importResult.value = result.data;
    emit('imported', result.data);
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    loading.value = false;
  }
}
</script>
