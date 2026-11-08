<template>
  <div class="min-h-screen bg-black px-4 py-10 text-white">
    <div class="mx-auto max-w-3xl">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-pink-400/80">
        Internal · Rive proof
      </p>
      <h1 class="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Faneqo Rive sandbox
      </h1>
      <p class="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
        Isolated runtime check only. This page is not part of the homepage.
        The graphic below is a <strong class="text-white/80">temporary official Rive sample</strong>
        used to prove load, resize, state-machine playback, trigger, and cleanup.
        It is not a Faneqo asset.
      </p>

      <div class="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c10]">
        <div class="h-[280px] w-full sm:h-[360px]">
          <ClientOnly>
            <FaneqoRive
              v-if="mounted"
              ref="riveRef"
              :src="SAMPLE_SRC"
              :state-machine="SAMPLE_STATE_MACHINE"
              fit="contain"
              alignment="center"
              :autoplay="true"
              :auto-bind="true"
              aria-label="Temporary Rive runtime sample"
              @load="onLoad"
              @load-error="onLoadError"
              @state-change="onStateChange"
            />
            <template #fallback>
              <div class="flex h-full items-center justify-center text-sm text-white/40">
                Loading Rive on the client…
              </div>
            </template>
          </ClientOnly>
        </div>
      </div>

      <p class="mt-3 text-xs text-white/40">
        Status: {{ status }}
        <span v-if="lastStates"> · states: {{ lastStates }}</span>
      </p>

      <div class="mt-6 flex flex-wrap gap-2">
        <button type="button" class="sandbox-btn" @click="play">Play</button>
        <button type="button" class="sandbox-btn" @click="pause">Pause</button>
        <button type="button" class="sandbox-btn" @click="nudge">Trigger / nudge</button>
        <button type="button" class="sandbox-btn" @click="remount">Destroy + remount</button>
      </div>

      <ul class="mt-8 space-y-1 text-sm text-white/55">
        <li>Runtime: <code class="text-white/80">@rive-app/webgl2</code></li>
        <li>Wrapper: <code class="text-white/80">components/rive/FaneqoRive.vue</code></li>
        <li>Sample: <code class="text-white/80">{{ SAMPLE_SRC }}</code></li>
        <li>State machine: <code class="text-white/80">{{ SAMPLE_STATE_MACHINE }}</code></li>
      </ul>
    </div>
  </div>
</template>

<script setup>
/**
 * Temporary runtime proof. Not marketing. Not production `/`.
 * Sample file is Rive's public vehicles.riv — replace when faneqo-echo.riv exists.
 */
import { nextTick, ref } from 'vue'
import FaneqoRive from '@/components/rive/FaneqoRive.vue'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Rive sandbox · Faneqo internal',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'googlebot', content: 'noindex, nofollow' },
  ],
})

const SAMPLE_SRC = 'https://cdn.rive.app/animations/vehicles.riv'
const SAMPLE_STATE_MACHINE = 'bumpy'

const riveRef = ref(null)
const mounted = ref(true)
const status = ref('waiting for client load')
const lastStates = ref('')

function onLoad() {
  status.value = 'loaded'
  const inputs = riveRef.value?.listStateMachineInputs?.() || []
  const names = inputs.map((item) => item.name).filter(Boolean)
  if (names.length) {
    status.value = `loaded · inputs: ${names.join(', ')}`
  }
}

function onLoadError(event) {
  status.value = `load error: ${event?.data || event || 'unknown'}`
}

function onStateChange(event) {
  const names = event?.data
  lastStates.value = Array.isArray(names) ? names.join(', ') : ''
}

function play() {
  riveRef.value?.play()
}

function pause() {
  riveRef.value?.pause()
}

function nudge() {
  const api = riveRef.value
  if (!api) return
  const inputs = api.listStateMachineInputs?.() || []
  const trigger = inputs.find((item) => typeof item.fire === 'function')
  if (trigger) {
    api.fireTrigger(trigger.name)
    return
  }
  const numeric = inputs.find((item) => typeof item.value === 'number')
  if (numeric) {
    api.setNumber(numeric.name, Number(numeric.value || 0) + 1)
    return
  }
  const flag = inputs.find((item) => typeof item.value === 'boolean')
  if (flag) {
    api.setBoolean(flag.name, !flag.value)
  }
}

async function remount() {
  status.value = 'destroyed'
  lastStates.value = ''
  mounted.value = false
  await nextTick()
  mounted.value = true
  status.value = 'remounted · waiting for load'
}
</script>

<style scoped>
.sandbox-btn {
  border-radius: 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  padding: 0.55rem 0.9rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
}
.sandbox-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
