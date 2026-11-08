<template>
  <div class="player-container h-full flex flex-col">
    <!-- Now Playing (fixed height) -->
    <div class="now-playing flex-none">
      <img
        v-if="albumCoverUrl !== props.placeholderImage"
        :src="albumCoverUrl"
        alt="Album Cover"
        class="album-cover"
      />
      <div class="song-info">
        <h3 class="song-title">{{ currentSongTitle }}</h3>
        <p class="artist-name">{{ artistName }}</p>
      </div>
    </div>

    <!-- Controls + Progress (single pinned row) -->
    <div class="controls-progress flex-none flex items-center px-4 py-2">
      <!-- Previous -->
      <button @click="previousSong" class="control-button">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
        </svg>
      </button>

      <!-- Play/Pause -->
      <button @click="togglePlay" class="control-button play-pause mx-2">
        <svg v-if="!playing" class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <svg v-else class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      </button>

      <!-- Next (if multiple) -->
      <button
        v-if="songs.length > 1"
        @click="nextSong"
        class="control-button mr-4"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
        </svg>
      </button>

      <!-- Current Time -->
      <span class="current-time">{{ formatTime(currentTime) }}</span>

      <!-- Seek Bar -->
      <input
        type="range"
        min="0"
        :max="duration"
        step="0.1"
        v-model="currentTime"
        @input="seekAudio"
        class="progress-bar flex-1"
        :style="progressBarStyle"
      />

      <!-- Total Time -->
      <span class="total-time">{{ formatTime(duration) }}</span>
    </div>

    <!-- Song List (fills the rest) -->
    <ul v-if="songs.length > 1" class="song-list flex-1 overflow-auto">
      <li
        v-for="(song, idx) in songs"
        :key="song.id || idx"
        :class="{ 'active-song': isCurrentSong(song) }"
        @click="playSong(song)"
      >
        <div class="song-index">{{ idx + 1 }}</div>
        <div class="song-details">
          <p class="song-title">{{ song.title }}</p>
          <p class="artist-name">{{ artistName }}</p>
        </div>
        <div class="song-duration">{{ formatTime(song.duration) }}</div>
      </li>
    </ul>

    <!-- Hidden audio element -->
    <audio
      ref="audioPlayer"
      @timeupdate="updateTime"
      @loadedmetadata="onAudioLoaded"
      @ended="onSongEnded"
    ></audio>
  </div>
</template>




<script setup>
import { ref, computed, onMounted, nextTick } from "vue";

// Allow parent to listen for “play”:
const emit = defineEmits(["play"])

// Props
const props = defineProps({
  album: {
    type: Object,
    required: true,
  },
  placeholderImage: {
    type: String,
    default: "@/assets/placeholder-image.svg",
  },
});

// Reactive State
const playing = ref(false);
const currentSong = ref(null);
const audioPlayer = ref(null);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(1);
const shuffle = ref(false);
const repeat = ref(false);

const progressPercent = computed(() => {
  const d = Number(duration.value) || 0;
  if (d <= 0) return 0;
  const t = Number(currentTime.value) || 0;
  return Math.max(0, Math.min(100, (t / d) * 100));
});

const progressBarStyle = computed(() => {
  const p = progressPercent.value;
  return {
    '--progress': `${p}%`,
  };
});

// Computed: build a “songs” array out of either album.attributes.songs or single-song data
const songs = computed(() => {
  try {
    // If album.attributes.songs exists, use that array directly
    if (props.album?.attributes?.songs) {
      const songsList = props.album.attributes.songs;
      return Array.isArray(songsList) ? songsList : [songsList];
    }
    // Otherwise, treat this as a single‐song album
    if (props.album?.attributes) {
      return [
        {
          id: props.album.id || Date.now(),
          title: props.album.attributes.title || "Unknown Title",
          file: props.album.attributes.file, // (may be undefined for single‐song format)
          song: props.album.attributes.song, // expected shape: { data: { attributes: { url } } }
          embedUrl: props.album.attributes.embedUrl || "",
          isEmbeded: !!props.album.attributes.embedUrl,
          duration: props.album.attributes.duration || 0,
          cover: props.album.attributes.cover, // expected shape: { data: { attributes: { url } } }
        },
      ];
    }
    console.warn("No valid song data found in album:", props.album);
    return [];
  } catch (error) {
    console.error("Error processing songs:", error);
    return [];
  }
});

