<template>
  <div class="container mx-auto max-w-5xl px-6 mb-10">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
    </div>
    <h1 class="text-white text-3xl font-bold mb-10 text-center pt-6 md:text-left">Edit Social Links</h1>
    <form @submit.prevent="submitEditSocialPage">
      
      <!-- Social Page Title Section -->
      <div class="mb-10">
        <div class="flex flex-col bg-black p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
          <h2 class="font-semibold text-white text-2xl">Social Page Title</h2>
        </div>
        <div class="bg-white p-6">
          <div class="mdc-text-field mb-4">
            <input type="text" id="title" class="mdc-text-field__input" v-model="socialpage.title" placeholder=" " />
            <label class="mdc-floating-label" for="title">Title</label>
            <div class="mdc-line-ripple"></div>
          </div>
        </div>
      </div>

      <!-- Social Media Links Section -->
      <div class="mb-10">
        <div class="flex flex-col bg-black p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
          <h2 class="font-semibold text-white text-2xl">Social Media Links</h2>
        </div>
        <div class="bg-white p-6">
          <div class="mdc-text-field mb-4">
            <input type="url" id="facebook" class="mdc-text-field__input" v-model="socialpage.facebook" placeholder=" " />
            <label class="mdc-floating-label" for="facebook">Facebook</label>
            <div class="mdc-line-ripple"></div>
          </div>
          <div class="mdc-text-field mb-4">
            <input type="url" id="snapchat" class="mdc-text-field__input" v-model="socialpage.snapchat" placeholder=" " />
            <label class="mdc-floating-label" for="snapchat">Snapchat</label>
            <div class="mdc-line-ripple"></div>
          </div>
          <div class="mdc-text-field mb-4">
            <input type="url" id="whatsapp" class="mdc-text-field__input" v-model="socialpage.whatsapp" placeholder=" " />
            <label class="mdc-floating-label" for="whatsapp">WhatsApp</label>
            <div class="mdc-line-ripple"></div>
          </div>
          <div class="mdc-text-field mb-4">
            <input type="url" id="twitch" class="mdc-text-field__input" v-model="socialpage.twitch" placeholder=" " />
            <label class="mdc-floating-label" for="twitch">Twitch</label>
            <div class="mdc-line-ripple"></div>
          </div>
          <div class="mdc-text-field mb-4">
            <input type="url" id="tictok" class="mdc-text-field__input" v-model="socialpage.tictok" placeholder=" " />
            <label class="mdc-floating-label" for="tictok">TikTok</label>
            <div class="mdc-line-ripple"></div>
          </div>
        </div>
      </div>

      <!-- Band Selection Section -->
      <div class="mb-10">
        <div class="flex flex-col bg-black p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
          <h2 class="font-semibold text-white text-2xl">Select Band</h2>
        </div>
        <div class="bg-white p-6">
          <div class="mdc-text-field mb-4">
            <select v-model="socialpage.band" class="mdc-text-field__input">
              <option value="" disabled>Select Band</option>
              <option v-for="band in bands" :key="band.id" :value="band.id">{{ band.attributes.name }}</option>
            </select>
            <label class="mdc-floating-label" for="band">Band</label>
            <div class="mdc-line-ripple"></div>
          </div>
        </div>
      </div>

      <!-- Image Upload Section -->
      <div class="mb-10">
        <div class="flex flex-col bg-black p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
          <h2 class="font-semibold text-white text-2xl">Upload Image</h2>
        </div>
        <div class="bg-white p-6">
          <input type="file" id="img" class="styled-file-input" @change="handleImageUpload" accept="image/*" />
          <label for="img" class="styled-file-label w-full text-center">Choose Image</label>
          <div v-if="socialpage.imgUrl" class="mt-4">
            <img :src="socialpage.imgUrl" alt="Social Page Image" class="w-full h-auto rounded-lg shadow-md" />
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="mdc-button w-full mt-10">Save Changes</button>
    </form>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const client = useStrapiClient();
const loading = ref(false)
const socialpage = ref({
  title: '',
  facebook: '',
  snapchat: '',
  whatsapp: '',
  twitch: '',
  tictok: '',
  img: null,
  imgUrl: null,
  band: '',
});
const bands = ref([]);

const fetchSocialPage = async () => {
  const socialPageId = route.params.id;
  try {
    const response = await client(`/socialpages/${socialPageId}`, {
      params: { populate: 'img' }, 
    });
    const data = response.data;

    socialpage.value = {
      title: data.attributes.title,
      facebook: data.attributes.facebook,
      snapchat: data.attributes.snapchat,
      whatsapp: data.attributes.whatsapp,
      twitch: data.attributes.twitch,
      tictok: data.attributes.tictok,
      band: data.attributes.band?.data?.id || '',
      imgUrl: data.attributes.img ? data.attributes.img.data.attributes.url : null,
    };
  } catch (error) {
    console.error('Error fetching social page:', error);
  }
};

const fetchBands = async () => {
  try {
    const response = await client('/bands', {
      params: { populate: '*' },
    });
    bands.value = response.data;
  } catch (error) {
    console.error('Error fetching bands:', error);
  }
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  socialpage.value.img = file;
  socialpage.value.imgUrl = URL.createObjectURL(file);
};

const submitEditSocialPage = async () => {
  const socialPageId = route.params.id;
  try {
    loading.value = true;
    const formData = new FormData();
    const socialPageData = {
      title: socialpage.value.title || null,
      facebook: socialpage.value.facebook || null,
      snapchat: socialpage.value.snapchat || null,
      whatsapp: socialpage.value.whatsapp || null,
      twitch: socialpage.value.twitch || null,
      tictok: socialpage.value.tictok || null,
      band: socialpage.value.band || null,
    };

    for (const key in socialPageData) {
      if (!socialPageData[key]) {
        delete socialPageData[key];
      }
    }

    formData.append('data', JSON.stringify(socialPageData));

    if (socialpage.value.img) {
      formData.append('files.img', socialpage.value.img);
    }

    await client(`/socialpages/${socialPageId}`, {
      method: 'PUT',
      body: formData,
    });

    router.push('/dashboard');
  } catch (error) {
    loading.value = false;
    console.error('Error updating social page:', error);
  }
};

onMounted(() => {
  fetchSocialPage();
  fetchBands();
});
</script>

<style scoped>
.mdc-text-field__input {
  font-size: 1rem;
  line-height: 1.5;
  padding: 0.75rem 0.5rem;
  border: 1px solid #000; /* Add this line for the border */
  border-radius: 0.375rem; /* Optional: for rounded corners */
  outline: none;
  width: 100%;
  background-color: white; /* Ensure the background is white */
}

.mdc-text-field__input:focus {
  border-color: #6200ee; /* Optional: Change the border color on focus */
}

.mdc-floating-label {
  position: absolute;
  z-index: 9999;
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

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Add relevant styles for your form and components */
</style>
