<template>
  <div class="chart-card">
    <div class="chart-header">
      <h3 class="chart-title">Fan Growth</h3>
      <p class="chart-subtitle">Last 30 days</p>
    </div>
    <div class="chart-body">
      <div v-if="!growthSeries || growthSeries.length === 0" class="chart-empty">
        <p class="text-white/50 text-sm">No data available yet</p>
      </div>
      <div v-else class="chart-container">
        <div class="chart-bars">
          <div
            v-for="(day, index) in growthSeries"
            :key="index"
            class="chart-bar-wrapper"
            :title="`${day.date}: ${day.count} new fans`"
          >
            <div
              class="chart-bar"
              :style="{ height: getBarHeight(day.count) + '%' }"
            ></div>
          </div>
        </div>
        <div class="chart-labels">
          <span class="text-white/40 text-xs">30d ago</span>
          <span class="text-white/40 text-xs">Today</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  growthSeries: {
    type: Array,
    default: () => [],
  },
});

const maxCount = computed(() => {
  if (!props.growthSeries || props.growthSeries.length === 0) return 1;
  const max = Math.max(...props.growthSeries.map(d => d.count));
  return max > 0 ? max : 1;
});

function getBarHeight(count) {
  if (count === 0) return 5;
  return Math.max(5, (count / maxCount.value) * 100);
}
</script>

<style scoped>
.chart-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  overflow: hidden;
}

.chart-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.chart-subtitle {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
}

.chart-body {
  padding: 1.5rem;
}

.chart-empty {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-container {
  height: 120px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 100px;
}

.chart-bar-wrapper {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.chart-bar {
  width: 100%;
  background: linear-gradient(to top, rgb(236, 72, 153), rgb(168, 85, 247));
  border-radius: 2px 2px 0 0;
  min-height: 4px;
  transition: height 0.3s ease;
}

.chart-bar-wrapper:hover .chart-bar {
  opacity: 0.8;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
}
</style>
