<template>
  <div class="min-h-screen bg-black pt-[var(--header-height)]">
    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        <span class="text-white/70 text-sm">Updating your QR code...</span>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-6 py-10">
      <!-- Header -->
      <div class="mb-10">
        <NuxtLink to="/dashboard" class="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm mb-4 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </NuxtLink>
        <h1 class="text-3xl md:text-4xl font-bold text-white">Edit QR Code</h1>
        <p class="text-white/60 mt-2">Update your QR code design and settings</p>
      </div>

      <!-- Two Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- QR Preview (Sticky) -->
        <div class="lg:col-span-1">
          <div class="sticky top-24">
            <div class="form-section">
              <div class="form-section-header">
                <div class="form-section-icon bg-gradient-to-br from-purple-500 to-violet-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <div>
                  <h2 class="form-section-title">Preview</h2>
                  <p class="form-section-subtitle">Live QR code preview</p>
                </div>
              </div>
              <div class="form-section-content flex justify-center">
                <div class="rounded-xl p-2 shadow-lg" :style="{ backgroundColor: bgColor }">
                  <div ref="qrcodeWrapper">
                    <!-- QR code will be rendered here by qr-code-styling -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Sections -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Name & Type Section -->
          <section class="form-section">
            <div class="form-section-header">
              <div class="form-section-icon bg-gradient-to-br from-purple-500 to-violet-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h2 class="form-section-title">QR Code Details</h2>
                <p class="form-section-subtitle">Name and type of your QR code</p>
              </div>
            </div>

            <div class="form-section-content">
              <div class="form-field">
                <label for="qr-name" class="form-label">QR Code Name <span class="text-red-400">*</span></label>
                <input
                  id="qr-name"
                  v-model="name"
                  type="text"
                  class="form-input"
                  placeholder="Enter a name for your QR code"
                />
              </div>

              <div class="form-field">
                <label class="form-label">QR Code Type</label>
                <div class="flex gap-4">
                  <button
                    type="button"
                    @click="selectType('bandProfile')"
                    class="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition"
                    :class="q_type === 'bandProfile' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/[0.07]'"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span class="font-medium">Artist Page</span>
                  </button>
                  <button
                    type="button"
                    @click="selectType('externalURL')"
                    class="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border cursor-pointer transition"
                    :class="q_type === 'externalURL' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/[0.07]'"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span class="font-medium">Link URL</span>
                  </button>
                </div>
              </div>

              <!-- Band Selection -->
              <div v-if="q_type === 'bandProfile'" class="form-field">
                <label for="band-select" class="form-label">Select Band</label>
                <select id="band-select" v-model="selectedBand" class="form-input">
                  <option disabled value="">Select a band</option>
                  <option :value="null">None</option>
                  <option v-for="band in bands" :key="band.id" :value="band.id">
                    {{ band.name }}
                  </option>
                  <option value="createNew">+ Create New Band</option>
                </select>
              </div>

              <!-- External Link -->
              <div v-if="q_type === 'externalURL'" class="form-field">
                <label for="external-link" class="form-label">External URL</label>
                <input
                  id="external-link"
                  v-model="link"
                  type="text"
                  class="form-input"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </section>

          <!-- Colors Section -->
          <section class="form-section">
            <div class="form-section-header">
              <div class="form-section-icon bg-gradient-to-br from-pink-500 to-rose-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <h2 class="form-section-title">Colors</h2>
                <p class="form-section-subtitle">Background and foreground colors</p>
              </div>
            </div>

            <div class="form-section-content">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-field">
                  <label class="form-label">Background Color</label>
                  <div class="color-picker-wrapper">
                    <input v-model="bgColor" type="text" class="form-input pr-12" />
                    <input v-model="bgColor" type="color" class="color-picker-input" />
                  </div>
                </div>
                <div v-if="!gradient" class="form-field">
                  <label class="form-label">Foreground Color</label>
                  <div class="color-picker-wrapper">
                    <input v-model="dotsColor" type="text" class="form-input pr-12" />
                    <input v-model="dotsColor" type="color" class="color-picker-input" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Gradient Section -->
          <section class="form-section">
            <div class="form-section-header">
              <div class="form-section-icon bg-gradient-to-br from-orange-500 to-amber-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 class="form-section-title">Gradient Options</h2>
                <p class="form-section-subtitle">Add gradient effects to your QR code</p>
              </div>
            </div>

            <div class="form-section-content">
              <label for="gradient-toggle" class="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/[0.07] transition">
                <div class="relative">
                  <input
                    id="gradient-toggle"
                    type="checkbox"
                    v-model="gradient"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-white/20 rounded-full peer peer-checked:bg-purple-600 transition-colors"></div>
                  <div class="absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5"></div>
                </div>
                <div>
                  <div class="text-white font-medium">Enable Gradient</div>
                  <div class="text-white/50 text-sm">Apply gradient colors to QR dots</div>
                </div>
              </label>

              <div v-if="gradient" class="space-y-4 mt-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="form-field">
                    <label class="form-label">Gradient Type</label>
                    <select v-model="gradientType" class="form-input">
                      <option value="linear">Linear</option>
                      <option value="radial">Radial</option>
                    </select>
                  </div>
                  <div class="form-field">
                    <label class="form-label">Rotation (degrees)</label>
                    <input
                      v-model.number="gradientRotation"
                      type="number"
                      class="form-input"
                      min="0"
                      max="360"
                    />
                  </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="form-field">
                    <label class="form-label">Start Color</label>
                    <div class="color-picker-wrapper">
                      <input v-model="gradientStartColor" type="text" class="form-input pr-12" />
                      <input v-model="gradientStartColor" type="color" class="color-picker-input" />
                    </div>
                  </div>
                  <div class="form-field">
                    <label class="form-label">End Color</label>
                    <div class="color-picker-wrapper">
                      <input v-model="gradientEndColor" type="text" class="form-input pr-12" />
                      <input v-model="gradientEndColor" type="color" class="color-picker-input" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Logo Section -->
          <section class="form-section">
            <div class="form-section-header">
              <div class="form-section-icon bg-gradient-to-br from-blue-500 to-cyan-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 class="form-section-title">Logo</h2>
                <p class="form-section-subtitle">Add your logo to the center</p>
              </div>
            </div>

            <div class="form-section-content">
              <label
                for="logo-upload"
                class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-purple-500/50 hover:bg-white/5 transition group"
              >
                <svg class="w-8 h-8 text-white/30 group-hover:text-purple-400 transition mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span class="text-white/50 group-hover:text-white/70 transition">Click to upload logo</span>
                <input
                  type="file"
                  id="logo-upload"
                  class="hidden"
                  @change="handleImageUpload"
                  accept="image/*"
                />
              </label>
            </div>
          </section>

          <!-- Dots Style Section -->
          <section class="form-section">
            <div class="form-section-header">
              <div class="form-section-icon bg-gradient-to-br from-green-500 to-emerald-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <h2 class="form-section-title">Dots Style</h2>
                <p class="form-section-subtitle">Customize the QR code pattern</p>
              </div>
            </div>

            <div class="form-section-content">
              <div class="form-field">
                <label class="form-label">Dots Type</label>
                <select v-model="dotsType" class="form-input">
                  <option value="rounded">Rounded</option>
                  <option value="dots">Dots</option>
                  <option value="classy">Classy</option>
                  <option value="classy-rounded">Classy Rounded</option>
                  <option value="square">Square</option>
                  <option value="extra-rounded">Extra Rounded</option>
                </select>
              </div>
            </div>
          </section>

          <!-- Corners Square Section -->
          <section class="form-section">
            <div class="form-section-header">
              <div class="form-section-icon bg-gradient-to-br from-violet-500 to-purple-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 15a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM17 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2z" />
                </svg>
              </div>
              <div>
                <h2 class="form-section-title">Corner Squares</h2>
                <p class="form-section-subtitle">Style the corner markers</p>
              </div>
            </div>

            <div class="form-section-content">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-field">
                  <label class="form-label">Corner Square Color</label>
                  <div class="color-picker-wrapper">
                    <input v-model="cornersSquareColor" type="text" class="form-input pr-12" />
                    <input v-model="cornersSquareColor" type="color" class="color-picker-input" />
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Corner Square Type</label>
                  <select v-model="cornersSquareType" class="form-input">
                    <option value="square">Square</option>
                    <option value="dot">Dot</option>
                    <option value="extraRounded">Extra Rounded</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <!-- Corners Dot Section -->
          <section class="form-section">
            <div class="form-section-header">
              <div class="form-section-icon bg-gradient-to-br from-red-500 to-rose-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 class="form-section-title">Corner Dots</h2>
                <p class="form-section-subtitle">Style the inner corner dots</p>
              </div>
            </div>

            <div class="form-section-content">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-field">
                  <label class="form-label">Corner Dot Color</label>
                  <div class="color-picker-wrapper">
                    <input v-model="cornersDotColor" type="text" class="form-input pr-12" />
                    <input v-model="cornersDotColor" type="color" class="color-picker-input" />
                  </div>
                </div>
                <div class="form-field">
                  <label class="form-label">Corner Dot Type</label>
                  <select v-model="cornersDotType" class="form-input">
                    <option value="square">Square</option>
                    <option value="dot">Dot</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <!-- Update Button -->
          <div class="pt-6 pb-10">
            <button
              @click="updateQrCodeSubmit"
              type="button"
              class="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold text-lg shadow-lg shadow-purple-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="loading"
            >
              <span v-if="loading" class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
              <span v-else>Update QR Code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from "vue"
