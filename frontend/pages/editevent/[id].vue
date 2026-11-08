<template>
  <div class="min-h-screen bg-black pt-[var(--header-height)]">
    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <span class="text-white/70 text-sm">Saving changes...</span>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-6 py-10">
      <!-- Header -->
      <div class="mb-10">
        <NuxtLink to="/dashboard" class="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mb-4 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </NuxtLink>
        <h1 class="text-3xl md:text-4xl font-bold text-white">Edit Event</h1>
        <p class="text-white/60 mt-2">Update your event details</p>
      </div>

      <form @submit.prevent="submitEditEvent" class="space-y-6">
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
              <label for="edit-event-title" class="form-label">Event Title</label>
              <input
                type="text"
                id="edit-event-title"
                v-model="event.title"
                class="form-input"
                placeholder="Enter event title"
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
                <label for="edit-event-date" class="form-label">Event Date</label>
                <input
                  type="date"
                  id="edit-event-date"
                  v-model="event.date"
                  class="form-input"
                />
              </div>

              <div class="form-field">
                <label for="edit-event-time" class="form-label">Event Time</label>
                <input
                  type="time"
                  id="edit-event-time"
                  v-model="event.time"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-field">
              <label for="edit-event-doors-time" class="form-label">Doors Time</label>
              <input
                type="time"
                id="edit-event-doors-time"
                v-model="event.doorsTime"
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
              <label for="edit-event-venue" class="form-label">Venue Name</label>
              <input
                type="text"
                id="edit-event-venue"
                v-model="event.venue"
                class="form-input"
                placeholder="e.g., The Fillmore"
              />
            </div>

            <div class="form-field">
              <label for="edit-event-address" class="form-label">Street Address</label>
              <input
                type="text"
                id="edit-event-address"
                v-model="event.address"
                class="form-input"
                placeholder="123 Main Street"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label for="edit-event-city" class="form-label">City</label>
                <input
                  type="text"
                  id="edit-event-city"
                  v-model="event.city"
                  class="form-input"
                  placeholder="City"
                />
              </div>

              <div class="form-field">
                <label for="edit-event-state" class="form-label">State</label>
                <input
                  type="text"
                  id="edit-event-state"
                  v-model="event.state"
                  class="form-input"
                  placeholder="State"
                />
              </div>
            </div>

            <div class="form-field">
              <label for="edit-event-age-restriction" class="form-label">Age Restriction</label>
              <input
                type="text"
                id="edit-event-age-restriction"
                v-model="event.ageRestriction"
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
              input-id="edit-event-image"
              :preview-url="event.imageUrl || ''"
              :alt="event.title ? `${event.title} poster` : 'Event poster'"
              @select="handleEventImageUpload"
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
              <label for="edit-event-link" class="form-label">Ticket Link</label>
              <input
                type="text"
                id="edit-event-link"
                v-model="event.link"
                @blur="event.link = normalizeLink(event.link)"
                class="form-input"
                placeholder="https://tickets.example.com"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-field">
                <label for="edit-event-ticket-label" class="form-label">Button Label</label>
                <input
                  type="text"
                  id="edit-event-ticket-label"
                  v-model="event.ticketLabel"
                  class="form-input"
                  placeholder="e.g., Get Tickets"
                />
              </div>

              <div class="form-field">
                <label for="edit-event-price-line" class="form-label">Price Info</label>
                <input
                  type="text"
                  id="edit-event-price-line"
                  v-model="event.priceLine"
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
                <label for="edit-event-email" class="form-label">Contact Email</label>
                <input
                  type="email"
                  id="edit-event-email"
                  v-model="event.contactEmail"
                  class="form-input"
                  placeholder="contact@example.com"
                />
              </div>

              <div class="form-field">
                <label for="edit-event-phone" class="form-label">Contact Phone</label>
                <input
                  type="tel"
                  id="edit-event-phone"
                  v-model="event.contactPhone"
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
                <label for="edit-event-facebook" class="form-label">Facebook</label>
                <input
                  type="url"
                  id="edit-event-facebook"
                  v-model="event.facebook"
                  @blur="event.facebook = normalizeLink(event.facebook)"
                  class="form-input"
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div class="form-field">
                <label for="edit-event-instagram" class="form-label">Instagram</label>
                <input
                  type="url"
                  id="edit-event-instagram"
                  v-model="event.instagram"
                  @blur="event.instagram = normalizeLink(event.instagram)"
                  class="form-input"
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div class="form-field">
                <label for="edit-event-twitter" class="form-label">Twitter / X</label>
                <input
                  type="url"
                  id="edit-event-twitter"
                  v-model="event.twitter"
                  @blur="event.twitter = normalizeLink(event.twitter)"
                  class="form-input"
                  placeholder="https://twitter.com/..."
                />
              </div>

              <div class="form-field">
                <label for="edit-event-tiktok" class="form-label">TikTok</label>
                <input
                  type="url"
                  id="edit-event-tiktok"
                  v-model="event.tiktok"
                  @blur="event.tiktok = normalizeLink(event.tiktok)"
                  class="form-input"
                  placeholder="https://tiktok.com/..."
                />
              </div>

              <div class="form-field">
                <label for="edit-event-youtube" class="form-label">YouTube</label>
                <input
                  type="url"
                  id="edit-event-youtube"
                  v-model="event.youtube"
                  @blur="event.youtube = normalizeLink(event.youtube)"
                  class="form-input"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div class="form-field">
                <label for="edit-event-website" class="form-label">Website</label>
                <input
                  type="url"
                  id="edit-event-website"
                  v-model="event.website"
                  @blur="event.website = normalizeLink(event.website)"
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
              <label for="edit-event-band" class="form-label">Select Artist</label>
              <select v-model="event.band" id="edit-event-band" class="form-input">
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
          Save Changes
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const client = useStrapiClient();
const user = useStrapiUser();
const loading = ref(false);

