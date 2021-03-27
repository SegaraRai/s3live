<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, watch } from 'vue';
import { viewerCountUpdate } from '../lib/commonConfig';
import { postViewer } from '../lib/authAPI';

export default defineComponent({
  props: {
    liveId: String,
  },
  setup(props) {
    const liveId = computed<string>(() => props.liveId);
    let timer: number | undefined;

    watch(
      liveId,
      (currentLiveId, oldLiveId) => {
        if (timer != null && currentLiveId === oldLiveId) {
          return;
        }
        if (timer != null) {
          clearInterval(timer);
          timer = undefined;
        }
        postViewer(currentLiveId);
        timer = setInterval(() => {
          postViewer(currentLiveId);
        }, viewerCountUpdate * 1000);
      },
      {
        immediate: true,
      }
    );

    onBeforeUnmount(() => {
      if (timer != null) {
        clearInterval(timer);
        timer = undefined;
      }
    });

    return {};
  },
});
</script>

<template></template>
