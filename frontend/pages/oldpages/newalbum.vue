<template>
  <div class="container mx-auto px-6">
    <!-- Loading Spinner -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
    </div>

    <!-- Form Title -->
    <h1 class="text-white text-2xl font-bold py-6">Create New Album</h1>

    <!-- Album Type Selection -->
    <div class="form-group">
      <label class="block text-white font-bold mb-2">Album Type:</label>
      <div class="flex items-center mb-4">
        <!-- Adjusted labels and inputs -->
        <label class="flex items-center text-white mr-4">
          <input
            type="radio"
            value="custom"
            v-model="newAlbum.type"
            class="mr-2"
          />
          Custom/Hosted Album
        </label>

        <label class="flex items-center text-white">
          <input
            type="radio"
            value="streaming"
            v-model="newAlbum.type"
            class="mr-2"
          />
          Streaming Embed
        </label>
      </div>
    </div>

    <!-- Debugging Output -->
    <!-- Remove this in production -->
    <p class="text-white">Selected Album Type: {{ newAlbum.type }}</p>

    <!-- Form Start -->
    <form @submit.prevent="submitNewAlbum">
      <!-- Universal Album Fields -->
      <div class="form-group">
        <div
          class="flex flex-col p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0"
        >
          <h2 class="text-white font-semibold text-xl">Album Details</h2>
        </div>

        <div class="bg-white p-4">
          <!-- Album Title -->
          <div class="mdc-text-field mb-4">
            <input
              type="text"
              id="new-album-title"
              class="mdc-text-field__input"
              v-model="newAlbum.title"
              placeholder=" "
              required
            />
            <label class="mdc-floating-label" for="new-album-title">Album Title</label>
            <div class="mdc-line-ripple"></div>
          </div>

          <!-- Release Date -->
          <div class="mdc-text-field mb-4">
            <input
              type="date"
              id="new-album-releaseDate"
              class="mdc-text-field__input"
              v-model="newAlbum.releaseDate"
              placeholder=" "
              required
            />
            <label class="mdc-floating-label" for="new-album-releaseDate">Release Date</label>
            <div class="mdc-line-ripple"></div>
          </div>

          <!-- Album Cover Upload -->
          <div class="mb-4">
            <input
              type="file"
              id="new-album-cover"
              class="styled-file-input"
              @change="handleCoverUpload"
              accept="image/*"
            />
            <label for="new-album-cover" class="styled-file-label">Choose Album Cover</label>
          </div>
          <div v-if="newAlbum.coverUrl" class="mb-4">
            <img
              :src="newAlbum.coverUrl"
              alt="Album Cover"
              class="w-full h-auto rounded-lg shadow-md"
            />
          </div>

          <!-- Band Selection -->
          <div class="mdc-text-field mb-4">
            <select v-model="newAlbum.band" class="mdc-text-field__input" required>
              <option value="" disabled>Select Band</option>
              <option v-for="band in bands" :key="band.id" :value="band.id">{{
                band.attributes.name
              }}</option>
            </select>
            <label class="mdc-floating-label" for="new-album-band">Select Band</label>
            <div class="mdc-line-ripple"></div>
          </div>
        </div>
      </div>

      <!-- Custom/Hosted Album Fields -->
      <div v-if="newAlbum.type === 'custom'">
        <!-- Add Songs Section -->
        <div class="mt-10">
          <div
            class="flex flex-col p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0"
          >
            <h2 class="text-white font-semibold text-xl">Add Songs</h2>
          </div>
          <div class="bg-white p-4">
            <div v-for="(song, index) in newAlbum.songs" :key="index" class="mb-4">
              <!-- Song Title -->
              <div class="mdc-text-field mb-2">
                <input
                  type="text"
                  :id="'song-title-' + index"
                  class="mdc-text-field__input"
                  v-model="song.title"
                  placeholder=" "
                  required
                />
                <label class="mdc-floating-label" :for="'song-title-' + index">Song Title</label>
                <div class="mdc-line-ripple"></div>
              </div>

              <!-- Song File Upload -->
              <div class="mb-2">
                <input
                  type="file"
                  required
                  :id="'song-file-' + index"
                  class="styled-file-input"
                  @change="handleSongFileUpload($event, index)"
                  accept="audio/*"
                />
                <label :for="'song-file-' + index" class="styled-file-label">Choose Song File</label>
              </div>
            </div>
            <button type="button" class="mdc-button mb-4" @click="addSong">Add Another Song</button>
          </div>
        </div>
      </div>

      <!-- Streaming Embed Fields -->
      <div v-if="newAlbum.type === 'streaming'">
        <!-- Streaming Service Details -->
        <div
          class="flex flex-col p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0"
        >
          <h2 class="text-white font-semibold text-xl">Streaming Service Details</h2>
        </div>
        <div class="bg-white p-4">
          <!-- Streaming Service Selection -->
          <div class="mdc-text-field mb-4">
            <label class="block text-gray-700">Select Streaming Service:</label>
            <select v-model="newAlbum.streamingService" class="mdc-text-field__input" required>
              <option value="" disabled>Select Streaming Service</option>
              <option v-for="service in streamingServices" :key="service" :value="service">{{
                service
              }}</option>
            </select>
          </div>

          <!-- Album URL Input -->
          <div class="mdc-text-field mb-4">
            <input
              type="text"
              id="album-url"
              class="mdc-text-field__input"
              v-model="newAlbum.albumUrl"
              placeholder=" "
              required
            />
            <label class="mdc-floating-label" for="album-url">Album URL</label>
            <div class="mdc-line-ripple"></div>
          </div>

          <!-- Album ID Input -->
          <div class="mdc-text-field mb-4">
            <input
              type="text"
              id="album-id"
              class="mdc-text-field__input"
              v-model="newAlbum.albumId"
              placeholder=" "
            />
            <label class="mdc-floating-label" for="album-id">Album ID (optional)</label>
            <div class="mdc-line-ripple"></div>
          </div>

          <!-- Embed URL Input -->
          <div class="mdc-text-field mb-4">
            <input
              type="text"
              id="embed-url"
              class="mdc-text-field__input"
              v-model="newAlbum.embedUrl"
              placeholder=" "
            />
            <label class="mdc-floating-label" for="embed-url">Embed URL (optional)</label>
            <div class="mdc-line-ripple"></div>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="mdc-button mb-4 w-full mt-10">Create Album</button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const router = useRouter();
