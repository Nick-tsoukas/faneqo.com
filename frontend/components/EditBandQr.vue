<template>
  <div class="bg-[#000] w-[90vw] mx-auto">
    <div class="container-mdc bg-black max-w-5xl">
      <h1 class="title text-black">Edit Band Profile</h1>

      <form class="form-group" @submit.prevent="submitEditBand">
        <!-- Band Details Section -->
        <div class="bg-[#fff] rounded-md">
          <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-white text-2xl">Band Details</h2>
          </div>
          <div class="p-4">
            <!-- Band Name -->
            <div class="mdc-text-field">
              <input type="text" id="edit-band-name" class="mdc-text-field__input" v-model="band.name" placeholder=" " required />
              <label class="mdc-floating-label" for="edit-band-name">Band Name</label>
              <div class="mdc-line-ripple"></div>
            </div>

            <!-- Genre -->
            <div class="mdc-text-field">
              <input type="text" id="edit-band-genre" class="mdc-text-field__input" v-model="band.genre" placeholder=" " required />
              <label class="mdc-floating-label" for="edit-band-genre">Genre</label>
              <div class="mdc-line-ripple"></div>
            </div>

            <!-- Bio -->
            <div class="mdc-text-field">
              <textarea id="edit-band-bio" class="mdc-text-field__input" v-model="band.bio" placeholder=" " required></textarea>
              <label class="mdc-floating-label" for="edit-band-bio">Bio</label>
              <div class="mdc-line-ripple"></div>
            </div>
          </div>
        </div>

        <!-- Band Image -->
        <div class="bg-[#fff] rounded-md mt-10">
          <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h3 class="font-semibold text-white text-2xl">Upload Image</h3>
          </div>
          <div class="p-4">
            <input type="file" id="edit-band-image" class="styled-file-input" @change="handleBandImageUpload" accept="image/*" />
            <label for="edit-band-image" class="styled-file-label w-full text-center">Choose Band Image</label>
            <div v-if="band.imageUrl" class="mb-4">
              <img :src="band.imageUrl" alt="Band Image" class="w-full h-auto rounded-lg shadow-md" />
            </div>
          </div>
        </div>

        <!-- Band Members Section -->
        <div class="bg-white rounded-md mt-10">
          <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-white text-2xl">Band Members</h2>
          </div>
          <div class="p-4">
            <div v-for="(member, index) in band.members" :key="index" class="member-container">
              <div class="mdc-text-field mb-4">
                <input type="text" :id="'edit-member-name-' + index" class="mdc-text-field__input" v-model="member.name" placeholder=" " />
                <label class="mdc-floating-label" :for="'edit-member-name-' + index">Member Name</label>
                <div class="mdc-line-ripple"></div>
              </div>
              <div class="mdc-text-field mb-4">
                <input type="text" :id="'edit-instrument-' + index" class="mdc-text-field__input" v-model="member.instrument" placeholder=" " />
                <label class="mdc-floating-label" :for="'edit-instrument-' + index">Instrument</label>
                <div class="mdc-line-ripple"></div>
              </div>
              <div class="mb-4">
                <input type="file" :id="'edit-member-img-' + index" class="styled-file-input" @change="(event) => handleMemberImageUpload(event, index)" accept="image/*" />
                <label :for="'edit-member-img-' + index" class="styled-file-label w-full text-center">Choose Member Image</label>
              </div>
              <div v-if="member.imageUrl" class="mb-4">
                <img :src="member.imageUrl" alt="Member Image" class="w-full h-auto rounded-lg shadow-md" />
              </div>
              <button type="button" class="mdc-button mb-4 w-full" @click="removeMember(index)">Remove Member</button>
            </div>
            <button type="button" class="mdc-button mb-8 w-full" @click="addMember">+ Add Member</button>
          </div>
        </div>

        <!-- Social Media Links Section -->
        <div class="bg-[#fff] rounded-md mt-10">
          <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-white text-2xl">Social Media Links</h2>
          </div>
          <div class="p-4">
            <div class="mdc-text-field mb-4">
              <input type="url" id="edit-facebook" class="mdc-text-field__input" v-model="band.facebook" placeholder=" " />
              <label class="mdc-floating-label" for="edit-facebook">Facebook</label>
              <div class="mdc-line-ripple"></div>
            </div>
            <div class="mdc-text-field mb-4">
              <input type="url" id="edit-instagram" class="mdc-text-field__input" v-model="band.instagram" placeholder=" " />
              <label class="mdc-floating-label" for="edit-instagram">Instagram</label>
              <div class="mdc-line-ripple"></div>
            </div>
            <div class="mdc-text-field mb-4">
              <input type="url" id="edit-twitch" class="mdc-text-field__input" v-model="band.twitch" placeholder=" " />
              <label class="mdc-floating-label" for="edit-twitch">Twitch</label>
              <div class="mdc-line-ripple"></div>
            </div>
          </div>
        </div>

        <!-- Streaming Links Section -->
        <div class="bg-[#fff] rounded-md mt-10">
          <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-white text-2xl">Streaming Links</h2>
          </div>
          <div class="p-4">
            <div class="mdc-text-field mb-4">
              <input type="url" id="edit-appleMusic" class="mdc-text-field__input" v-model="band.appleMusic" placeholder=" " />
              <label class="mdc-floating-label" for="edit-appleMusic">Apple Music</label>
              <div class="mdc-line-ripple"></div>
            </div>
            <div class="mdc-text-field mb-4">
              <input type="url" id="edit-spotify" class="mdc-text-field__input" v-model="band.spotify" placeholder=" " />
              <label class="mdc-floating-label" for="edit-spotify">Spotify</label>
              <div class="mdc-line-ripple"></div>
            </div>
            <div class="mdc-text-field mb-4">
              <input type="url" id="edit-soundcloud" class="mdc-text-field__input" v-model="band.soundcloud" placeholder=" " />
              <label class="mdc-floating-label" for="edit-soundcloud">SoundCloud</label>
              <div class="mdc-line-ripple"></div>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <button type="submit" class="mdc-button w-full mt-10">Save Changes</button>
      </form>
    </div>
  </div>
