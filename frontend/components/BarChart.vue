<template>
  <div>
    <canvas id="myChart"></canvas>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { Chart } from 'chart.js/auto';

onMounted(() => {
  const ctx = document.getElementById('myChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      datasets: [
        {
          label: 'Scans',
          data: [65, 59, 80, 81, 56, 55, 40],
          backgroundColor: [
            'rgba(236, 72, 153, 0.9)',
            '#000',
            'rgba(236, 72, 153, 0.9)',
            '#000',
            'rgba(236, 72, 153, 0.9)',
            '#000',
            'rgba(236, 72, 153, 0.9)',
          ],
          borderColor: [
            'rgba(236, 72, 153, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(236, 72, 153, 1)',
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      animations: {
        tension: {
          duration: 1000,
          easing: 'easeInOutQuad',
          from: 1,
          to: 0,
          loop: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
          color: '#fff'  // Change Y-axis label color to red
        }
        },
        x: {
          
          ticks: {
          color: '#fff'  // Change Y-axis label color to red
        }
        },
      },
      plugins: {
      legend: {
        labels: {
          color: '#white'  // Change legend label color to green
        }
      }
    }
    },
    
  });
});
</script>

<style scoped>
/* Add any specific styles for your bar chart component here */
</style>
