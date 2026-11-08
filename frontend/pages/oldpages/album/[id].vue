<template>
  <div class="container mx-auto my-10 min-h-screen">
    <div v-if="albumData">
      <!-- Album Cover and Title -->
      <div
        v-if="albumData.attributes.cover"
        class="relative w-full h-64 md:h-96 bg-gray-200 rounded-lg overflow-hidden mb-8"
      >
        <img
          :src="albumData.attributes.cover.data.attributes.url"
          alt="album cover Hero Image"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-black bg-opacity-50 flex items-end p-4 rounded-b-lg">
          <h1 class="text-4xl md:text-6xl text-white font-bold">{{ albumData.attributes.title }}</h1>
        </div>
      </div>

      <!-- Conditional Content Based on Album Type -->
      <section class="w-full my-20">
        <!-- Custom Album -->
        <div v-if="albumData.attributes.type === 'custom'">
          <AudioPlayer :album="albumData" class="w-full mx-auto" />
        </div>

        <!-- Streaming Album -->
        <div v-else-if="albumData.attributes.type === 'streaming'">
          <div class="embed-container">
            <iframe
              :src="albumData.attributes.embedUrl"
              width="100%"
              height="380"
              frameborder="0"
              allowtransparency="true"
              allow="encrypted-media"
            ></iframe>
          </div>
        </div>

        <!-- Handle Other Types -->
        <div v-else>
          <p>Album type not recognized.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';


const route = useRoute();
const { findOne } = useStrapi();

const albumData = ref(null);

onMounted(async () => {
  try {
    const { data: album } = await findOne('albums', route.params.id, {
      populate: {
        songs: {
          populate: {
            file: true,
          },
        },
        cover: true, // Assuming 'cover' is a media field
      },
    });
    albumData.value = album;

    console.log('Album Data:', albumData.value);
  } catch (error) {
    console.error(error);
  }
});
</script>

<style scoped>
/* Add any necessary styles */
</style>
