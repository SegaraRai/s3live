import Hls, { LoaderCallbacks, LoaderConfig, LoaderContext } from 'hls.js';

export class CustomFLoader extends Hls.DefaultConfig.loader {
  constructor(config: LoaderConfig) {
    super(config);
  }

  load(
    context: LoaderContext,
    config: LoaderConfig,
    callbacks: LoaderCallbacks
  ): void {
    // use CDN for fragment files
    context.url = context.url.replace(/^https:\/\/s3\.[^/]+\//, 'https://');
    return super.load(context, config, callbacks);
  }
}
