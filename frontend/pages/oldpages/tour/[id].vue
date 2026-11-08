<template>
  <div v-if="tour" class="container mx-auto px-4 py-8">
    <div  class="relative w-full h-64 md:h-96 bg-gray-200 rounded-lg overflow-hidden mb-6">
      <img
        :src="tourImage"
        alt="Tour Hero Image"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 flex items-end mb-4 justify-center ">
        <h1 class="text-4xl md:text-6xl text-white font-bold">{{ tourTitle }}</h1>
      </div>
    </div>

    <section v-if="tour" class="mt-8">
      <h2 class="text-2xl md:text-4xl text-white font-semibold my-4">Bands</h2>
      <p v-if="tour.attributes.description" class="text-lg md:text-2xl text-white">{{ tour.attributes.bands.data[0].attributes.name }}</p>
          <h2 class="text-2xl md:text-4xl text-white font-semibold my-4">Description</h2>
          <p v-if="tour.attributes.description" class="text-lg md:text-2xl text-white">{{ tour.attributes.description }}</p>

          <h2 class="text-2xl md:text-4xl text-white font-semibold my-4">Tour Date</h2>
          <p v-if="tour.attributes.description" class="text-lg md:text-2xl text-white">From {{ tour.attributes.startDate }} - {{ tour.attributes.endDate }}</p>
          

    </section>

    <h2 class="text-3xl font-bold text-center mb-8">Upcoming Tour Events</h2>
    <div v-if="events" class="space-y-8 ">
      <div
        v-for="(event, index) in events"
        :key="index"
        class="bg-white shadow-md rounded-lg overflow-hidden"
      >
        <div class="relative h-56 overflow-hidden">
          <img
            :src="event.attributes.image.data.attributes.url"
            alt="Event image"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="p-6">
          <h2 class="text-2xl font-semibold mb-2">{{ event.attributes.title }}</h2>
          <p class="text-gray-600">{{ formatDate(event.attributes.date) }}</p>
          <p class="text-gray-600 " >{{ event.attributes.venue }}</p>
          <p class="text-gray-600">{{ event.attributes.city }}, {{ event.attributes.state }}</p>
          <p class="text-gray-600 mt-4 truncate" v-html="truncate(event.attributes.description, 150)"></p>
          <div class="mt-4">
            <NuxtLink
             :to="`/event/${event.id}`"
              target="_blank"
              class="mdc-button"
            >
              Learn More
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

import { format } from 'date-fns';

const route = useRoute();
const { findOne } = useStrapi();
const tour = ref(null);
const tourTitle = ref('');
const tourImage = ref('');
const events = ref([]);

onMounted(async () => {
  try {
    const response = await findOne('tours', route.params.id, {
      populate: {
        bands: true,
        image: true,
        events: {
          populate: 'image'
        }
      }
    });
    // Set the tour data
    tour.value = response.data;
    console.log(response.data)
    // Set the tour title
    tourTitle.value = tour.value.attributes.title;

    // Check if the tour has a main image and set it
    if (tour.value.attributes.image?.data) {
      tourImage.value = tour.value.attributes.image.data.attributes.url;
    }

    // // Check if there are events with images and set the first event's image (optional)
    // if (tour.value.attributes.events?.data[0]?.attributes.image?.data) {
    //   firstEventImage.value = tour.value.attributes.events.data[0].attributes.image.data.attributes.url;
    // }

    // Set the events array
    events.value = tour.value.attributes.events.data;
    console.log(events.value, 'this is events ')
  } catch (error) {
    console.error(error);
  }
});

const truncate = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

const formatDate = (dateStr) => {
  return format(new Date(dateStr), 'MMMM d, yyyy');
};
</script>

<style scoped>
.container {
  max-width: 1200px;
}
</style>
