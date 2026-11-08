<template>
  <div class="min-h-screen bg-[#121212] pt-[var(--header-height)] text-white px-4 sm:px-6 lg:px-8 py-10">
    <div class="max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold">Saved</h1>

      <client-only>
        <template #fallback>
          <div class="mt-8 text-white/70">Loading…</div>
        </template>

        <div v-if="!savedBands.length" class="mt-8">
          <div class="text-xl font-semibold">No saved bands yet</div>
          <div class="text-white/70 mt-2">When you save a band, it will appear here.</div>
          <NuxtLink
            to="/"
            class="inline-block mt-6 bg-violet-600 hover:bg-violet-700 text-white font-medium px-5 py-3 rounded-xl transition-all"
          >
            Explore bands
          </NuxtLink>
        </div>

        <div v-else class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="b in savedBands"
            :key="b.bandSlug"
            class="bg-black/40 border border-white/10 rounded-xl overflow-hidden"
          >
            <div class="flex gap-4 p-4">
              <div class="w-20 h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                <img
                  v-if="b.bandImageUrl"
                  :src="b.bandImageUrl"
                  :alt="b.bandName || b.bandSlug"
                  class="w-full h-full object-cover"
                />
              </div>

              <div class="flex-1 min-w-0">
                <div class="text-lg font-semibold truncate">
                  {{ b.bandName || b.bandSlug }}
                </div>
                <div class="text-white/60 text-sm mt-1">
                  Saved {{ formatSavedAt(b.savedAt) }}
                </div>

                <div class="mt-3 flex gap-2">
                  <NuxtLink
                    :to="`/${b.bandSlug}`"
                    class="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5"
                  >
                    View band
                  </NuxtLink>

                  <button
                    type="button"
                    class="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5"
                    @click="unsaveBand(b.bandSlug)"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </client-only>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useSavedBands } from "@/composables/useSavedBands";
import { useAnalytics } from "@/composables/useAnalytics";

const { savedBands, count, unsaveBand } = useSavedBands();
const { trackEvent } = useAnalytics();

function formatSavedAt(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

onMounted(() => {
  trackEvent("saved_page_viewed", { count: count.value });
});
</script>
