<template>
  <div class="min-h-screen bg-black pt-[var(--header-height)]">
    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        <span class="text-white/70 text-sm">Creating your QR code...</span>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-6 py-10">
      <!-- Header -->
      <div class="mb-10">
        <NuxtLink to="/dashboard" class="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm mb-4 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </NuxtLink>
        <h1 class="text-3xl md:text-4xl font-bold text-white">Create QR Code</h1>
        <p class="text-white/60 mt-2">Design and customize your QR code</p>
      </div>

      <!-- Two Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- QR Preview (Sticky) -->
        <div class="lg:col-span-5">
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
                <div class="relative w-full">
                  <div class="rounded-2xl p-3 sm:p-4 shadow-2xl shadow-purple-500/10 border border-white/10" :style="{ backgroundColor: bgColor }">
                    <div ref="qrcodeWrapper" class="qr-preview-wrapper flex justify-center items-center min-h-[200px]">
                      <!-- QR code will be rendered here by qr-code-styling -->
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Sections -->
        <div class="lg:col-span-7 space-y-6">
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
                    :class="route.query.type === 'bandProfile' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/[0.07]'"
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
                    :class="route.query.type === 'externalURL' ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/[0.07]'"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span class="font-medium">Link URL</span>
                  </button>
                </div>
              </div>

              <!-- Band Selection -->
              <div v-if="route.query.type === 'bandProfile'" class="form-field">
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
              <div v-if="route.query.type === 'externalURL'" class="form-field">
                <label for="external-link" class="form-label">External URL</label>
                <input
                  id="external-link"
                  v-model="link"
                  type="text"
                  class="form-input"
                  placeholder="https://example.com"
                  @change="link = normalizeLink(link)"
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
                <div class="form-field">
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

          <!-- Save Button -->
          <div class="pt-6 pb-10">
            <button
              @click="saveQrCode"
              type="button"
              class="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold text-lg shadow-lg shadow-purple-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="loading"
            >
              <span v-if="loading" class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
              <span v-else>Save QR Code</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { useAsyncData, useRuntimeConfig } from '#app'
import { useRouter, useRoute, useStrapi, useStrapiUser, useStrapiClient } from '#imports'
import { v4 as uuidv4 } from 'uuid'
import { useDebounceFn, useThrottleFn } from '@vueuse/core'
import { getEncodedQrUrl } from '~/utils/qr'

const config = useRuntimeConfig()

