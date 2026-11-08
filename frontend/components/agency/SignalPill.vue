<template>
  <span 
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
    :class="pillClasses"
  >
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClass" />
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  state: {
    type: String,
    default: 'steady',
    validator: (v) => ['surging', 'warming', 'steady', 'cooling'].includes(v)
  }
})

const pillClasses = computed(() => {
  const classes = {
    surging: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warming: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    steady: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    cooling: 'bg-gray-500/10 text-gray-400 border-gray-500/30'
  }
  return classes[props.state] || classes.steady
})

const dotClass = computed(() => {
  const classes = {
    surging: 'bg-emerald-400 animate-pulse',
    warming: 'bg-amber-400',
    steady: 'bg-blue-400',
    cooling: 'bg-gray-400'
  }
  return classes[props.state] || classes.steady
})

const label = computed(() => {
  const labels = {
    surging: 'Surging',
    warming: 'Warming',
    steady: 'Steady',
    cooling: 'Cooling'
  }
  return labels[props.state] || 'Steady'
})
</script>