import { useDebounceFn } from "@vueuse/core"
import { useRuntimeConfig } from "#app"
import { v4 as uuidv4 } from "uuid"
import { getEncodedQrUrl } from '~/utils/qr'

const config = useRuntimeConfig()
const { findOne, find } = useStrapi()
const user = useStrapiUser()
const router = useRouter()
const route = useRoute()
const client = useStrapiClient()

const loading = ref(false)
const qrcodeWrapper = ref(null)
const qrCode = ref(null)
const qrData = ref(null)

// Stable redirect id and URL (ALWAYS used in the QR)
const slugId = ref("") // persisted on the QR record

// storedUrl: the permanent encoded URL saved on this QR record.
// For NEW QRs this starts as getEncodedQrUrl(slugId) (qr.faneqo.com).
// For EXISTING QRs this is populated from data.url on load and NEVER
// recomputed from the gateway constant, so legacy qr.musicbizqr.com
// records keep their original encoded URL unchanged.
const storedUrl = ref('')

// directUrl is kept as a computed for display and watcher purposes,
// but is NOT used as the write-back value for existing records.
const directUrl = computed(() => storedUrl.value || (slugId.value ? getEncodedQrUrl(slugId.value) : ''))

function extractIdFromUrl(u) {
  if (!u) return ""
  try {
    const url = new URL(u)
    return url.searchParams.get("id") || ""
  } catch { return "" }
}

