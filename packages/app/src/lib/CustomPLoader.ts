import Hls, { LoaderConfig, LoaderContext, LoaderCallbacks } from 'hls.js';

export class CustomPLoader extends Hls.DefaultConfig.loader {
  constructor(config: LoaderConfig) {
    super(config);
  }

  load(
    context: LoaderContext,
    config: LoaderConfig,
    callbacks: LoaderCallbacks
  ): void {
    const orgOnSuccessCallback = callbacks.onSuccess;
    callbacks = {
      ...callbacks,
      onSuccess(response, stats, context): void {
        // add future fragments speculatively
        if (typeof response.data === 'string') {
          if (!response.data.endsWith('\n')) {
            response.data += '\n';
          }

          // TODO: サーバーの時刻と同期する
          const clientTimestamp = Date.now() - 1000;
          const lines = response.data.split('\n');
          const durations: number[] = [];
          let timestamp: number | undefined;
          let finalFragmentFilename: string[] | undefined;
          for (const line of lines) {
            let match: RegExpMatchArray | null;
            if ((match = line.match(/^#EXTINF:(\d+(?:\.\d*)?)/))) {
              durations.push(parseFloat(match[1]));
            } else if ((match = line.match(/^#X-TIMESTAMP:(\d+)/))) {
              timestamp = parseInt(match[1], 10);
            } else if (
              /^[^#]/.test(line) &&
              (match = line.match(/^(.+?)(\d+)(.ts)$/))
            ) {
              finalFragmentFilename = match;
            }
          }
          if (timestamp && finalFragmentFilename && durations.length) {
            const maxDuration = Math.ceil(Math.max(...durations));
            const maxDurationMsec = maxDuration * 1000;
            let t = timestamp + maxDurationMsec;
            let i = parseInt(finalFragmentFilename[2], 10) + 1;
            while (t < clientTimestamp) {
              const fragmentFilename = [
                finalFragmentFilename[1],
                i.toString(),
                finalFragmentFilename[3],
              ].join('');
              response.data += `#EXTINF:${maxDuration.toFixed(
                6
              )},\n${fragmentFilename}\n`;
              i++;
              t += maxDurationMsec;
            }
          }
        }
        //console.log(response.data);
        return orgOnSuccessCallback.call(this, response, stats, context);
      },
    };
    return super.load(context, config, callbacks);
  }
}
