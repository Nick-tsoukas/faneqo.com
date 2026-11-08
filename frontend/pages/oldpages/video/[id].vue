<template>
  <div class="max-w-full mx-auto p-4">
    <!-- Hero Section -->
    <div v-if="videoItems.length" class="relative bg-black text-white rounded-lg overflow-hidden mb-8">
      <img
        v-if="videoItems[0].bandimgUrl"
        :src="videoItems[0].bandimgUrl"
        alt="Band Image"
        class="w-full h-64 object-cover opacity-50"
      />
      <div class="absolute inset-0 flex flex-col justify-center items-center p-6">
        <h1 class="text-4xl md:text-6xl font-bold text-white drop-shadow-md text-center">
          {{ videoItems[0].title }}
        </h1>
        <p class="mt-2 text-lg md:text-xl text-white">
          Explore videos by {{ videoItems[0].title }}
        </p>
      </div>
    </div>

    <!-- Video Grid -->
    <div v-if="videoItems.length">
      <div
        v-for="video in videoItems"
        :key="video.id"
        class="bg-black p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
      >
        <div class="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            v-for="(thumbnail, index) in video.youtubeThumbnails"
            :key="index"
            class="relative mb-4 rounded-lg overflow-hidden"
          >
            <!-- Display YouTube player when video is playing -->
            <div v-if="playingVideos[thumbnail.videoId]" class="relative aspect-video">
              <YouTube
                :src="thumbnail.videoId"
                :width="640"
                :height="360"
                :vars="playerOptions"
                @ready="onPlayerReady"
                class="absolute top-0 left-0 w-full h-full rounded-md"
              />
            </div>

            <!-- Display thumbnail and play button when video is not playing -->
            <div v-else class="relative aspect-video cursor-pointer" @click="playVideo(thumbnail.videoId)">
              <img
                :src="thumbnail.thumbnailUrl"
                alt="Video Thumbnail"
                class="absolute top-0 left-0 w-full h-full object-cover rounded-md"
              />
              <div class="absolute inset-0 flex items-center justify-center">
                <svg class="w-16 h-16 text-white opacity-75" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 84 84">
                  <circle cx="42" cy="42" r="42" fill="rgba(0, 0, 0, 0.6)" />
                  <polygon points="33,24 33,60 60,42" fill="white" />
                </svg>
              </div>
              <h4 class="text-white font-semibold mt-4">{{ videoMetadata[thumbnail.videoId] || 'Loading...' }}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No videos found message -->
    <div v-else class="text-white text-center">
      <p>No videos found. Please check back later.</p>
    </div>
  </div>
</template>

<script setup>

import YouTube from 'vue3-youtube';

const route = useRoute();
const { findOne } = useStrapi();

const videoItems = ref([]);
const playingVideos = ref({});
const videoMetadata = ref({});
const loading = ref(true);

const playerOptions = {
  autoplay: 1,
  mute: 1,
  rel: 0,
  modestbranding: 1,
};

// Function to extract YouTube video ID and create a thumbnail URL
const getYouTubeThumbnail = (youtubeVideo) => {
  const url = youtubeVideo.videoid; // Updated attribute name
  const videoIdMatch = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : '';
  return {
    videoId,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };
};

// Fetch video data from Strapi
const fetchVideos = async () => {
  try {
    const response = await findOne('videos', route.params.id, {
      populate: {
        mediayoutube: true, // Updated attribute name
        bandImg: true,
      },
    });

    // Map video data for displaying
    const thumbnails = response.data.attributes.mediayoutube.map((youtubeVideo) => getYouTubeThumbnail(youtubeVideo));
    videoItems.value = [
      {
        id: response.id,
        title: response.data.attributes.bandname || 'No Band Name',
        bandlink: response.data.attributes.bandlink || '',
        bandimgUrl: response.data.attributes.bandImg?.data?.attributes?.url || '',
        youtubeThumbnails: thumbnails,
      },
    ];
  } catch (error) {
    console.error('Error fetching videos:', error);
  } finally {
    loading.value = false;
  }
};

// Function to play video by setting its state in `playingVideos`
const playVideo = (videoId) => {
  playingVideos.value[videoId] = true;
};

// // Enter full-screen mode when player is ready
// const onPlayerReady = (event) => {
//   const iframe = event.target.getIframe();
//   if (iframe.requestFullscreen) {
//     iframe.requestFullscreen();
//   } else if (iframe.mozRequestFullScreen) { // Firefox
//     iframe.mozRequestFullScreen();
//   } else if (iframe.webkitRequestFullscreen) { // Chrome, Safari, and Opera
//     iframe.webkitRequestFullscreen();
//   } else if (iframe.msRequestFullscreen) { // IE/Edge
//     iframe.msRequestFullscreen();
//   }
// };

onMounted(() => {
  fetchVideos();
});
</script>
