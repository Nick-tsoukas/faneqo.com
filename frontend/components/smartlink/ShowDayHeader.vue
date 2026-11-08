<template>
  <div 
    v-if="event"
    class="show-day-header flex items-center gap-3 px-4 py-3"
  >
    <!-- Live indicator with icon background to match LiveFeed -->
    <div class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
      <span class="relative flex h-2.5 w-2.5">
        <span class="absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 animate-ping"></span>
        <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-purple-400"></span>
      </span>
    </div>
    
    <!-- Event info -->
    <div class="min-w-0 flex-1">
      <div class="text-white font-semibold text-sm truncate">
        {{ dateLabel }} in {{ event.city || 'your city' }}
      </div>
      <div class="text-white/60 text-xs truncate">
        {{ event.venue || 'Show' }}
        <span v-if="doorsTime"> • Doors {{ doorsTime }}</span>
      </div>
    </div>

    <!-- CTA Button -->
    <button
      @click="handleCta"
      class="shrink-0 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-sm font-semibold transition"
    >
      {{ ctaLabel }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { isSameLocalCalendarDay, parseCalendarDate, startOfLocalToday } from '~/utils/dates/calendarDate'

const props = defineProps({
  event: {
    type: Object,
    default: null
  },
  hasPayEntry: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['tickets', 'pay-entry'])

const doorsTime = computed(() => {
  // TODO: Backend field needed - event.doorsTime
  // For now, return null or use a default
  return props.event?.doorsTime || null
})

const dateLabel = computed(() => {
  if (!props.event?.date) return 'Tonight'

  const eventDate = parseCalendarDate(props.event.date)
  if (!eventDate) return 'Tonight'
  if (isSameLocalCalendarDay(eventDate)) return 'Tonight'

  const tomorrow = startOfLocalToday()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (isSameLocalCalendarDay(eventDate, tomorrow)) return 'Tomorrow'

  return eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
})

const ctaLabel = computed(() => {
  if (props.event?.ticketLink) return 'Tickets'
  if (props.hasPayEntry) return 'View Event'
  return 'View Event'
})

function handleCta() {
  // Always emit 'tickets' to navigate to event page
  emit('tickets', props.event)
}
</script>
