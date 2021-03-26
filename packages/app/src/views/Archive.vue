<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import VideoView from '../components/VideoView.vue';
import router from '../router';

export default defineComponent({
  components: {
    VideoView,
  },
  setup() {
    const liveId$$q = computed(
      () => router.currentRoute.value.params.liveIdAndHash.split('-')[0]
    );
    const hash$$q = computed(
      () => router.currentRoute.value.params.liveIdAndHash.split('-')[1]
    );

    return {
      liveId$$q,
      hash$$q,
    };
  },
});
</script>

<template>
  <video-view :live-id="liveId$$q" :hash="hash$$q" />
</template>
