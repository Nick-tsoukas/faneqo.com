import { defineNuxtPlugin } from '#app';
import QrcodeVue from 'qrcode.vue';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('QrcodeVue', QrcodeVue);
});