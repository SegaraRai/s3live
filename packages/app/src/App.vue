<script lang="ts">
import { ref, watch } from 'vue';
import LiveVideo from './components/LiveVideo.vue';

export default {
  components: {
    LiveVideo,
  },
  setup() {
    const streamId = new URLSearchParams(location.search).get('stream');
    const url = `https://${import.meta.env.VITE_S3_BASE_URL}/${streamId}/stream.m3u8?response-Cache-Control=no-store`;

    const error$$q = ref<string | undefined>(undefined);
    const loading$$q = ref(true);
    const src$$q = ref<string | undefined>(undefined);

    fetch(url, {
      method: 'HEAD',
    }).then(response => {
      if (response.ok) {
        src$$q.value = url;
      } else {
        error$$q.value = 'Stream Not Found';
      }
    }).catch(() => {
      error$$q.value = 'Network Error';
    });

    return {
      error$$q,
      loading$$q,
      src$$q,
    };
  },
};
</script>

<template>
  <main class="container mx-auto">
    <template v-if="src$$q">
      <div v-show="!loading$$q" class="flex flex-row items-center min-h-screen">
        <live-video :src="src$$q" @ready="loading$$q = false" @error="error$$q = $event.target.value" />
      </div>
    </template>
    <template v-if="loading$$q && !error$$q">
      <div class="absolute left-0 top-0 w-full h-full flex items-center justify-center bg-white bg-opacity-25 text-blue-400">
        <svg class="animate-spin w-32 h-32" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </template>
    <template v-if="error$$q">
      <p class="mt-8 text-xl text-red-500">{{error$$q}}</p>
    </template>
  </main>
</template>
