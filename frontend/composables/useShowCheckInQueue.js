/**
 * Offline-tolerant queue for show check-ins.
 *
 * Check-ins happen in a packed room on congested mobile data. A request that
 * fails there is effectively unrecoverable — the fan has put their phone away
 * and is not coming back to try again. Failed submissions are kept on the
 * device and replayed on the next visit or when the connection returns.
 *
 * Replaying is safe: the backend dedupes attendance per campaign + fan.
 */

const QUEUE_KEY = 'mbq_checkin_queue';
const MAX_ENTRIES = 20;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function useShowCheckInQueue() {
  const config = useRuntimeConfig();

  function readQueue() {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function writeQueue(entries) {
    try {
      if (!entries.length) {
        localStorage.removeItem(QUEUE_KEY);
        return;
      }
      localStorage.setItem(QUEUE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
    } catch (err) {
      // Storage unavailable or full — the check-in is already lost at this point.
    }
  }

  function isSameCheckIn(entry, payload) {
    return (
      entry?.payload?.bandId === payload.bandId &&
      entry?.payload?.campaignId === payload.campaignId &&
      entry?.payload?.fanEmail === payload.fanEmail
    );
  }

  function enqueue(payload) {
    if (!payload?.fanEmail) return;

    const entries = readQueue().filter((entry) => !isSameCheckIn(entry, payload));
    entries.push({ payload, queuedAt: Date.now() });
    writeQueue(entries);
  }

  async function flush() {
    const entries = readQueue();
    if (!entries.length) return { sent: 0, remaining: 0 };

    const fresh = entries.filter((entry) => Date.now() - (entry.queuedAt || 0) < MAX_AGE_MS);
    const remaining = [];
    let sent = 0;

    for (let i = 0; i < fresh.length; i++) {
      try {
        await $fetch(`${config.public.strapiUrl}/api/fan-interactions/check-in`, {
          method: 'POST',
          body: fresh[i].payload,
          retry: 0,
        });
        sent++;
      } catch (err) {
        const status = err?.statusCode || err?.response?.status;

        // A payload the server rejects outright will be rejected again.
        if (status && status >= 400 && status < 500) continue;

        // Still no usable connection — keep this and everything after it.
        remaining.push(...fresh.slice(i));
        break;
      }
    }

    writeQueue(remaining);
    return { sent, remaining: remaining.length };
  }

  return {
    enqueue,
    flush,
    queueSize: () => readQueue().length,
  };
}
