<script lang="ts">
import { Channel } from 'pusher-js';
import { computed, defineComponent, onBeforeUnmount, ref, watch } from 'vue';
import { getPusherLiveKey, pusherCommentEvent } from '../lib/commonConfig';
import type { Comment } from '../lib/commonTypes';
import pusher from '../lib/pusher';

interface ViewComment {
  readonly id$$q: string;
  readonly userId$$q: string;
  readonly timestamp$$q: number;
  readonly content$$q: string;
  readonly humanTime$$q: string;
  readonly utcTime$$q: string;
}

function commentToViewComment(comment: Comment): ViewComment {
  const date = new Date(comment.timestamp);
  return {
    id$$q: comment.id,
    userId$$q: comment.userId,
    timestamp$$q: comment.timestamp,
    content$$q: comment.content,
    humanTime$$q: `${date
      .getHours()
      .toString()
      .padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
    utcTime$$q: date.toUTCString(),
  };
}

export default defineComponent({
  props: {
    ownerId: String,
    userId: String,
    liveId: String,
    comments: Array,
  },
  setup(props, { emit }) {
    let channel: Channel | undefined;

    const liveId = ref<string | undefined>();
    const ownerId$$q = computed(() => props.ownerId);
    const userId$$q = computed(() => props.userId);

    const comments$$q = ref<ViewComment[]>([]);

    watch(liveId, (currentLiveId, oldLiveId) => {
      if (currentLiveId === oldLiveId) {
        return;
      }
      if (oldLiveId && channel) {
        channel.unbind(pusherCommentEvent);
        channel.unsubscribe();
        channel = undefined;
        comments$$q.value = [];
        emit('update');
      }
      if (currentLiveId) {
        channel = pusher.subscribe(getPusherLiveKey(currentLiveId));
        channel.bind(pusherCommentEvent, (data: Comment) => {
          if (comments$$q.value.find((comment) => comment.id$$q === data.id)) {
            return;
          }
          comments$$q.value = [
            ...comments$$q.value,
            commentToViewComment(data),
          ].sort((a, b) => a.timestamp$$q - b.timestamp$$q);
          emit('update');
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
        comments$$q.value = Array.from(
          new Map(
            [
              ...comments$$q.value,
              ...(currentComments as Comment[]).map(commentToViewComment),
            ].map((item) => [item.id$$q, item])
          ).values()
        ).sort((a, b) => a.timestamp$$q - b.timestamp$$q);
        emit('update');
      },
      {
        immediate: true,
      }
    );

    onBeforeUnmount(() => {
      liveId.value = undefined;
    });

    return {
      ownerId$$q,
      userId$$q,
      comments$$q,
    };
  },
});
</script>

<template>
  <ul>
    <template v-for="comment in comments$$q" v-key="comment.id$$q">
      <li
        class="comment"
        :class="[
          comment.userId$$q === ownerId$$q && 'comment--owner',
          comment.userId$$q === userId$$q && 'comment--user',
        ]"
      >
        <div class="comment__body">
          {{ comment.content$$q }}
        </div>
        <time class="comment__time" :datetime="comment.utcTime$$q">
          {{ comment.humanTime$$q }}
        </time>
      </li>
    </template>
  </ul>
</template>
