<template>
  <div class="chart-card">
    <div class="chart-header">
      <h3 class="chart-title">Source Breakdown</h3>
      <p class="chart-subtitle">Where your fans come from</p>
    </div>
    <div class="chart-body">
      <div v-if="!hasData" class="chart-empty">
        <p class="text-white/50 text-sm">No data available yet</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="source in sortedSources"
          :key="source.key"
          class="source-row"
        >
          <div class="source-info">
            <span class="source-label">{{ source.label }}</span>
            <span class="source-count">{{ source.count }}</span>
          </div>
          <div class="source-bar-bg">
            <div
              class="source-bar"
              :style="{ width: source.percentage + '%', backgroundColor: source.color }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  sourceBreakdown: {
    type: Object,
    default: () => ({}),
  },
});

const sourceConfig = {
  band_page: { label: 'Band Page', color: '#ec4899' },
  follow_modal: { label: 'Follow Modal', color: '#a855f7' },
  import: { label: 'Import', color: '#3b82f6' },
  manual: { label: 'Manual', color: '#10b981' },
  other: { label: 'Other', color: '#6b7280' },
};

const totalCount = computed(() => {
  if (!props.sourceBreakdown) return 0;
  return Object.values(props.sourceBreakdown).reduce((sum, count) => sum + count, 0);
});

const hasData = computed(() => totalCount.value > 0);

const sortedSources = computed(() => {
  if (!props.sourceBreakdown) return [];
  
  return Object.entries(props.sourceBreakdown)
    .map(([key, count]) => ({
      key,
      count,
      label: sourceConfig[key]?.label || key,
      color: sourceConfig[key]?.color || '#6b7280',
      percentage: totalCount.value > 0 ? (count / totalCount.value) * 100 : 0,
    }))
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count);
});
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

.source-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.source-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.source-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.source-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.source-bar-bg {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.source-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}
</style>
