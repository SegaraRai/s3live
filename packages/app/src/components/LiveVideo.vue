<script lang="ts">
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import Hls from 'hls.js';
//import { CustomFLoader } from '../lib/CustomFLoader';
import { PlaylistContainer, createCustomPLoader } from '../lib/CustomPLoader';
import type { PusherEventDataPlaylist } from '../lib/apiTypes';
import {
  getPusherLiveKey,
  playlistContentType,
  pusherPlaylistEvent,
} from '../lib/commonConfig';
import pusher from '../lib/pusher';
import { Channel } from 'pusher-js';

export default defineComponent({
  props: {
    liveId: String,
    hash: String,
  },
  setup(props, { emit }) {
    const elVideo$$q = ref<HTMLVideoElement | null>(null);

    const liveId$$q = computed(() => props.liveId);
    const hash$$q = computed(() => props.hash);

    const isLive$$q = computed(() => !hash$$q.value);
    const src$$q = computed(() =>
      isLive$$q.value
        ? `${import.meta.env.VITE_API_ENDPOINT}/lives/${
            liveId$$q.value
          }/playlist.m3u8`
        : `${import.meta.env.VITE_FRAGMENT_ENDPOINT}/${
            liveId$$q.value
          }/playlist-${hash$$q.value}.m3u8`
    );

    const play$$q = ref<() => void>(() => {});
    const ready$$q = ref(false);
    const showControls$$q = ref(false);
    const showOverlay$$q = ref(true);

    //
    const playlistContainer: PlaylistContainer = {
      playlist$$q: '',
    };

    let channel: Channel | undefined;
    const cleanupChannel = () => {
      if (channel) {
        console.log('pcp', liveId$$q.value);
        //channel.unbind(pusherPlaylistEvent);
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
        playlistContainer.playlist$$q = '';

        console.log('pbp', currentLiveId);
        if (currentLiveId) {
          channel = pusher.subscribe(getPusherLiveKey(currentLiveId));
          channel.bind(
            pusherPlaylistEvent,
            (newPlaylist: PusherEventDataPlaylist) => {
              console.log(
                'pp',
                liveId$$q.value,
                currentLiveId,
                newPlaylist,
                playlistContainer
              );
              if (liveId$$q.value !== currentLiveId) {
                return;
              }
              playlistContainer.playlist$$q = newPlaylist;
            }
          );
        }
      },
      {
        immediate: true,
      }
    );
    onBeforeUnmount(cleanupChannel);

    //

    let hls: Hls | undefined;

    onMounted(() => {
      const video = elVideo$$q.value!;
      const videoSrc = src$$q.value;

      let isSupported = false;

      if (Hls.isSupported()) {
        isSupported = true;
        hls = new Hls({
          enableWorker: import.meta.env === 'production',
          //fLoader: CustomFLoader,
          pLoader: createCustomPLoader(playlistContainer),
        });
        hls.on('hlsError', (event, data) => {
          if (
            data.type === 'networkError' &&
            data.url.includes('.m3u8') &&
            data.response.code === 404
          ) {
            emit('finish');
          }
        });
        hls.loadSource(videoSrc);
        hls.attachMedia(video);
      } else if (video.canPlayType(playlistContentType)) {
        isSupported = true;
        video.src = videoSrc;
      }

      if (!isSupported) {
        emit(
          'error',
          'Your browser does not support HLS (HTTP Live Streaming)'
        );
        return;
      }

      video.addEventListener(
        'loadeddata',
        () => {
          ready$$q.value = true;
          emit('ready');
        },
        {
          once: true,
        }
      );

      play$$q.value = () => {
        play$$q.value = () => {};

        showControls$$q.value = true;
        showOverlay$$q.value = false;

        video.currentTime = isLive$$q.value
          ? Math.max(video.duration - 3, 0)
          : 0;
        video.play();
      };
    });

    onBeforeUnmount(() => {
      hls?.destroy();
    });

    return {
      elVideo$$q,
      play$$q,
      ready$$q,
      showControls$$q,
      showOverlay$$q,
    };
  },
});
</script>

<template>
  <div v-show="ready$$q">
    <video
      ref="elVideo$$q"
      class="w-full h-full"
      :controls="showControls$$q"
    ></video>
    <template v-if="showOverlay$$q">
      <div
        class="absolute left-0 top-0 w-full h-full flex items-center justify-center bg-white bg-opacity-25"
      >
        <button @click="play$$q" class="text-white focus:outline-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            class="w-32 h-32 hover:opacity-75"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </template>
  </div>
</template>
