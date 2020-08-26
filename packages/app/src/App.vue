<script lang="ts">
import { ref, watch } from 'vue';
import LiveVideo from './components/LiveVideo.vue';

function getPlaylistURL(id: string, type: string): string {
  return `https://${import.meta.env.VITE_S3_BASE_URL}/${id}/${type}.m3u8?response-Cache-Control=no-store`;
}

export default {
  components: {
    LiveVideo,
  },
  setup() {
    const error$$q = ref<string | undefined>(undefined);
    const loading$$q = ref(true);
    const src$$q = ref<string | undefined>(undefined);
    const hasArchive$$q = ref<boolean>(undefined);
    const archiveURL$$q = location.search + '&archive';

    const searchParams = new URLSearchParams(location.search);

    const streamId = searchParams.get('stream');
    const isArchive = searchParams.has('archive');

    if (streamId) {
      const liveURL = getPlaylistURL(streamId, 'live');
      const archiveURL = getPlaylistURL(streamId, 'archive');

      (async () => {
        try {
          const [
            liveResponse,
            archiveResponse,
          ] = await Promise.all([
            fetch(liveURL, {
              method: 'HEAD',
            }),
            fetch(archiveURL, {
              method: 'HEAD',
            }),
          ]);

          if (isArchive) {
            if (archiveResponse.ok) {
              src$$q.value = archiveURL;
            }
          } else {
            if (liveResponse.ok) {
              src$$q.value = liveURL;
            } else if (archiveResponse.ok) {
              hasArchive$$q.value = true;
            } else {
              hasArchive$$q.value = false;
            }
          }

          if (!src$$q.value && !hasArchive$$q.value) {
            error$$q.value = 'Stream Not Found';
          }
        } catch (_error) {
          error$$q.value = 'Network Error';
        }
      })();
    } else {
      // TODO: top page
      error$$q.value = 'Stream Not Found';
    }

    return {
      error$$q,
      loading$$q,
      src$$q,
      hasArchive$$q,
      archiveURL$$q,
      live$$q: !isArchive,
      reload$$q() {
        location.reload();
      },
    };
  },
};
</script>

<template>
  <main class="container mx-auto">
    <template v-if="src$$q">
      <div v-show="!loading$$q" class="flex flex-row items-center min-h-screen">
        <live-video :src="src$$q" :live="live$$q" @ready="loading$$q = false" @error="error$$q = $event.target.value" @finish="reload$$q" />
      </div>
    </template>
    <template v-if="hasArchive$$q">
      <div class="absolute left-0 top-0 w-full h-full pt-8">
        Live Streaming Finished.<br>
        <a :href="archiveURL$$q" class="text-blue-600">View Archive</a>
      </div>
    </template>
    <template v-if="loading$$q && !error$$q && !hasArchive$$q">
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