// Computed: album cover URL or placeholder
const albumCoverUrl = computed(() => {
  try {
    if (currentSong.value?.cover?.data?.attributes?.url) {
      return currentSong.value.cover.data.attributes.url;
    } else if (props.album?.attributes?.cover?.data?.attributes?.url) {
      return props.album.attributes.cover.data.attributes.url;
    }
    return props.placeholderImage;
  } catch (error) {
    console.error("Error getting album cover:", error);
    return props.placeholderImage;
  }
});
const currentSongTitle = computed(() =>
  currentSong.value?.title || "Select a song"
);
const artistName = computed(() =>
  props.album.attributes?.artist || "Unknown Artist"
);

// Initialize volume on mount
onMounted(async () => {
  // wait for DOM to settle
  await nextTick();
  // set initial volume
  if (audioPlayer.value) {
    audioPlayer.value.volume = volume.value;
  }

  // if there's exactly one song, select it (but don't auto-play)
  if (songs.value.length === 1) {
    // 1) mark it as current
    currentSong.value = songs.value[0];

    // 2) figure out its URL the same way playSong does
    const fileUrl =
      currentSong.value.file?.data?.attributes?.url ||
      currentSong.value.song?.data?.attributes?.url ||
      "";

    // 3) load metadata so duration is set
    if (audioPlayer.value && fileUrl) {
      audioPlayer.value.src = fileUrl;
      audioPlayer.value.load();
      // onloadedmetadata will fire and update `duration`
    }
  }
});


// Play a given song object
const playSong = async (song) => {
  if (!audioPlayer.value) return;

  currentSong.value = song;
  let fileUrl = "";

  // Determine the correct URL field:
  if (song.file?.data?.attributes?.url) {
    fileUrl = song.file.data.attributes.url;
  } else if (song.song?.data?.attributes?.url) {
    fileUrl = song.song.data.attributes.url;
  } else if (typeof song.file === "string") {
    fileUrl = song.file;
  }

  if (!fileUrl) {
    console.error("No valid file URL found:", song);
    return;
  }

  try {
    audioPlayer.value.src = fileUrl;
    audioPlayer.value.load();

    // Wait for metadata (so duration is populated)
    await new Promise((resolve) => {
      audioPlayer.value.onloadedmetadata = resolve;
    });

    audioPlayer.value.currentTime = 0;
    await audioPlayer.value.play();
    playing.value = true;

    // Notify parent that play has started:
    emit("play");
  } catch (error) {
    console.error("Error playing audio:", error);
    playing.value = false;
  }
};

// Check if a song is the “currentSong”
const isCurrentSong = (song) =>
  currentSong.value && currentSong.value.id === song.id;

// Toggle play/pause
const togglePlay = async () => {
  if (!audioPlayer.value) return;

  if (!currentSong.value) {
    // If nothing is selected yet, pick the first track
    if (songs.value.length) {
      await playSong(songs.value[0]);
    }
    return;
  }

  if (playing.value) {
    audioPlayer.value.pause();
    playing.value = false;
  } else {
    try {
      await audioPlayer.value.play();
      playing.value = true;
      emit("play");
    } catch (error) {
      console.error("Error playing audio:", error);
      playing.value = false;
    }
  }
};

// Next / Previous logic
const nextSong = async () => {
  if (shuffle.value) {
    playRandomSong();
  } else {
    const idx = songs.value.findIndex((s) => s.id === currentSong.value?.id);
    let nextIndex = idx + 1;
    if (nextIndex >= songs.value.length) nextIndex = 0;
    await playSong(songs.value[nextIndex]);
  }
};

const previousSong = async () => {
  if (songs.value.length === 1) {
    if (audioPlayer.value) {
      audioPlayer.value.currentTime = 0;
    }
    return;
  }
  const idx = songs.value.findIndex((s) => s.id === currentSong.value?.id);
  let prevIndex = idx - 1;
  if (prevIndex < 0) prevIndex = songs.value.length - 1;
  await playSong(songs.value[prevIndex]);
};

