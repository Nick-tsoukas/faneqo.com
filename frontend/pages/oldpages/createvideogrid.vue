<template>
  <div class="bg-[#000] w-[90vw] mx-auto">
    <!-- Video Creation Form -->
    <div class="mx-auto bg-black max-w-5xl">
      <h1 class="text-3xl mb-6 font-bold text-white">Create Video</h1>

      <form class="form-group" @submit.prevent="submitForm">
        <!-- Video Title -->
        <div class="bg-[#fff] rounded-md">
          <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-2xl text-white">Video Title</h2>
          </div>
          <div class="p-4">
            <div class="mdc-text-field mb-4">
              <input
                type="text"
                id="videoTitle"
                class="mdc-text-field__input"
                v-model="videoTitle"
                placeholder=" "
                required
              />
              <label class="mdc-floating-label" for="videoTitle">Video Title</label>
              <div class="mdc-line-ripple"></div>
            </div>
          </div>
        </div>

        <!-- Band Selection -->
        <div class="bg-[#fff] rounded-md mt-4">
          <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-2xl text-white">Select Band</h2>
          </div>
          <div class="p-4">
            <div class="mdc-text-field mb-4">
              <select v-model="selectedBand" class="mdc-text-field__input" required>
                <option value="" disabled>Select Band</option>
                <option v-for="band in bands" :key="band.id" :value="band.id">
                  {{ band.attributes.name }}
                </option>
              </select>
              <label class="mdc-floating-label" for="selectedBand">Band</label>
              <div class="mdc-line-ripple"></div>
            </div>
          </div>
        </div>

        <!-- Embed YouTube Videos Section -->
        <div class="bg-[#fff] rounded-md mt-4">
          <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-2xl text-white">Embed YouTube Video Links</h2>
          </div>
          <div class="p-4">
            <div v-for="(youtubeVideo, index) in youtubevideos" :key="index" class="mb-4 p-4 rounded-md">
              <div class="mdc-text-field mb-4">
                <input
                  type="url"
                  class="mdc-text-field__input"
                  v-model="youtubeVideo.youtube"
                  placeholder=" "
                  required
                />
                <label class="mdc-floating-label">YouTube Video URL</label>
                <div class="mdc-line-ripple"></div>
              </div>

              <!-- Display YouTube Thumbnail -->
              <div v-if="getYouTubeVideoId(youtubeVideo.youtube)">
                <img
                  :src="`https://img.youtube.com/vi/${getYouTubeVideoId(youtubeVideo.youtube)}/hqdefault.jpg`"
                  alt="YouTube Thumbnail"
                  class="w-full h-auto mb-4"
                />
              </div>

              <button type="button" class="mdc-button bg-red-600" @click="removeYouTubeVideo(index)">Remove</button>
            </div>
            <button type="button" class="mdc-button bg-blue-600" @click="addYouTubeVideo">Add New YouTube Video</button>
          </div>
        </div>

        <!-- Band Image Section -->
        <div class="bg-[#fff] rounded-md mt-4">
          <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-2xl text-white">Upload Band Image</h2>
          </div>
          <div class="p-4">
            <input type="file" @change="handleImageUpload" class="styled-file-input" id="fileUpload" />
            <label for="fileUpload" class="styled-file-label">Upload Band Image</label>
            <div v-if="imgUrl" class="mt-4">
              <img :src="imgUrl" alt="Preview" class="w-48 h-48 object-cover rounded-lg" />
            </div>
          </div>
        </div>

        <!-- Band Information Section -->
        <div class="bg-[#fff] rounded-md mt-4">
          <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-2xl text-white">Band Information</h2>
          </div>
          <div class="p-4">
            <div class="mdc-text-field mb-4">
              <input
                type="text"
                id="bandname"
                class="mdc-text-field__input"
                v-model="bandname"
                placeholder=" "
                required
              />
              <label class="mdc-floating-label" for="bandname">Band Name</label>
              <div class="mdc-line-ripple"></div>
            </div>
            <div class="mdc-text-field mb-4">
              <input
                type="url"
                id="bandlink"
                class="mdc-text-field__input"
                v-model="bandlink"
                placeholder=" "
              />
              <label class="mdc-floating-label" for="bandlink">Band Link</label>
              <div class="mdc-line-ripple"></div>
            </div>
          </div>
        </div>

        <button type="submit" class="mdc-button w-full mt-10">Create Video</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';


const router = useRouter();
const client = useStrapiClient();
const user = useStrapiUser();

// Form variables
const videoTitle = ref('');
const bandname = ref('');
const bandlink = ref('');
const youtubevideos = ref([{ youtube: '' }]); // Initialize with one empty embed
const img = ref(null);
const imgUrl = ref(null);
const loading = ref(false);

// Bands data
const bands = ref([]);
const selectedBand = ref('');

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

// Fetch bands on component mount
onMounted(() => {
  fetchBands();
});

// Add a new YouTube video field
const addYouTubeVideo = () => {
  youtubevideos.value.push({ youtube: '' });
};

// Remove a YouTube video field
const removeYouTubeVideo = (index) => {
  youtubevideos.value.splice(index, 1);
};

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|\/u\/\w\/|embed\/|watch\?v=|\&v=|youtube\.com\/v\/|youtube\.com\/embed\/|youtube\.com\/watch\?v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Image upload handler
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  img.value = file;
  imgUrl.value = URL.createObjectURL(file);
};

// Submit form and send data to Strapi
const submitForm = async () => {
  try {
    loading.value = true;

    // Prepare the form object for video data
    const form = {
      title: videoTitle.value || null,
      bandname: bandname.value || null,
      bandlink: bandlink.value || null,
      mediayoutube: youtubevideos.value
        .filter((video) => video.youtube.trim() !== '')
        .map((video) => ({
          videoid: getYouTubeVideoId(video.youtube.trim()),
        })),
      users_permissions_users: user.value.id,
      band: selectedBand.value || null,
    };

    // Initialize FormData for files (band image)
    const formData = new FormData();
    formData.append('data', JSON.stringify(form));

    if (img.value) {
      formData.append('files.bandImg', img.value); // Use the correct field name for the image
    }

    // Submit the form
    const { data: videoData } = await client('/videos', {
      method: 'POST',
      body: formData,
    });

    console.log('Video created successfully:', videoData);
    router.push('/dashboard'); // Redirect after successful submission
  } catch (error) {
    loading.value = false;
    console.error('Error creating video:', error);
  }
};
</script>

<style scoped>
/* Spinner Styling */
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
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
  border: 1px solid #ccc;
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
