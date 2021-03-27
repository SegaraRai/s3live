<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import CommentView from '../components/CommentView.vue';
import { fetchLive } from '../lib/api';
import type { Comment } from '../lib/commonTypes';
import router from '../router';

export default defineComponent({
  components: {
    CommentView,
  },
  setup() {
    const liveId$$q = computed(() => router.currentRoute.value.params.liveId);

    const ownerId$$q = ref('');
    const comments$$q = ref<Comment[]>([]);

    watch(
      liveId$$q,
      async () => {
        try {
          const liveInfo = await fetchLive(liveId$$q.value);
          ownerId$$q.value = liveInfo.live.userId;
          comments$$q.value = [...liveInfo.comments];
        } catch (_error) {
          ownerId$$q.value = '';
          comments$$q.value = [];
        }
      },
      {
        immediate: true,
      }
    );

    return {
      liveId$$q,
      ownerId$$q,
      comments$$q,
    };
  },
});
</script>

<template>
  <div>
    <template v-if="ownerId$$q">
      <comment-view
        :class="$style.comments$$q"
        :live-id="liveId$$q"
        :owner-id="ownerId$$q"
        :comments="comments$$q"
        user-id=""
      />
    </template>
  </div>
</template>


<style module>
.comments > :global(.comment) {
  @apply whitespace-normal;
  @apply break-all;
  @apply px-2;
  @apply my-2;
  @apply flex;
  @apply items-center;
}

.comments > :global(.comment--owner) > :global(.comment__body) {
  @apply font-bold;
  @apply text-green-600;
}

.comments > :global(.comment) > :global(.comment__body) {
  @apply flex-grow;
}

.comments > :global(.comment) > :global(.comment__time) {
  @apply flex-grow-0;
  @apply flex-shrink-0;
  @apply w-14;
  @apply text-right;
  @apply text-gray-600;
  @apply font-semibold;
  @apply font-mono;
  @apply tabular-nums;
}
</style>
