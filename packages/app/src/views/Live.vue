<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import VideoView from '../components/VideoView.vue';
import router from '../router';

export default defineComponent({
  components: {
    VideoView,
  },
  setup() {
    const liveId$$q = computed(() => router.currentRoute.params.liveId);

    return {
      liveId$$q,
    };
  },
});
</script>

<template>
  <video-view :liveId="liveId$$q" />
</template>
