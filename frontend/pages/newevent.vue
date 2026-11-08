<template>
  <div class="min-h-screen bg-black pt-[var(--header-height)]">
    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <span class="text-white/70 text-sm">Creating your event...</span>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-6 py-10">
      <!-- Header -->
      <div class="mb-10">
        <NuxtLink :to="dashboardBackTo" class="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mb-4 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </NuxtLink>
        <h1 class="text-3xl md:text-4xl font-bold text-white">Create New Event</h1>
        <p class="text-white/60 mt-2">Set up your event details and start promoting</p>
      </div>

      <form @submit.prevent="submitNewEvent" class="space-y-6">
        <!-- Event Details Section -->
        <section class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-blue-500 to-indigo-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 class="form-section-title">Event Details</h2>
              <p class="form-section-subtitle">Basic information about your event</p>
            </div>
          </div>

          <div class="form-section-content">
            <div class="form-field">
              <label for="new-event-title" class="form-label">Event Title <span class="text-red-400">*</span></label>
              <input
                type="text"
                id="new-event-title"
                v-model="newEvent.title"
                class="form-input"
                placeholder="Enter event title"
                required
              />
            </div>

            <!-- Description (Rich Text via Tiptap JSON) -->
            <div class="form-field">
              <label class="form-label">Event Description</label>
              <client-only>
                <div v-if="editor" class="editor-wrapper">
                  <div class="editor-toolbar">
                    <button
                      type="button"
                      :class="['editor-btn', editor.isActive('bold') && 'active']"
                      @click="toggleBold"
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      type="button"
                      :class="['editor-btn', editor.isActive('italic') && 'active']"
                      @click="toggleItalic"
                    >
                      <em>I</em>
                    </button>
                    <button
                      type="button"
                      :class="['editor-btn', editor.isActive('underline') && 'active']"
                      @click="toggleUnderline"
                    >
                      <u>U</u>
                    </button>
                  </div>
                  <EditorContent
                    class="editor-content"
                    :editor="editor"
                  />
                </div>
                <div v-else class="editor-loading">
                  <div class="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                  <span>Loading editor...</span>
                </div>
              </client-only>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label for="new-event-date" class="form-label">Event Date <span class="text-red-400">*</span></label>
                <input
                  type="date"
                  id="new-event-date"
                  v-model="newEvent.date"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-field">
                <label for="new-event-time" class="form-label">Event Time <span class="text-red-400">*</span></label>
                <input
                  type="time"
                  id="new-event-time"
                  v-model="newEvent.time"
                  class="form-input"
                  required
                />
              </div>
            </div>

            <div class="form-field">
              <label for="new-event-doors-time" class="form-label">Doors Time</label>
              <input
                type="time"
                id="new-event-doors-time"
                v-model="newEvent.doorsTime"
                class="form-input"
              />
            </div>
          </div>
        </section>

        <!-- Venue Section -->
        <section class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-emerald-500 to-teal-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 class="form-section-title">Venue & Location</h2>
              <p class="form-section-subtitle">Where is your event taking place?</p>
            </div>
          </div>

          <div class="form-section-content">
            <div class="form-field">
              <label for="new-event-venue" class="form-label">Venue Name <span class="text-red-400">*</span></label>
              <input
                type="text"
                id="new-event-venue"
                v-model="newEvent.venue"
                class="form-input"
                placeholder="e.g., The Fillmore"
                required
              />
            </div>

            <div class="form-field">
              <label for="new-event-address" class="form-label">Street Address <span class="text-red-400">*</span></label>
              <input
                type="text"
                id="new-event-address"
                v-model="newEvent.address"
                class="form-input"
                placeholder="123 Main Street"
                required
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label for="new-event-city" class="form-label">City <span class="text-red-400">*</span></label>
                <input
                  type="text"
                  id="new-event-city"
                  v-model="newEvent.city"
                  class="form-input"
                  placeholder="City"
                  required
                />
              </div>

              <div class="form-field">
                <label for="new-event-state" class="form-label">State <span class="text-red-400">*</span></label>
                <input
                  type="text"
                  id="new-event-state"
                  v-model="newEvent.state"
                  class="form-input"
                  placeholder="State"
                  required
                />
              </div>
            </div>

            <div class="form-field">
              <label for="new-event-age-restriction" class="form-label">Age Restriction</label>
              <input
                type="text"
                id="new-event-age-restriction"
                v-model="newEvent.ageRestriction"
                class="form-input"
                placeholder="e.g., 21+"
              />
            </div>
          </div>
        </section>

        <!-- Event Image Section -->
        <section class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-purple-500 to-violet-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 class="form-section-title">Event poster</h2>
              <p class="form-section-subtitle">Upload the full flyer. Fans can tap to zoom and read it.</p>
            </div>
          </div>

          <div class="form-section-content">
            <EventPosterField
              input-id="new-event-image"
              :preview-url="newEvent.imageUrl || ''"
              :alt="newEvent.title ? `${newEvent.title} poster` : 'Event poster'"
              required
              @select="handleNewEventImageUpload"
            />
          </div>
        </section>

        <!-- Ticket Link Section -->
        <section class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-amber-500 to-orange-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <h2 class="form-section-title">Tickets</h2>
              <p class="form-section-subtitle">Link to your ticket sales page</p>
            </div>
          </div>

          <div class="form-section-content">
            <div class="form-field">
              <label for="new-event-link" class="form-label">Ticket Link</label>
              <input
                type="text"
                id="new-event-link"
                v-model="newEvent.link"
                @blur="newEvent.link = normalizeLink(newEvent.link)"
                class="form-input"
                placeholder="https://tickets.example.com"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label for="new-event-ticket-label" class="form-label">Button Label</label>
                <input
                  type="text"
                  id="new-event-ticket-label"
                  v-model="newEvent.ticketLabel"
                  class="form-input"
                  placeholder="e.g., Get Tickets"
                />
              </div>

              <div class="form-field">
                <label for="new-event-price-line" class="form-label">Price Info</label>
                <input
                  type="text"
                  id="new-event-price-line"
                  v-model="newEvent.priceLine"
                  class="form-input"
                  placeholder="e.g., $25 - $50"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Contact Section -->
        <section class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-pink-500 to-rose-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 class="form-section-title">Contact Information</h2>
              <p class="form-section-subtitle">How can attendees reach you?</p>
            </div>
          </div>

          <div class="form-section-content">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label for="new-event-contact-email" class="form-label">Contact Email</label>
                <input
                  type="email"
                  id="new-event-contact-email"
                  v-model="newEvent.contactEmail"
                  class="form-input"
                  placeholder="contact@example.com"
                />
              </div>

              <div class="form-field">
                <label for="new-event-contact-phone" class="form-label">Contact Phone</label>
                <input
                  type="tel"
                  id="new-event-contact-phone"
                  v-model="newEvent.contactPhone"
                  class="form-input"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Social Media Section -->
        <section class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-cyan-500 to-blue-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <div>
              <h2 class="form-section-title">Social Media</h2>
              <p class="form-section-subtitle">Connect your social profiles</p>
            </div>
          </div>

          <div class="form-section-content">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label for="new-event-facebook" class="form-label">Facebook</label>
                <input
                  type="url"
                  id="new-event-facebook"
                  v-model="newEvent.facebook"
                  class="form-input"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div class="form-field">
                <label for="new-event-instagram" class="form-label">Instagram</label>
                <input
                  type="url"
                  id="new-event-instagram"
                  v-model="newEvent.instagram"
                  class="form-input"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div class="form-field">
                <label for="new-event-twitter" class="form-label">Twitter / X</label>
                <input
                  type="url"
                  id="new-event-twitter"
                  v-model="newEvent.twitter"
                  class="form-input"
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div class="form-field">
                <label for="new-event-tiktok" class="form-label">TikTok</label>
                <input
                  type="url"
                  id="new-event-tiktok"
                  v-model="newEvent.tiktok"
                  class="form-input"
                  placeholder="https://tiktok.com/..."
                />
              </div>

              <div class="form-field">
                <label for="new-event-youtube" class="form-label">YouTube</label>
                <input
                  type="url"
                  id="new-event-youtube"
                  v-model="newEvent.youtube"
                  class="form-input"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div class="form-field">
                <label for="new-event-website" class="form-label">Website</label>
                <input
                  type="url"
                  id="new-event-website"
                  v-model="newEvent.website"
                  class="form-input"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Band Selection Section -->
        <section class="form-section">
          <div class="form-section-header">
            <div class="form-section-icon bg-gradient-to-br from-violet-500 to-purple-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <h2 class="form-section-title">Link to Artist</h2>
              <p class="form-section-subtitle">Connect this event to your artist page</p>
            </div>
          </div>

          <div class="form-section-content">
            <div class="form-field">
              <label for="new-event-band" class="form-label">Select Artist</label>
              <select v-model="newEvent.band" id="new-event-band" class="form-input">
                <option value="" disabled>Select an artist (optional)</option>
                <option v-for="band in bands" :key="band.id" :value="band.id">
                  {{ band.name }}
                </option>
              </select>
            </div>
          </div>
        </section>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-lg shadow-lg shadow-blue-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Create Event
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { useStrapiClient, useStrapiUser, useStrapi } from '#imports'
import { dashboardPathForBand, parseBandIdHint } from '~/utils/ui/dashboardWorkspace'

