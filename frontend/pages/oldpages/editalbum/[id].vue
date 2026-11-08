<template>
  <div class="container mx-auto px-6">
    <!-- Loading Spinner -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
    </div>

    <!-- Form Title -->
    <h1 class="text-white text-2xl font-bold py-6">Edit Album</h1>

    <!-- Album Type Selection -->
    <div class="form-group">
      <label class="block text-white font-bold mb-2">Album Type:</label>
      <div class="flex items-center mb-4">
        <!-- Adjusted labels and inputs -->
        <label class="flex items-center text-white mr-4">
          <input
            type="radio"
            value="custom"
            v-model="album.type"
            class="mr-2"
          />
          Custom/Hosted Album
        </label>

        <label class="flex items-center text-white">
          <input
            type="radio"
            value="streaming"
            v-model="album.type"
            class="mr-2"
          />
          Streaming Embed
        </label>
      </div>
    </div>

    <!-- Form Start -->
    <form @submit.prevent="submitEditAlbum">
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
              id="edit-album-title"
              class="mdc-text-field__input"
              v-model="album.title"
              placeholder=" "
              required
            />
            <label class="mdc-floating-label" for="edit-album-title">Album Title</label>
            <div class="mdc-line-ripple"></div>
          </div>

          <!-- Release Date -->
          <div class="mdc-text-field mb-4">
            <input
              type="date"
              id="edit-album-releaseDate"
              class="mdc-text-field__input"
              v-model="album.releaseDate"
              placeholder=" "
              required
            />
            <label class="mdc-floating-label" for="edit-album-releaseDate">Release Date</label>
            <div class="mdc-line-ripple"></div>
          </div>

          <!-- Album Cover Upload -->
          <div class="mb-4">
            <input
              type="file"
              id="edit-album-cover"
              class="styled-file-input"
              @change="handleAlbumCoverUpload"
              accept="image/*"
            />
            <label for="edit-album-cover" class="styled-file-label">Choose Album Cover</label>
          </div>
          <div v-if="album.imageUrl" class="mb-4">
            <img
              :src="album.imageUrl"
              alt="Album Cover"
              class="w-full h-auto rounded-lg shadow-md"
            />
          </div>

          <!-- Band Selection -->
          <div class="mdc-text-field mb-4">
            <select v-model="album.band" class="mdc-text-field__input" required>
              <option value="" disabled>Select Band</option>
              <option v-for="band in bands" :key="band.id" :value="band.id">{{
                band.attributes.name
              }}</option>
            </select>
            <label class="mdc-floating-label" for="edit-album-band">Select Band</label>
            <div class="mdc-line-ripple"></div>
          </div>
        </div>
      </div>

      <!-- Custom/Hosted Album Fields -->
      <div v-if="album.type === 'custom'">
        <!-- Add Songs Section -->
        <div class="mt-10">
          <div
            class="flex flex-col p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0"
          >
            <h2 class="text-white font-semibold text-xl">Edit Songs</h2>
          </div>
          <div class="bg-white p-4">
            <div v-for="(song, index) in album.songs" :key="index" class="mb-4">
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
                  :id="'song-file-' + index"
                  class="styled-file-input"
                  @change="handleSongFileUpload($event, index)"
                  accept="audio/*"
                />
                <label :for="'song-file-' + index" class="styled-file-label">Choose Song File</label>
              </div>

              <!-- Optionally display existing song file link -->
              <div v-if="song.fileUrl" class="mb-2">
                <audio controls :src="song.fileUrl"></audio>
              </div>

              <button type="button" class="mdc-button mb-2 w-full" @click="removeSong(index)">Remove Song</button>
            </div>
            <button type="button" class="mdc-button mb-4" @click="addSong">Add Another Song</button>
          </div>
        </div>
      </div>

      <!-- Streaming Embed Fields -->
      <div v-if="album.type === 'streaming'">
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
            <select v-model="album.streamingService" class="mdc-text-field__input" required>
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
              v-model="album.albumUrl"
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
              v-model="album.albumId"
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
              v-model="album.embedUrl"
              placeholder=" "
            />
            <label class="mdc-floating-label" for="embed-url">Embed URL (optional)</label>
            <div class="mdc-line-ripple"></div>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="mdc-button mb-4 w-full mt-10">Save Changes</button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const route = useRoute();
const router = useRouter();
const client = useStrapiClient();
const user = useStrapiUser();
const { findOne, update } = useStrapi();
const loading = ref(false);

