<template>
  <div class="min-h-screen bg-gray-900 text-white p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-4">🔧 QR Repair Tool</h1>
      <p class="text-gray-400 mb-8">
        Fix all QR codes to ensure they encode valid scannable URLs.
      </p>

      <!-- ALWAYS VISIBLE BUTTON -->
      <div class="bg-gray-800 p-6 rounded-lg mb-6">
        <p class="text-gray-400 mb-4">Found <span class="text-white font-bold">{{ qrs.length }}</span> QR codes</p>
        
        <button 
          @click="repairAll" 
          :disabled="repairing"
          class="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold disabled:opacity-50 text-lg"
        >
          {{ repairing ? `Repairing ${repairProgress}/${qrs.length}...` : '🚀 REPAIR ALL QRS' }}
        </button>
        
        <p v-if="error" class="text-red-400 mt-4">{{ error }}</p>
      </div>

      <!-- Log -->
      <div v-if="repairLog.length" class="bg-gray-800 p-6 rounded-lg">
        <h2 class="text-xl font-semibold mb-4">Repair Log</h2>
        <div class="space-y-2 max-h-96 overflow-y-auto font-mono text-sm">
          <div 
            v-for="(log, i) in repairLog" 
            :key="i"
            :class="log.success ? 'text-green-400' : 'text-red-400'"
          >
            {{ log.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const qrs = ref([])
const repairing = ref(false)
const repairProgress = ref(0)
const repairLog = ref([])
const error = ref('')

const STRAPI_URL = 'https://api.musicbizqr.com'

onMounted(async () => {
  await loadQrs()
})

async function loadQrs() {
  try {
    error.value = ''
    const res = await fetch(`${STRAPI_URL}/api/qrs?pagination[pageSize]=200&populate=*`)
    const json = await res.json()
    qrs.value = json.data || []
    console.log('[Repair] Loaded QRs:', qrs.value.length)
  } catch (e) {
    console.error('Failed to load QRs:', e)
    error.value = `Failed to load QRs: ${e.message}`
  }
}

async function repairAll() {
  repairing.value = true
  repairProgress.value = 0
  repairLog.value = []
  error.value = ''

  for (const qr of qrs.value) {
    try {
      const id = qr.id
      const attrs = qr.attributes || qr
      
      const slugId = attrs.slugId || id
      const correctUrl = `https://musicbizqr.com/directqr?id=${slugId}`
      
      const res = await fetch(`${STRAPI_URL}/api/qrs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            url: correctUrl,
            slugId: String(slugId),
            options: {
              ...(attrs.options || {}),
              data: correctUrl
            }
          }
        })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      repairLog.value.push({
        success: true,
        message: `✓ QR ${id} (${attrs.name || 'unnamed'}): ${correctUrl}`
      })
    } catch (e) {
      repairLog.value.push({
        success: false,
        message: `✗ QR ${qr.id}: ${e.message || 'Failed'}`
      })
    }
    
    repairProgress.value++
  }

  repairing.value = false
  repairLog.value.push({
    success: true,
    message: `✅ Done! Repaired ${repairProgress.value} QRs.`
  })
}
</script>
