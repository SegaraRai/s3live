<script lang="ts">
import { onMounted, ref } from 'vue';
import Hls from 'hls.js';

class CustomFLoader extends Hls.DefaultConfig.loader {
  constructor(config) {
    super(config);
  }

  load(context, config, callbacks) {
    // use CDN for fragment files
    context.url = context.url.replace(/^https:\/\/s3\.[^/]+\//, 'https://');
    return super.load(context, config, callbacks);
  }
}

export default {
  props: {
    src: String,
  },
  setup(props, { emit }) {
    const videoElement$$q = ref<HTMLVideoElement | null>(null);
    const play$$q = ref<() => void>(() => {});
    const ready$$q = ref(false);
    const showControls$$q = ref(false);
    const showOverlay$$q = ref(true);

    onMounted(() => {
      const video = videoElement$$q.value!;
      const videoSrc = props.src;

      let isSupported = false;

      if (Hls.isSupported()) {
        isSupported = true;
        const hls = new Hls({
          fLoader: CustomFLoader,
        });
        hls.loadSource(videoSrc);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        isSupported = true;
        video.src = videoSrc;
      }

      if (!isSupported) {
        emit('error', 'Your browser does not support HLS (HTTP Live Streaming)');
        return;
      }

      video.addEventListener('loadeddata', () => {
        ready$$q.value = true;
        emit('ready');
      }, {
        once: true,
      });

      play$$q.value = () => {
        showControls$$q.value = true;
        showOverlay$$q.value = false;

        video.currentTime = Math.max(video.duration - 3, 0);
        video.play();
      };
    });

    return {
      videoElement$$q,
      play$$q,
      ready$$q,
      showControls$$q,
      showOverlay$$q,
    };
  },
};
</script>

<template>
  <div v-show="ready$$q">
    <video ref="videoElement$$q" class="w-full h-full" :controls="showControls$$q"></video>
    <template v-if="showOverlay$$q">
      <div class="absolute left-0 top-0 w-full h-full flex items-center justify-center bg-white bg-opacity-25">
        <button @click="play$$q" class="text-white">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-32 h-32 hover:opacity-75">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </template>
  </div>
</template>


