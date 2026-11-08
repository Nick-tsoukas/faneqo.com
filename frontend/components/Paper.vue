<template>
    <div :class="containerClasses">
      <slot></slot>
    </div>
  </template>
  
  <script>
  export default {
    computed: {
      containerClasses() {
        return [
          'bg-white',
          'border',
          'border-gray-300',
          'rounded-lg',
          'shadow-md',
          'p-6', // Padding
          'm-4', // Margin
          'transition-shadow',
          'hover:shadow-lg' // Shadow on hover
        ];
      }
    }
  };
  </script>
  
  <style scoped>
  /* You can add scoped styles specific to this component if needed */
  </style>
  