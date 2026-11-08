<template>
  <div class="min-h-screen bg-gray-900 text-white p-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-2">🔬 QR Debug Lab</h1>
      <p class="text-gray-400 mb-8">Scan each QR below to find which one works and which doesn't.</p>

      <!-- Test URL Input -->
      <div class="bg-gray-800 p-4 rounded-lg mb-8">
        <label class="block text-sm text-gray-400 mb-2">Test URL (all QRs will encode this):</label>
        <input 
          v-model="testUrl" 
          class="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
          placeholder="https://musicbizqr.com/directqr?id=79"
        />
        <p class="text-xs text-gray-500 mt-2">Current: {{ testUrl }}</p>
        
        <!-- Quick URL buttons -->
        <div class="flex flex-wrap gap-2 mt-4">
          <button @click="testUrl = 'https://google.com'" class="px-3 py-1 bg-green-600 rounded text-sm">Google (works)</button>
          <button @click="testUrl = 'https://musicbizqr.com'" class="px-3 py-1 bg-blue-600 rounded text-sm">musicbizqr.com</button>
          <button @click="testUrl = 'https://musicbizqr.com/directqr?id=79'" class="px-3 py-1 bg-purple-600 rounded text-sm">directqr?id=79</button>
          <button @click="testUrl = 'https://musicbizqr.com/shannontehya'" class="px-3 py-1 bg-pink-600 rounded text-sm">/shannontehya</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <!-- TEST 1: External API (goqr.me) -->
        <div class="bg-gray-800 p-6 rounded-lg">
          <h3 class="text-lg font-bold mb-2 text-green-400">✅ Test 1: External API (goqr.me)</h3>
          <p class="text-xs text-gray-400 mb-4">If this scans, your URL is valid.</p>
          <div class="bg-white p-4 rounded flex items-center justify-center">
            <img 
              :src="`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(testUrl)}`"
              alt="External QR"
              class="w-[200px] h-[200px]"
            />
          </div>
          <p class="text-xs text-gray-500 mt-2">Source: api.qrserver.com</p>
        </div>

        <!-- TEST 2: qrcode.vue (different library) -->
        <div class="bg-gray-800 p-6 rounded-lg">
          <h3 class="text-lg font-bold mb-2 text-blue-400">🔵 Test 2: qrcode.vue library</h3>
          <p class="text-xs text-gray-400 mb-4">Different library than qr-code-styling.</p>
          <div class="bg-white p-4 rounded flex items-center justify-center">
            <ClientOnly>
              <QrcodeVue :value="testUrl" :size="200" level="M" />
            </ClientOnly>
          </div>
          <p class="text-xs text-gray-500 mt-2">Library: qrcode.vue</p>
        </div>

        <!-- TEST 3: qr-code-styling MINIMAL -->
        <div class="bg-gray-800 p-6 rounded-lg">
          <h3 class="text-lg font-bold mb-2 text-yellow-400">🟡 Test 3: qr-code-styling MINIMAL</h3>
          <p class="text-xs text-gray-400 mb-4">Bare minimum config, no styling.</p>
          <div class="bg-white p-4 rounded flex items-center justify-center">
            <div ref="qrMinimal" class="w-[200px] h-[200px]"></div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Config: width, height, data only</p>
        </div>

        <!-- TEST 4: qr-code-styling SAFE MODE -->
        <div class="bg-gray-800 p-6 rounded-lg">
          <h3 class="text-lg font-bold mb-2 text-orange-400">🟠 Test 4: qr-code-styling SAFE</h3>
          <p class="text-xs text-gray-400 mb-4">Square dots, white bg, margin 20.</p>
          <div class="bg-white p-4 rounded flex items-center justify-center">
            <div ref="qrSafe" class="w-[200px] h-[200px]"></div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Config: Safe mode preset</p>
        </div>

        <!-- TEST 5: qr-code-styling CANVAS -->
        <div class="bg-gray-800 p-6 rounded-lg">
          <h3 class="text-lg font-bold mb-2 text-purple-400">🟣 Test 5: qr-code-styling CANVAS</h3>
          <p class="text-xs text-gray-400 mb-4">Canvas rendering instead of SVG.</p>
          <div class="bg-white p-4 rounded flex items-center justify-center">
            <div ref="qrCanvas" class="w-[200px] h-[200px]"></div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Type: canvas (not SVG)</p>
        </div>

        <!-- TEST 6: qr-code-styling STYLED (like your app) -->
        <div class="bg-gray-800 p-6 rounded-lg">
          <h3 class="text-lg font-bold mb-2 text-red-400">🔴 Test 6: qr-code-styling STYLED</h3>
          <p class="text-xs text-gray-400 mb-4">With rounded dots, gradients - like your app.</p>
          <div class="bg-white p-4 rounded flex items-center justify-center">
            <div ref="qrStyled" class="w-[200px] h-[200px]"></div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Config: Rounded dots, gradient</p>
        </div>

      </div>

      <!-- Debug Info -->
      <div class="mt-8 bg-gray-800 p-6 rounded-lg">
        <h3 class="text-lg font-bold mb-4">📊 Debug Info</h3>
        <div class="font-mono text-xs space-y-2">
          <p><span class="text-gray-400">URL Length:</span> {{ testUrl.length }} chars</p>
          <p><span class="text-gray-400">URL Valid:</span> {{ isValidUrl ? '✅ Yes' : '❌ No' }}</p>
          <p><span class="text-gray-400">Starts with https://:</span> {{ testUrl.startsWith('https://') ? '✅ Yes' : '❌ No' }}</p>
          <p><span class="text-gray-400">Has directqr:</span> {{ testUrl.includes('directqr') ? '✅ Yes' : '⚠️ No' }}</p>
          <p><span class="text-gray-400">Char codes (first 30):</span></p>
          <p class="text-green-400 break-all">{{ charCodes }}</p>
        </div>
      </div>

      <!-- Instructions -->
      <div class="mt-8 bg-blue-900/30 border border-blue-500/50 p-6 rounded-lg">
        <h3 class="text-lg font-bold mb-4 text-blue-400">📋 Instructions</h3>
        <ol class="list-decimal list-inside space-y-2 text-sm">
          <li>Scan <strong>Test 1</strong> (External API) - If this doesn't scan, the URL is bad</li>
          <li>Scan <strong>Test 2</strong> (qrcode.vue) - If this works but others don't, qr-code-styling is broken</li>
          <li>Scan <strong>Test 3</strong> (Minimal) - If this works, the library is fine with basic config</li>
          <li>Scan <strong>Test 4</strong> (Safe) - If this works, safe mode config is good</li>
          <li>Scan <strong>Test 5</strong> (Canvas) - If this works but Test 3 doesn't, SVG rendering is broken</li>
          <li>Scan <strong>Test 6</strong> (Styled) - If this doesn't work, styling breaks scanning</li>
        </ol>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import QrcodeVue from 'qrcode.vue'

