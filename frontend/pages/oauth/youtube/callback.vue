<script setup>
import { useRoute, useRouter, useStrapiClient } from '#imports'
import { ref, onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
// Authenticated client: the API requires edit access to the band being connected.
const client = useStrapiClient()

const code = route.query.code
const state = route.query.state

// plain JS, no TS union type
const status = ref('connecting') // 'connecting' | 'done' | 'needs-channel' | 'error'
const result = ref(null)
const error = ref(null)

// helper: pull bandId out of "mbqr|band:5|nonce:xxxx"
function getBandIdFromState(raw) {
  if (!raw) return null
  const s = Array.isArray(raw) ? raw[0] : raw
  const m = String(s).match(/band:(\d+)/)
  return m ? Number(m[1]) : null
}

onMounted(async () => {
  if (!code || !state) {
    status.value = 'error'
    error.value = 'Missing code or state from Google'
    return
  }

  const bandId = getBandIdFromState(state)

  try {
    const res = await client('/youtube/oauth/callback', {
      method: 'POST',
      body: { code, state }
    })

    result.value = res

    // case: multiple channels → stay here and render buttons
    if (res && res.needsChannelSelection) {
      status.value = 'needs-channel'
      return
    }

    // case: success → if we know the band → redirect to analytics
    if (res && res.ok) {
      if (bandId) {
        router.push(`/analytics/${bandId}`)
        return
      }
      // no bandId? just show success
      status.value = 'done'
      return
    }

    // fallback: error
    status.value = 'error'
    error.value = res
  } catch (err) {
    status.value = 'error'
    error.value = err && (err.data || err.message) ? (err.data || err.message) : err
  }
})

async function selectChannel(channelId) {
  const bandId = getBandIdFromState(state)

  if (!bandId) {
    alert('Missing bandId in state')
    return
  }

  try {
    const res = await client('/youtube/select-channel', {
      method: 'POST',
      body: { bandId, channelId }
    })
    result.value = res

    if (res && res.ok) {
      // after channel picked → go back to analytics
      router.push(`/analytics/${bandId}`)
      return
    }

    status.value = 'error'
    error.value = res
  } catch (err) {
    console.error(err)
    status.value = 'error'
    error.value = err && (err.data || err.message) ? (err.data || err.message) : err
  }
}
</script>

<template>
  <div class="min-h-screen bg-black text-white flex items-center justify-center p-6">
    <div class="max-w-md w-full space-y-4">
      <h1 class="text-xl font-semibold">Connecting YouTube…</h1>

      <!-- loading -->
      <p v-if="status === 'connecting'">
        Talking to MusicBizQR backend…
      </p>

      <!-- multiple channels -->
      <div v-else-if="status === 'needs-channel'">
        <p class="mb-2">This Google account has more than one YouTube channel.</p>
        <p class="text-sm text-gray-300 mb-2">
          Pick which one should be linked to this band.
        </p>

        <div v-if="result && result.channels && result.channels.length" class="space-y-2">
          <button
            v-for="ch in result.channels"
            :key="ch.id"
            class="w-full bg-white/10 hover:bg-white/20 rounded px-3 py-2 text-left"
            @click="selectChannel(ch.id)"
          >
            <div class="font-medium">{{ ch.title || ch.id }}</div>
            <div class="text-xs text-gray-400">{{ ch.id }}</div>
          </button>
        </div>
        <p v-else class="text-xs text-gray-500">
          No channels returned from YouTube.
        </p>
      </div>

      <!-- fallback success (when we can't redirect) -->
      <div v-else-if="status === 'done'">
        <p class="mb-2">✅ YouTube connected.</p>
        <p class="text-sm text-gray-300">
          You can close this window and go back to the analytics dashboard.
        </p>
      </div>

      <!-- error -->
      <div v-else-if="status === 'error'">
        <p class="text-red-400 mb-2">Something went wrong.</p>
        <pre class="bg-zinc-900 p-3 rounded text-xs overflow-auto">{{ error }}</pre>
      </div>
    </div>
  </div>
</template>
