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
        :live-id="liveId$$q"
        :owner-id="ownerId$$q"
        :comments="comments$$q"
      />
    </template>
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
