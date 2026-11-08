<template>
  <section v-if="rows.length" class="pnl">
    <h2>{{ heading }}</h2>
    <ul>
      <li v-for="(row, index) in rows" :key="row.bandId || row.name || index">
        <span class="pnl__act">{{ row.name }}</span>
        <span v-if="roleOf(row)" class="pnl__role">{{ roleOf(row) }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { lineupRoleLabel } from '~/utils/nights/artistRecap'

const props = defineProps({
  lineup: { type: Array, default: () => [] },
  heading: { type: String, default: 'On stage' },
})

const rows = computed(() =>
  Array.isArray(props.lineup)
    ? props.lineup.filter((row) => String(row?.name || '').trim())
    : [],
)

function roleOf(row) {
  return lineupRoleLabel(row?.role)
}
</script>

<style scoped>
.pnl h2 {
  margin: 0 0 0.7rem;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.72);
}
.pnl ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.pnl li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.2rem 0.85rem;
  padding: 0.22rem 0;
}
.pnl__act {
  font-size: 0.95rem;
  font-weight: 650;
  letter-spacing: 0.02em;
  color: #f5f5f6;
  overflow-wrap: anywhere;
}
.pnl__role {
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgba(245, 245, 246, 0.52);
}
@media (min-width: 768px) {
  .pnl li {
    display: grid;
    gap: 0.08rem;
    padding: 0.38rem 0;
  }
  .pnl__act {
    font-size: 0.92rem;
    letter-spacing: 0.03em;
  }
  .pnl__role { font-size: 0.75rem; }
}
</style>