useHead({
  htmlAttrs: { class: 'fq-event-form-route' },
  bodyAttrs: { class: 'fq-event-form-route' },
})

// 1) Import Tiptap auto-imports provided by `@tiptap/vue-3`:
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import EventPosterField from '@/components/events/EventPosterField.vue'


// 2) Reactive form state
const newEvent = ref({
  title: '',
  date: '',
  time: '',
  doorsTime: '',
  venue: '',
  city: '',
  state: '',
  address: '',
  contactEmail: '',
  contactPhone: '',
  ageRestriction: '',
  facebook: '',
  twitter: '',
  instagram: '',
  youtube: '',
  tiktok: '',
  website: '',
  band: null as number | null,
  image: null as File | null,
  imageUrl: '' as string | null,
  link: '',
  ticketLabel: '',
  priceLine: '',
})

function normalizeLink(link: string): string {
  if (!link) return ''

  // Already has a protocol → return as-is
  if (/^https?:\/\//i.test(link)) return link.trim()

  // Starts with www → add https://
  if (/^www\./i.test(link)) return `https://${link.trim()}`

  // Otherwise assume https://
  return `https://www.${link.trim()}`
}


// 3) Create the Tiptap editor instance (JSON‐ready)
const editor = useEditor({
  extensions: [StarterKit, Underline],
  content: {
    type: 'doc',
    content: []
  },
  autofocus: false,
  editorProps: {
    attributes: {
      class: 'px-2 py-2 outline-none'
    }
  }
})

// 4) Toggle functions (guard against editor being null)
const toggleBold = () => {
  if (!editor.value) return
  editor.value.chain().focus().toggleBold().run()
}
const toggleItalic = () => {
  if (!editor.value) return
  editor.value.chain().focus().toggleItalic().run()
}
const toggleUnderline = () => {
  if (!editor.value) return
  editor.value.chain().focus().toggleUnderline().run()
}

// 5) The rest of your form logic
const loading = ref(false)
const router = useRouter()
const route = useRoute()
const client = useStrapiClient()
const user = useStrapiUser()
const { update } = useStrapi()
const bands = ref<Array<{ id: number; name: string }>>([])
const dashboardBackTo = computed(() => dashboardPathForBand(newEvent.value.band ?? route.query.bandId))

// 6) Handle image file input
const handleNewEventImageUpload = (file: File) => {
  if (newEvent.value.imageUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(newEvent.value.imageUrl)
  }
  newEvent.value.image = file
  newEvent.value.imageUrl = URL.createObjectURL(file)
}

// 7) Convert “hh:mm” → Strapi “hh:mm:00.000”
const formatTime = (time: string) => {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}:00.000`
}

// 8) Submit new event to Strapi
// 8) Submit new event to Strapi
const submitNewEvent = async () => {
  if (!editor.value) {
    console.warn('Editor not ready')
    return
  }

  loading.value = true
  try {
    // --- OPTIONAL: quick pre-check so user gets instant feedback ---
    const dup = await client('/events', {
      params: {
        filters: { title: { $eq: newEvent.value.title } },
        pagination: { pageSize: 1 }
      }
    })
    if (dup?.data?.length) {
      alert('That title is already taken. Please choose another.')
      return
    }
    // ---------------------------------------------------------------

    const eventForm = new FormData()

    // ▶ Grab JSON from Tiptap for Strapi’s JSON field
    const descriptionJson = editor.value.getJSON()

    const eventData: Record<string, unknown> = {
      title: newEvent.value.title,
      description: descriptionJson,   // <— send JSON, not HTML
      date: newEvent.value.date,
      city: newEvent.value.city,
      state: newEvent.value.state,
      venue: newEvent.value.venue,
      address: newEvent.value.address,
      time: formatTime(newEvent.value.time),
      doorsTime: newEvent.value.doorsTime ? formatTime(newEvent.value.doorsTime) : undefined,
      link: normalizeLink(newEvent.value.link),
      ticketLabel: newEvent.value.ticketLabel || undefined,
      priceLine: newEvent.value.priceLine || undefined,
      users_permissions_user: user.value.id,
      contactEmail: newEvent.value.contactEmail,
      contactPhone: newEvent.value.contactPhone,
      ageRestriction: newEvent.value.ageRestriction,
      facebook: newEvent.value.facebook,
      twitter: newEvent.value.twitter,
      instagram: newEvent.value.instagram,
      youtube: newEvent.value.youtube,
      tiktok: newEvent.value.tiktok,
      website: newEvent.value.website
    }

    if (newEvent.value.band) {
      eventData.band = newEvent.value.band
    }

    eventForm.append('data', JSON.stringify(eventData))

    if (newEvent.value.image) {
      eventForm.append('files.image', newEvent.value.image)
    }

    const { data: event } = await client('/events', {
      method: 'POST',
      body: eventForm
    })

    // If a QR ID was passed via query, attach it
    if (route.query.qrId) {
      await update('qrs', route.query.qrId as string, { event: event.id })
    }

    router.push(dashboardPathForBand(newEvent.value.band))
  } catch (err: any) {
    // Nice message for Strapi's unique constraint
    const msg =
      err?.error?.message ||
      err?.data?.error?.message ||
      err?.response?.data?.error?.message ||
      (Array.isArray(err?.error?.details?.errors) && err.error.details.errors[0]?.message) ||
      'Something went wrong.'

    if (/unique|already exists|duplicate/i.test(String(msg))) {
      alert('That title is already taken. Please choose another.')
    } else {
      alert(msg)
    }

    console.error('Error creating new event:', err)
  } finally {
    loading.value = false
  }
}

// 9) On mount, fetch bands for the dropdown
onMounted(async () => {
  try {
    const response = await client('/bands', {
      params: {
        filters: {
          users_permissions_user: { id: user.value.id }
        }
      }
    })
    bands.value = response.data
    const hinted = parseBandIdHint(route.query.bandId)
    const hintedBand = hinted != null
      ? bands.value.find((band) => String(band.id) === String(hinted))
      : null
    if (hintedBand) {
      newEvent.value.band = hintedBand.id
    } else if (bands.value.length > 0) {
      newEvent.value.band = bands.value[0].id
    }
  } catch (error) {
    console.error('Error fetching bands:', error)
  }
})
</script>

<style scoped>
/* Form Section */
.form-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  overflow: clip;
}

.form-section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.form-section-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.form-section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
}

.form-section-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.125rem;
}

.form-section-content {
  padding: 1.5rem;
}

/* Form Field */
.form-field {
  margin-bottom: 1rem;
}

.form-field:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  color: white;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-input:focus {
  outline: none;
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input::-webkit-calendar-picker-indicator {
  filter: invert(1);
}

/* Editor */
.editor-wrapper {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  overflow: clip;
}

.editor-toolbar {
  display: flex;
  gap: 0.25rem;
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.editor-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.editor-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.editor-btn.active {
  background: rgba(99, 102, 241, 0.3);
  border-color: rgba(99, 102, 241, 0.5);
  color: white;
}

.editor-content {
  min-height: 150px;
  padding: 1rem;
  color: white;
}

.editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 120px;
}

.editor-content :deep(.ProseMirror p) {
  margin: 0;
}

.editor-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

/* File Upload */
.file-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.file-upload-area:hover {
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(99, 102, 241, 0.05);
}

.file-upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Select styling */
select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.5)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1.25rem;
  padding-right: 2.5rem;
}

select.form-input option {
  background: #1a1a1a;
  color: white;
}
</style>

<!--
  Global html/body use height 100% plus overflow-x hidden, which makes body
  the scroller. When the editor or a date field changes height, body.scrollTop
  drops and the form jumps. This route scrolls the document instead.
-->
<style>
html.fq-event-form-route,
html.fq-event-form-route body {
  height: auto;
  min-height: 100%;
  overflow-x: clip;
  overflow-y: visible;
}
</style>
