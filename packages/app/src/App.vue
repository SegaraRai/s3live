<script lang="ts">
import { defineComponent, ref } from 'vue';
import LiveVideo from './components/LiveVideo.vue';

function getPlaylistURL(id: string, type: string): string {
  return `/api/lives/${id}/${type}.m3u8`;
}

export default defineComponent({
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
          const [liveResponse, archiveResponse] = await Promise.all([
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
});
</script>

<template>
  <div>
    <div class="p-2">
      <h1 class="text-xl leading-tight">s3live</h1>
    </div>
    <main class="container mx-auto">
      <router-view />
    </main>
  </div>
</template>

<style module>
.comment {
  @apply block;
}

.owner {
  @apply text-red-500;
}
</style>
