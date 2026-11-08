<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[1000]">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80" @click="close"></div>

      <!-- Modal (full screen) -->
      <div
        ref="modal"
        class="fixed inset-0 flex flex-col text-white"
        role="dialog"
        aria-modal="true"
        @keydown.esc="close"
      >
        <!-- Header -->
        <div
          class="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-neutral-900/90 backdrop-blur border-b border-white/10"
        >
          <h2 class="text-lg font-semibold">Download QR</h2>
          <button
            @click="close"
            class="rounded-lg p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>

        <!-- Loading / Warning states -->
        <div v-if="isLoading" class="px-5 py-3 bg-white/5 text-white/80 text-sm">
          <div class="flex items-center gap-3">
            <span class="inline-block h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
            <span>Loading QR…</span>
          </div>
        </div>

        <div v-else-if="showMissingOptionsWarning" class="px-5 py-3 bg-amber-500/10 text-amber-300 text-sm">
          ⚠️ No <code>qr-options</code> (with a <code>data</code> field) were passed.
          Showing a test QR until you provide real options.
        </div>

        <!-- Body -->
        <div
          class="h-[calc(100vh-56px)] grid sm:grid-cols-2 gap-6 p-5 overflow-y-auto"
        >
          <!-- Preview (centered; borderless) -->
          <div class="flex items-center justify-center">
            <div
              class="relative aspect-square w-[min(90vw,80vh)]"
              :style="{
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: 'center'
              }"
            >
              <div
                v-if="isLoading"
                class="absolute inset-0 z-10 grid place-items-center bg-black/30 backdrop-blur-sm rounded"
              >
                <div class="flex flex-col items-center gap-3">
                  <span class="inline-block h-10 w-10 rounded-full border-4 border-white/20 border-t-white animate-spin"></span>
                  <div class="text-sm text-white/80">Loading preview…</div>
                </div>
              </div>
              <div
                ref="previewEl"
                class="w-full h-full
                       [&>canvas]:block [&>canvas]:mx-auto [&>canvas]:h-full [&>canvas]:w-full
                       [&>svg]:block   [&>svg]:mx-auto   [&>svg]:h-full   [&>svg]:w-full"
              ></div>
            </div>
          </div>

          <!-- Controls -->
          <div class="space-y-5">
            <!-- File name -->
            <div>
              <label class="block text-sm mb-1">File name</label>
              <input
                v-model="fileName"
                type="text"
                class="w-full rounded-md bg-neutral-800 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="my-qr"
              />
            </div>

            <!-- Preview Zoom -->
            <div>
              <label class="block text-sm mb-1">Preview zoom</label>
              <input
                type="range"
                min="50"
                max="200"
                step="10"
                v-model.number="previewZoom"
                class="w-full"
              />
              <div class="text-xs text-white/60 mt-1">{{ previewZoom }}%</div>
            </div>

            <!-- Export size -->
            <div>
              <label class="block text-sm mb-1">Export size (pixels)</label>
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="s in [512, 1024, 2048]"
                  :key="s"
                  class="px-3 py-2 rounded-md border border-white/10"
                  :class="
                    exportSize === s
                      ? 'bg-white text-black'
                      : 'bg-neutral-800 hover:bg-neutral-700'
                  "
                  @click="exportSize = s"
                >
                  {{ s }}px
                </button>

                <div class="flex items-center gap-2">
                  <input
                    v-model.number="customSize"
                    type="number"
                    min="64"
                    step="1"
                    class="w-28 rounded-md bg-neutral-800 border border-white/10 px-2 py-2"
                    placeholder="Custom"
                    @input="exportSize = customSize || exportSize"
                  />
                  <span class="text-xs text-white/60">(custom)</span>
                </div>
              </div>
            </div>

            <!-- Format -->
            <div>
              <label class="block text-sm mb-1">Format</label>
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="ext in ['png', 'jpeg', 'svg']"
                  :key="ext"
                  @click="format = ext"
                  class="px-3 py-2 rounded-md border border-white/10"
                  :class="
                    format === ext
                      ? 'bg-white text-black'
                      : 'bg-neutral-800 hover:bg-neutral-700'
                  "
                >
                  {{ ext.toUpperCase() }}
                </button>
              </div>
              <p class="text-xs text-white/60 mt-2">
                SVG scales cleanly in editors. If your QR has a raster logo,
                that part won’t upscale beyond its original resolution.
              </p>
            </div>

            <!-- SAFE MODE toggle -->
            <div class="p-3 rounded-lg border-2" :class="safeMode ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5'">
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="safeMode" class="w-4 h-4" />
                <span class="text-sm font-semibold" :class="safeMode ? 'text-emerald-400' : 'text-white/70'">
                  Safe QR Mode (recommended)
                </span>
              </label>
              <p class="text-xs text-white/50 mt-1">
                Uses square dots, solid background, and high contrast for maximum scan reliability.
              </p>
            </div>

            <!-- Background options (for PNG/JPEG) -->
            <div v-if="format !== 'svg' && !safeMode">
              <label class="inline-flex items-center gap-2">
                <input type="checkbox" v-model="transparentBg" />
                <span class="text-sm">Transparent background</span>
              </label>
              <div v-if="!transparentBg" class="mt-3">
                <label class="block text-sm mb-1">Background color (hex)</label>
                <input
                  v-model="bgColor"
                  type="text"
                  placeholder="#FFFFFF"
                  class="w-full rounded-md bg-neutral-800 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
            </div>

            <!-- Actions -->
            <div class="pt-2 flex items-center gap-3">
              <button
                @click="download"
                :disabled="downloading"
                class="px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 disabled:opacity-60"
              >
                {{ downloading ? 'Preparing…' : 'Download' }}
              </button>
              <button
                @click="close"
                class="px-4 py-2 rounded-lg bg-neutral-800 border border-white/10 hover:bg-neutral-700"
              >
                Cancel
              </button>
            </div>

            <p v-if="errorMsg" class="text-sm text-red-400 pt-1">
              {{ errorMsg }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, computed, nextTick } from 'vue'