</template>

<script setup>


const route = useRoute();
const router = useRouter();
const { findOne } = useStrapi();
const client = useStrapiClient();
const user = useStrapiUser();

const band = ref({
  name: '',
  genre: '',
  bio: '',
  bandImg: null,
  imageUrl: null,
  facebook: '',
  instagram: '',
  twitch: '',
  appleMusic: '',
  spotify: '',
  soundcloud: '',
  members: [{ name: '', instrument: '', image: null, imageUrl: null }]
});

const fetchBand = async () => {
  const bandId = route.params.id;
  try {
    const response = await findOne('bands', bandId, { populate: ['bandImg', 'members'] });
    if (response.data) {
      const attributes = response.data.attributes;
      band.value = {
        name: attributes.name,
        genre: attributes.genre,
        bio: attributes.bio,
        bandImg: attributes.bandImg ? attributes.bandImg.data : null,
        imageUrl: attributes.bandImg ? attributes.bandImg.data.attributes.url : null,
        facebook: attributes.facebook || '',
        instagram: attributes.instagram || '',
        twitch: attributes.twitch || '',
        appleMusic: attributes.appleMusic || '',
        spotify: attributes.spotify || '',
        soundcloud: attributes.soundcloud || '',
        members: attributes.members.map(member => ({
          name: member.name,
          instrument: member.instrument,
          imageUrl: member.image ? member.image.url : null,
          image: null
        }))
      };
    }
  } catch (error) {
    console.error('Error fetching band:', error);
  }
};

const handleBandImageUpload = (e) => {
  const file = e.target.files[0];
  band.value.bandImg = file;
  band.value.imageUrl = URL.createObjectURL(file);
};

const handleMemberImageUpload = (event, index) => {
  const file = event.target.files[0];
  band.value.members[index].image = file;
  band.value.members[index].imageUrl = URL.createObjectURL(file);
};

const addMember = () => {
  band.value.members.push({ name: '', instrument: '', image: null, imageUrl: null });
};

const removeMember = (index) => {
  band.value.members.splice(index, 1);
};

const submitEditBand = async () => {
  const bandId = route.params.id;
  try {
    const bandForm = new FormData();
    const bandData = {
      name: band.value.name,
      genre: band.value.genre,
      bio: band.value.bio,
      facebook: band.value.facebook,
      instagram: band.value.instagram,
      twitch: band.value.twitch,
      appleMusic: band.value.appleMusic,
      spotify: band.value.spotify,
      soundcloud: band.value.soundcloud,
      users_permissions_user: user.value.id,
      members: band.value.members.map(member => ({
        name: member.name,
        instrument: member.instrument
      }))
    };

    bandForm.append('data', JSON.stringify(bandData));

    if (band.value.bandImg) {
      bandForm.append('files.bandImg', band.value.bandImg);
    }

    band.value.members.forEach((member, index) => {
      if (member.image) {
        bandForm.append(`files.members[${index}].image`, member.image);
      }
    });

    await client(`/bands/${bandId}`, { method: 'PUT', body: bandForm });

    router.push('/dashboard');
  } catch (error) {
    console.error('Error updating band:', error);
  }
};

onMounted(fetchBand);
</script>

<style scoped>
/* Same styles as the Create Band page */

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
  background-color: #2C2C2C;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.styled-file-label:hover {
  background-color: #3700b3;
}

.member-container {
  margin: 0;
}

.mdc-text-field.mb-4 {
  margin-bottom: 1rem;
}
</style>
