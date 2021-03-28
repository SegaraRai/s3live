import Hls, { LoaderConfig, LoaderContext, LoaderCallbacks } from 'hls.js';
import { playlistContentType } from './commonConfig';

type CustomLoaderClass = typeof Hls.DefaultConfig.loader;

export interface PlaylistContainer {
  playlist$$q: string | null | undefined;
}

export function createCustomPLoader(
  playlistContainer: PlaylistContainer
): CustomLoaderClass {
  return class extends Hls.DefaultConfig.loader {
    constructor(config: LoaderConfig) {
      super(config);
    }

    load(
      context: LoaderContext,
      config: LoaderConfig,
      callbacks: LoaderCallbacks
    ): void {
      if (context.url.includes('.m3u8') && playlistContainer.playlist$$q) {
        context.url = `data:${playlistContentType},${encodeURIComponent(
          playlistContainer.playlist$$q
        )}`;
      }
      return super.load(context, config, callbacks);
    }
  };
}