// Initialize album object
const album = ref({
  type: '', // 'custom' or 'streaming'
  title: '',
  releaseDate: '',
  cover: null,
  imageUrl: null,
  band: null,
  songs: [{ title: '', file: null, fileUrl: null }],
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

// Fetch album data
const fetchAlbum = async () => {
  const albumId = route.params.id;
  console.log('Getting album with ID:', albumId);
  try {
    const response = await findOne('albums', albumId, {
      populate: ['cover', 'band', 'songs', 'songs.file'],
    });

    if (response.data) {
      const attributes = response.data.attributes;
      album.value = {
        type: attributes.type ?? '',
        title: attributes.title ?? '',
        releaseDate: attributes.releaseDate ?? '',
        cover: null, // Will be set if user uploads new cover
        imageUrl: attributes.cover?.data?.attributes.url ?? null,
        band: attributes.band?.data?.id ?? null,
        songs: attributes.songs?.map((song) => ({
          id: song.id,
          title: song.title ?? '',
          file: null, // Will be set if user uploads new file
          fileUrl: song.file?.data?.attributes.url ?? null,
        })) ?? [],
        streamingService: attributes.streamingService ?? '',
        albumUrl: attributes.albumUrl ?? '',
        albumId: attributes.albumId ?? '',
        embedUrl: attributes.embedUrl ?? '',
        isApproved: attributes.isApproved ?? true,
      };
      console.log('Fetched album data:', album.value);
    } else {
      console.log('No data found for album ID:', albumId);
    }
  } catch (error) {
    console.error('Error fetching album:', error);
  }
};

// Fetch bands associated with the user
const fetchBands = async () => {
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
};

// Handle album cover upload
const handleAlbumCoverUpload = (e) => {
  const file = e.target.files[0];
  album.value.cover = file;
  album.value.imageUrl = URL.createObjectURL(file);
};

// Handle song file upload
const handleSongFileUpload = (e, index) => {
  const file = e.target.files[0];
  album.value.songs[index].file = file;
  album.value.songs[index].fileUrl = URL.createObjectURL(file);
};

// Add a new song input
const addSong = () => {
  album.value.songs.push({ title: '', file: null, fileUrl: null });
};

// Remove a song
const removeSong = (index) => {
  album.value.songs.splice(index, 1);
};

// Submit the edited album
const submitEditAlbum = async () => {
  const albumId = route.params.id;
  try {
    loading.value = true;
    const albumForm = new FormData();
    const albumData = {
      type: album.value.type,
      title: album.value.title,
      releaseDate: album.value.releaseDate,
      band: album.value.band,
      users_permissions_user: user.value.id,
      isApproved: album.value.isApproved,
    };

    if (album.value.type === 'custom') {
      // Custom/Hosted Album Logic
      albumData.songs = album.value.songs.map((song) => ({
        title: song.title,
      }));
    } else if (album.value.type === 'streaming') {
      // Streaming Embed Logic
      albumData.streamingService = album.value.streamingService;
      albumData.albumUrl = album.value.albumUrl;
      albumData.albumId = album.value.albumId;
      albumData.embedUrl = album.value.embedUrl;

      // Clear songs data for streaming type
      albumData.songs = [];
    }

    albumForm.append('data', JSON.stringify(albumData));

    // Append cover image if provided
    if (album.value.cover) {
      albumForm.append('files.cover', album.value.cover);
    }

    // Append song files
    album.value.songs.forEach((song, index) => {
      if (song.file) {
        albumForm.append(`files.songs[${index}].file`, song.file);
      }
    });

    // Send data to Strapi
    const response = await client(`/albums/${albumId}`, {
      method: 'PUT',
      body: albumForm,
    });

    // Redirect to dashboard after successful update
    router.push('/dashboard');
  } catch (error) {
    console.error('Error updating album:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchBands();
  await fetchAlbum();
});
</script>

<style scoped>
/* Spinner Styling */
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  border: 8px solid #f3f3f3;
  border-top: 8px solid #555;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Material Design Text Field Styling */
.mdc-text-field {
  position: relative;
  margin-bottom: 1.5rem;
  display: inline-block;
  width: 100%;
}

.mdc-text-field__input::placeholder {
  color: transparent;
}

.mdc-text-field__input:focus::placeholder {
  color: #aaa;
}

.mdc-text-field__input {
  font-size: 1rem;
  line-height: 1.5;
  padding: 0.75rem 0.5rem;
  border: 1px solid black;
  border-radius: 4px;
  outline: none;
  width: 100%;
}

.mdc-floating-label {
  position: absolute;
  z-index: 1;
  top: 0.75rem;
  left: 0.5rem;
  padding-left: 0.2em;
  padding-right: 0.2em;
  font-size: 1rem;
  background: white;
  line-height: 1;
  color: #aaa;
  pointer-events: none;
  transition: transform 0.2s, color 0.2s;
}

.mdc-text-field__input:focus + .mdc-floating-label,
.mdc-text-field__input:not(:placeholder-shown) + .mdc-floating-label {
  transform: translateY(-1.5rem);
  color: #6200ee;
}

.mdc-line-ripple {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #6200ee;
  transform: scaleX(0);
  transition: transform 0.2s;
}

.mdc-text-field__input:focus ~ .mdc-line-ripple {
  transform: scaleX(1);
}

/* Button Styling */
.mdc-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.0892857143em;
  color: #fff;
  background-color: #2C2C2C;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mdc-button:hover {
  background-color: #3700b3;
}

.mdc-button:focus {
  outline: none;
}

/* Styled File Input */
.styled-file-input {
  display: none;
}

.styled-file-label {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.0892857143em;
  color: #fff;
  background-color: #2C2C2C;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: center;
  width: 100%;
}

.styled-file-label:hover {
  background-color: #3700b3;
}

/* Additional Styles */
.form-group {
  margin-bottom: 2rem;
}

.audio-player {
  width: 100%;
}
</style>
