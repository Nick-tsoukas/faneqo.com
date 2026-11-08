<template>
  <div class="skeleton-loader">
    <div class="skeleton-title"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
  </div>
</template>

<style scoped>
.skeleton-loader {
  padding: 20px;
  background: #f0f0f0;
  border-radius: 8px;
  margin-bottom: 20px;
}
.skeleton-title {
  width: 50%;
  height: 20px;
  background: #e0e0e0;
  margin-bottom: 10px;
}
.skeleton-line {
  width: 100%;
  height: 15px;
  background: #e0e0e0;
  margin-bottom: 5px;
}
</style>