// A valid encoded QR URL is an HTTPS /directqr?id= URL.
function isValidDirectQrUrl(u) {
  if (!u || typeof u !== "string") return false
  return u.startsWith("https://") && u.includes("/directqr?id=") && !!extractIdFromUrl(u)
}

const qrValue = ref("")   // what the QR actually encodes (directUrl)
const qrSize = ref(300)

const bgColor = ref("#FFFFFF")
const gradient = ref(false)
const gradientType = ref("linear")
const gradientRotation = ref(0)
const gradientStartColor = ref("#e6289d")
const gradientEndColor = ref("#40353c")

const name = ref("name")
const link = ref("")      // destination; backend redirector uses this
const q_type = ref(null)

// qrOptions controls
const qrTypeNumber = ref(0)  // 0 = auto, 1–40 fixed
const qrEcLevel = ref("H")   // L, M, Q, H
const qrMargin = ref(4)      // quiet zone (modules)

const imageSettings = reactive({
  src: "",
  imageSize: 0.4,
  margin: 0,
  crossOrigin: "anonymous",
})

const dotsColor = ref("#000000")
const dotsType = ref("square")

const cornersSquareColor = ref("#000000")
const cornersSquareType = ref("square")

const cornersDotColor = ref("#000000")
const cornersDotType = ref("square")

const bands = ref([])
const events = ref([])
const tours = ref([])
const albums = ref([])

const selectedEvent = ref(null)
const selectedTour = ref(null)
const selectedAlbum = ref(null)
const selectedBand = ref(null)