/* ----------------------------- Utilities ----------------------------- */
function normalizeLink(link) {
  if (!link) return ''
  if (/^https?:\/\//i.test(link)) return link.trim()
  if (/^www\./i.test(link)) return `https://${link.trim()}`
  return `https://www.${link.trim()}`
}

/* ------------------------------- State -------------------------------- */
const qrcodeWrapper = ref(null)
const qrCode = ref(null)

const uuid = uuidv4()

// Use the gateway URL helper for all new QR codes
const qrValue = ref(getEncodedQrUrl(uuid))

const qrSize = ref(300)

const name = ref('name')
const link = ref(null)

const loading = ref(false)
const isRendering = ref(false)
let renderTimer = null

function startRender(minMs = 250) {
  if (renderTimer) {
    isRendering.value = true
    return
  }
  isRendering.value = true
  renderTimer = window.setTimeout(() => {
    isRendering.value = false
    renderTimer = null
  }, minMs)
}

function endRenderSoon(extraMs = 150) {
  if (renderTimer) window.clearTimeout(renderTimer)
  renderTimer = window.setTimeout(() => {
    isRendering.value = false
    renderTimer = null
  }, extraMs)
}

/* ---------------------------- Style Options --------------------------- */
const bgColor = ref('#FFFFFF')
const dotsColor = ref('#000000')
const cornersSquareColor = ref('#000000')
const cornersDotColor = ref('#000000')
const gradient = ref(false)
const gradientType = ref('linear')
const gradientRotation = ref(0)
const gradientStartColor = ref('#e6289d')
const gradientEndColor = ref('#40353c')
const dotsType = ref('square')
const cornersSquareType = ref('square')
const cornersDotType = ref('square')

const imageSettings = reactive({
  src: '',
  imageSize: 0.4,
  margin: 0,
  crossOrigin: 'anonymous'
})

const lastColorOptions = reactive({
  bgColor: '',
  dotsColor: '',
  cornersSquareColor: '',
  cornersDotColor: '',
  gradient: false,
  gradientType: '',
  gradientRotation: 0,
  gradientStartColor: '',
  gradientEndColor: ''
})

/* ---------------------------- QR Options ---------------------------- */
function getQRCodeOptions() {
  // DEBUG: Log exactly what URL is being encoded in the QR
  console.log('[QrCode CREATE] getQRCodeOptions called with data:', qrValue.value)
  
  const options = {
    margin: 16,
    width: qrSize.value,
    height: qrSize.value,
    data: qrValue.value,
    errorCorrectionLevel: 'H',
    dotsOptions: { type: dotsType.value, roundSize: false },
    cornersSquareOptions: {
      color: cornersSquareColor.value,
      type: cornersSquareType.value
    },
    cornersDotOptions: {
      color: cornersDotColor.value,
      type: cornersDotType.value
    },
    backgroundOptions: {
      color: bgColor.value,
      transparent: false
    },
    imageOptions: {
      crossOrigin: imageSettings.crossOrigin,
      margin: imageSettings.margin,
      imageSize: imageSettings.imageSize
    }
  }

  if (imageSettings.src) options.image = imageSettings.src

  if (gradient.value) {
    options.dotsOptions.gradient = {
      type: gradientType.value,
      rotation: (gradientRotation.value * Math.PI) / 180,
      colorStops: [
        { offset: 0, color: gradientStartColor.value },
        { offset: 1, color: gradientEndColor.value }
      ]
    }
  } else {
    options.dotsOptions.color = dotsColor.value
  }

  return options
}

/* -------------------------- Update Strategies ------------------------- */
const updateColourFast = useThrottleFn(() => {
  if (!qrCode.value) return

  const changed =
    bgColor.value !== lastColorOptions.bgColor ||
    dotsColor.value !== lastColorOptions.dotsColor ||
    cornersSquareColor.value !== lastColorOptions.cornersSquareColor ||
    cornersDotColor.value !== lastColorOptions.cornersDotColor ||
    gradient.value !== lastColorOptions.gradient ||
    gradientType.value !== lastColorOptions.gradientType ||
    gradientRotation.value !== lastColorOptions.gradientRotation ||
    gradientStartColor.value !== lastColorOptions.gradientStartColor ||
    gradientEndColor.value !== lastColorOptions.gradientEndColor

  if (!changed) return

  startRender()

  lastColorOptions.bgColor = bgColor.value
  lastColorOptions.dotsColor = dotsColor.value
  lastColorOptions.cornersSquareColor = cornersSquareColor.value
  lastColorOptions.cornersDotColor = cornersDotColor.value
  lastColorOptions.gradient = gradient.value
  lastColorOptions.gradientType = gradientType.value
  lastColorOptions.gradientRotation = gradientRotation.value
  lastColorOptions.gradientStartColor = gradientStartColor.value
  lastColorOptions.gradientEndColor = gradientEndColor.value

  qrCode.value.update({
    backgroundOptions: { color: bgColor.value },
    margin: 16,
    dotsOptions: {
      type: dotsType.value,
      ...(gradient.value
        ? {
            gradient: {
              type: gradientType.value,
              rotation: (gradientRotation.value * Math.PI) / 180,
              colorStops: [
                { offset: 0, color: gradientStartColor.value },
                { offset: 1, color: gradientEndColor.value }
              ]
            }
          }
        : { color: dotsColor.value })
    },
    cornersSquareOptions: { color: cornersSquareColor.value },
    cornersDotOptions: { color: cornersDotColor.value }
  })

  endRenderSoon()
}, 33)

const updateQRCodeSlow = useDebounceFn(() => {
  if (!qrCode.value) return
  startRender()
  qrCode.value.update(getQRCodeOptions())
  endRenderSoon()
}, 150)

function initializeWatcher() {
  watch(
    [qrValue, qrSize, dotsType, cornersSquareType, cornersDotType, () => imageSettings.src],
    updateQRCodeSlow,
    { deep: true }
  )
}

/* --------------------------- Image Handling --------------------------- */
function handleImageUpload(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      imageSettings.src = e.target && e.target.result ? e.target.result : ''
      startRender()
      updateQRCodeSlow()
    }
    reader.readAsDataURL(file)
  }
}

/* ----------------------- Routing & Strapi wiring ---------------------- */
const { find } = useStrapi()
const user = useStrapiUser()
const router = useRouter()
const route = useRoute()
const client = useStrapiClient()

const selectedBand = ref('')
const { data: bandsData } = useAsyncData(
  'user-bands',
  async () => {
    if (!user.value?.id) return []
    const res = await find('bands', {
      filters: { users_permissions_user: { id: user.value.id } }
    })
    return Array.isArray(res.data) ? res.data : res.data?.data || []
  },
  { watch: () => user.value?.id, immediate: true }
)

