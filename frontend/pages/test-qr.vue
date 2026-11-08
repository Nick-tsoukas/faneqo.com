<template>
  <div class="min-h-screen bg-black flex flex-col items-center justify-center p-8">
    <h1 class="text-white text-2xl font-bold mb-4">QR Test Page</h1>
    <p class="text-white/70 mb-8">Scan these QRs with your phone camera</p>
    
    <!-- Test 1: QrcodeVue library (Canvas) -->
    <div class="mb-8">
      <h2 class="text-white text-lg mb-2">Test 1: QrcodeVue (Canvas)</h2>
      <div class="bg-white p-6 rounded-2xl">
        <ClientOnly>
          <QrcodeVue 
            :value="testUrl"
            :size="200"
            level="M"
            render-as="canvas"
          />
        </ClientOnly>
      </div>
      <p class="text-white/50 text-xs mt-2">{{ testUrl }}</p>
    </div>

    <!-- Test 2: qr-code-styling library -->
    <div class="mb-8">
      <h2 class="text-white text-lg mb-2">Test 2: qr-code-styling</h2>
      <div class="bg-white p-6 rounded-2xl">
        <ClientOnly>
          <div ref="qrContainer" class="w-[200px] h-[200px]"></div>
        </ClientOnly>
      </div>
      <p class="text-white/50 text-xs mt-2">{{ directQrUrl }}</p>
    </div>

    <!-- Test 3: Simple Google URL -->
    <div class="mb-8">
      <h2 class="text-white text-lg mb-2">Test 3: Google URL (Canvas)</h2>
      <div class="bg-white p-6 rounded-2xl">
        <ClientOnly>
          <QrcodeVue 
            value="https://google.com"
            :size="200"
            level="M"
            render-as="canvas"
          />
        </ClientOnly>
      </div>
      <p class="text-white/50 text-xs mt-2">https://google.com</p>
    </div>
    
    <div class="mt-8 space-y-4 text-center">
      <p class="text-green-400" v-if="scanned">✓ QR scanning works!</p>
      <p class="text-yellow-400">If Test 1 & 3 work but Test 2 doesn't, the qr-code-styling library has an issue.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import QrcodeVue from 'qrcode.vue'

const route = useRoute()
const scanned = computed(() => route.query.scanned === '1')
const qrContainer = ref(null)

const testUrl = 'https://musicbizqr.com/test-qr?scanned=1'
const directQrUrl = 'https://musicbizqr.com/directqr?id=46'

onMounted(async () => {
  if (typeof window !== 'undefined' && qrContainer.value) {
    try {
      const { default: QRCodeStyling } = await import('qr-code-styling')
      const qr = new QRCodeStyling({
        width: 200,
        height: 200,
        data: directQrUrl,
        dotsOptions: { type: 'square', color: '#000000' },
        backgroundOptions: { color: '#FFFFFF' },
        errorCorrectionLevel: 'M'
      })
      qrContainer.value.innerHTML = ''
      qr.append(qrContainer.value)
      console.log('[TestQR] qr-code-styling rendered with data:', directQrUrl)
    } catch (e) {
      console.error('[TestQR] Failed to render qr-code-styling:', e)
    }
  }
})
</script>
