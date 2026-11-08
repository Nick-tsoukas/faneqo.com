<template>
  <div id="tsparticles"></div>
</template>

<script setup>
import { tsParticles } from "tsparticles";
import { loadFull } from "tsparticles";

const particlesOptions = {
  particles: {
    number: {
      value: 50,
    },
    size: {
      value: 3,
    },
    move: {
      speed: 1,
    },
    line_linked: {
      enable: true,
    },
  },
};

onMounted(async () => {
  await loadFull(tsParticles);
  console.log(tsParticles)
  tsParticles.load("tsparticles", particlesOptions);
});
</script>

<style scoped>
#tsparticles {
  position: fixed;
  width: 100%;
  height: 100%;
  z-index: -1;
  top: 0;
  left: 0;
}
</style>
