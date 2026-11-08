<template>
  <div class="copy-block bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700">
      <h4 class="text-white font-medium text-sm">{{ title }}</h4>
      <div class="flex items-center gap-2">
        <button
          v-if="showMarkdownToggle"
          @click="asMarkdown = !asMarkdown"
          class="px-2 py-1 text-xs rounded-lg transition-colors"
          :class="asMarkdown ? 'bg-violet-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'"
        >
          MD
        </button>
        <button
          @click="handleCopy"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <svg v-if="!copied" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
    </div>

    <!-- Preview Area -->
    <div class="p-4 max-h-80 overflow-y-auto">
      <pre class="text-gray-300 text-xs font-mono whitespace-pre-wrap leading-relaxed">{{ displayContent }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Output'
  },
  content: {
    type: String,
    required: true
  },
  showMarkdownToggle: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['copied'])

const copied = ref(false)
const asMarkdown = ref(false)

const displayContent = computed(() => {
  if (asMarkdown.value) {
    return convertToMarkdown(props.content)
  }
  return props.content
})

function convertToMarkdown(text) {
  return text
    .replace(/^(MBQ .+|WEEKLY .+|CITY .+|ARTIST .+)$/gm, '# $1')
    .replace(/^(\d+\) .+)$/gm, '## $1')
    .replace(/^(Slide \d+ — .+)$/gm, '## $1')
    .replace(/^(Snapshot|What happened|Proof|Recommended .+|Steps:)$/gm, '### $1')
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(displayContent.value)
    copied.value = true
    emit('copied')
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<style scoped>
.copy-block pre {
  tab-size: 2;
}
</style>
