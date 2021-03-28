<script lang="ts">
import { Channel } from 'pusher-js';
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { fetchLive } from '../lib/api';
import { postComment } from '../lib/authAPI';
import {
  getPusherLiveKey,
  maxCommentLength,
  pusherFinishEvent,
  pusherPlaylistEvent,
} from '../lib/commonConfig';
import type { Comment } from '../lib/commonTypes';
import pusher from '../lib/pusher';
import { fetchUserId } from '../lib/userAccount';
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
    const userId$$q = ref('');
    fetchUserId().then((userId) => {
      userId$$q.value = userId;
    });

    //

    const liveId$$q = computed(() => props.liveId);
    const hash$$q = computed(() => props.hash);

    const reloadCounter$$q = ref(0);
    const error$$q = ref<string | undefined>(undefined);
    const loading$$q = ref(true);
    const humanizedCreatedAt$$q = ref('');
    const started$$q = ref(false);
    const finished$$q = ref(false);
    const title$$q = ref('');
    const ownerId$$q = ref('');
    const comments$$q = ref<Comment[]>([]);
    const viewerCount$$q = ref(0);

    watch(
      [liveId$$q, reloadCounter$$q],
      async ([currentLiveId], [oldLiveId]) => {
        if (currentLiveId === oldLiveId && loading$$q.value) {
          return;
        }

        loading$$q.value = true;
        error$$q.value = undefined;

        try {
          const liveInfo = await fetchLive(currentLiveId);
          if (liveId$$q.value !== currentLiveId) {
            return;
          }

          loading$$q.value = false;

          title$$q.value = liveInfo.live.title;
          humanizedCreatedAt$$q.value = new Date(
            liveInfo.live.createdAt
          ).toLocaleString();
          started$$q.value = !!liveInfo.live.startedAt;
          finished$$q.value = !!liveInfo.live.finishedAt;
          ownerId$$q.value = liveInfo.live.userId;
          comments$$q.value = [...liveInfo.comments];
          viewerCount$$q.value = liveInfo.viewerCount;
        } catch (_error) {
          error$$q.value = '配信が存在しません';
          loading$$q.value = false;

          title$$q.value = '';
          humanizedCreatedAt$$q.value = '';
          started$$q.value = false;
          finished$$q.value = false;
          ownerId$$q.value = '';
          comments$$q.value = [];
          viewerCount$$q.value = 0;
        }
      },
      {
        immediate: true,
      }
    );

    //

    let channel: Channel | undefined;
    const cleanupChannel = () => {
      if (channel) {
        channel.unbind(pusherFinishEvent);
        channel.unbind(pusherPlaylistEvent);
        channel.unsubscribe();
        channel = undefined;
      }
    };
    watch(
      liveId$$q,
      (currentLiveId, oldLiveId) => {
        if (channel && currentLiveId === oldLiveId) {
          return;
        }

        cleanupChannel();

        if (currentLiveId) {
          channel = pusher.subscribe(getPusherLiveKey(currentLiveId));
          const finishCallback = () => {
            if (liveId$$q.value !== currentLiveId) {
              return;
            }
            if (loading$$q.value) {
              return;
            }
            if (!finished$$q.value) {
              reloadCounter$$q.value++;
            }
            channel.unbind(pusherFinishEvent, finishCallback);
          }
          channel.bind(pusherFinishEvent, finishCallback);
          // we use `pusherPlaylistEvent` since the playlist is not yet uploaded at `pusherStartEvent`
          const playlistCallback = () => {
            if (liveId$$q.value !== currentLiveId) {
              return;
            }
            if (loading$$q.value) {
              return;
            }
            if (!started$$q.value) {
              reloadCounter$$q.value++;
            }
            channel.unbind(pusherPlaylistEvent, playlistCallback);
          };
          channel.bind(pusherPlaylistEvent, playlistCallback);
        }
      },
      {
        immediate: true,
      }
    );
    onBeforeUnmount(cleanupChannel);

    //

    const newCommentPosting$$q = ref(false);
    const elTextArea$$q = ref<HTMLTextAreaElement | undefined>();
    const elTextAreaSpinner$$q = ref<HTMLDivElement | undefined>();
    const newComment$$q = ref('');
    const newCommentOk$$q = computed(
      () =>
        !newCommentPosting$$q.value &&
        !!newComment$$q.value.trim() &&
        newComment$$q.value.length <= maxCommentLength
    );

    const resizeTextArea = () => {
      const trimmedComment = newComment$$q.value.replace(
        /[\r\n\v\f\u0085\u2028\u2029]/g,
        ''
      );
      if (newComment$$q.value !== trimmedComment) {
        newComment$$q.value = trimmedComment;
      }

      if (elTextArea$$q.value && elTextAreaSpinner$$q.value) {
        elTextArea$$q.value.style.height = 'auto';
        const height = `${elTextArea$$q.value.scrollHeight}px`;
        elTextArea$$q.value.style.height = height;
        elTextAreaSpinner$$q.value.style.height = height;
      }
    };
    watch(newComment$$q, resizeTextArea);
    watch(loading$$q, resizeTextArea);

    //

    const elRoot$$q = ref<HTMLDivElement | undefined>();
    const elVideoContainer$$q = ref<HTMLDivElement | undefined>();
    const resizeComments = () => {
      if (elVideoContainer$$q.value && elRoot$$q.value) {
        elRoot$$q.value.style.setProperty(
          '--container-size',
          `${elVideoContainer$$q.value.scrollHeight}px`
        );
      }
    };
    watch(loading$$q, () => {
      nextTick(resizeComments);
    });
    window.addEventListener('resize', resizeComments);
    onBeforeUnmount(() => {
      window.removeEventListener('resize', resizeComments);
    });

    //

    const elCommentsContainer$$q = ref<HTMLDivElement | undefined>();
    const commentsAutoScrollEnabled$$q = ref(true);
    const autoScroll$$q = () => {
      nextTick(() => {
        if (
          commentsAutoScrollEnabled$$q.value &&
          elCommentsContainer$$q.value
        ) {
          elCommentsContainer$$q.value.scrollTop =
            elCommentsContainer$$q.value.scrollHeight;
        }
      });
    };
    onMounted(autoScroll$$q);

    return {
      liveId$$q,
      hash$$q,
      error$$q,
      loading$$q,
      title$$q,
      humanizedCreatedAt$$q,
      started$$q,
      finished$$q,
      ownerId$$q,
      comments$$q,
      viewerCount$$q,
      reload$$q() {
        reloadCounter$$q.value++;
      },
      userId$$q,
      maxCommentLength$$q: maxCommentLength,
      elTextArea$$q,
      elTextAreaSpinner$$q,
      newComment$$q,
      newCommentPosting$$q,
      newCommentOk$$q,
      postComment$$q() {
        if (!newCommentOk$$q.value) {
          return;
        }

        newCommentPosting$$q.value = true;
        postComment(liveId$$q.value, newComment$$q.value)
          .then(() => {
            newComment$$q.value = '';
            newCommentPosting$$q.value = false;
          })
          .catch((error) => {
            newCommentPosting$$q.value = false;
            alert(error instanceof Error ? error.message : String(error));
          });
      },
      elRoot$$q,
      elVideoContainer$$q,
      elCommentsContainer$$q,
      onCommentsScroll$$q(event: UIEvent) {
        const target = event.target as HTMLDivElement;
        const isBottom =
          target.scrollTop + target.clientHeight === target.scrollHeight;
        commentsAutoScrollEnabled$$q.value = isBottom;
      },
      //
      autoScroll$$q,
    };
  },
});
</script>

