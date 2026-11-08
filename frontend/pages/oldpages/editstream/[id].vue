<template>
  <div class="container mx-auto max-w-5xl px-6 mb-10">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
    </div>
    <h1 class="text-white text-3xl font-bold mb-10 text-center pt-6 md:text-left">Edit Stream</h1>
    <form @submit.prevent="submitEditStream">
      <!-- Stream Details Section -->
      <div class="bg-white mb-10">
        <div class="flex flex-col bg-[#000] p-6 mb-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
          <h2 class="font-semibold text-white text-2xl">Stream Details</h2>
        </div>
        <div class="p-6">
          <div class="mdc-text-field mb-4">
            <input type="text" id="edit-stream-title" class="mdc-text-field__input" v-model="stream.title" placeholder=" " />
            <label class="mdc-floating-label" for="edit-stream-title">Stream Title</label>
            <div class="mdc-line-ripple"></div>
          </div>

        </div>
      </div>
       <!-- Stream Image Section -->
       <div class="mt-10 bg-white">
        <div class="flex flex-col bg-[#000] p-6 mb-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
          <h2 class="font-semibold text-white text-2xl">Stream Image</h2>
        </div>
        <div v-if="stream.imageUrl" class="mb-4 mx-auto max-w-[500px]">
          <img :src="stream.imageUrl" alt="Stream Image" class="w-full h-auto rounded-lg shadow-md" />
        </div>
        <div class="mb-4 p-6">
          <input type="file" id="edit-stream-image" class="styled-file-input" @change="handleStreamImageUpload" accept="image/*" />
          <label for="edit-stream-image" class="styled-file-label w-full text-center">Choose Stream Image</label>
        </div>
      
      </div>

      <!-- Stream Music Links Section -->
      <div class="bg-white">
        <div class="flex flex-col bg-[#000] p-6 mb-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
          <h2 class="font-semibold text-white text-2xl">Music Links</h2>
        </div>
        <div class="p-6">
          <div class="mdc-text-field mb-4">
            <input type="url" id="edit-stream-applemusic" class="mdc-text-field__input" v-model="stream.applemusic" placeholder=" " />
            <label class="mdc-floating-label" for="edit-stream-applemusic">Apple Music URL</label>
            <div class="mdc-line-ripple"></div>
          </div>
          <div class="mdc-text-field mb-4">
            <input type="url" id="edit-stream-spotify" class="mdc-text-field__input" v-model="stream.spotify" placeholder=" " />
            <label class="mdc-floating-label" for="edit-stream-spotify">Spotify URL</label>
            <div class="mdc-line-ripple"></div>
          </div>
          <div class="mdc-text-field mb-4">
            <input type="url" id="edit-stream-youtubemusic" class="mdc-text-field__input" v-model="stream.youtubemusic" placeholder=" " />
            <label class="mdc-floating-label" for="edit-stream-youtubemusic">YouTube Music URL</label>
            <div class="mdc-line-ripple"></div>
          </div>
        </div>
      </div>

     

      <!-- Save Changes Button -->
      <button type="submit" class="mdc-button mb-4 w-full mt-10">Save Changes</button>
    </form>
  </div>
</template>


<script setup>


const route = useRoute();
const router = useRouter();
const client = useStrapiClient();
const loading = ref(false)
const stream = ref({
  title: '',
  description: '',
  applemusic: '',
  spotify: '',
  youtubemusic: '',
  image: null,
  imageUrl: null,
});

const fetchStream = async () => {
  const streamId = route.params.id;
  try {
    const response = await client(`/streams/${streamId}`, {
      params: {
        populate: 'img', // Populate the img field correctly
      },
    });
    
    const data = response.data;

    console.log(data); // Debugging: check the response data

    stream.value = {
      title: data.attributes.title,
      description: data.attributes.description,
      applemusic: data.attributes.applemusic,
      spotify: data.attributes.spotify,
      youtubemusic: data.attributes.youtubemusic,
      imageUrl: data.attributes.img ? data.attributes.img.data.attributes.url : null, // Correctly accessing the img URL
    };
  } catch (error) {
    console.error('Error fetching stream:', error);
  }
};

const handleStreamImageUpload = (e) => {
  const file = e.target.files[0];
  stream.value.image = file;
  stream.value.imageUrl = URL.createObjectURL(file);
};

const submitEditStream = async () => {
  const streamId = route.params.id;
  try {
    loading.value = true;
    const streamForm = new FormData();
    const streamData = {
      title: stream.value.title ?? undefined,
      description: stream.value.description ?? undefined,
      applemusic: stream.value.applemusic ?? undefined,
      spotify: stream.value.spotify ?? undefined,
      youtubemusic: stream.value.youtubemusic ?? undefined,
    };

    streamForm.append('data', JSON.stringify(streamData));

    if (stream.value.image) {
      streamForm.append('files.image', stream.value.image);
    }

    await client(`/streams/${streamId}`, {
      method: 'PUT',
      body: streamForm,
    });

    router.push('/dashboard');
  } catch (error) {
    loading.value = false;
    console.error('Error updating stream:', error);
  }
};

onMounted(() => {
  fetchStream();
});
</script>

<style scoped>
@tailwind base;
@tailwind components;
@tailwind utilities;

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
  border: 1px solid #000;
  border-radius: 10px;
  outline: none;
  width: 100%;
}

.mdc-floating-label {
  position: absolute;
  z-index: 99999;
  top: 0.75rem;
  left: 0.5rem;
  padding-left: .2em;
  padding-right: .2em;
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
}

.styled-file-label:hover {
  background-color: #3700b3;
}
</style>


