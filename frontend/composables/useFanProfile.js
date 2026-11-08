import { ref } from 'vue'
import {
  FAN_AVATAR_FIELD,
  fanAvatarClientCheck,
  fanAvatarErrorMessage,
  fanProfileFieldError,
  fanProfilePatchBody,
} from '~/utils/fan/fanProfileIdentity'

/**
 * The single owner of the global fan profile API.
 *
 * Identity: GET + PATCH `/api/fan-account/profile`.
 * Avatar: POST + DELETE `/api/fan-account/avatar`.
 *
 * The legacy POST on `/fan-account/profile` syncs band-scoped Fan names for
 * messaging and is deliberately not reachable from here.
 */
export function useFanProfile() {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const baseUrl = config.public.strapiUrl || 'http://localhost:1337'

  // Shared so the fan home identity strip and the profile page agree without
  // fetching twice on a single navigation.
  const profile = useState('fan-profile', () => null)
  const loaded = useState('fan-profile-loaded', () => false)

  const loading = ref(false)
  const saving = ref(false)
  const avatarUploading = ref(false)
  const avatarDeleting = ref(false)
  const error = ref(null)
  const fieldErrors = ref({})

  function authHeaders() {
    if (!token.value) {
      const unauthorized = new Error('Authentication required')
      unauthorized.status = 401
      throw unauthorized
    }
    return { Authorization: `Bearer ${token.value}` }
  }

  function normalize(data) {
    if (!data || typeof data !== 'object') return null
    return {
      displayName: data.displayName || null,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      avatarUrl: data.avatarUrl || null,
      profileCompletedAt: data.profileCompletedAt || null,
      email: data.email || null,
    }
  }

  function apiError(err) {
    return err?.data?.error || err?.response?._data?.error || null
  }

  function statusOf(err) {
    return Number(err?.status || err?.statusCode || apiError(err)?.status) || 0
  }

  function applyError(err, fallback) {
    const body = apiError(err)
    const mapped = fanProfileFieldError(body)
    if (mapped) {
      fieldErrors.value = { ...fieldErrors.value, [mapped.field]: mapped.message }
      error.value = null
      return
    }
    const avatarMessage = fanAvatarErrorMessage(body) || fanAvatarErrorMessage(err)
    if (avatarMessage) {
      error.value = avatarMessage
      return
    }
    if (statusOf(err) === 401) {
      error.value = 'Your session expired. Sign in again to continue.'
      return
    }
    error.value = String(body?.message || '').trim() || fallback
  }

  async function loadProfile({ force = false } = {}) {
    if (loaded.value && !force) return profile.value
    loading.value = true
    error.value = null
    try {
      const res = await $fetch(`${baseUrl}/api/fan-account/profile`, { headers: authHeaders() })
      profile.value = normalize(res?.data)
      loaded.value = true
      return profile.value
    } catch (err) {
      applyError(err, "Couldn't load your profile.")
      throw err
    } finally {
      loading.value = false
    }
  }

  async function saveProfile(form) {
    saving.value = true
    error.value = null
    fieldErrors.value = {}
    try {
      const res = await $fetch(`${baseUrl}/api/fan-account/profile`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: fanProfilePatchBody(form),
      })
      profile.value = normalize(res?.data)
      loaded.value = true
      return profile.value
    } catch (err) {
      applyError(err, "Couldn't save that. Try again.")
      throw err
    } finally {
      saving.value = false
    }
  }

  /**
   * Multipart avatar upload. Does not PATCH the profile, does not write
   * profileCompletedAt, and does not mutate local avatarUrl until the
   * server returns the new profile — a failed replace keeps the old photo.
   */
  async function uploadAvatar(file) {
    const check = fanAvatarClientCheck(file)
    if (!check.ok) {
      error.value = check.message
      const invalid = new Error(check.message)
      invalid.code = check.code
      throw invalid
    }
    if (avatarUploading.value || avatarDeleting.value) return profile.value

    avatarUploading.value = true
    error.value = null
    try {
      const body = new FormData()
      body.append(FAN_AVATAR_FIELD, file, file.name || 'avatar')
      const res = await $fetch(`${baseUrl}/api/fan-account/avatar`, {
        method: 'POST',
        headers: authHeaders(),
        body,
      })
      profile.value = normalize(res?.data)
      loaded.value = true
      return profile.value
    } catch (err) {
      applyError(err, 'Photo upload failed. Try again.')
      throw err
    } finally {
      avatarUploading.value = false
    }
  }

  /** Idempotent. A missing avatar is success, not a broken empty state. */
  async function removeAvatar() {
    if (avatarUploading.value || avatarDeleting.value) return profile.value

    avatarDeleting.value = true
    error.value = null
    try {
      const res = await $fetch(`${baseUrl}/api/fan-account/avatar`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      profile.value = normalize(res?.data)
      loaded.value = true
      return profile.value
    } catch (err) {
      applyError(err, "Couldn't remove that photo. Try again.")
      throw err
    } finally {
      avatarDeleting.value = false
    }
  }

  function clearError() {
    error.value = null
    fieldErrors.value = {}
  }

  /** Drop the cached identity so it cannot survive a sign-out into a new session. */
  function reset() {
    profile.value = null
    loaded.value = false
    avatarUploading.value = false
    avatarDeleting.value = false
    clearError()
  }

  return {
    profile,
    loaded,
    loading,
    saving,
    avatarUploading,
    avatarDeleting,
    error,
    fieldErrors,
    loadProfile,
    saveProfile,
    uploadAvatar,
    removeAvatar,
    clearError,
    reset,
    statusOf,
  }
}