// Inline sanitization to avoid import issues
function sanitizeQrValue(value) {
  let str = String(value ?? '')
  str = str.replace(/[\u200B-\u200D\uFEFF\u00A0\u2060\u180E]/g, '')
  return str.trim()
}

const SAFE_QR_CONFIG = {
  margin: 20,
  qrOptions: { errorCorrectionLevel: 'M' },
  dotsOptions: { type: 'square', color: '#000000' },
  cornersSquareOptions: { type: 'square', color: '#000000' },
  cornersDotOptions: { type: 'square', color: '#000000' },
  backgroundOptions: { color: '#FFFFFF' },
}

// Props from parent
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  qrInstance: { type: Object, default: null }, // optional external instance
  qrOptions: { type: Object, default: null },  // options to build internal instance
  defaultName: { type: String, default: 'qr-code' },
})
const emit = defineEmits(['update:modelValue'])

// UI state
const modal = ref(null)
const previewEl = ref(null)

const currentData = ref('')

// Holds style bits so we can re-apply them on preview/export (prevents color loss)
const styleOpts = ref(null)

const fileName = ref(props.defaultName)
const previewZoom = ref(100)     // % (CSS scale only)
const exportSize = ref(512)      // SAFE: Use 512 for reliable scanning
const customSize = ref(null)
const format = ref('png')        // 'png' | 'jpeg' | 'svg'
const transparentBg = ref(false) // default unchecked - SAFE: solid background
const bgColor = ref('#FFFFFF')
const safeMode = ref(false)      // PWA was the issue, not styling - show real QR
const showDebug = ref(false)     // Debug panel toggle
const downloading = ref(false)
const errorMsg = ref('')
const isLoading = ref(false)
const showMissingOptionsWarning = ref(false)

// Internal QR instance (if parent didn’t pass one)
let qr = null
let appended = false
const PREVIEW_SIZE = 512 // fast render size for on-screen preview
let missingOptsTimer = null

const hasReadyOptions = computed(() => {
  return !!(props.qrInstance || (props.qrOptions && props.qrOptions.data))
})

// Normalize options: ensure imageOptions.src mirrors image if needed, and set preview size
function withImageNormalized(opts) {
  if (!opts) return opts
  const copy = { ...opts }

  // If only imageOptions.src is provided, set image as well (lib reads both)
  if (!copy.image && copy.imageOptions?.src) copy.image = copy.imageOptions.src

  // force preview size (actual export size is handled at download time)
  copy.width = copy.width || PREVIEW_SIZE
  copy.height = copy.height || PREVIEW_SIZE

  return copy
}

function close() {
  emit('update:modelValue', false)
}

