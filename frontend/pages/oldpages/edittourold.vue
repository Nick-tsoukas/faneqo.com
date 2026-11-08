<template>
  <div class="container-mdc">
    <h1 class="title">Create New Tour</h1>
    <form @submit.prevent="submitNewTour">
      <div class="form-group">
        <div class="mdc-text-field mb-4">
          <input type="text" id="new-tour-title" class="mdc-text-field__input" v-model="newTour.title" placeholder=" " />
          <label class="mdc-floating-label" for="new-tour-title">Tour Title</label>
          <div class="mdc-line-ripple"></div>
        </div>
        <div class="mdc-text-field mb-4">
          <input type="date" id="new-tour-start-date" class="mdc-text-field__input" v-model="newTour.startDate" placeholder=" " />
          <label class="mdc-floating-label" for="new-tour-start-date">Start Date</label>
          <div class="mdc-line-ripple"></div>
        </div>
        <div class="mdc-text-field mb-4">
          <input type="date" id="new-tour-end-date" class="mdc-text-field__input" v-model="newTour.endDate" placeholder=" " />
          <label class="mdc-floating-label" for="new-tour-end-date">End Date</label>
          <div class="mdc-line-ripple"></div>
        </div>
        <div class="mb-4">
          <input type="file" id="new-tour-image" class="styled-file-input" @change="handleNewTourImageUpload" accept="image/*" />
          <label for="new-tour-image" class="styled-file-label">Choose Tour Image</label>
        </div>
        <div v-if="newTour.imageUrl" class="mb-4">
          <img :src="newTour.imageUrl" alt="Tour Image" class="w-full h-auto rounded-lg shadow-md" />
        </div>
        <div class="mdc-text-field mb-4">
          <select v-model="newTour.bands"  class="mdc-text-field__input">
            <option value="" disabled>Select Bands (Optional)</option>
            <option v-for="band in bands" :key="band.id" :value="band.id">{{ band.attributes.name }}</option>
          </select>
          <label class="mdc-floating-label" for="new-tour-bands">Select Bands</label>
          <div class="mdc-line-ripple"></div>
        </div>
        <div class="mdc-text-field mb-4">
          <select v-model="newTour.events" multiple class="mdc-text-field__input">
            <option value="" disabled>Select Events (Optional)</option>
            <option v-for="event in events" :key="event.id" :value="event.id">{{ event.attributes.title }}</option>
          </select>
          <label class="mdc-floating-label" for="new-tour-events">Select Events</label>
          <div class="mdc-line-ripple"></div>
        </div>
        <button type="submit" class="mdc-button mb-4 w-full">Create Tour</button>
      </div>
    </form>
  </div>
</template>


<script setup>


const router = useRouter();
const client = useStrapiClient();
const user = useStrapiUser();

const newTour = ref({
  title: '',
  startDate: '',
  endDate: '',
  image: null,
  imageUrl: null,
  bands: [],  // Optional association with bands
  events: [], // Optional association with events
});
const bands = ref([]);
const events = ref([]);

const handleNewTourImageUpload = (event) => {
  const file = event.target.files[0];
  newTour.value.image = file;
  newTour.value.imageUrl = URL.createObjectURL(file);
};

const submitNewTour = async () => {
  try {
    const tourForm = new FormData();
    const tourData = {
      title: newTour.value.title,
      startDate: newTour.value.startDate,
      endDate: newTour.value.endDate,
      bands: newTour.value.bands,
      events: newTour.value.events,
      users_permissions_user: user.value.id, // Associate the tour with the current user
    };

    tourForm.append('data', JSON.stringify(tourData));

    if (newTour.value.image) {
      tourForm.append('files.image', newTour.value.image);
    }

    await client('/tours', {
      method: 'POST',
      body: tourForm,
    });

    router.push('/tours'); // Redirect to tours page or any other page after successful creation
  } catch (error) {
    console.error('Error creating new tour:', error);
  }
};

onMounted(async () => {
  try {
    const bandsResponse = await client('/bands', {
      params: {
        filters: {
          users_permissions_user: {
            id: user.value.id,
          },
        },
        populate: ['users_permissions_user'], // Populate the user relation if needed
      },
    });
    bands.value = bandsResponse.data;

    const eventsResponse = await client('/events', {
      params: {
        filters: {
          users_permissions_user: {
            id: user.value.id,
          },
        },
        populate: ['users_permissions_user'], // Populate the user relation if needed
      },
    });
    events.value = eventsResponse.data;
  } catch (error) {
    console.error('Error fetching bands or events associated with the user:', error);
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