const client = useStrapiClient();
const user = useStrapiUser();
const route = useRoute();
const { update } = useStrapi();
const loading = ref(false);

// Initialize newAlbum object
const newAlbum = ref({
  type: '', // 'custom' or 'streaming'
  title: '',
  releaseDate: '',
  cover: null,
  coverUrl: null,
  band: null,
  songs: [{ title: '', file: null }],
  // For streaming embed
  streamingService: '',
  albumUrl: '',
  albumId: '',
  embedUrl: '',
  isApproved: true,
});

const streamingServices = [
  'Spotify',
  'Apple Music',
  'YouTube Music',
  'Amazon Music',
  'Tidal',
  'Deezer',
];

const bands = ref([]);

// Handle cover image upload
const handleCoverUpload = (event) => {
  const file = event.target.files[0];
  newAlbum.value.cover = file;
  newAlbum.value.coverUrl = URL.createObjectURL(file);
};

// Handle song file upload
const handleSongFileUpload = (event, index) => {
  const file = event.target.files[0];
  newAlbum.value.songs[index].file = file;
};

// Add a new song input
const addSong = () => {
  newAlbum.value.songs.push({ title: '', file: null });
};

// Submit the new album
const submitNewAlbum = async () => {
  try {
    loading.value = true;
    const albumForm = new FormData();
    const albumData = {
      title: newAlbum.value.title,
      releaseDate: newAlbum.value.releaseDate,
      band: newAlbum.value.band,
      type: newAlbum.value.type,
      users_permissions_user: user.value.id,
      isApproved: true,
    };

    // Append cover image if provided
    if (newAlbum.value.cover) {
      albumForm.append('files.cover', newAlbum.value.cover);
    }

    if (newAlbum.value.type === 'custom') {
      // Custom/Hosted Album Logic
      if (!newAlbum.value.title || !newAlbum.value.releaseDate || !newAlbum.value.band) {
        alert('Please fill in all required fields.');
        loading.value = false;
        return;
      }

      albumData.songs = newAlbum.value.songs.map((song) => ({ title: song.title }));

      albumForm.append('data', JSON.stringify(albumData));

      // Append song files
      newAlbum.value.songs.forEach((song, index) => {
        if (song.file) {
          albumForm.append(`files.songs[${index}].file`, song.file);
        }
      });
    } else if (newAlbum.value.type === 'streaming') {
      // Streaming Embed Logic
      if (
        !newAlbum.value.streamingService ||
        !newAlbum.value.albumUrl ||
        !newAlbum.value.title ||
        !newAlbum.value.releaseDate ||
        !newAlbum.value.band
      ) {
        alert('Please fill in all required fields.');
        loading.value = false;
        return;
      }

      // Use albumId and embedUrl from user input if provided, otherwise attempt to extract/generate them
      let albumId = newAlbum.value.albumId;
      let embedUrl = newAlbum.value.embedUrl;

      if (!albumId) {
        albumId = extractAlbumId(newAlbum.value.streamingService, newAlbum.value.albumUrl);
        newAlbum.value.albumId = albumId; // Update the albumId in newAlbum
      }

      if (!embedUrl) {
        embedUrl = generateEmbedUrl(newAlbum.value.streamingService, albumId);
        newAlbum.value.embedUrl = embedUrl; // Update the embedUrl in newAlbum
      }

      albumData.streamingService = newAlbum.value.streamingService;
      albumData.albumUrl = newAlbum.value.albumUrl;
      albumData.albumId = albumId;
      albumData.embedUrl = embedUrl;

      albumForm.append('data', JSON.stringify(albumData));
    } else {
      alert('Please select an album type.');
      loading.value = false;
      return;
    }

    // Send data to Strapi
    const response = await client('/albums', {
      method: 'POST',
      body: albumForm,
    });

    const album = response.data;

    // Associate with QR code if applicable
    if (route.query.qrId) {
      await update('qrs', route.query.qrId, {
        album: album.id,
      });
    }

    // Redirect to dashboard after successful creation
    router.push('/dashboard');
  } catch (error) {
    console.error('Error creating new album:', error);
  } finally {
    loading.value = false;
  }
};

// Extract Album ID based on the streaming service
function extractAlbumId(service, url) {
  let match;
  switch (service) {
    case 'Spotify':
      match = url.match(/album\/([\w\d]+)/);
      return match ? match[1] : null;
    // Add cases for other services
    default:
      return null;
  }
}

// Generate Embed URL based on the streaming service
function generateEmbedUrl(service, albumId) {
  switch (service) {
    case 'Spotify':
      return `https://open.spotify.com/embed/album/${albumId}`;
    // Add cases for other services
    default:
      return '';
  }
}

// Fetch bands associated with the user
onMounted(async () => {
  try {
    const response = await client('/bands', {
      params: {
        filters: {
          users_permissions_user: {
            id: user.value.id,
          },
        },
        populate: ['users_permissions_user'],
      },
    });
    bands.value = response.data;
  } catch (error) {
    console.error('Error fetching bands associated with the user:', error);
  }
});
</script>

<style scoped>
/* Add any additional styling if needed */
</style>
