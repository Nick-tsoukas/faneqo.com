<template>
  <div v-if="socialPage" class="container max-w-5xl mx-auto">
    <!-- Image Section -->
    <div v-if="socialPage.attributes.img.data" class="relative h-64 md:h-96 rounded-lg overflow-hidden ">
      <img
        :src="socialPage.attributes.img.data.attributes.url"
        alt="Social Page Image"
        class="w-full h-full object-cover"
      />
     
    </div>
    <!-- <div v-if="socialPage.attributes.title" class=" inset-0 flex items-end p-8 rounded-b-lg">
        <h1 class="text-4xl md:text-6xl text-white font-bold">{{ socialPage.attributes.title }}</h1>
      </div> -->
    <!-- Social Media Links Section -->
    <div class="py-10">
      <a v-if="socialPage.attributes.facebook"  :href="socialPage.attributes.facebook" class="flex gap-4 items-center bg-gradient-to-r from-pink-500 to-violet-500 w-full mx-auto p-4 rounded-md shadow-lg mb-6">
        <img class="h-10 w-10"src="@/assets/facebookfree.png" alt="">
        <p class="text-white text-lg font-semibold">Facebook</p>

        <!-- <svg class="h-10 w-10"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64h98.2V334.2H109.4V256h52.8V222.3c0-87.1 39.4-127.5 125-127.5c16.2 0 44.2 3.2 55.7 6.4V172c-6-.6-16.5-1-29.6-1c-42 0-58.2 15.9-58.2 57.2V256h83.6l-14.4 78.2H255V480H384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64z"/></svg>        <p class="text-white text-lg font-semibold">Facebook</p> -->
      </a>

      <a v-if="socialPage.attributes.snapchat" :href="socialPage.attributes.snapchat" class="flex items-center gap-4 bg-gradient-to-r from-pink-500 to-violet-500  w-full mx-auto p-4 rounded-md shadow-lg mb-6">
        <img class="h-10 w-10"src="@/assets/snapchatfree.png" alt="">
        <!-- <svg class="h-10 w-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#000" d="M384 32H64A64 64 0 0 0 0 96V416a64 64 0 0 0 64 64H384a64 64 0 0 0 64-64V96A64 64 0 0 0 384 32zm-3.9 319.3-.1 .1a32.4 32.4 0 0 1 -8.7 6.8 90.3 90.3 0 0 1 -20.6 8.2 12.7 12.7 0 0 0 -3.9 1.8c-2.2 1.9-2.1 4.6-4.4 8.6a23.1 23.1 0 0 1 -6.8 7.5c-6.7 4.6-14.2 4.9-22.2 5.2-7.2 .3-15.4 .6-24.7 3.7-3.8 1.2-7.8 3.7-12.4 6.5-11.3 6.9-26.7 16.4-52.3 16.4s-40.9-9.4-52.1-16.3c-4.7-2.9-8.7-5.4-12.5-6.6-9.3-3.1-17.5-3.4-24.7-3.7-8-.3-15.5-.6-22.2-5.2a23.1 23.1 0 0 1 -6-6.1c-3.2-4.6-2.9-7.8-5.3-9.9a13.4 13.4 0 0 0 -4.1-1.8 90 90 0 0 1 -20.3-8.1 32.9 32.9 0 0 1 -8.3-6.3c-6.6-6.8-8.3-14.8-5.7-21.8 3.4-9.3 11.6-12.1 19.4-16.3 14.8-8 26.3-18.1 34.4-29.9a68.2 68.2 0 0 0 6-10.6c.8-2.2 .8-3.3 .2-4.4a7.4 7.4 0 0 0 -2.2-2.2c-2.5-1.7-5.1-3.4-6.9-4.5-3.3-2.1-5.9-3.8-7.5-5-6.3-4.4-10.7-9-13.4-14.2a28.4 28.4 0 0 1 -1.4-23.6c4.1-10.9 14.5-17.7 27-17.7a37.1 37.1 0 0 1 7.8 .8c.7 .2 1.4 .3 2 .5-.1-7.4 .1-15.4 .7-23.1 2.4-27.3 11.9-41.6 21.9-53a86.8 86.8 0 0 1 22.3-17.9C188.3 100.4 205.3 96 224 96s35.8 4.4 50.9 13a87.2 87.2 0 0 1 22.2 17.9c10 11.4 19.5 25.7 21.9 53a231.2 231.2 0 0 1 .7 23.1c.7-.2 1.4-.3 2.1-.5a37.1 37.1 0 0 1 7.8-.8c12.5 0 22.8 6.8 27 17.7a28.4 28.4 0 0 1 -1.4 23.6c-2.7 5.2-7.1 9.9-13.4 14.2-1.7 1.2-4.3 2.9-7.5 5-1.8 1.2-4.5 2.9-7.2 4.7a6.9 6.9 0 0 0 -2 2c-.5 1-.5 2.2 .2 4.2a69 69 0 0 0 6.1 10.8c8.3 12.1 20.2 22.3 35.5 30.4 1.5 .8 3 1.5 4.4 2.3 .7 .3 1.6 .8 2.5 1.3 4.9 2.7 9.2 6 11.5 12.2C387.8 336.9 386.3 344.7 380.1 351.3zm-16.7-18.5c-50.3-24.3-58.3-61.9-58.7-64.7-.4-3.4-.9-6 2.8-9.5 3.6-3.3 19.5-13.2 24-16.3 7.3-5.1 10.5-10.2 8.2-16.5-1.7-4.3-5.7-6-10-6a18.5 18.5 0 0 0 -4 .4c-8 1.7-15.8 5.8-20.4 6.9a7.1 7.1 0 0 1 -1.7 .2c-2.4 0-3.3-1.1-3.1-4 .6-8.8 1.8-25.9 .4-41.9-1.9-22-9-32.9-17.4-42.6-4.1-4.6-23.1-24.7-59.5-24.7S168.5 134.4 164.5 139c-8.4 9.7-15.5 20.6-17.4 42.6-1.4 16-.1 33.1 .4 41.9 .2 2.8-.7 4-3.1 4a7.1 7.1 0 0 1 -1.7-.2c-4.5-1.1-12.3-5.1-20.3-6.9a18.5 18.5 0 0 0 -4-.4c-4.3 0-8.3 1.6-10 6-2.4 6.3 .8 11.4 8.2 16.5 4.4 3.1 20.4 13 24 16.3 3.7 3.4 3.2 6.1 2.8 9.5-.4 2.8-8.4 40.4-58.7 64.7-2.9 1.4-8 4.5 .9 9.3 13.9 7.6 23.1 6.8 30.3 11.4 6.1 3.9 2.5 12.4 6.9 15.4 5.5 3.8 21.6-.3 42.3 6.6 17.4 5.7 28.1 22 59 22s41.8-16.3 58.9-22c20.8-6.9 36.9-2.8 42.3-6.6 4.4-3.1 .8-11.5 6.9-15.4 7.2-4.6 16.4-3.8 30.3-11.5C371.4 337.4 366.3 334.3 363.4 332.8z"/></svg> -->
        <p class="text-white text-lg font-semibold">Snapchat</p>
      </a>

      <a v-if="socialPage.attributes.whatsapp" :href="socialPage.attributes.whatsapp" class="flex gap-4 items-center bg-gradient-to-r from-pink-500 to-violet-500 w-full mx-auto p-4 rounded-md shadow-lg mb-6">
        <img class="h-10 w-10" src="@/assets/whatsappfree.png" alt="">
        <p class="text-white text-lg font-semibold">Whatsapp</p>

        <!-- <svg class="h-10 w-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path  d="M92.1 254.6c0 24.9 7 49.2 20.2 70.1l3.1 5-13.3 48.6L152 365.2l4.8 2.9c20.2 12 43.4 18.4 67.1 18.4h.1c72.6 0 133.3-59.1 133.3-131.8c0-35.2-15.2-68.3-40.1-93.2c-25-25-58-38.7-93.2-38.7c-72.7 0-131.8 59.1-131.9 131.8zM274.8 330c-12.6 1.9-22.4 .9-47.5-9.9c-36.8-15.9-61.8-51.5-66.9-58.7c-.4-.6-.7-.9-.8-1.1c-2-2.6-16.2-21.5-16.2-41c0-18.4 9-27.9 13.2-32.3c.3-.3 .5-.5 .7-.8c3.6-4 7.9-5 10.6-5c2.6 0 5.3 0 7.6 .1c.3 0 .5 0 .8 0c2.3 0 5.2 0 8.1 6.8c1.2 2.9 3 7.3 4.9 11.8c3.3 8 6.7 16.3 7.3 17.6c1 2 1.7 4.3 .3 6.9c-3.4 6.8-6.9 10.4-9.3 13c-3.1 3.2-4.5 4.7-2.3 8.6c15.3 26.3 30.6 35.4 53.9 47.1c4 2 6.3 1.7 8.6-1c2.3-2.6 9.9-11.6 12.5-15.5c2.6-4 5.3-3.3 8.9-2s23.1 10.9 27.1 12.9c.8 .4 1.5 .7 2.1 1c2.8 1.4 4.7 2.3 5.5 3.6c.9 1.9 .9 9.9-2.4 19.1c-3.3 9.3-19.1 17.7-26.7 18.8zM448 96c0-35.3-28.7-64-64-64H64C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V96zM148.1 393.9L64 416l22.5-82.2c-13.9-24-21.2-51.3-21.2-79.3C65.4 167.1 136.5 96 223.9 96c42.4 0 82.2 16.5 112.2 46.5c29.9 30 47.9 69.8 47.9 112.2c0 87.4-72.7 158.5-160.1 158.5c-26.6 0-52.7-6.7-75.8-19.3z"/></svg>        <p class="text-white text-lg font-semibold">WhatsApp</p> -->
      </a>

      <a v-if="socialPage.attributes.twitch" :href="socialPage.attributes.twitch" class="flex gap-4 items-center bg-gradient-to-r from-pink-500 to-violet-500 w-full mx-auto p-4 rounded-md shadow-lg mb-6">
        <img class="w-10 h-10"src="@/assets/twitchfree.png" alt="">
        <p class="text-white text-lg font-semibold">Twitch</p>
        <!-- <svg class="h-10 w-10"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M391.2 103.5H352.5v109.7h38.6zM285 103H246.4V212.8H285zM120.8 0 24.3 91.4V420.6H140.1V512l96.5-91.4h77.3L487.7 256V0zM449.1 237.8l-77.2 73.1H294.6l-67.6 64v-64H140.1V36.6H449.1z"/></svg>        <p class="text-white text-lg font-semibold">Twitch</p> -->
      </a>

      <a v-if="socialPage.attributes.tictok" :href="socialPage.attributes.tictok" class="flex gap-4 items-center bg-gradient-to-r from-pink-500 to-violet-500 w-full mx-auto p-4 rounded-md shadow-lg mb-6">
        <img class="w-10 h-10" src="@/assets/tiktokfree.png" alt="">
        <p class="text-white text-lg font-semibold">TikTok</p>
        <!-- <svg class="h-10 w-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z"/></svg>        <p class="text-white text-lg font-semibold">TikTok</p> -->
      </a>
    </div>
  </div>
</template>

<script setup>
const { findOne } = useStrapi();
const route = useRoute();
const socialPage = ref(null);

const fetchSocialPage = async () => {
  const { data } = await findOne('socialpages', route.params.id, {
    populate: {
      img: true,
    },
  });
  socialPage.value = data;
  console.log(socialPage.value);
};

onMounted(() => {
  fetchSocialPage();
});
</script>

<style scoped>
.container {
  margin-top: 20px;
}

.bg-gradient-to-r {
  transition: all 0.3s ease;
}

.bg-gradient-to-r:hover {
  transform: translateY(-4px);
}
</style>
