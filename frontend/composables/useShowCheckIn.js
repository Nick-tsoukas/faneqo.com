import { ref, computed } from 'vue'

/**
 * DEPRECATED — currently unused.
 *
 * This duplicates the check-in state machine and POST already implemented in
 * components/band/ShowCheckInModal.vue. No modal is bound to this state, so
 * calling openModal() here does nothing visible. The source of truth is the
 * page-level modal in pages/[bandSlug]/index.vue: components should emit
 * `open-check-in-modal` upward instead of using this composable.
 */
export function useShowCheckIn() {
  // Modal state
  const isModalOpen = ref(false)
  const currentShowData = ref(null)
  
  // Check-in state
  const checkInState = ref('idle') // idle, identity_needed, submitting, success, already_checked_in, error
  const isLoading = ref(false)
  const errorMessage = ref('')
  
  // Form data
  const email = ref('')
  const firstName = ref('')
  
  // Results
  const lastCheckInResult = ref(null)
  
  // Computed getters
  const isIdle = computed(() => checkInState.value === 'idle')
  const needsIdentity = computed(() => checkInState.value === 'identity_needed')
  const isSubmitting = computed(() => checkInState.value === 'submitting')
  const isSuccess = computed(() => checkInState.value === 'success')
  const isAlreadyCheckedIn = computed(() => checkInState.value === 'already_checked_in')
  const hasError = computed(() => checkInState.value === 'error')
  
  // Modal management
  const openModal = (showData) => {
    currentShowData.value = showData
    isModalOpen.value = true
    resetCheckInState()
    
    // Pre-fill email if available
    if (showData?.fanEmail) {
      email.value = showData.fanEmail
    }
  }
  
  const closeModal = () => {
    isModalOpen.value = false
    resetCheckInState()
  }
  
  // State management
  const resetCheckInState = () => {
    checkInState.value = 'idle'
    isLoading.value = false
    errorMessage.value = ''
    firstName.value = ''
    // Keep email if it was pre-filled
    if (!currentShowData.value?.fanEmail) {
      email.value = ''
    }
  }
  
  const setCheckInState = (newState) => {
    checkInState.value = newState
  }
  
  const setError = (message) => {
    checkInState.value = 'error'
    errorMessage.value = message
    isLoading.value = false
  }
  
  const setLoading = (loading) => {
    isLoading.value = loading
    if (loading) {
      checkInState.value = 'submitting'
    }
  }
  
  const setSuccess = (result) => {
    checkInState.value = result?.alreadyCheckedIn ? 'already_checked_in' : 'success'
    lastCheckInResult.value = result
    isLoading.value = false
  }
  
  // Form management
  const updateEmail = (newEmail) => {
    email.value = newEmail
  }
  
  const updateFirstName = (newFirstName) => {
    firstName.value = newFirstName
  }
  
  // Check-in submission
  const submitCheckIn = async (checkInData) => {
    setLoading(true)
    errorMessage.value = ''
    
    try {
      const config = useRuntimeConfig()
      
      const payload = {
        bandId: parseInt(checkInData.bandId),
        fanEmail: email.value.trim().toLowerCase(),
        eventId: checkInData.eventId ? parseInt(checkInData.eventId) : null,
        campaignId: checkInData.campaignId,
        surface: 'band_page',
        interactionContext: 'show_mode',
        metadata: {
          showTitle: checkInData.showTitle,
          venue: checkInData.venue,
          city: checkInData.city,
          checkInMethod: 'premium_modal',
          firstName: firstName.value.trim() || null,
          ...checkInData.metadata
        }
      }
      
      const response = await $fetch(`${config.public.strapiUrl}/api/fan-interactions/check-in`, {
        method: 'POST',
        body: payload
      })
      
      if (response.success) {
        setSuccess(response)
        return response
      } else {
        throw new Error(response.error || 'Check-in failed')
      }
    } catch (error) {
      console.error('Check-in error:', error)
      setError(error.message || 'Unable to check in. Please try again.')
      throw error
    }
  }
  
  // Quick check-in for known fans
  const quickCheckIn = async (checkInData) => {
    if (!email.value) {
      setCheckInState('identity_needed')
      return
    }
    
    return await submitCheckIn(checkInData)
  }
  
  // Retry functionality
  const retryCheckIn = () => {
    if (email.value) {
      return submitCheckIn(currentShowData.value)
    } else {
      setCheckInState('idle')
    }
  }
  
  // Event handlers for modal
  const handlePrimaryCTA = () => {
    if (email.value) {
      quickCheckIn(currentShowData.value)
    } else {
      setCheckInState('identity_needed')
    }
  }
  
  const handleEmailSubmit = () => {
    if (email.value) {
      submitCheckIn(currentShowData.value)
    }
  }
  
  const handleClose = () => {
    closeModal()
  }
  
  const handleRetry = () => {
    retryCheckIn()
  }
  
  // Computed copy for UI
  const introHeadline = computed(() => {
    const show = currentShowData.value
    if (show?.showTitle) {
      return `You're at ${show.showTitle}`
    }
    return 'You Were Here Tonight'
  })
  
  const introMessage = computed(() => {
    const show = currentShowData.value
    if (show?.venue && show?.city) {
      return `Check in to tonight's show at ${show.venue} in ${show.city}.`
    }
    return 'Check in to tonight\'s show and make it official.'
  })
  
  const primaryCTACopy = computed(() => {
    const show = currentShowData.value
    if (show?.showTitle) {
      return 'Check In at Tonight\'s Show'
    }
    return 'I\'m Here Tonight'
  })
  
  const supportingText = computed(() => {
    if (email.value) {
      return 'Welcome back! Check in to be part of tonight\'s attendance.'
    }
    return 'Check in to be part of tonight\'s attendance and unlock future fan perks.'
  })
  
  return {
    // Modal state
    isModalOpen,
    currentShowData,
    openModal,
    closeModal,
    
    // Check-in state
    checkInState,
    isLoading,
    errorMessage,
    lastCheckInResult,
    
    // Computed states
    isIdle,
    needsIdentity,
    isSubmitting,
    isSuccess,
    isAlreadyCheckedIn,
    hasError,
    
    // Form data
    email,
    firstName,
    updateEmail,
    updateFirstName,
    
    // Actions
    submitCheckIn,
    quickCheckIn,
    retryCheckIn,
    setCheckInState,
    setError,
    setLoading,
    setSuccess,
    
    // Event handlers
    handlePrimaryCTA,
    handleEmailSubmit,
    handleClose,
    handleRetry,
    
    // Computed copy
    introHeadline,
    introMessage,
    primaryCTACopy,
    supportingText
  }
}