import { parse, format } from "date-fns";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import EventPosterField from "@/components/events/EventPosterField.vue";

const event = ref({
  title: "",
  description: {} as any, // ← use `any` so it can hold ProseMirror JSON
  date: "",
  time: "",
  doorsTime: "",
  state: "",
  city: "",
  address: "",
  venue: "",
  link: "",
  ticketLabel: "",
  priceLine: "",
  contactEmail: "",
  contactPhone: "",
  ageRestriction: "",
  facebook: "",
  twitter: "",
  instagram: "",
  youtube: "",
  tiktok: "",
  website: "",
  image: null as File | null,
  imageUrl: null as string | null,
  band: null as number | null,
});

function normalizeLink(link: string): string {
  if (!link) return "";

  // Already has a protocol → return as-is
  if (/^https?:\/\//i.test(link)) return link.trim();

  // Starts with www → add https://
  if (/^www\./i.test(link)) return `https://${link.trim()}`;

  // Otherwise assume https://
  return `https://www.${link.trim()}`;
}

// Toggle Bold / Italic / Underline helpers
const toggleBold = () => {
  if (!editor.value) return;
  editor.value.chain().focus().toggleBold().run();
};
const toggleItalic = () => {
  if (!editor.value) return;
  editor.value.chain().focus().toggleItalic().run();
};
const toggleUnderline = () => {
  if (!editor.value) return;
  editor.value.chain().focus().toggleUnderline().run();
};

// 1) Initialize Tiptap editor (starts empty; we’ll set content when fetched)
const editor = useEditor({
  extensions: [StarterKit, Underline],
  content: "",
  autofocus: false,
  editorProps: {
    attributes: {
      class: "px-2 py-2 outline-none",
    },
  },
});

const bands = ref<Array<{ id: number; name: string }>>([]);
const selectedBandId = ref(null as number | null);

const fetchEvent = async () => {
  const eventId = route.params.id as string;
  try {
    // — Use response.data.attributes, not response.data.data.attributes —
    const { data } = await client(`/events/${eventId}`, {
      params: {
        populate: {
          band: { populate: "*" },
          image: { populate: "*" },
        },
      },
    });
    // `data` is now the Strapi object with an `attributes` field
    const attrs = data.attributes;

    selectedBandId.value = attrs.band?.data?.id || null;

    event.value = {
      title: attrs.title,
      description: attrs.description || "",
      date: attrs.date,
      time: attrs.time ? attrs.time.slice(0, 5) : "",
      doorsTime: attrs.doorsTime ? attrs.doorsTime.slice(0, 5) : "",
      state: attrs.state,
      city: attrs.city,
      address: attrs.address,
      venue: attrs.venue,
      contactEmail: attrs.contactEmail,
      contactPhone: attrs.contactPhone,
      ageRestriction: attrs.ageRestriction || "",
      link: attrs.link,
      ticketLabel: attrs.ticketLabel || "",
      priceLine: attrs.priceLine || "",
      facebook: attrs.facebook || "",
      twitter: attrs.twitter || "",
      instagram: attrs.instagram || "",
      youtube: attrs.youtube || "",
      tiktok: attrs.tiktok || "",
      website: attrs.website || "",
      image: null,
      imageUrl: attrs.image?.data?.attributes?.url || null,
      band: attrs.band?.data?.id || null,
    };
  } catch (error) {
    console.error("Error fetching event:", error);
  }
};

const handleEventImageUpload = (file: File) => {
  if (!file) return;
  if (event.value.imageUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(event.value.imageUrl);
  }
  event.value.image = file;
  event.value.imageUrl = URL.createObjectURL(file);
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  try {
    const parsedTime = parse(timeStr, "HH:mm", new Date());
    return format(parsedTime, "HH:mm:ss.SSS");
  } catch (error) {
    console.error("Error parsing/formatting time:", error);
    return timeStr;
  }
};

const submitEditEvent = async () => {
  const eventId = route.params.id as string;
  try {
    loading.value = true;
    const eventForm = new FormData();

    // — Always pull from Tiptap, not from event.value.description —
    const descriptionJson = editor.value?.getJSON() || {
      type: "doc",
      content: [],
    };

    const eventData: Record<string, unknown> = {
      title: event.value.title || undefined,
      description: descriptionJson, // ← now sending JSON
      date: event.value.date || undefined,
      time: formatTime(event.value.time) || undefined,
      doorsTime: event.value.doorsTime ? formatTime(event.value.doorsTime) : undefined,
      city: event.value.city || undefined,
      state: event.value.state || undefined,
      venue: event.value.venue || undefined,
      address: event.value.address || undefined,
      contactPhone: event.value.contactPhone || undefined,
      contactEmail: event.value.contactEmail || undefined,
      ageRestriction: event.value.ageRestriction || undefined,
      link: normalizeLink(event.value.link) || undefined,
      ticketLabel: event.value.ticketLabel || undefined,
      priceLine: event.value.priceLine || undefined,
      facebook: event.value.facebook || undefined,
      twitter: event.value.twitter || undefined,
      instagram: event.value.instagram || undefined,
      youtube: event.value.youtube || undefined,
      tiktok: event.value.tiktok || undefined,
      website: event.value.website || undefined,
      users_permissions_user: user.value.id,
    };

    if (event.value.band) {
      eventData.band = event.value.band;
    }

    eventForm.append("data", JSON.stringify(eventData));

    if (event.value.image) {
      eventForm.append("files.image", event.value.image);
    }

    await client(`/events/${eventId}`, {
      method: "PUT",
      body: eventForm,
    });

    router.push("/dashboard");
  } catch (error) {
    loading.value = false;
    console.error("Error updating event:", error);
  }
};

onMounted(async () => {
  try {
    // Fetch bands for dropdown
    const response = await client("/bands", {
      params: {
        filters: {
          users_permissions_user: { id: user.value.id },
        },
        populate: ["users_permissions_user"],
      },
    });
    console.log("this is the response ", response.data);
    bands.value = response.data.map((b: any) => ({
      id: b.id,
      name: b.name,
    }));
  } catch (error) {
    console.error("Error fetching bands:", error);
  }

  await fetchEvent();
});

// 2) Once `event.description` is fetched, push into Tiptap
watch(
  () => event.value.description,
  (newDesc) => {
    if (editor.value && newDesc !== undefined) {
      editor.value.commands.setContent(newDesc, false);
    }
  }
);

// 3) Removed the “editor.on('update')” watcher entirely
</script>

<style scoped>
/* Form Section */
.form-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  overflow: hidden;
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
  overflow: hidden;
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
