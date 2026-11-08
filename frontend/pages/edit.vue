<template>
  <div class="pt-[var(--header-height)]">
    
    <component :is="currentComponent" v-bind="props"></component>

  </div>
</template>

<script setup>

import EditLinkQr from '@/components/EditLinkQr.vue' // Adjust the path as necessary
import EditBandQr from '@/components/EditBandQr.vue' // Adjust the path as necessary


// Retrieve the route object
const route = useRoute()
const { findOne } = useStrapi()

const props  = ref(null)

// Define the map of component types to component names
const editComponentRender = {
  externalURL: EditLinkQr,
  bandProfile: EditBandQr
}





const currentComponent = computed(() => editComponentRender[route.query.type])
 
const setProps = async () => {
  const response = await findOne('qrs', route.query.id, {populate: '*'})
  const data = response.data.attributes;
  console.log(response.data.id)
  const propsObject = await {
    name: data.name,
    url: data.url,
    q_type: data.q_type,
    q_image : data.q_image.data.attributes.url,
    link: data.link,
    qrId: route.query.id
    

  }
  props.value = propsObject
}

setProps()

</script>

<style scoped>
/* Additional styles if needed */
</style>