<template>
  <div ref="elRoot$$q">
    <template v-if="!loading$$q && !error$$q">
      <div class="flex w-full flex-col xl:flex-row">
        <div class="m-4 flex-grow flex flex-col">
          <div
            class="flex aspect-w-16 aspect-h-9 bg-gray-900"
            ref="elVideoContainer$$q"
          >
            <template v-if="started$$q && (!finished$$q || hash$$q)">
              <live-video
                :live-id="liveId$$q"
                :hash="hash$$q"
                @ready="loading$$q = false"
                @error="error$$q = $event.target.value"
              />
            </template>
            <template v-else>
              <div class="flex w-full h-full items-center justify-center">
                <div class="text-2xl text-white">
                  <template v-if="!started$$q">
                    配信開始までしばらくお待ちください
                  </template>
                  <template v-if="finished$$q && !hash$$q">
                    この配信は終了しました
                  </template>
                </div>
              </div>
            </template>
          </div>
          <div class="my-2">
            <div class="text-2xl leading-tight">
              {{ title$$q }}
            </div>
          </div>
          <div class="font-medium text-gray-700">
            <div class="inline-block">
              {{ humanizedCreatedAt$$q }}
            </div>
            <template v-if="!finished$$q">
              <div class="inline-block ml-4">
                視聴中
                <counter-view
                  :live-id="liveId$$q"
                  :count="viewerCount$$q"
                  class="inline mx-1"
                />
                人
              </div>
              <counter-updater :liveId="liveId$$q" hidden />
            </template>
          </div>
        </div>
        <div class="m-4 flex-grow-0 xl:w-96 flex flex-col">
          <div
            class="bg-white w-full flex-grow flex-shrink overflow-y-auto h-64 xl:h-auto"
            :class="$style.commentsContainer$$q"
            ref="elCommentsContainer$$q"
            @scroll="onCommentsScroll$$q"
          >
            <comment-view
              :class="$style.comments$$q"
              :live-id="liveId$$q"
              :owner-id="ownerId$$q"
              :user-id="userId$$q"
              :comments="comments$$q"
              @update="autoScroll$$q"
            />
          </div>
          <template v-if="!finished$$q">
            <div class="mt-4 w-full">
              <div class="bg-white p-2 border-gray-500 border-b-2">
                <div class="relative">
                  <textarea
                    class="block w-full max-h-32 overflow-auto whitespace-normal break-all bg-transparent outline-none"
                    ref="elTextArea$$q"
                    placeholder="コメントを入力……"
                    v-model="newComment$$q"
                    @keyup.ctrl.enter.stop="postComment$$q"
                  />
                  <div
                    class="absolute top-0 left-0 w-full max-h-32 flex justify-center items-center bg-white bg-opacity-90"
                    ref="elTextAreaSpinner$$q"
                    v-show="newCommentPosting$$q"
                  >
                    <svg
                      class="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600"
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
                    <div>送信中…</div>
                  </div>
                </div>
              </div>
              <div class="flex mt-2">
                <div class="flex-grow">
                  <template v-if="ownerId$$q === userId$$q">
                    <div class="text-green-600 font-bold">
                      あなたが配信者です
                    </div>
                  </template>
                </div>
                <div class="mx-3">
                  <span
                    :class="
                      newComment$$q.length > maxCommentLength$$q
                        ? 'text-red-500'
                        : ''
                    "
                    >{{ newComment$$q.length }}</span
                  >
                  <span class="mx-1">/</span>
                  <span>{{ maxCommentLength$$q }}</span>
                </div>
                <button
                  type="button"
                  class="inline-flex justify-center rounded-sm border border-transparent shadow-sm px-4 text-base font-medium text-white bg-green-600 disabled:bg-green-600 hover:bg-green-700 disabled:opacity-75 disabled:cursor-not-allowed"
                  :disabled="!newCommentOk$$q"
                  @click="postComment$$q"
                >
                  投稿
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>
    <template v-if="error$$q">
      <p class="mt-8 text-xl text-red-500">{{ error$$q }}</p>
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

.comments > :global(.comment--user) > :global(.comment__body) {
  @apply font-bold;
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

@screen xl {
  .comments-container {
    max-height: var(--container-size);
  }
}
</style>
