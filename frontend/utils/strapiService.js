// utils/strapiService.js

import { useStrapi } from '#imports'

export const deleteItem = async (collectionType, id) => {
  const strapi = useStrapi()

  try {
    await strapi.delete(`${collectionType}/${id}`)
    return { success: true }
  } catch (error) {
    console.error(`Error deleting item from ${collectionType}:`, error)
    return { success: false, error }
  }
}
