<script lang="ts">
import { Channel } from 'pusher-js';
import { computed, defineComponent, onBeforeUnmount, ref, watch } from 'vue';
import { fetchViewers } from '../lib/api';
import {
  getPusherLiveKey,
  pusherViewerCountEvent,
  viewerCountViewUpdate,
} from '../lib/commonConfig';
import type { ViewerCount } from '../lib/commonTypes';
import pusher from '../lib/pusher';

export default defineComponent({
  props: {
    liveId: String,
    count: Number,
  },
  setup(props) {
    const liveId = ref<string | undefined>();
    let channel: Channel | undefined;
    let timer: number | undefined;

    const count = ref<number>(0);

    watch(liveId, (currentLiveId, oldLiveId) => {
      if (currentLiveId === oldLiveId) {
        return;
      }
      if (timer != null) {
        clearInterval(timer);
        timer = undefined;
      }
      if (oldLiveId && channel) {
        channel.unbind(pusherViewerCountEvent);
        channel.unsubscribe();
        channel = undefined;
        count.value = 0;
      }
      if (currentLiveId) {
        channel = pusher.subscribe(getPusherLiveKey(currentLiveId));
        channel.bind(pusherViewerCountEvent, (data: ViewerCount) => {
          count.value = data.viewerCount;
        });
        timer = setInterval(() => {
          fetchViewers(currentLiveId).then((data) => {
            count.value = data.viewerCount;
          });
        }, viewerCountViewUpdate * 1000);
      }
    });

    watch(
      computed(() => props.liveId),
      (currentLiveId) => {
        liveId.value = currentLiveId;
      },
      {
        immediate: true,
      }
    );

    watch(
      computed(() => props.count),
      (currentCount) => {
        count.value = currentCount;
      },
      {
        immediate: true,
      }
    );

    onBeforeUnmount(() => {
      liveId.value = undefined;
      if (timer != null) {
        clearInterval(timer);
        timer = undefined;
      }
    });

    return {
      count$$q: count,
    };
  },
});
</script>

<template>
  <div>{{ count$$q }}</div>
</template>
