<template>
  <div class="min-h-screen bg-[#121212] pt-[var(--header-height)] text-white px-4 sm:px-6 lg:px-8 py-10">
    <div class="max-w-3xl mx-auto">
      <div class="text-center">
        <div class="text-3xl font-bold">Merch Reserved</div>
        <div class="text-white/70 mt-2">Keep this screen for pickup</div>
      </div>

      <div v-if="pending" class="mt-10 text-center text-white/70">Loading…</div>

      <div v-else-if="error" class="mt-10 text-center">
        <div class="text-xl font-semibold">Unable to load pickup pass</div>
        <div class="text-white/70 mt-2">{{ errorMessage }}</div>
      </div>

      <div v-else class="mt-10">
        <div class="bg-black/40 border border-white/10 rounded-2xl p-6">
          <div class="text-white/70">Band</div>
          <div class="text-2xl font-semibold mt-1">{{ order.bandNameSnapshot }}</div>

          <div class="mt-6 grid gap-4">
            <div class="bg-black/30 border border-white/10 rounded-xl p-4">
              <div class="text-white/70">Item</div>
              <div class="text-lg font-semibold mt-1">{{ order.itemTitleSnapshot }}</div>
              <div v-if="order.selectedSize" class="text-white/70 mt-1">Size: {{ order.selectedSize }}</div>
            </div>

            <div class="bg-black/30 border border-white/10 rounded-xl p-4">
              <div class="text-white/70">Pickup instructions</div>
              <div class="text-white mt-2 whitespace-pre-line">{{ order.pickupInstructionsSnapshot }}</div>
            </div>

            <div class="bg-black/30 border border-white/10 rounded-xl p-4">
              <div class="text-white/70">Order code</div>
              <div class="text-3xl font-bold tracking-wider mt-1">{{ order.orderCode }}</div>
            </div>

            <div class="bg-black/30 border border-white/10 rounded-xl p-4">
              <div class="text-white/70 font-semibold">Keep this for pickup</div>
              <div class="text-white/70 mt-2">Screenshot this screen for pickup</div>
              <div v-if="order.customerEmail" class="text-white/70 mt-1">
                We emailed your pickup pass to: <span class="text-white">{{ order.customerEmail }}</span> (may take a minute)
              </div>

              <div class="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  class="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5"
                  @click="copyLink"
                >
                  Copy pickup link
                </button>
                <NuxtLink
                  v-if="order.bandSlugSnapshot"
                  :to="`/${order.bandSlugSnapshot}`"
                  class="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 text-center"
                >
                  Back to band
                </NuxtLink>
              </div>

              <div v-if="copied" class="text-green-300 text-sm mt-3">Link copied</div>
            </div>
          </div>
        </div>

        <div v-if="order.status === 'refund_pending' || order.status === 'refunded'" class="mt-6 bg-red-900/30 border border-red-500/30 rounded-2xl p-4">
          <div class="font-semibold">We’re sorry — this item sold out</div>
          <div class="text-white/70 mt-2">
            Your payment is being refunded. If you have questions, please contact the band.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const route = useRoute()

const copied = ref(false)

const orderCode = computed(() => String(route.params.orderCode || ''))

const { data, pending, error } = await useFetch(() => `/api/merch-concierge/order/${encodeURIComponent(orderCode.value)}`, {
  server: true,
})

const order = computed(() => data.value?.data || null)

const errorMessage = computed(() => {
  if (!error.value) return ''
  return error.value?.data?.message || error.value?.message || 'Unknown error'
})

async function copyLink() {
  try {
    copied.value = false
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    copied.value = false
  }
}
</script>
