<template>
  <client-only>
    <!-- Toolbar Container -->
    <div class="flex gap-2 mb-2">
      <!-- Bold Button -->
      <button
        @click="() => editor.chain().focus().toggleBold().run()"
        :class="{
          'font-bold text-white bg-blue-600': editor?.isActive('bold'),
          'text-gray-200 bg-gray-800': !editor?.isActive('bold')
        }"
        class="px-3 py-1 rounded"
      >
        B
      </button>

      <!-- Underline Button -->
      <button
        @click="() => editor.chain().focus().toggleUnderline().run()"
        :class="{
          'underline text-white bg-blue-600': editor?.isActive('underline'),
          'text-gray-200 bg-gray-800': !editor?.isActive('underline')
        }"
        class="px-3 py-1 rounded"
      >
        U
      </button>
    </div>

    <!-- Editor Container: black bg, white text -->
    <div class="border rounded p-4 min-h-[200px] bg-black text-white">
      <EditorContent v-if="editor" :editor="editor" />
    </div>
  </client-only>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'

const editor = ref<Editor | null>(null)

onMounted(() => {
  editor.value = new Editor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: `
      <p>Select some text and hit <strong>B</strong> or <u>U</u>.</p>
    `,
  })
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
/* Ensure the editor area is at least 200px tall */
.min-h-\[200px\] {
  min-height: 200px;
}

/* Buttons already use Tailwind classes above (bg-gray-800 / text-gray-200 for dark mode) */
/* You can adjust hover/focus states as needed. */
button {
  transition: background-color 0.2s;
}
</style>
