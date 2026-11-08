<template>
  <div class="container mx-auto max-w-5xl px-6 mb-10">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
    </div>
    <h1 class="font-bold text-white text-3xl mb-10">Create Social Page Links</h1>
    <form @submit.prevent="submitForm">
      
      <!-- Title Section -->
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
          <input type="file" required id="img" class="styled-file-input" @change="handleImageUpload" accept="image/*" />
          <label for="img" class="styled-file-label w-full text-center">Choose Image</label>
          <div v-if="socialpage.imgUrl" class="mt-4">
            <img :src="socialpage.imgUrl" alt="Social Page Image" class="w-full h-auto rounded-lg shadow-md" />
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="mdc-button w-full font-semibold text-xl mt-10 bg-gradient-to-r from-pink-500 to-violet-500">Create Social Page Links</button>
    </form>
  </div>
</template>


<script setup>


const router = useRouter();
const client = useStrapiClient();
const user = useStrapiUser();
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
  band: '',  // To hold the selected band ID
});

const bands = ref([]);

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  socialpage.value.img = file;
  socialpage.value.imgUrl = URL.createObjectURL(file);
};

const fetchBands = async () => {
  try {
    const response = await client('/bands', user.id, {
      params: {
        populate: '*',
      },
    });
    bands.value = response.data;
    console.log(bands, 'this is bands')
  } catch (error) {
    console.error('Error fetching bands:', error);
  }
};

const submitForm = async () => {
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
      users_permissions_user: user.value.id,
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

    const { data: socialPageDataResponse } = await client('/socialpages', {
      method: 'POST',
      body: formData,
    });

    console.log('Social page created successfully:', socialPageDataResponse);
    router.push('/dashboard');
  } catch (error) {
    loading.value = false;
    console.error('Error creating social page:', error);
  }
};

onMounted(() => {
  fetchBands();
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
  background-color: #2c2c2c;
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
  background-color: #2c2c2c;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: center;
}

.styled-file-label:hover {
  background-color: #3700b3;
}
</style>