async function mountQr() {
  if (typeof window === 'undefined' || !previewEl.value) return

  isLoading.value = true
  errorMsg.value = ''

  // CRITICAL: Use real domain as fallback, not example.com which phones won't recognize
  const FALLBACK_DATA = 'https://musicbizqr.com'

  // Do we have usable options?
  const hasOpts = !!(props.qrInstance || (props.qrOptions && props.qrOptions.data))

  showMissingOptionsWarning.value = !hasOpts

  // Base options (respect incoming options but force preview size)
  const rawOpts = hasOpts ? withImageNormalized(props.qrOptions) : {
    data: FALLBACK_DATA,
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    backgroundOptions: { color: '#FFFFFF' },
    dotsOptions: { type: 'square', color: '#000000' },
  }

  // Capture and lock the encoded string we want to use everywhere
  let candidateData =
    (props.qrOptions && props.qrOptions.data) ||
    (props.qrInstance && props.qrInstance?._options?.data) ||
    rawOpts.data ||
    ''

  // Sanitize the data to remove invisible characters (BOM, zero-width, etc.)
  candidateData = sanitizeQrValue(candidateData)

  // Validate the URL
  const isValidUrl = (s) => /^https?:\/\/.+/.test(s || '')
  
  if (!isValidUrl(candidateData)) {
    console.error('[DownloadQr] INVALID DATA - not a URL:', candidateData)
    candidateData = FALLBACK_DATA
    console.warn('[DownloadQr] Using fallback URL:', candidateData)
  }
  
  currentData.value = candidateData

  // Ensure data + preview dimensions are present
  let baseOpts = {
    ...rawOpts,
    data: currentData.value,
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
  }

  // SAFE MODE: Apply proven-scannable config (optional fallback)
  if (safeMode.value) {
    baseOpts = {
      ...baseOpts,
      ...SAFE_QR_CONFIG,
      data: currentData.value, // Keep the sanitized data
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
    }
  }

  // Save style bits so preview/export re-use the exact look
  styleOpts.value = {
    margin: baseOpts?.margin ?? 20, // SAFE: Ensure quiet zone
    backgroundOptions: baseOpts?.backgroundOptions || { color: '#FFFFFF' },
    dotsOptions: baseOpts?.dotsOptions || { type: 'square', color: '#000000' },
    cornersSquareOptions: baseOpts?.cornersSquareOptions,
    cornersDotOptions: baseOpts?.cornersDotOptions,
    image: baseOpts?.image,
    imageOptions: baseOpts?.imageOptions,
  }
  
  // Sync local bgColor with saved options
  if (baseOpts?.backgroundOptions?.color) {
    bgColor.value = baseOpts.backgroundOptions.color
  }

  try {
    if (props.qrInstance) {
      // Use external instance but enforce full options once (incl. data)
      qr = props.qrInstance
      try { await qr.update({ ...baseOpts }) } catch { /* noop for older builds */ }
    } else {
      if (!qr) {
        const { default: QRCodeStyling } = await import('qr-code-styling')
        qr = new QRCodeStyling({ ...baseOpts })
      } else {
        try { await qr.update({ ...baseOpts }) } catch { /* noop */ }
      }
    }
  } catch (e) {
    console.error('[DownloadQr] Failed to create QR instance:', e)
    errorMsg.value = 'Could not create QR instance.'
    isLoading.value = false
    return
  }

  // Append once
  try {
    if (!appended) {
      previewEl.value.innerHTML = ''
      qr.append(previewEl.value)
      appended = true
    }
  } catch (e) {
    console.error('[DownloadQr] Failed to append QR to DOM:', e)
    errorMsg.value = 'Could not render into the modal.'
    isLoading.value = false
    return
  }

  // Final sync to ensure preview uses locked data + styles
  try {
    await qr.update({
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      backgroundOptions: { color: computeBgColor() },
      data: currentData.value,
      ...styleOpts.value,
    })
  } catch { /* older versions may ignore partial updates */ }

  await refreshPreview() // keeps your existing flow; safe to call

  isLoading.value = false
}
// Debug logging on mount
if (typeof window !== 'undefined') {
  console.log('[DownloadQr] Component loaded with props:', {
    modelValue: props.modelValue,
    hasQrInstance: !!props.qrInstance,
    qrOptionsData: props.qrOptions?.data,
    defaultName: props.defaultName
  })
}

watch(
  () => props.qrOptions,
  (val) => {
    console.log('[DownloadQr] qrOptions changed:', val)
  },
  { deep: true }
)

