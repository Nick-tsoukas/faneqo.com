// plugins/fontawesome.js

import { defineNuxtPlugin } from '#app';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Import the icons you need
import { faCalendarAlt } from '@fortawesome/free-regular-svg-icons';
import {
  faMapMarkerAlt,
  faInfoCircle,
  faEnvelope,
  faPhone,
  faUserLock,
  faShareAlt,
  faMusic,
  faTicketAlt,
  faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import {
  faFacebookSquare,
  faTwitterSquare,
  faInstagramSquare,
  faYoutubeSquare,
  faTiktok,
} from '@fortawesome/free-brands-svg-icons';

// Add the imported icons to the library
library.add(
  faCalendarAlt,
  faMapMarkerAlt,
  faInfoCircle,
  faEnvelope,
  faPhone,
  faUserLock,
  faShareAlt,
  faMusic,
  faTicketAlt,
  faGlobe,
  faFacebookSquare,
  faTwitterSquare,
  faInstagramSquare,
  faYoutubeSquare,
  faTiktok
);

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('font-awesome-icon', FontAwesomeIcon);
});
