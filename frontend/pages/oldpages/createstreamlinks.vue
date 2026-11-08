<template>
  <div class="bg-[#000] w-[90vw] mx-auto">
    <div v-if="loading" class="loading-container">
  <div class="spinner"></div>
</div>
    <div class="container-mdc bg-black max-w-5xl">
      <h1 class="title text-white">Create Streaming Links</h1>

      <form class="form-group" @submit.prevent="submitForm">
        <!-- Band Title -->
        <div class="bg-[#fff] rounded-md ">
          <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-2xl text-white">Band Title</h2>
          </div>
          <div class="p-4" >
            <div class="mdc-text-field mb-4">
            <input type="text" id="bandTitle" class="mdc-text-field__input" v-model="bandTitle" placeholder=" " />
            <label class="mdc-floating-label" for="bandTitle">Band Title</label>
            <div class="mdc-line-ripple"></div>
          </div>
          </div>
        </div>

        <!-- Streaming Links Section -->
        <div class="bg-[#fff] rounded-md mt-4">
          <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-2xl text-white">Streaming Links</h2>
          </div>
          <div class="p-4">
            <!-- Apple Music -->
            <div class="mdc-text-field mb-4">
              <input type="url" id="appleMusic" class="mdc-text-field__input" v-model="appleMusic" placeholder=" " />
              <label class="mdc-floating-label" for="appleMusic">Apple Music</label>
              <div class="mdc-line-ripple"></div>
            </div>
            <!-- Spotify -->
            <div class="mdc-text-field mb-4">
              <input type="url" id="spotify" class="mdc-text-field__input" v-model="spotify" placeholder=" " />
              <label class="mdc-floating-label" for="spotify">Spotify</label>
              <div class="mdc-line-ripple"></div>
            </div>
            <!-- SoundCloud -->
            <div class="mdc-text-field mb-4">
              <input type="url" id="soundcloud" class="mdc-text-field__input" v-model="soundcloud" placeholder=" " />
              <label class="mdc-floating-label" for="soundcloud">SoundCloud</label>
              <div class="mdc-line-ripple"></div>
            </div>
            <!-- YouTube Music -->
            <div class="mdc-text-field mb-4">
              <input type="url" id="youtubeMusic" class="mdc-text-field__input" v-model="youtubeMusic" placeholder=" " />
              <label class="mdc-floating-label" for="youtubeMusic">YouTube Music</label>
              <div class="mdc-line-ripple"></div>
            </div>
          </div>
        </div>

        <!-- Image Upload Section -->
        <div class="bg-[#fff] rounded-md mt-4">
          <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-2xl text-white">Upload Image</h2>
          </div>
          <div class="p-4">
            <input type="file" required id="streamImg" class="styled-file-input" @change="handleImageUpload" accept="image/*" />
            <label for="streamImg" class="styled-file-label w-full text-center">Choose Image</label>
            <div v-if="imgUrl" class="mt-4">
              <img :src="imgUrl" alt="Stream Image" class="w-full h-auto rounded-lg shadow-md" />
            </div>
          </div>
        </div>

        <button type="submit" class="mdc-button w-full mt-10">Create Streaming Links</button>
      </form>
    </div>
  </div>
</template>

<script setup>


const router = useRouter();
const client = useStrapiClient();
const user = useStrapiUser();

// Define reactive variables for form inputs
const bandTitle = ref('');
const appleMusic = ref('');
const spotify = ref('');
const soundcloud = ref('');
const youtubeMusic = ref('');
const img = ref(null);
const imgUrl = ref(null);
const loading = ref(false)

// Function to handle image upload
const handleImageUpload = (event) => {
  const file = event.target.files[0];
  img.value = file;
  imgUrl.value = URL.createObjectURL(file);
};

// Function to handle form submission
const submitForm = async () => {
  try {
    loading.value = true
    console.log('creating stream')
    // Create the form object with streaming link values
    const form = {
      bandTitle: bandTitle.value || null,
      applemusic: appleMusic.value || null,
      spotify: spotify.value || null,
      soundcloud: soundcloud.value || null,
      youtubemusic: youtubeMusic.value || null,
      users_permissions_user: user.value.id || null,
    };

    // Remove null or empty values from the form object
    for (const key in form) {
      if (!form[key]) {
        delete form[key];
      }
    }

    // Initialize FormData
    const formData = new FormData();
    formData.append('data', JSON.stringify(form));

    // Append the image file if it exists
    if (img.value) {
      formData.append('files.img', img.value);
    }

    // Use Strapi client to create a new stream entry
    const { data: streamData } = await client('/streams', {
      method: 'POST',
      body: formData,
    });

    console.log('Streaming links created successfully:');
    router.push('/dashboard'); // Redirect to dashboard or another page
  } catch (error) {
    loading.value = false;
    console.error('Error creating streaming links:', error);
  }
};
</script>

<style >
@tailwind base;
@tailwind components;
@tailwind utilities;

.container-mdc {
  margin: 1rem auto;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #fff;
}

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