function computeBgColor() {
  // For PNG/JPEG, use hex or transparent; for SVG, 'transparent' usually works too
  if (transparentBg.value) return 'transparent'
  // Use local bgColor (which is synced from saved options) or fall back to saved options directly
  return bgColor.value || styleOpts.value?.backgroundOptions?.color || '#FFFFFF'
}

async function refreshPreview() {
  if (!qr) return
  const bg = computeBgColor()

  try {
    await qr.update({
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      backgroundOptions: { color: bg },
      data: currentData.value, 
      // 👇 re-apply full style so preview reflects saved DB design
      ...styleOpts.value,
    })
  } catch (e) {
    // no-op for older versions
  }
}

async function download() {
  if (!qr) {
    errorMsg.value = 'QR instance not ready.'
    return
  }
  errorMsg.value = ''
  downloading.value = true

  const bg = computeBgColor()
  const targetSize = Math.max(64, Number(exportSize.value) || 1024)
  const ext = format.value
  const name = (fileName.value || 'qr-code')
    .replace(/\s+/g, '-')
    .toLowerCase()
  const quality = 1

  // CRITICAL DEBUG: Log exactly what we're encoding
  console.log('[DownloadQr] DOWNLOADING WITH DATA:', currentData.value)
  console.log('[DownloadQr] styleOpts:', JSON.stringify(styleOpts.value))
  
  // Validate data one more time before download
  if (!currentData.value || !currentData.value.startsWith('http')) {
    console.error('[DownloadQr] CRITICAL: Invalid data at download time:', currentData.value)
    errorMsg.value = 'Invalid QR data. Please try again.'
    downloading.value = false
    return
  }

  try {
    // Update to export size + style for the actual file
    await qr.update({
      width: targetSize,
      height: targetSize,
      backgroundOptions: { color: bg },
      data: currentData.value, 
      // 👇 critical: keep dots/corners/logo so export matches preview/DB
      ...styleOpts.value,
    })

    await qr.download({ name, extension: ext, quality })

    // Return preview back to fast size (keep UI snappy)
    await qr.update({
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
       data: currentData.value, 
      backgroundOptions: { color: bg },
      ...styleOpts.value,
    })
  } catch (e) {
    // Fallback paths for some library versions
    try {
      if (qr.getRawData) {
        const blob = await qr.getRawData(ext)
        triggerBlobDownload(blob, `${name}.${ext}`)
      } else if (qr.getImage) {
        const blob = await qr.getImage(ext)
        triggerBlobDownload(blob, `${name}.${ext}`)
      } else {
        throw e
      }
    } catch (e2) {
      console.error('QR download failed:', e2)
      errorMsg.value = 'Could not generate the file. Try PNG or reduce size.'
    }
  } finally {
    downloading.value = false
  }
}

function triggerBlobDownload(blob, fname) {
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fname
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// — Watches —
watch([format, transparentBg, bgColor], () => {
  if (props.modelValue) refreshPreview()
})

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await onOpen()
      setTimeout(() => modal.value?.focus?.(), 0)
    } else {
      onClose()
    }
  }
)

watch(
  () => hasReadyOptions.value,
  async (ready) => {
    if (!props.modelValue || !ready) return
    if (missingOptsTimer) {
      clearTimeout(missingOptsTimer)
      missingOptsTimer = null
    }
    await nextTick()
    await mountQr()
  }
)

onMounted(() => {
  if (props.modelValue) onOpen()
})

async function onOpen() {
  fileName.value = props.defaultName || 'qr-code'
  errorMsg.value = ''
  appended = false // allow append if remounting

  // Initialize bgColor from saved options if available
  if (props.qrOptions?.backgroundOptions?.color) {
    bgColor.value = props.qrOptions.backgroundOptions.color
  }

  showMissingOptionsWarning.value = false
  isLoading.value = true
  await nextTick()

  if (missingOptsTimer) {
    clearTimeout(missingOptsTimer)
    missingOptsTimer = null
  }

  if (hasReadyOptions.value) {
    await mountQr()
    return
  }

  // Grace period for async props: keep spinner and avoid warning flash.
  missingOptsTimer = setTimeout(async () => {
    if (!props.modelValue) return
    if (hasReadyOptions.value) return
    await mountQr()
  }, 2500)
}

function onClose() {
  if (missingOptsTimer) {
    clearTimeout(missingOptsTimer)
    missingOptsTimer = null
  }
  isLoading.value = false
  showMissingOptionsWarning.value = false
}
</script>

<style scoped>
/* Allow focusing the container for Esc key */
div[role="dialog"] {
  outline: none;
}
</style>
