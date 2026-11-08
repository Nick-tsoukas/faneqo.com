<template>
  <section v-if="isDemoUser" class="dashboard-section mb-8">
    <div class="section-header bg-gradient-to-r from-amber-600 to-orange-600">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">Demo Controls</h2>
          <p class="text-white/70 text-sm">Smart Link Live Surface toggles</p>
        </div>
      </div>
      <button
        @click="handleReset"
        class="px-3 py-1.5 text-sm font-medium text-white/90 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
      >
        Reset to Defaults
      </button>
    </div>

    <div class="section-content">
      <p class="text-white/50 text-sm mb-6">
        These toggles affect demo rendering on band pages. Changes take effect on page refresh.
      </p>

      <!-- Master + Demo Feed -->
      <div class="mb-6">
        <h3 class="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">Master Controls</h3>
        <div class="space-y-3">
          <label
            v-for="flag in masterFlags"
            :key="flag.key"
            class="flex items-center justify-between gap-4 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.07] transition-colors"
          >
            <div class="min-w-0">
              <div class="text-white font-medium text-sm">{{ flag.label }}</div>
              <div class="text-white/50 text-xs truncate">{{ flag.description }}</div>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="demoFlags[flag.key]"
              @click.prevent="setFlag(flag.key, !demoFlags[flag.key])"
              class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-black"
              :class="demoFlags[flag.key] ? 'bg-amber-500' : 'bg-white/20'"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="demoFlags[flag.key] ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </label>
        </div>
      </div>

      <!-- V1 Modules -->
      <div class="mb-6">
        <h3 class="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">V1 Modules</h3>
        <div class="space-y-3" :class="{ 'opacity-50 pointer-events-none': !isMasterEnabled }">
          <label
            v-for="flag in v1Flags"
            :key="flag.key"
            class="flex items-center justify-between gap-4 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.07] transition-colors"
            :class="{ 'cursor-not-allowed': !isMasterEnabled }"
          >
            <div class="min-w-0">
              <div class="text-white font-medium text-sm">{{ flag.label }}</div>
              <div class="text-white/50 text-xs truncate">{{ flag.description }}</div>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="demoFlags[flag.key]"
              :disabled="!isMasterEnabled"
              @click.prevent="setFlag(flag.key, !demoFlags[flag.key])"
              class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-black"
              :class="demoFlags[flag.key] ? 'bg-amber-500' : 'bg-white/20'"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="demoFlags[flag.key] ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </label>
        </div>
        <p v-if="!isMasterEnabled" class="text-amber-400/70 text-xs mt-2">
          Enable "Live Surface Enabled" to toggle V1 modules
        </p>
      </div>

      <!-- V2 Modules -->
      <div>
        <h3 class="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">V2 Modules (Experimental)</h3>
        <div class="space-y-3 mb-3">
          <label class="flex items-center justify-between gap-4 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.07] transition-colors" :class="{ 'cursor-not-allowed': !isMasterEnabled }">
            <div class="min-w-0">
              <div class="text-white font-medium text-sm">{{ v2EnabledFlag.label }}</div>
              <div class="text-white/50 text-xs truncate">{{ v2EnabledFlag.description }}</div>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="demoFlags[v2EnabledFlag.key]"
              :disabled="!isMasterEnabled"
              @click.prevent="setFlag(v2EnabledFlag.key, !demoFlags[v2EnabledFlag.key])"
              class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-black"
              :class="demoFlags[v2EnabledFlag.key] ? 'bg-amber-500' : 'bg-white/20'"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="demoFlags[v2EnabledFlag.key] ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </label>
        </div>
        <div class="space-y-3" :class="{ 'opacity-50 pointer-events-none': !isMasterEnabled || !isV2Enabled }">
          <label
            v-for="flag in v2Flags"
            :key="flag.key"
            class="flex items-center justify-between gap-4 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.07] transition-colors"
            :class="{ 'cursor-not-allowed': !isMasterEnabled || !isV2Enabled }"
          >
            <div class="min-w-0">
              <div class="text-white font-medium text-sm">{{ flag.label }}</div>
              <div class="text-white/50 text-xs truncate">{{ flag.description }}</div>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="demoFlags[flag.key]"
              :disabled="!isMasterEnabled || !isV2Enabled"
              @click.prevent="setFlag(flag.key, !demoFlags[flag.key])"
              class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-black"
              :class="demoFlags[flag.key] ? 'bg-amber-500' : 'bg-white/20'"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :class="demoFlags[flag.key] ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </label>
        </div>
        <p v-if="isMasterEnabled && !isV2Enabled" class="text-amber-400/70 text-xs mt-2">
          Enable "V2 Features Enabled" to toggle V2 modules
        </p>
      </div>

      <!-- Demo Overrides -->
      <div class="mt-6 pt-6 border-t border-white/10">
        <h3 class="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">Demo Overrides</h3>
        <p class="text-white/40 text-xs mb-4">
          Force specific states for demos. Auto uses real events/signals.
        </p>
        <div class="space-y-4" :class="{ 'opacity-50 pointer-events-none': !isMasterEnabled }">
          <!-- Force Page Mode -->
          <div class="p-3 rounded-lg bg-white/5 border border-white/10">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0">
                <div class="text-white font-medium text-sm">{{ forceModeFlag.label }}</div>
                <div class="text-white/50 text-xs truncate">{{ forceModeFlag.description }}</div>
              </div>
              <select
                :value="demoFlags[forceModeFlag.key]"
                :disabled="!isMasterEnabled"
                @change="setFlag(forceModeFlag.key, $event.target.value === '' ? null : $event.target.value)"
                class="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent min-w-[140px]"
                :class="{ 'opacity-50 cursor-not-allowed': !isMasterEnabled }"
              >
                <option 
                  v-for="opt in forceModeFlag.options" 
                  :key="opt.value ?? 'null'" 
                  :value="opt.value ?? ''"
                  class="bg-gray-900 text-white"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div v-if="demoFlags[forceModeFlag.key]" class="mt-2 text-xs text-amber-400/80">
              ⚠️ Forced override active — ignoring detection logic
            </div>
          </div>
          
          <!-- Force NOW Banner -->
          <div class="p-3 rounded-lg bg-white/5 border border-white/10">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0">
                <div class="text-white font-medium text-sm">{{ forceNowBannerFlag.label }}</div>
                <div class="text-white/50 text-xs truncate">{{ forceNowBannerFlag.description }}</div>
              </div>
              <select
                :value="demoFlags[forceNowBannerFlag.key]"
                :disabled="!isMasterEnabled"
                @change="setFlag(forceNowBannerFlag.key, $event.target.value === '' ? null : $event.target.value)"
                class="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent min-w-[140px]"
                :class="{ 'opacity-50 cursor-not-allowed': !isMasterEnabled }"
              >
                <option 
                  v-for="opt in forceNowBannerFlag.options" 
                  :key="opt.value ?? 'null'" 
                  :value="opt.value ?? ''"
                  class="bg-gray-900 text-white"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div v-if="demoFlags[forceNowBannerFlag.key]" class="mt-2 text-xs text-amber-400/80">
              ⚠️ Forced override active — ignoring detection logic
            </div>
          </div>
        </div>
        <p v-if="!isMasterEnabled" class="text-amber-400/70 text-xs mt-2">
          Enable "Live Surface Enabled" to use demo overrides
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useDemoFlags, FLAG_DEFINITIONS } from '@/composables/useDemoFlags'

const {
  demoFlags,
  isDemoUser,
  isMasterEnabled,
  isV2Enabled,
  setFlag,
  resetFlags,
} = useDemoFlags()

// Group flags by category
const masterFlags = computed(() => 
  Object.values(FLAG_DEFINITIONS).filter(f => f.group === 'master')
)

const v1Flags = computed(() => 
  Object.values(FLAG_DEFINITIONS).filter(f => f.group === 'v1')
)

const v2EnabledFlag = computed(() => 
  FLAG_DEFINITIONS.SMARTLINK_V2_ENABLED
)

const v2Flags = computed(() => 
  Object.values(FLAG_DEFINITIONS).filter(f => f.group === 'v2' && f.key !== 'SMARTLINK_V2_ENABLED')
)

// Override flags
const forceModeFlag = computed(() => FLAG_DEFINITIONS.DEMO_FORCE_MODE)
const forceNowBannerFlag = computed(() => FLAG_DEFINITIONS.DEMO_FORCE_NOW_BANNER)

function handleReset() {
  if (confirm('Reset all demo flags to their default values?')) {
    resetFlags()
  }
}

</script>
