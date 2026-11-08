<template>
  <div 
    class="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 cursor-pointer hover:border-gray-700 transition-colors"
    @click="$emit('click')"
  >
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-white font-semibold">After-Show Lift</h3>
        <p class="text-gray-500 text-xs mt-0.5">Momentum boost from live shows</p>
      </div>
      <div 
        class="w-10 h-10 rounded-xl flex items-center justify-center"
        :class="lift.lift > 0 ? 'bg-emerald-600/20' : 'bg-gray-800'"
      >
        <svg class="w-5 h-5" :class="lift.lift > 0 ? 'text-emerald-400' : 'text-gray-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    </div>

    <!-- Lift Percentage -->
    <div class="text-center mb-6">
      <div class="text-5xl font-bold" :class="liftValue > 0 ? 'text-emerald-400' : 'text-gray-400'">
        {{ liftDisplay }}
      </div>
      <p class="text-gray-500 text-sm mt-1">
        {{ hasData ? 'average lift on show days' : 'Not enough data' }}
      </p>
    </div>

    <!-- Comparison Bars -->
    <div v-if="hasData" class="space-y-3">
      <div>
        <div class="flex items-center justify-between text-xs mb-1">
          <span class="text-gray-400">After-Show Days</span>
          <span class="text-emerald-400 font-medium">{{ avgAfterShowDisplay }}</span>
        </div>
        <div class="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all"
            :style="{ width: `${safeBarWidth(lift.avgAfterShow)}%` }"
          />
        </div>
      </div>
      
      <div>
        <div class="flex items-center justify-between text-xs mb-1">
          <span class="text-gray-400">Baseline Days</span>
          <span class="text-gray-300 font-medium">{{ avgBaselineDisplay }}</span>
        </div>
        <div class="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div 
            class="h-full bg-gray-600 rounded-full transition-all"
            :style="{ width: `${safeBarWidth(lift.avgBaseline)}%` }"
          />
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else class="text-center py-4 text-gray-500 text-sm">
      No after-show data available yet
    </div>

    <!-- Stats -->
    <div class="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 gap-4 text-center">
      <div>
        <div class="text-lg font-bold text-white">{{ afterShowCountDisplay }}</div>
        <div class="text-xs text-gray-500">show days tracked</div>
      </div>
      <div>
        <div class="text-lg font-bold text-white">{{ baselineCountDisplay }}</div>
        <div class="text-xs text-gray-500">baseline days</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'
import { safeInt, isValidNumber } from '~/utils/agencyPortal/validateMockData'

defineEmits(['click'])

const store = useAgencyPortalStore()

const lift = computed(() => store.afterShowLift || {})

const hasData = computed(() => {
  return isValidNumber(lift.value.afterShowCount) && lift.value.afterShowCount > 0
})

const liftValue = computed(() => {
  return isValidNumber(lift.value.lift) ? lift.value.lift : 0
})

const liftDisplay = computed(() => {
  if (!hasData.value) return 'N/A'
  if (!isValidNumber(lift.value.lift)) return 'N/A'
  const val = Math.round(lift.value.lift)
  return val > 0 ? `+${val}%` : `${val}%`
})

const avgAfterShowDisplay = computed(() => {
  return isValidNumber(lift.value.avgAfterShow) ? safeInt(lift.value.avgAfterShow) : '—'
})

const avgBaselineDisplay = computed(() => {
  return isValidNumber(lift.value.avgBaseline) ? safeInt(lift.value.avgBaseline) : '—'
})

const afterShowCountDisplay = computed(() => {
  return isValidNumber(lift.value.afterShowCount) ? safeInt(lift.value.afterShowCount) : '0'
})

const baselineCountDisplay = computed(() => {
  return isValidNumber(lift.value.baselineCount) ? safeInt(lift.value.baselineCount) : '0'
})

function safeBarWidth(value) {
  if (!isValidNumber(value)) return 0
  return Math.min(Math.max(value, 0), 100)
}
</script>
