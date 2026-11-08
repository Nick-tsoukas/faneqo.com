import { defineNuxtPlugin } from '#app'
import VueECharts from 'vue-echarts'
import { use } from 'echarts/core'

// Import only the chart types and components you need.
import {
  CanvasRenderer
} from 'echarts/renderers'
import {
  LineChart,
  BarChart,
  PieChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent
} from 'echarts/components'

// Tell ECharts which features to use:
use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  LineChart,
  BarChart,
  PieChart,
  CanvasRenderer
])

export default defineNuxtPlugin((nuxtApp) => {
  // Register <v-chart> (alias for VueECharts) globally
  nuxtApp.vueApp.component('VChart', VueECharts)
})
