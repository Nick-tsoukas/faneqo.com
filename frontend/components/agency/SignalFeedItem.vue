<template>
  <div 
    class="bg-gray-900/60 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
    :class="{ 'opacity-70': isHandled }"
  >
    <div class="flex items-start gap-3">
      <!-- Band Avatar -->
      <div 
        class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="avatarClass"
      >
        <span class="font-bold text-sm">{{ band?.name?.charAt(0) || '?' }}</span>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-white font-medium text-sm">{{ band?.name || 'Unknown' }}</span>
          <span class="text-xs px-2 py-0.5 rounded-full" :class="typeClass">
            {{ formatType(signal.type) }}
          </span>
          <span 
            v-if="isHandled" 
            class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          >
            ✓ Handled
          </span>
          <span 
            v-if="!owner" 
            class="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30"
          >
            Unassigned
          </span>
        </div>

        <div class="mt-2">
          <div class="text-xs font-bold tracking-wide" :class="accentClass">
            {{ signal.headline }}
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xl font-bold" :class="accentClass">{{ signal.hero }}</span>
            <span class="text-gray-500 text-xs">{{ signal.windowLabel }}</span>
          </div>
          <p class="text-gray-400 text-xs mt-1">{{ signal.proof }}</p>
          
          <!-- V1.2: Why Now micro-line -->
          <p class="text-gray-500 text-xs mt-2 italic">
            💡 {{ whyNow }}
          </p>
        </div>

        <!-- Meta -->
        <div class="flex items-center gap-3 mt-3 text-xs text-gray-500">
          <span v-if="signal.context?.city" class="flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {{ signal.context.city }}
          </span>
          <span>{{ timeAgo }}</span>
          <span>Score: {{ signal.score }}</span>
          <span v-if="owner" class="flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {{ owner.name.split(' ')[0] }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-2 flex-shrink-0">
        <button 
          @click="$emit('open', signal.bandId)"
          class="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          title="Open Artist Command"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
        <button 
          @click="$emit('assign', signal.bandId)"
          class="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          title="Assign Owner"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </button>
        <button 
          @click="$emit('proof', signal)"
          class="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          title="Share Proof"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
        <button 
          v-if="!isHandled"
          @click="$emit('handle', signal.id)"
          class="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors"
          title="Mark as Handled"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button 
          @click="$emit('task', signal)"
          class="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          title="Create Task from Signal"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAgencyPortalStore } from '~/stores/agencyPortal'

// V1.2: Why Now mapping by signal type
const WHY_NOW_MAP = {
  CITY_CLAIM: 'City pull is rising — run a city-specific push while attention is hot.',
  CITY_STACK: 'Multiple artists heating here — coordinate a territory move.',
  NEW_CITY_UNLOCKED: 'New market detected — test a lightweight activation.',
  MOMENTUM_SURGE: 'Velocity jumped above baseline — amplify before it cools.',
  AFTER_SHOW_ENERGY: 'Post-show attention spike — convert within 24–48h.',
  SHARE_CHAIN: 'Sharing is active — strengthen the chain and pin the best link.',
  ENGAGED_SESSIONS: 'Fans are staying longer — route them to a single conversion.',
  RETURNING_FANS: 'Repeat intent is up — ask for follows/saves and capture contacts.',
  PLATFORM_PULL: 'Fans are choosing a platform lane — reinforce it immediately.',
  PEAK_HOUR: 'Peak hour identified — schedule the push inside this window.',
  SOURCE_SURGE: 'Traffic source surged — double down on what\'s working.',
  MILESTONE_DROP: 'Milestone proof unlocked — package and share with stakeholders.'
}

const props = defineProps({
  signal: {
    type: Object,
    required: true
  }
})

defineEmits(['open', 'handle', 'task', 'assign', 'proof'])

const store = useAgencyPortalStore()

const band = computed(() => store.getBandById(props.signal.bandId))
const isHandled = computed(() => store.isSignalHandled(props.signal.id))
const owner = computed(() => store.getOwnerForBand(props.signal.bandId))

// V1.2: Why Now micro-line
const whyNow = computed(() => {
  return WHY_NOW_MAP[props.signal.type] || 'Signal detected — review and take action.'
})

const accentClass = computed(() => {
  const classes = {
    violet: 'text-violet-400',
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400'
  }
  return classes[props.signal.accent] || classes.violet
})

const avatarClass = computed(() => {
  const classes = {
    violet: 'bg-violet-600/20 text-violet-400',
    blue: 'bg-blue-600/20 text-blue-400',
    emerald: 'bg-emerald-600/20 text-emerald-400',
    amber: 'bg-amber-600/20 text-amber-400',
    rose: 'bg-rose-600/20 text-rose-400'
  }
  return classes[props.signal.accent] || classes.violet
})

const typeClass = computed(() => {
  const classes = {
    violet: 'bg-violet-500/20 text-violet-400',
    blue: 'bg-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    rose: 'bg-rose-500/20 text-rose-400'
  }
  return classes[props.signal.accent] || classes.violet
})

const timeAgo = computed(() => {
  const date = new Date(props.signal.createdAt)
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return '1d ago'
  return `${diffDays}d ago`
})

function formatType(type) {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}
</script>
