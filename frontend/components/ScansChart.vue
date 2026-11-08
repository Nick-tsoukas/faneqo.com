<template>
  <div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Chart } from 'chart.js/auto';

const props = defineProps({
  labels: {
    type: Array,
    required: true,
  },
  data: {
    type: Array,
    required: true,
  },
});

const chartCanvas = ref(null);
let chartInstance = null;

onMounted(() => {
  const ctx = chartCanvas.value.getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: 'Scans',
          data: props.data,
          backgroundColor: 'rgba(236, 72, 153, 0.9)',
          borderColor: 'rgba(236, 72, 153, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#fff',
          },
        },
        x: {
          ticks: {
            color: '#fff',
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: '#fff',
          },
        },
      },
    },
  });
});

// Update the chart when props change
watch(
  () => [props.labels, props.data],
  ([newLabels, newData]) => {
    if (chartInstance) {
      chartInstance.data.labels = newLabels;
      chartInstance.data.datasets[0].data = newData;
      chartInstance.update();
    }
  },
  { deep: true }
);
</script>

<style scoped>
/* Optional styles */
</style>