const playRandomSong = async () => {
  const randomIndex = Math.floor(Math.random() * songs.value.length);
  await playSong(songs.value[randomIndex]);
};

// When a song naturally ends
const onSongEnded = () => {
  if (repeat.value) {
    audioPlayer.value.currentTime = 0;
    audioPlayer.value.play();
    emit("play");
  } else {
    nextSong();
  }
};

// Once metadata loads, record duration
const onAudioLoaded = () => {
  duration.value = audioPlayer.value?.duration || 0;
};

// Update currentTime as audio plays
const updateTime = () => {
  currentTime.value = audioPlayer.value?.currentTime || 0;
};

// Seek handler
const seekAudio = () => {
  if (audioPlayer.value) {
    audioPlayer.value.currentTime = currentTime.value;
  }
};

// Format seconds → mm:ss
const formatTime = (time) => {
  if (!time && time !== 0) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};
</script>

<style scoped>
.player-container {
  display: flex;
  flex-direction: column;
  justify-content: end;
  background: black;
  color: #fff;
  border-radius: 0.5rem;
  height: 100%;
  width: 100%;
}

/* Now Playing */
.now-playing {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.album-cover {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
}

.artist-name {
  font-size: 0.75rem;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.6);
  margin: 0.125rem 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Controls + Progress Row */
.controls-progress {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.control-button {
  background: none;
  border: none;
  padding: 0.375rem;
  cursor: pointer;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  transition: all 0.15s ease;
}

.control-button:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.control-button:active {
  transform: scale(0.95);
}

.control-button.play-pause {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.control-button.play-pause:hover {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

/* Time labels */
.current-time,
.total-time {
  width: 2.5rem;
  text-align: center;
  font-size: 0.7rem;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.5);
  font-variant-numeric: tabular-nums;
}

/* Slider */
.progress-bar {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  height: 6px;
  border-radius: 9999px;
  background: linear-gradient(
    to right,
    #8b5cf6 0%,
    #8b5cf6 var(--progress, 0%),
    rgba(255, 255, 255, 0.15) var(--progress, 0%),
    rgba(255, 255, 255, 0.15) 100%
  );
  appearance: none;
  -webkit-appearance: none;
  margin: 0 0.5rem;
  cursor: pointer;
  border: 0;
  outline: none;
  transition: height 0.15s ease;
}

.progress-bar:hover {
  height: 8px;
}

.progress-bar::-webkit-slider-runnable-track {
  height: 100%;
  background: transparent;
  border-radius: 9999px;
}

.progress-bar::-moz-range-track {
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
}

.progress-bar::-moz-range-progress {
  height: 100%;
  background: #8b5cf6;
  border-radius: 9999px;
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  border: 0;
  margin-top: -4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.progress-bar:hover::-webkit-slider-thumb {
  opacity: 1;
}

.progress-bar::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  border: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

@media (max-width: 360px) {
  .controls-progress {
    padding: 0.5rem;
  }

  .current-time,
  .total-time {
    width: 2.1rem;
  }

  .progress-bar {
    margin: 0 0.35rem;
  }
}

/* Song List */
.song-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}

.song-list::-webkit-scrollbar {
  width: 4px;
}

.song-list::-webkit-scrollbar-track {
  background: transparent;
}

.song-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.song-list li {
  display: flex;
  align-items: center;
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.song-list li:last-child {
  border-bottom: none;
}

.song-list li:hover {
  background: rgba(255, 255, 255, 0.05);
}

.song-list li.active-song {
  background: rgba(139, 92, 246, 0.15);
}

.song-list li.active-song .song-title {
  color: #a78bfa;
}

.song-index {
  width: 1.5rem;
  text-align: center;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

.song-list li.active-song .song-index {
  color: #8b5cf6;
}

.song-details {
  flex: 1;
  padding: 0 0.5rem;
  min-width: 0;
}

.song-details .song-title {
  font-size: 0.8rem;
}

.song-details .artist-name {
  font-size: 0.7rem;
}

.song-duration {
  width: 2.5rem;
  text-align: right;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  font-variant-numeric: tabular-nums;
}
</style>


