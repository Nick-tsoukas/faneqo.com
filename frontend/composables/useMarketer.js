// ~/composables/useMarketer.js
// Composable for marketer dashboard data

export function useMarketer() {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const user = useStrapiUser()

  const baseUrl = `${config.public.strapiUrl}/api/marketer`
  
  // Cache for isMarketer check
  const isMarketerChecked = ref(false)
  const isMarketerValue = ref(false)

  // Check if current user is a marketer (with API fallback)
  const isMarketer = computed(() => {
    // If already checked via API, use cached value
    if (isMarketerChecked.value) {
      return isMarketerValue.value
    }
    // Otherwise use user object value
    return !!user.value?.isMarketer
  })
  
  // Fetch isMarketer status from API (call this on mount)
  async function checkIsMarketer() {
    if (!token.value) return false
    
    try {
      const response = await fetch(`${config.public.strapiUrl}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      if (response.ok) {
        const userData = await response.json()
        isMarketerValue.value = !!userData.isMarketer
        isMarketerChecked.value = true
        return isMarketerValue.value
      }
    } catch (e) {
      console.warn('[useMarketer] Failed to check isMarketer:', e)
    }
    return false
  }

  // Get marketer stats
  async function getMarketerStats() {
    if (!token.value) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${baseUrl}/me/stats`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error?.error?.message || 'Failed to fetch marketer stats')
    }

    return response.json()
  }

  // Get referred users with pagination
  async function getMarketerUsers({ page = 1, pageSize = 25 } = {}) {
    if (!token.value) {
      throw new Error('Not authenticated')
    }

    const params = new URLSearchParams()
    params.set('page', page.toString())
    params.set('pageSize', pageSize.toString())

    const response = await fetch(`${baseUrl}/me/users?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error?.error?.message || 'Failed to fetch referred users')
    }

    return response.json()
  }

  // Format currency
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Format date
  function formatDate(dateString) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get status badge color
  function getStatusColor(status) {
    switch (status) {
      case 'active':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'trialing':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'canceled':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'pastDue':
      case 'past_due':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  // Format status label
  function formatStatus(status) {
    switch (status) {
      case 'active':
        return 'Active'
      case 'trialing':
        return 'Trial'
      case 'canceled':
        return 'Canceled'
      case 'pastDue':
      case 'past_due':
        return 'Past Due'
      default:
        return status || 'Unknown'
    }
  }

  return {
    isMarketer,
    checkIsMarketer,
    getMarketerStats,
    getMarketerUsers,
    formatCurrency,
    formatDate,
    getStatusColor,
    formatStatus,
  }
}
