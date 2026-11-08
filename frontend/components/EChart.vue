<template>
    <div class="chart-container">
      <VChart v-if="options" :options="options" autoresize />
    </div>
  </template>
  
  <script setup lang="ts">
  import { defineProps, watch, ref } from 'vue'
  
  // Declare a prop for the ECharts options object:
  const props = defineProps<{
    options: Record<string, unknown> | null
  }>()
  
  // We can watch `options` for changes, although ECharts auto-updates if the prop changes.
  // Just keep a local ref so the chart updates smoothly.
  
  const chartOptions = ref(props.options)
  
  watch(
    () => props.options,
    (newOpts) => {
      chartOptions.value = newOpts
    }
  )
  </script>
  
  <style scoped>
  .chart-container {
    width: 100%;
    height: 400px; /* default height; override in parent as needed */
  }
  </style>
  