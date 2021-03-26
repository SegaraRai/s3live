<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import { fetchLive } from '../lib/api';
import CommentView from './CommentView.vue';
import CounterUpdater from './CounterUpdater.vue';
import CounterView from './CounterView.vue';
import LiveVideo from './LiveVideo.vue';

export default defineComponent({
  components: {
    LiveVideo,
    CommentView,
    CounterView,
    CounterUpdater,
  },
  props: {
    liveId: String,
    hash: String,
  },
  setup(props) {
    const error$$q = ref<string | undefined>(undefined);
    const loading$$q = ref(true);
    const title$$q = ref('');
    const finished$$q = ref(false);
    const liveId$$q = computed(() => props.liveId);
    const hash$$q = computed(() => props.hash);

    watch(
      liveId$$q,
      async () => {
        loading$$q.value = true;
        error$$q.value = undefined;

        try {
          const liveInfo = await fetchLive(liveId$$q.value);
          title$$q.value = liveInfo.live.title;
          finished$$q.value = !!liveInfo.live.finishedAt;
        } catch (_error) {
          error$$q.value = 'Live not found';
          loading$$q.value = false;
        }
      },
      {
        immediate: true,
      }
    );

    return {
      liveId$$q,
      hash$$q,
      error$$q,
      loading$$q,
      title$$q,
      finished$$q,
      reload$$q() {
        location.reload();
      },
    };
  },
});
</script>

<template>
  <div>
    <template v-if="!loading$$q && !error$$q">
      <template v-if="!finished$$q || hash$$q">
        <div class="flex">
          <div class="flex">
            <div class="">
              <live-video
                :liveId="liveId$$q"
                :hash="hash$$q"
                @ready="loading$$q = false"
                @error="error$$q = $event.target.value"
                @finish="reload$$q"
              />
              <div
                class="absolute left-0 top-0 w-full h-full flex items-center justify-center bg-white bg-opacity-25 text-blue-400"
              >
                <svg
                  class="animate-spin w-32 h-32"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
          <div class="flex flex-col">
            <div class="">
            <comment-view />
            <div>視聴中 <counter-view class="inline" /> 人</div>
          </div>
        </div>
        <counter-updater hidden />
      </template>
      <template v-if="!loading$$q && !error$$q && finished$$q && !hash$$q">
        <div>この配信は終了しました</div>
      </template>
    </template>
    <template v-if="error$$q">
      <p class="mt-8 text-xl text-red-500">{{ error$$q }}</p>
    </template>
  </div>
</template>
