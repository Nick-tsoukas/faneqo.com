<template>
  <div v-if="stream" class="container max-w-5xl mx-auto " >
    <div  >
      <div v-if="stream.attributes.img.data" class="relative  h-64 md:h-96  rounded-lg overflow-hidden mb-8">
        <img
          :src="stream.attributes.img.data.attributes.url"
          alt="Event Hero Image"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0  flex items-end p-4 rounded-b-lg">
          <h1 class="text-4xl md:text-6xl text-white font-bold">{{ stream.title }}</h1>
        </div>
      </div>
    </div>
    <div class="px-10" >
      <NuxtLink v-if="stream.attributes.applemusic" class="flex gap-4 bg-gradient-to-r from-pink-500 to-violet-500 w-full mx-auto p-4 rounded-md shadow-lg  mb-6"  >
        <img src="@/assets/apple.svg" class="h-6 w-6" alt="">
         <p class="text-white " >Apple Music</p>
        <!-- <p class="text-white" >{{ stream.attributes.applemusic }}</p> -->
      </NuxtLink>
      <NuxtLink v-if="stream.attributes.spotify" class="flex gap-4 bg-gradient-to-r from-pink-500 to-violet-500 w-fullmx-auto p-4 rounded-md shadow-lg  mb-6"  >
        <img src="@/assets/spot.svg" class="h-6 w-6" alt="">
        <p class="text-white ">Spotify</p>
      </NuxtLink>
      <NuxtLink v-if="stream.attributes.youtubemusic" class="flex gap-4 bg-gradient-to-r from-pink-500 to-violet-500 w-full mx-auto p-4 rounded-md shadow-lg mb-6"  >
        <img src="@/assets/ymusic.svg" class="h-6 w-6" alt="">
        <p class="text-white">Youtube Music</p>
      </NuxtLink>
      <NuxtLink v-if="stream.attributes.soundcloud" class="flex gap-4 bg-gradient-to-r from-pink-500 to-violet-500 w-full mx-auto p-4 rounded-md shadow-lg mb-6"  >
        <img src="@/assets/soundcloudlast.png" class="h-6 w-6" alt="">
        <p class="text-white">Soundcloud</p>
      </NuxtLink>
    </div>

  </div>
</template>

<script setup>
const { findOne } = useStrapi()
const route = useRoute();
const stream = ref(null)

const fetchData = async () => {
  const {data} = await findOne('streams', route.params.id, {
    populate: {
      img: true
    }
  })
   stream.value = await data
   console.log(stream.value)

}

onMounted(() => {
  fetchData()
});
</script>

<style>

</style>