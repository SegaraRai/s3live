<script lang="ts">
import { computed, defineComponent } from 'vue';
import VideoView from '../components/VideoView.vue';
import router from '../router';

export default defineComponent({
  components: {
    VideoView,
  },
  setup() {
    const liveId$$q = computed(() => router.currentRoute.value.params.liveId);

    return {
      liveId$$q,
    };
  },
});
</script>

<template>
  <video-view :live-id="liveId$$q" />
</template>
