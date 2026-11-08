<template>
  <div class="container mx-auto px-6">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
    </div>
    <h1 class="text-white text-3xl font-bold mb-10">Edit Tour page</h1>
    <form @submit.prevent="submitEditTour">
      <div >

        <div class="bg-white" >
          <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-white text-2xl">Event Title</h2>
          </div>
        <div class="p-6 mt-6" >
          <div class="mdc-text-field mb-4">
          <input type="text" id="edit-tour-title" class="mdc-text-field__input" v-model="tour.title" placeholder=" " />
          <label class="mdc-floating-label" for="edit-tour-title">Tour Title</label>
          <div class="mdc-line-ripple"></div>
        </div>
        </div>
        </div>

       <div class="bg-white mt-10">
        <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-white text-2xl">Event Title</h2>
          </div>
          <div class="p-6 mt-6" >
            <div class="mdc-text-field mb-4">
          <input type="date" id="edit-tour-start-date" class="mdc-text-field__input" v-model="tour.startDate" placeholder=" " />
          <label class="mdc-floating-label" for="edit-tour-start-date">Start Date</label>
          <div class="mdc-line-ripple"></div>
        </div>
        <div class="mdc-text-field mb-4">
          <input type="date" id="edit-tour-end-date" class="mdc-text-field__input" v-model="tour.endDate" placeholder=" " />
          <label class="mdc-floating-label" for="edit-tour-end-date">End Date</label>
          <div class="mdc-line-ripple"></div>
        </div>
          </div>
       </div>

       <div class="bg-white my-10">
       <div class="flex flex-col bg-[#000] p-6 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-white text-2xl">Event Image</h2>
          </div>
        <div class="mb-4 p-6">
          <input type="file" id="edit-tour-image" class="styled-file-input" @change="handleTourImageUpload" accept="image/*" />
          <label for="edit-tour-image" class="styled-file-label w-full text-center">Choose Tour Image</label>
        </div>
        <!-- <div v-if="tour.imageUrl" class="mb-4">
          <img :src="tour.imageUrl" alt="Tour Image" class="w-full h-auto rounded-lg shadow-md" />
        </div> -->
       </div>


    <div class="bg-white">
      <div class="flex flex-col bg-[#000] p-6 mt-10 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-white text-2xl">Choose Band</h2>
          </div>
      <div class="p-6" >
        <div class="mdc-text-field mt-10 ">
          <select v-model="tour.bands" class="mdc-text-field__input" multiple>
            <option v-for="band in bands" :key="band.id" :value="band.id">{{ band.attributes.name }}</option>
          </select>
          <label class="mdc-floating-label" for="edit-tour-bands">Select Bands</label>
          <div class="mdc-line-ripple"></div>
        </div>
      </div>
    </div>
        
      <div class="bg-white">
        <div class="flex flex-col bg-[#000] p-6 mt-10 border-b-2 bg-gradient-to-r from-pink-500 to-violet-500 py-6 gap-2 items-center md:flex-row md:gap-0">
            <h2 class="font-semibold text-white text-2xl">Choose Events</h2>
          </div>
        <div class="p-6">
        <div class="mdc-text-field my-10">
          <select v-model="tour.events" class="mdc-text-field__input" multiple>
            <option v-for="event in events" :key="event.id" :value="event.id">{{ event.attributes.title }}</option>
          </select>
          <label class="mdc-floating-label" for="edit-tour-events">Select Events</label>
          <div class="mdc-line-ripple"></div>
        </div>
      </div>
      </div>

        <button type="submit" class="mdc-button my-10 w-full">Save Changes</button>
      </div>
    </form>
  
  </div>

</template>

<script setup>


const route = useRoute();
const router = useRouter();
const { findOne } = useStrapi();
const user = useStrapiUser();
const client = useStrapiClient()
console.log('file is running ')
const loading = ref(false)
const tour = ref({
  title: '',
  startDate: '',
  endDate: '',
  image: null,
  imageUrl: null,
  bands: [],
  events: [],
});
const bands = ref([]);
const events = ref([]);


const fetchTour = async () => {
  const tourId = route.params.id;
  console.log('Getting tour with ID:', tourId);
  try {
    const response = await findOne('tours', tourId, {
      populate: ['bands', 'events', 'image'],
    });

    if (response.data) {
      const attributes = response.data.attributes;
      tour.value = {
        title: attributes.title,
        startDate: attributes.startDate,
        endDate: attributes.endDate,
        image: attributes.image ? attributes.image.data : null,
        imageUrl: attributes.image ? attributes.image.data.attributes.url : null,
        bands: attributes.bands.data.map(band => band.id),
        events: attributes.events.data.map(event => event.id),
      };
      console.log('Fetched tour data:', tour.value);
    } else {
      console.log('No data found for tour ID:', tourId);
    }
  } catch (error) {
    console.error('Error fetching tour:', error);
  }
};


const handleTourImageUpload = (e) => {
  const file = e.target.files[0];
  tour.value.image = file;
  tour.value.imageUrl = URL.createObjectURL(file);
};

const submitEditTour = async () => {
  const tourId = route.params.id;
  try {
    loading.value = true;
    const tourForm = new FormData();
    const tourData = {
      title: tour.value.title,
      startDate: tour.value.startDate,
      endDate: tour.value.endDate,
      bands: tour.value.bands,
      events: tour.value.events,
      users_permissions_user: user.value.id,
    };

    tourForm.append('data', JSON.stringify(tourData));

    if (tour.value.image) {
      tourForm.append('files.image', tour.value.image);
    }

    await client(`/tours/${tourId}`, {
      method: 'PUT',
      body: tourForm,
    });

    router.push('/dashboard');
  } catch (error) {
    console.error('Error updating tour:', error);
  }
};

onMounted(async () => {

  try {
    const bandsResponse = await findOne('bands', {
      params: {
        filters: {
          users_permissions_user: {
            id: user.value.id,
          },
        },
        populate: ['users_permissions_user'],
      },
    });
    bands.value = bandsResponse.data;

    const eventsResponse = await findOne('events', {
      params: {
        filters: {
          users_permissions_user: {
            id: user.value.id,
          },
        },
        populate: ['users_permissions_user'],
      },
    });
    events.value = eventsResponse.data;

    await fetchTour();
  } catch (error) {
    console.error('Error fetching bands or events:', error);
  }
});
</script>

<style scoped>
@tailwind base;
@tailwind components;
@tailwind utilities;

.container-mdc {
  max-width: 500px;
  margin: 1rem auto;
  padding: 1rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  border: 1px solid #ccc;
  border-radius: 4px;
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

.styled-select {
  width: 100%;
  padding: 0.75rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  background-color: white;
  appearance: none;
  position: relative;
  background-image: none;
}

.select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 12px;
  color: #aaa;
}

.styled-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  color: #aaa;
}
</style>
