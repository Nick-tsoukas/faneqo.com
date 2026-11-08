<template>
  <div class="relative">
    <!-- Bell Button -->
    <button
      @click="toggleDropdown"
      class="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      :class="{ 'bg-white/10': isOpen }"
    >
      <svg
        class="w-6 h-6 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <!-- Unread Badge -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50"
      >
        <!-- Header -->
        <div class="sticky top-0 bg-slate-900 border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <h3 class="text-white font-semibold">Notifications</h3>
          <button
            v-if="notifications.length > 0"
            @click="markAllRead"
            class="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            Mark all read
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="p-4 text-center">
          <div class="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
        </div>

        <!-- Empty State -->
        <div v-else-if="notifications.length === 0" class="p-6 text-center">
          <div class="text-3xl mb-2">🔔</div>
          <p class="text-gray-400 text-sm">No notifications yet</p>
        </div>

        <!-- Notification List -->
        <div v-else class="divide-y divide-white/5">
          <div
            v-for="notif in notifications"
            :key="notif.id"
            @click="handleNotificationClick(notif)"
            class="px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
            :class="{ 'bg-purple-500/10': !notif.readAt }"
          >
            <div class="flex items-start gap-3">
              <!-- Icon -->
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span v-if="notif.type === 'pulse_surge'" class="text-sm">🚀</span>
                <span v-else class="text-sm">📣</span>
              </div>
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-medium truncate">{{ notif.title }}</p>
                <p class="text-gray-400 text-xs mt-0.5 line-clamp-2">{{ notif.message }}</p>
                <p class="text-gray-500 text-xs mt-1">{{ formatTime(notif.createdAt) }}</p>
              </div>
              <!-- Unread dot -->
              <div v-if="!notif.readAt" class="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Click outside overlay -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="isOpen = false"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: number
  type: string
  channel: string
  title: string
  message: string
  deepLink: string
  readAt: string | null
  createdAt: string
  meta: any
}

const router = useRouter()
const client = useStrapiClient()

const isOpen = ref(false)
const loading = ref(false)
const notifications = ref<Notification[]>([])
const unreadCount = ref(0)

let pollInterval: ReturnType<typeof setInterval> | null = null

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value && notifications.value.length === 0) {
    fetchNotifications()
  }
}

async function fetchNotifications() {
  loading.value = true
  try {
    const res = await client('/notifications')
    notifications.value = res.data || []
    updateUnreadCount()
  } catch (err) {
    console.error('[NotificationBell] Failed to fetch notifications:', err)
  } finally {
    loading.value = false
  }
}

async function fetchUnreadCount() {
  try {
    const res = await client('/notifications/unread-count')
    unreadCount.value = res.count || 0
  } catch (err) {
    // Silently fail for count polling
  }
}

function updateUnreadCount() {
  unreadCount.value = notifications.value.filter(n => !n.readAt).length
}

async function markRead(notif: Notification) {
  if (notif.readAt) return
  try {
    await client(`/notifications/${notif.id}/read`, { method: 'POST' })
    notif.readAt = new Date().toISOString()
    updateUnreadCount()
  } catch (err) {
    console.error('[NotificationBell] Failed to mark read:', err)
  }
}

async function markAllRead() {
  const unread = notifications.value.filter(n => !n.readAt)
  await Promise.all(unread.map(n => markRead(n)))
}

function handleNotificationClick(notif: Notification) {
  markRead(notif)
  isOpen.value = false
  if (notif.deepLink) {
    router.push(notif.deepLink)
  }
}

function formatTime(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return ''
  }
}

onMounted(() => {
  fetchUnreadCount()
  // Poll for new notifications every 60 seconds
  pollInterval = setInterval(fetchUnreadCount, 60000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