function normalizeLink(val) {
  if (!val) return ""
  if (/^https?:\/\//i.test(val)) return val.trim()
  if (/^www\./i.test(val)) return `https://${val.trim()}`
  return `https://www.${val.trim()}`
}

// Debounced QR update
const updateQRCodeDebounced = useDebounceFn(() => {
  if (qrCode.value) {
    qrCode.value.update(getQRCodeOptions())
  }
}, 150)

onMounted(async () => {
  loading.value = true
  try {
    const response = await findOne("qrs", route.params.id, {
      populate: {
        event: { populate: "*" },
        tour: { populate: "*" },
        album: { populate: "*" },
        band: { populate: "*" },
        q_image: { populate: "*" },
      },
    })
    qrData.value = response.data
    await initializeVariables()

    if (process.client) {
      const { default: QRCodeStyling } = await import("qr-code-styling")
      qrCode.value = new QRCodeStyling(getQRCodeOptions())
      qrCode.value.append(qrcodeWrapper.value)
      updateQRCodeDebounced()
      initializeWatcher()
    }
  } catch (err) {
    console.error("Error fetching QR code data:", err)
  } finally {
    loading.value = false
  }
})

async function initializeVariables() {
  const data = qrData.value.attributes

  // 1) Resolve the stable QR identifier in priority order:
  //    1. data.slugId
  //    2. id extracted from data.url
  //    3. id extracted from data.options?.data
  //    4. existing Strapi record id (stable, never random)
  //    5. random uuid only if there is no stable id at all
  const optionsData = data.options?.data
  const existingId =
    data.slugId ||
    extractIdFromUrl(data.url) ||
    extractIdFromUrl(optionsData) ||
    (qrData.value.id != null ? String(qrData.value.id) : "")
  slugId.value = existingId || uuidv4()

  // 2) Preserve the existing encoded URL in priority order:
  //    1. data.url (if a valid /directqr?id= URL)
  //    2. data.options?.data (if a valid /directqr?id= URL)
  //    3. only then generate a new URL with the current gateway
  // This keeps legacy qr.musicbizqr.com records on their original host even
  // when only one of the two fields survived.
  if (isValidDirectQrUrl(data.url)) {
    storedUrl.value = data.url
  } else if (isValidDirectQrUrl(optionsData)) {
    storedUrl.value = optionsData
  } else {
    storedUrl.value = getEncodedQrUrl(slugId.value)
  }
  qrValue.value = storedUrl.value

  // Only repair a truly missing slugId — never overwrite a valid existing url.
  if (!data.slugId) {
    try {
      await client(`/qrs/${qrData.value.id}`, {
        method: "PUT",
        body: { data: { slugId: slugId.value } },
      })
    } catch (e) {
      console.warn("Could not persist slugId repair:", e)
    }
  }

  // 2) Rest of fields
  q_type.value = data.q_type || null
  link.value   = data.link || ""
  name.value   = data.name || "add name"
  qrSize.value = data.options?.size || 300

  bgColor.value = data.options?.backgroundOptions?.color || "#FFFFFF"

  gradient.value = !!data.options?.dotsOptions?.gradient
  gradientType.value = data.options?.dotsOptions?.gradient?.type || "linear"
  gradientRotation.value = data.options?.dotsOptions?.gradient?.rotation
    ? (data.options.dotsOptions.gradient.rotation * 180) / Math.PI
    : 0
  gradientStartColor.value =
    data.options?.dotsOptions?.gradient?.colorStops?.[0]?.color || "#e6289d"
  gradientEndColor.value =
    data.options?.dotsOptions?.gradient?.colorStops?.[1]?.color || "#40353c"

  imageSettings.src =
    data.options?.imageOptions?.src || data.options?.image || ""
  imageSettings.imageSize = data.options?.imageOptions?.imageSize || 0.4
  imageSettings.margin = data.options?.imageOptions?.margin || 0
  imageSettings.crossOrigin = "anonymous"

  dotsColor.value = data.options?.dotsOptions?.color || "#000000"
  dotsType.value = data.options?.dotsOptions?.type || "square"

  cornersSquareColor.value =
    data.options?.cornersSquareOptions?.color || "#000000"
  cornersSquareType.value =
    data.options?.cornersSquareOptions?.type || "square"

  cornersDotColor.value = data.options?.cornersDotOptions?.color || "#000000"
  cornersDotType.value = data.options?.cornersDotOptions?.type || "square"

  // qrOptions with safe defaults
  qrTypeNumber.value = data.options?.qrOptions?.typeNumber ?? 0
  qrEcLevel.value    = data.options?.qrOptions?.errorCorrectionLevel ?? "Q"
  qrMargin.value     = data.options?.qrOptions?.margin ?? 4

  selectedEvent.value = data.event?.data?.id ?? null
  selectedTour.value = data.tour?.data?.id ?? null
  selectedAlbum.value = data.album?.data?.id ?? null
  selectedBand.value = data.band?.data?.id ?? null

  fetchUserRelatedData()
}

async function rebuildQr() {
  if (!process.client) return
  const { default: QRCodeStyling } = await import("qr-code-styling")
  if (qrcodeWrapper.value) qrcodeWrapper.value.innerHTML = ""
  qrCode.value = new QRCodeStyling(getQRCodeOptions())
  qrCode.value.append(qrcodeWrapper.value)
}

function getQRCodeOptions() {
  // DEBUG: Log exactly what URL is being encoded in the QR
  console.log('[EditQR] getQRCodeOptions called with data:', directUrl.value)
  
  const baseDots = { type: dotsType.value }

  const opts = {
    margin: 16,
    qrOptions: {
      errorCorrectionLevel: 'H',
      
    },
   
    width: qrSize.value,
    height: qrSize.value,
    data: directUrl.value, // ✅ ALWAYS the redirect URL
    dotsOptions: baseDots,
    cornersSquareOptions: {
      color: cornersSquareColor.value,
      type: cornersSquareType.value,
    },
    cornersDotOptions: {
      color: cornersDotColor.value,
      type: cornersDotType.value,
    },
    backgroundOptions: { color: bgColor.value },
    imageOptions: {
      crossOrigin: imageSettings.crossOrigin,
      margin: imageSettings.margin,
      imageSize: imageSettings.imageSize,
      src: imageSettings.src,
    },
  }

  if (imageSettings.src) {
    opts.image = imageSettings.src
  }

  if (gradient.value) {
    opts.dotsOptions.gradient = {
      type: gradientType.value,
      rotation: (gradientRotation.value * Math.PI) / 180,
      colorStops: [
        { offset: 0, color: gradientStartColor.value },
        { offset: 1, color: gradientEndColor.value },
      ],
    }
  } else {
    opts.dotsOptions.gradient = null
    opts.dotsOptions.color = dotsColor.value
  }

  return opts
}

function initializeWatcher() {
  watch(gradient, async (isOn, wasOn) => {
    if (!qrCode.value) return
    if (!isOn && wasOn) {
      qrCode.value.update({ dotsOptions: { gradient: null, color: dotsColor.value } })
    }
    updateQRCodeDebounced()
  })

  watch([qrTypeNumber, qrEcLevel, () => directUrl.value], async () => {
    await rebuildQr()
  })

  watch(
    [
      () => directUrl.value,  // keep in the dependency list; data is derived
      qrSize,
      bgColor,
      dotsColor,
      dotsType,
      cornersSquareColor,
      cornersSquareType,
      cornersDotColor,
      cornersDotType,
      gradient,
      gradientType,
      gradientRotation,
      gradientStartColor,
      gradientEndColor,
      () => imageSettings.src,
    ],
    updateQRCodeDebounced,
    { deep: true }
  )
}

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    imageSettings.src = e.target.result
    if (qrCode.value) {
      qrCode.value.update(getQRCodeOptions())
    }
  }
  reader.readAsDataURL(file)
}