const bands = computed(() => bandsData.value || [])

/* ---------------- Defaulting logic ---------------- */
onMounted(async () => {
  if (process.client) {
    const { default: QRCodeStyling } = await import('qr-code-styling')
    qrCode.value = new QRCodeStyling(getQRCodeOptions())
    startRender()
    qrCode.value.append(qrcodeWrapper.value)
    endRenderSoon()
    initializeWatcher()

    watch(
      [
        bgColor,
        dotsColor,
        gradient,
        gradientType,
        gradientRotation,
        gradientStartColor,
        gradientEndColor,
        cornersSquareColor,
        cornersDotColor
      ],
      updateColourFast,
      { deep: true }
    )
  }

  // 1) ensure we always have a type
  if (!route.query.type) {
    router.replace({
      query: { ...route.query, type: 'bandProfile' }
    })
  }

  // 2) once bands are loaded, auto-select
  watch(
    () => bands.value,
    (list) => {
      if (!list) return

      const currentType = route.query.type || 'bandProfile'
      if (currentType !== 'bandProfile') return

      if (list.length === 1) {
        selectedBand.value = list[0].id
      } else if (list.length === 0) {
        selectedBand.value = 'createNew'
      } else {
        selectedBand.value = list[0].id
      }
    },
    { immediate: true }
  )
})

/* ------------------------------ Actions -------------------------------- */
function selectType(selected) {
  router.push({ query: { ...route.query, type: selected } })

  if (selected === 'bandProfile') {
    const list = bands.value
    if (list && list.length === 1) {
      selectedBand.value = list[0].id
    } else if (!list || list.length === 0) {
      selectedBand.value = 'createNew'
    }
  }
}

async function saveQrCode() {
  try {
    loading.value = true
    const qType = route.query.type || 'bandProfile'

    // Ensure QR code is fully updated with current options before saving
    qrCode.value.update(getQRCodeOptions())
    // Wait for the QR code library to finish rendering
    await new Promise((r) => setTimeout(r, 100))

    const initialForm = {
      url: qrValue.value,
      users_permissions_user: { id: user.value.id },
      q_type: qType,
      link: normalizeLink(link.value),
      name: name.value,
      slugId: uuid, // Save the UUID for consistent lookups
      options: getQRCodeOptions()
    }

    if (qType === 'bandProfile') {
      if (selectedBand.value && selectedBand.value !== 'createNew') {
        initialForm.band = selectedBand.value
      } else {
        initialForm.band = null
      }
    }

    const tempBlob = await qrCode.value.getRawData('png')
    const tempFile = new File([tempBlob], 'qrcode.png')
    const formData = new FormData()
    formData.append('files.q_image', tempFile, 'qrcode.png')
    formData.append('data', JSON.stringify(initialForm))

    const { data: created } = await client('/qrs', {
      method: 'POST',
      body: formData
    })
    if (!created?.id) throw new Error('QR code was not saved (no ID returned).')
    // Use gateway URL for the final QR image
    const finalTracker = getEncodedQrUrl(created.id)
    
    console.log('[QrCode CREATE] ✅ QR saved with ID:', created.id)
    console.log('[QrCode CREATE] ✅ Final tracker URL:', finalTracker)

    qrValue.value = finalTracker
    // Update QR with final tracker URL and wait for render
    qrCode.value.update(getQRCodeOptions())
    await new Promise((r) => setTimeout(r, 100))

    const finalBlob = await qrCode.value.getRawData('png')
    const finalFile = new File([finalBlob], 'qrcode.png')
    const patch = new FormData()
    patch.append('files.q_image', finalFile, 'qrcode.png')
    patch.append(
      'data',
      JSON.stringify({
        url: finalTracker,
        options: { ...getQRCodeOptions(), data: finalTracker }
      })
    )

    await client(`/qrs/${created.id}`, { method: 'PUT', body: patch })

    if (qType === 'bandProfile' && selectedBand.value === 'createNew') {
      router.push({ name: 'createband', query: { qrId: created.id } })
    } else {
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Error during QR code save:', error?.response?.data || error)
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

/* QR Preview — ensure the rendered canvas/svg fits the card without clipping */
.qr-preview-wrapper :deep(canvas),
.qr-preview-wrapper :deep(svg) {
  max-width: 100% !important;
  height: auto !important;
  display: block;
}
</style>