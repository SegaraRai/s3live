<script lang="ts">
import { Channel } from 'pusher-js';
import { computed, defineComponent, onBeforeUnmount, ref, watch } from 'vue';
import { pusherCommentEvent } from '../lib/commonConfig';
import type { Comment } from '../lib/commonTypes';
import pusher from '../lib/pusher';

export default defineComponent({
  props: {
    ownerId: String,
    liveId: String,
    comments: Array,
  },
  setup(props) {
    const liveId = ref<string | undefined>();
    let channel: Channel | undefined;
    const ownerId = computed(() => props.ownerId);

    const comments = ref<Comment[]>([]);

    watch(liveId, (currentLiveId, oldLiveId) => {
      if (currentLiveId === oldLiveId) {
        return;
      }
      if (oldLiveId && channel) {
        channel.unbind(pusherCommentEvent);
        channel.unsubscribe();
        channel = undefined;
        comments.value = [];
      }
      if (currentLiveId) {
        channel = pusher.subscribe(currentLiveId);
        channel.bind(pusherCommentEvent, (data: Comment) => {
          if (comments.value.find((comment) => comment.id === data.id)) {
            return;
          }
          comments.value.push(data);
          comments.value.sort((a, b) => a.timestamp - b.timestamp);
        });
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
      computed(() => props.comments),
      (currentComments) => {
        comments.value = Array.from(
          new Map(
            [
              ...comments.value,
              ...(currentComments as Comment[]),
            ].map((item) => [item.id, item])
          ).values()
        ).sort((a, b) => a.timestamp - b.timestamp);
      },
      {
        immediate: true,
      }
    );

    onBeforeUnmount(() => {
      liveId.value = undefined;
    });

    return {
      ownerId$$q: ownerId,
      comments$$q: comments,
    };
  },
});
</script>

<template>
  <ul>
    <template v-for="comment in comments$$q" v-key="comment.id">
      <li
        :class="[
          $style.comment,
          comment.userId === ownerId$$q ? $style.owner : $style.viewer,
        ]"
      >
        {{ comment.content }}
      </li>
    </template>
  </ul>
</template>
