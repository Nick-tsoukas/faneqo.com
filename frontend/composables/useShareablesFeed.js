import { ref, computed } from 'vue'
import { useRuntimeConfig, useStrapiToken } from '#imports'
import { useShareKit } from './useShareKit'

/**
 * Composable for fetching shareable cards from the unified Shareables v1 API.
 * Uses GET /api/pulse/shareables endpoint.
 */
export function useShareablesFeed(bandData) {
  const config = useRuntimeConfig()
  // /api/pulse/shareables is band-private and authenticated server-side, so the
  // session token has to travel with the request.
  const token = useStrapiToken()
  const { buildShareUrl } = useShareKit()

  // State
  const loading = ref(true)
  const refreshing = ref(false)
  const items = ref([])
  const recommendedItems = ref([])
  const error = ref(null)

  // Band data refs
  const bandId = computed(() => bandData.value?.id || bandData.id)
  const bandSlug = computed(() => bandData.value?.slug || bandData.slug || '')
  const bandName = computed(() => bandData.value?.name || bandData.name || 'This Artist')
  const bandImageUrl = computed(() => bandData.value?.imageUrl || bandData.imageUrl || null)
  const isBandNameInLogo = computed(() => bandData.value?.isBandNameInLogo || bandData.isBandNameInLogo || false)

  // Get origin for URLs
  function getOrigin() {
    return typeof window !== 'undefined' ? window.location.origin : 'https://musicbizqr.com'
  }

  /**
   * Transform backend ShareCard to frontend ShareableItem format
   */
  function transformCard(card) {
    const origin = getOrigin()
    const slug = bandSlug.value

    // Map card type to source category
    const sourceMap = {
      CITY_CLAIM: 'geo',
      NEW_CITY_UNLOCKED: 'geo',
      MOMENTUM_SURGE: 'growth',
      AFTER_SHOW_ENERGY: 'growth',
      PEAK_HOUR: 'growth',
      RETURNING_FANS: 'engagement',
      ENGAGED_SESSIONS: 'engagement',
      SHARE_CHAIN: 'distribution',
      PLATFORM_PULL: 'distribution',
      MILESTONE_DROP: 'achievement',
    }

    return {
      id: card.id,
      source: sourceMap[card.type] || 'other',
      kind: card.type,
      windowLabel: card.windowLabel,
      title: card.headline,
      primaryStat: card.hero,
      secondaryStat: card.proof,
      microCaption: card.microCaption?.hype || null,
      band: {
        id: bandId.value,
        slug,
        name: bandName.value,
        imageUrl: bandImageUrl.value,
        isBandNameInLogo: isBandNameInLogo.value,
      },
      share: {
        shareUrl: buildShareUrl({ bandSlug: slug }),
        ogUrl: `${origin}/share/band/${slug}`,
        captions: card.microCaption || {
          hype: `${bandName.value} is building momentum 🔥`,
          grateful: `Thank you for the support 🙏`,
          tease: `Something's happening… 👀`,
        },
        defaultCaptionStyle: 'hype',
      },
      context: card.context || {},
      score: card.score || 0,
      accent: card.accent || 'violet',
    }
  }

  /**
   * Fetch shareables from unified API
   */
  async function fetchItems() {
    const strapiUrl = config.public.strapiUrl
    const id = bandId.value
    if (!id) return

    try {
      const res = await fetch(`${strapiUrl}/api/pulse/shareables?bandId=${id}`, {
        headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      })
      const data = await res.json()

      if (data.ok) {
        // Transform all cards
        items.value = (data.cards || []).map(transformCard)
        recommendedItems.value = (data.recommended || []).map(transformCard)
        error.value = null
      } else {
        console.warn('[useShareablesFeed] API returned not ok:', data.error)
        items.value = []
        recommendedItems.value = []
      }
    } catch (err) {
      console.error('[useShareablesFeed] Failed to fetch:', err)
      error.value = err
      items.value = []
      recommendedItems.value = []
    }
  }

  // Filtered lists by source category
  const recaps = computed(() => items.value.filter(i => 
    i.kind === 'AFTER_SHOW_ENERGY' || i.kind === 'MILESTONE_DROP'
  ))
  const spikes = computed(() => items.value.filter(i => 
    i.kind === 'MOMENTUM_SURGE' || i.kind === 'PEAK_HOUR'
  ))
  const prompts = computed(() => items.value.filter(i => 
    i.source === 'geo' || i.source === 'distribution' || i.source === 'engagement'
  ))

  // Recommended from API (already sorted by score + diversity)
  const recommended = computed(() => recommendedItems.value)

  // Get items for a specific tab
  function getItemsForTab(tab) {
    switch (tab) {
      case 'recaps':
        return recaps.value
      case 'spikes':
        return spikes.value
      case 'prompts':
        return prompts.value
      case 'recommended':
      default:
        return recommended.value.length > 0 ? recommended.value : items.value
    }
  }

  // Initial fetch
  async function init() {
    loading.value = true
    await fetchItems()
    loading.value = false
  }

  // Refresh
  async function refresh() {
    refreshing.value = true
    await fetchItems()
    refreshing.value = false
  }

  return {
    loading,
    refreshing,
    items,
    error,
    recaps,
    spikes,
    prompts,
    recommended,
    getItemsForTab,
    init,
    refresh,
  }
}
