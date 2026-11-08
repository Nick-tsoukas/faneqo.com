<script setup>
import { FLAGSHIP_DECK_PATH } from '~/corvana/decks/deckIndex.js'

definePageMeta({
  layout: false,
})

const route = useRoute()

// Older links used /deck; the shareable address is /presentation
await navigateTo(
  { path: FLAGSHIP_DECK_PATH, query: route.query },
  { replace: true, redirectCode: 301 },
)
</script>
