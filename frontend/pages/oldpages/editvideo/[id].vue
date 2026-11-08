<template>
  <div class="bg-[#000] w-[90vw] mx-auto">
    <div class="mx-auto bg-black max-w-5xl">
      <h1 class="text-3xl mb-6 font-bold text-white">Edit Video</h1>

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
              />
              <label class="mdc-floating-label" for="videoTitle">Video Title</label>
              <div class="mdc-line-ripple"></div>
            </div>
          </div>
        </div>

        <!-- Embed YouTube Videos Section -->
        <div class="bg-[#fff] rounded-md mt-4">
          <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-2xl text-white">Edit YouTube Video Links</h2>
          </div>
          <div class="p-4">
            <div v-for="(youtubeVideo, index) in youtubevideos" :key="index" class="mb-4 p-4 rounded-md">
              <div class="mdc-text-field mb-4">
                <input
                  type="url"
                  class="mdc-text-field__input"
                  v-model="youtubeVideo.youtube" 
                  placeholder="Paste YouTube Video URL"
                  required
                />
                <label class="mdc-floating-label">YouTube Video URL</label>
                <div class="mdc-line-ripple"></div>
              </div>
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
          <div class="p-4">
            <input type="file" @change="handleImageUpload" class="styled-file-input" id="fileUpload" />
            <label for="fileUpload" class="styled-file-label">Upload Band Image</label>
            <div v-if="imgUrl || existingImgUrl" class="mt-4">
              <img :src="imgUrl || existingImgUrl" alt="Preview" class="w-48 h-48 object-cover rounded-lg" />
            </div>
          </div>
        </div>

        <!-- Band Information Section -->
        <div class="bg-[#fff] rounded-md mt-4">
          <div class="p-4">
            <div class="mdc-text-field mb-4">
              <input
                type="text"
                id="bandname"
                class="mdc-text-field__input"
                v-model="bandname"
                placeholder=" "
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

        <button type="submit" class="mdc-button w-full mt-10">Save Changes</button>
      </form>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const client = useStrapiClient();

const videoTitle = ref('');
const bandname = ref('');
const bandlink = ref('');
const youtubevideos = ref([]);
const img = ref(null);
const imgUrl = ref(null);
const existingImgUrl = ref(null);

// Load the existing video data for editing
const loadVideoData = async () => {
  try {
    const { data } = await client(`/videos/${route.params.id}`, { method: 'GET', params: { populate: '*' } });

    videoTitle.value = data.attributes.title;
    bandname.value = data.attributes.bandname;
    bandlink.value = data.attributes.bandlink;

    // Update attribute names to match the new schema
    if (data.attributes.mediayoutube) {
      youtubevideos.value = data.attributes.mediayoutube.map((video) => ({ youtube: video.videoid }));
    } else {
      youtubevideos.value = [];
    }
    console.log("Loaded youtube videos:", youtubevideos.value); // Debug log

    // Adjust how you access bandImg.data
    if (data.attributes.bandImg?.data) {
      if (Array.isArray(data.attributes.bandImg.data)) {
        existingImgUrl.value = data.attributes.bandImg.data[0]?.attributes.url;
      } else {
        existingImgUrl.value = data.attributes.bandImg.data.attributes.url;
      }
    }
  } catch (error) {
    console.error('Error loading video data:', error);
  }
};

// Submit form and update video in Strapi
const submitForm = async () => {
  try {
    const form = {
      title: videoTitle.value,
      bandname: bandname.value,
      bandlink: bandlink.value,
      mediayoutube: youtubevideos.value.map(video => ({ videoid: video.youtube.trim() })),
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(form));

    if (img.value) {
      formData.append('files.bandImg', img.value);
    }

    await client(`/videos/${route.params.id}`, {
      method: 'PUT',
      body: formData,
    });

    router.push('/dashboard');
  } catch (error) {
    console.error('Error updating video:', error);
  }
};

// Image upload handler
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  img.value = file;
  imgUrl.value = URL.createObjectURL(file);
};

// Utility functions
const addYouTubeVideo = () => youtubevideos.value.push({ youtube: '' });
const removeYouTubeVideo = (index) => youtubevideos.value.splice(index, 1);
const getYouTubeVideoId = (url) => {
  const match = url.match(/(?:youtu\.be\/|v=|\/v\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return match ? match[1] : null;
};

// Load existing data when component mounts
onMounted(loadVideoData);
</script>