const testUrl = ref('https://musicbizqr.com/directqr?id=79')

const qrMinimal = ref(null)
const qrSafe = ref(null)
const qrCanvas = ref(null)
const qrStyled = ref(null)

let qrInstances = {}

const isValidUrl = computed(() => /^https?:\/\/.+/.test(testUrl.value))

const charCodes = computed(() => {
  return testUrl.value.slice(0, 30).split('').map(c => c.charCodeAt(0)).join(', ')
})

async function renderAllQRs() {
  if (typeof window === 'undefined') return
  
  const { default: QRCodeStyling } = await import('qr-code-styling')
  
  // Clean up old instances
  if (qrMinimal.value) qrMinimal.value.innerHTML = ''
  if (qrSafe.value) qrSafe.value.innerHTML = ''
  if (qrCanvas.value) qrCanvas.value.innerHTML = ''
  if (qrStyled.value) qrStyled.value.innerHTML = ''

  // Test 3: MINIMAL
  qrInstances.minimal = new QRCodeStyling({
    width: 200,
    height: 200,
    data: testUrl.value,
  })
  qrInstances.minimal.append(qrMinimal.value)

  // Test 4: SAFE
  qrInstances.safe = new QRCodeStyling({
    width: 200,
    height: 200,
    data: testUrl.value,
    margin: 20,
    qrOptions: { errorCorrectionLevel: 'M' },
    dotsOptions: { type: 'square', color: '#000000' },
    cornersSquareOptions: { type: 'square', color: '#000000' },
    cornersDotOptions: { type: 'square', color: '#000000' },
    backgroundOptions: { color: '#FFFFFF' },
  })
  qrInstances.safe.append(qrSafe.value)

  // Test 5: CANVAS
  qrInstances.canvas = new QRCodeStyling({
    width: 200,
    height: 200,
    data: testUrl.value,
    type: 'canvas',
    margin: 10,
    dotsOptions: { type: 'square', color: '#000000' },
    backgroundOptions: { color: '#FFFFFF' },
  })
  qrInstances.canvas.append(qrCanvas.value)

  // Test 6: STYLED (like your app uses)
  qrInstances.styled = new QRCodeStyling({
    width: 200,
    height: 200,
    data: testUrl.value,
    margin: 16,
    qrOptions: { errorCorrectionLevel: 'H' },
    dotsOptions: { 
      type: 'rounded',
      gradient: {
        type: 'linear',
        rotation: 0,
        colorStops: [
          { offset: 0, color: '#8B5CF6' },
          { offset: 1, color: '#EC4899' }
        ]
      }
    },
    cornersSquareOptions: { type: 'extra-rounded', color: '#8B5CF6' },
    cornersDotOptions: { type: 'dot', color: '#EC4899' },
    backgroundOptions: { color: '#FFFFFF' },
  })
  qrInstances.styled.append(qrStyled.value)
}

onMounted(() => {
  setTimeout(renderAllQRs, 100)
})

watch(testUrl, () => {
  renderAllQRs()
})
</script>
