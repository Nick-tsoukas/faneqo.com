<template>
  <!-- Wrap in <client-only> so Tiptap only renders on the client (avoids SSR hydration errors) -->
  <client-only>
    <div class="border rounded p-4 min-h-[200px]">
      <!-- Only render EditorContent if `editor` is initialized -->
      <EditorContent v-if="editor" :editor="editor" />
    </div>
  </client-only>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

// Create a ref to hold the Editor instance
const editor = ref<Editor | null>(null)

onMounted(() => {
  // Instantiate Tiptap’s Editor once component is mounted (client-side)
  editor.value = new Editor({
    extensions: [
      StarterKit, // Basic formatting tools (bold, italic, headings, lists, etc.)
      // → add more extensions here as needed
    ],
    content: `
      <h2 class="text-xl font-semibold mb-2">Tiptap is Alive!</h2>
      <p>Type here to test your WYSIWYG setup.</p>
    `,
  })
})

onBeforeUnmount(() => {
  // Clean up the Editor instance when this component unmounts
  editor.value?.destroy()
})
</script>

<style scoped>
/* Optional: ensure a minimum height so it’s easy to click in */
.min-h-\[200px\] {
  min-height: 200px;
}
.border {
  border: 1px solid #d1d5db; /* Tailwind gray-300 */
}
.rounded {
  border-radius: 0.375rem; /* Tailwind rounded-md */
}
.p-4 {
  padding: 1rem; /* Tailwind p-4 */
}
</style>