const fetchUserRelatedData = async () => {
  try {
    bands.value = (
      await find("bands", {
        filters: { users_permissions_user: { id: user.value.id } },
      })
    ).data
    events.value = (
      await find("events", {
        filters: { users_permissions_user: { id: user.value.id } },
      })
    ).data
    tours.value = (
      await find("tours", {
        filters: { users_permissions_user: { id: user.value.id } },
      })
    ).data
    albums.value = (
      await find("albums", {
        filters: { users_permissions_user: { id: user.value.id } },
      })
    ).data
  } catch (err) {
    console.error("Error fetching user-related data:", err)
  }
}

const selectType = (type) => {
  q_type.value = type
  selectedBand.value = null
  selectedAlbum.value = null
  selectedTour.value = null
  selectedEvent.value = null

  // ✅ Never overwrite qrValue with link; keep redirect URL
  qrValue.value = directUrl.value
  updateQRCodeDebounced()
}

const updateQrCodeSubmit = async () => {
  const qrId = route.params.id
  try {
    loading.value = true
    const formData = new FormData()

    // ✅ Preserve the permanent encoded URL — use storedUrl, not a recomputed value.
    // This ensures existing qr.musicbizqr.com records keep their original URL.
    qrValue.value = storedUrl.value

    console.log('[EditQR SAVE] ✅ Saving QR with URL:', storedUrl.value)
    console.log('[EditQR SAVE] ✅ slugId:', slugId.value)

    const form = {
      url: storedUrl.value,   // permanent encoded URL — never overwritten with recomputed value
      users_permissions_user: { id: user.value.id },
      q_type: q_type.value,
      link: q_type.value === "externalURL" ? normalizeLink(link.value) : (link.value || null), // destination
      name: name.value,
      options: {
        data: storedUrl.value, // ✅ CRITICAL: Store the URL in options for download
        size: qrSize.value,
        backgroundOptions: { color: bgColor.value },
        image: imageSettings.src,
        imageOptions: { ...imageSettings },
        dotsOptions: {
          type: dotsType.value,
          color: !gradient.value ? dotsColor.value : undefined,
          gradient: gradient.value
            ? {
                type: gradientType.value,
                rotation: (gradientRotation.value * Math.PI) / 180,
                colorStops: [
                  { offset: 0, color: gradientStartColor.value },
                  { offset: 1, color: gradientEndColor.value },
                ],
              }
            : undefined,
        },
        cornersSquareOptions: {
          color: cornersSquareColor.value,
          type: cornersSquareType.value,
        },
        cornersDotOptions: {
          color: cornersDotColor.value,
          type: cornersDotType.value,
        },
        qrOptions: {
          typeNumber: qrTypeNumber.value,
          errorCorrectionLevel: qrEcLevel.value,
          margin: qrMargin.value,
        },
      },
      band:  selectedBand.value  !== "createNew" ? selectedBand.value  : null,
      album: selectedAlbum.value !== "createNew" ? selectedAlbum.value : null,
      event: selectedEvent.value !== "createNew" ? selectedEvent.value : null,
      tour:  selectedTour.value  !== "createNew" ? selectedTour.value  : null,
      slugId: slugId.value,    // persist the id we use in /directqr?id=
    }

    const { default: QRCodeStyling } = await import("qr-code-styling")
    const blob = await qrCode.value.getRawData("png")
    const file = new File([blob], "qrcode.png")
    formData.append("files.q_image", file, "qrcode.png")
    formData.append("data", JSON.stringify(form))

    await client(`/qrs/${qrId}`, { method: "PUT", body: formData })

    if (selectedBand.value === "createNew") {
      router.push({ path: "/createband", query: { createnew: "createNew", qrId } })
    } else if (selectedAlbum.value === "createNew") {
      router.push({ path: "/newalbum", query: { createnew: "createNew", qrId } })
    } else if (selectedTour.value === "createNew") {
      router.push({ path: "/newtour", query: { createnew: "createNew", qrId } })
    } else if (selectedEvent.value === "createNew") {
      router.push({ path: "/newevent", query: { createnew: "createNew", qrId } })
    } else {
      router.push("/dashboard")
    }
  } catch (err) {
    console.error("Error updating QR code:", err)
  } finally {
    loading.value = false
  }
}
</script>


<style scoped>
/* Form Section Styles */
.form-section {
  @apply bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden;
}

.form-section-header {
  @apply flex items-center gap-4 p-5 border-b border-white/10 bg-white/[0.02];
}

.form-section-icon {
  @apply w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg;
}

.form-section-title {
  @apply text-lg font-semibold text-white;
}

.form-section-subtitle {
  @apply text-sm text-white/50;
}

.form-section-content {
  @apply p-5 space-y-4;
}

.form-field {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-white/70;
}

.form-input {
  @apply w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition;
}

.form-input option {
  @apply bg-gray-900 text-white;
}

/* Color Picker Wrapper */
.color-picker-wrapper {
  @apply relative;
}

.color-picker-input {
  @apply absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg border-0 cursor-pointer;
}

/* Fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
