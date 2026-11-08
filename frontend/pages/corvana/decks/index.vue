<template>
  <div class="p-8">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Presentations</h1>
        <p class="text-white/50">Internal deck viewer and presentation system</p>
      </div>
      
      <!-- Deck Grid -->
      <div class="grid gap-4">
        <NuxtLink 
          v-for="deck in decks"
          :key="deck.slug"
          :to="`/corvana/decks/${deck.slug}`"
          class="block bg-white/5 border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-purple-500/50 hover:bg-white/[0.07] transition-all no-underline group"
          :class="{ 'ring-2 ring-purple-500/30 border-purple-500/40': deck.isPrimary }"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div 
                class="w-12 h-12 rounded-xl flex items-center justify-center"
                :class="deck.isPrimary ? 'bg-gradient-to-br from-purple-500/30 to-emerald-500/30' : 'bg-purple-500/20'"
              >
                <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <!-- Primary Badge -->
              <span 
                v-if="deck.isPrimary" 
                class="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-gradient-to-r from-purple-500 to-emerald-500 text-white"
              >
                Primary
              </span>
            </div>
            <!-- Tags -->
            <div class="flex gap-2">
              <span 
                v-for="tag in deck.tags" 
                :key="tag"
                class="text-xs font-medium px-2.5 py-1 rounded-full"
                :class="getTagClass(tag)"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          
          <h2 class="text-xl font-semibold text-white mb-1">{{ deck.title }}</h2>
          <p class="text-white/50 text-sm mb-4">{{ deck.subtitle }}</p>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4 text-white/40 text-sm">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {{ deck.slideCount }} slides
              </span>
              <span>{{ deck.version }}</span>
              <span>{{ deck.lastUpdated }}</span>
            </div>
            <span class="bg-purple-500 group-hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition text-sm">
              Open Deck
              <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { deckIndex } from '~/corvana/decks/deckIndex.js'

definePageMeta({
  layout: 'corvana'
})

const decks = deckIndex

function getTagClass(tag) {
  const classes = {
    'Flagship': 'bg-purple-500/20 text-purple-400',
    'Primary': 'bg-emerald-500/20 text-emerald-400',
    'Manager': 'bg-blue-500/20 text-blue-400',
    'Label': 'bg-amber-500/20 text-amber-400',
    'Agency': 'bg-orange-500/20 text-orange-400',
    'Investor': 'bg-rose-500/20 text-rose-400'
  }
  return classes[tag] || 'bg-white/10 text-white/60'
}
</script>
