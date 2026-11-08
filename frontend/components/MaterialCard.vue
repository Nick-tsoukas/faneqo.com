<template>
  <div class="max-w-sm rounded-lg overflow-hidden shadow-lg m-4 border border-gray-200">
    <img class="w-full h-48 object-scale-down" :src="q_image" alt="Card Image">
    <div class="p-4">
      <h2 class="font-bold text-xl mb-2">{{name}}</h2>
      <p class="text-gray-700 text-base "><span  class="font-bold">Type:</span> {{ q_type }} </p>
      <p class="text-gray-700 mb-2 text-base "><span  class="font-bold">Scans:</span> 0 </p>
      <p class="text-gray-700 text-base">{{ typeDescriptions[q_type] }} </p>
      <p>{{ link }} </p>
    </div>
    <div class="px-4 py-2 flex w-full justify-start space-x-2">
      <NuxtLink :to="q_image" class="bg-blue-500 text-white font-bold py-2 px-4 mr-auto rounded hover:bg-blue-700">Download QR</NuxtLink>
   
      <img @click="navigateToEdit(q_type, qr.id)" src="@/assets/edit-icon.svg"   alt="Edit Icon" class="icon ml-auto" />
      <img   src="@/assets/delete-icon.svg" @click="handleDelete('qrs', qrId)" alt="Delete Icon" class="icon" />
    </div>
  </div>
</template>

<script setup>
import { deleteItem } from '@/utils/strapiService'
const router = useRouter()


const props = defineProps({
  name: {
    type: String,
    default: 'Default Title'
  },
  qr: {
    type: Object
  },
  url: {
    type: String,
    default: ''
  },
  q_image: {
    type: String,
    default: 'https://via.placeholder.com/300'
  },
  q_type: {
  type: String
  },
  scanTime: {
    type: Array,
    default: () => []
  },
  link: {
    type: String,
    default: null
  },
  qrId : {
    type: Number
  }
})
const typeDescriptions = {
  externalURL : 'directs users to an external link such as a website, online portfolio, or multimedia content.'
}

const navigateToEdit = (type, id) => {

  router.push({
    path: '/edit',
    query: { type: type, id: id }
  })
}


const handleDelete = async (collectionType, id) => {
  const result = await deleteItem(collectionType, id)

  if (result.success) {
    // Handle successful deletion, e.g., show a success message or update the UI
    window.location.reload()
    console.log(`Item from ${collectionType} deleted successfully`)
  } else {
    // Handle error, e.g., show an error message
    console.error(`Failed to delete item from ${collectionType}:`, result.error)
  }
}

</script>

<style scoped>
/* Additional custom styles if needed */
</style>
