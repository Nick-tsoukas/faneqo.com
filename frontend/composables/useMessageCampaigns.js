/**
 * Generic Faneqo broadcast campaigns (Message Fans, Message the Room status, etc.)
 * Never expects recipient email lists from the API.
 */
import {
  formatCampaignAudienceLine,
  formatCampaignStatusLabel,
} from '~/utils/campaigns/campaignLabels'

const TERMINAL_STATUSES = new Set(['completed', 'partially_failed', 'failed', 'canceled'])
const DEFAULT_POLL_MS = 2000

export function useMessageCampaigns() {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const baseUrl = config.public.strapiUrl || 'http://localhost:1337'

  function authHeaders() {
    return { Authorization: `Bearer ${token.value}` }
  }

  /**
   * Aggregate audience counts — no PII / no snapshot.
   * @returns {{ total, eligible, suppressed, unavailable, canSend, ... }}
   */
  async function previewAudience({
    bandId,
    audienceType,
    audienceReference = null,
    audienceConfig = null,
    channel = 'email',
    artistUpdateId = null,
  }) {
    const response = await $fetch(`${baseUrl}/api/message-campaigns/preview`, {
      method: 'POST',
      headers: authHeaders(),
      body: {
        bandId,
        audienceType,
        audienceReference,
        audienceConfig,
        channel,
        artistUpdateId,
      },
    })
    return response?.data || null
  }

  /**
   * Queue a campaign. Returns immediately with campaignId.
   */
  async function createCampaign({
    bandId,
    audienceType,
    audienceReference = null,
    audienceConfig = null,
    subject,
    note,
    name = null,
    channel = 'email',
    artistUpdateId = null,
  }) {
    const response = await $fetch(`${baseUrl}/api/message-campaigns`, {
      method: 'POST',
      headers: authHeaders(),
      body: {
        bandId,
        audienceType,
        audienceReference,
        audienceConfig,
        subject,
        note,
        name,
        channel,
        artistUpdateId,
      },
    })
    return response?.data || null
  }

  async function getCampaignStatus(campaignId) {
    const response = await $fetch(`${baseUrl}/api/message-campaigns/${campaignId}/status`, {
      headers: authHeaders(),
    })
    return response?.data || null
  }

  /**
   * Paginated campaign history for a band (aggregates only).
   */
  async function getCampaignHistory({ bandId, page = 1, pageSize = 20 }) {
    if (!token.value) {
      const err = new Error('Authentication required')
      err.status = 401
      throw err
    }
    const response = await $fetch(`${baseUrl}/api/message-campaigns/history`, {
      headers: authHeaders(),
      query: { bandId, page, pageSize },
    })
    return {
      data: Array.isArray(response?.data) ? response.data : [],
      meta: response?.meta || { pagination: { page: 1, pageSize, pageCount: 1, total: 0 } },
    }
  }

  /**
   * Campaign detail including original bodyText — never recipient emails.
   */
  async function getCampaignDetail(campaignId) {
    const response = await $fetch(`${baseUrl}/api/message-campaigns/${campaignId}`, {
      headers: authHeaders(),
    })
    return response?.data || null
  }

  function isTerminalStatus(status) {
    return TERMINAL_STATUSES.has(status)
  }

  function formatAudienceLabel(campaign) {
    return formatCampaignAudienceLine(campaign)
  }

  function formatStatusLabel(status) {
    return formatCampaignStatusLabel(status)
  }

  function formatCampaignWhen(campaign) {
    const raw = campaign?.completedAt || campaign?.queuedAt || campaign?.createdAt
    if (!raw) return ''
    try {
      const d = new Date(raw)
      if (Number.isNaN(d.getTime())) return ''
      const now = new Date()
      const time = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(d)
      if (d.toDateString() === now.toDateString()) return `Today · ${time}`
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      }).format(d)
    } catch {
      return ''
    }
  }

  function formatCampaignDateTime(campaign) {
    const raw = campaign?.completedAt || campaign?.queuedAt || campaign?.createdAt
    if (!raw) return ''
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(raw))
    } catch {
      return ''
    }
  }

  /**
   * Poll until terminal. Caller owns cleanup via returned stop().
   * @param {number|string} campaignId
   * @param {(status: object) => void} onUpdate
   * @param {{ intervalMs?: number, fallback?: object }} [options]
   */
  function pollCampaignStatus(campaignId, onUpdate, options = {}) {
    const intervalMs = options.intervalMs ?? DEFAULT_POLL_MS
    const fallback = options.fallback || {}
    let timer = null
    let stopped = false

    const apply = (status) => {
      if (!status) return
      const merged = {
        ...fallback,
        ...status,
        isTerminal: isTerminalStatus(status.status),
        skippedCount: status.skippedCount ?? fallback.skippedCount ?? fallback.skipped ?? 0,
      }
      onUpdate(merged)
      if (merged.isTerminal) stop()
    }

    const tick = async () => {
      if (stopped) return
      try {
        const status = await getCampaignStatus(campaignId)
        apply(status)
      } catch (err) {
        console.warn('[MessageCampaigns] status poll failed', err)
      }
    }

    function stop() {
      stopped = true
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    // Seed optimistic queued state, then poll.
    apply({
      status: fallback.status || 'queued',
      recipientCount: fallback.recipientCount || 0,
      sentCount: fallback.sentCount || 0,
      deliveredCount: fallback.deliveredCount || 0,
      failedCount: fallback.failedCount || 0,
      suppressedCount: fallback.suppressedCount || 0,
      skippedCount: fallback.skipped || fallback.skippedCount || 0,
    })

    tick().then(() => {
      if (!stopped) {
        timer = setInterval(tick, intervalMs)
      }
    })

    return { stop }
  }

  return {
    previewAudience,
    createCampaign,
    getCampaignStatus,
    getCampaignHistory,
    getCampaignDetail,
    pollCampaignStatus,
    isTerminalStatus,
    formatAudienceLabel,
    formatStatusLabel,
    formatCampaignWhen,
    formatCampaignDateTime,
    TERMINAL_STATUSES,
  }
}
