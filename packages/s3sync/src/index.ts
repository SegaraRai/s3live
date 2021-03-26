import { readdir, unlink, mkdir, readFile } from 'fs/promises';
import LRUCache from 'lru-cache';
import { basename, dirname, join } from 'path';
import {
  fetchLiveFragmentURL,
  finishLive,
  startLive,
  uploadLivePlaylist,
} from './api';
import {
  fragmentCacheControl,
  fragmentContentType,
  fragmentsPerPlaylist,
} from './commonConfig';

/** msec */
const poolInterval = 200 as const;

function sleep(time: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, time);
  });
}

async function proc(liveId: string, token: string) {
  const playlistFilepath = process.argv[2];

  const streamDir = dirname(playlistFilepath);
  const playlistFilename = basename(playlistFilepath);

  const indexToDuration: number[] = [];
  const filenameToIndex = new LRUCache<string, number>({
    max: 10,
  });

  let lastFragmentIndex = -1;

  const uploadFragment = async (
    filename: string,
    index: number
  ): Promise<void> => {
    try {
      const filepath = join(streamDir, filename);
      const content = await readFile(filepath);
      const response = await fetch(
        await fetchLiveFragmentURL(liveId, token, index),
        {
          method: 'PUT',
          headers: [
            ['Cache-Control', fragmentCacheControl],
            ['Content-Type', fragmentContentType],
          ],
          body: content,
        }
      );
      if (!response.ok) {
        throw new Error('failed to upload fragment');
      }
      await unlink(filepath);

      console.log(`[F] uploaded ${filepath}`);
    } catch (error) {
      process.stderr.write(
        `[ERROR] failed to upload fragment ${filename}\n${error}`
      );
    }
  };

  const uploadPlaylist = async (filename: string): Promise<void> => {
    try {
      const filepath = join(streamDir, filename);
      const content = await readFile(filepath, 'utf-8');

      let targetDuration: number | undefined;
      const indices: number[] = [];
      let nextDuration: number | undefined;
      for (const line of content.split(/\r?\n/)) {
        if (!line) {
          continue;
        }

        let match: RegExpMatchArray | null;
        if ((match = line.match(/^#EXTINF:([\d.]+)/))) {
          nextDuration = parseFloat(match[1]);
        } else if ((match = line.match(/^#EXT-X-TARGETDURATION:([\d.]+)/))) {
          targetDuration = Math.ceil(parseFloat(match[1]));
        } else if (/^[^#]/.test(line)) {
          if (!nextDuration) {
            throw new Error('nextDuration not specified');
          }
          const index = filenameToIndex.get(line);
          if (index == null) {
            throw new Error(`index of ${line} not registered`);
          }
          indexToDuration[index] = nextDuration;
          indices.push(index);
          nextDuration = undefined;
        }
      }

      if (indices.some((index, i) => index !== i + indices[0])) {
        throw new Error('invalid indices');
      }

      const firstIndex = Math.max(
        lastFragmentIndex - fragmentsPerPlaylist + 1,
        0
      );
      const fragmentDurations: number[] = [];
      for (let index = firstIndex; index <= lastFragmentIndex; index++) {
        const duration = indexToDuration[index];
        if (!duration) {
          throw new Error(`duration of ${index} not registered`);
        }
        fragmentDurations.push(duration);
      }

      if (!targetDuration) {
        targetDuration = Math.ceil(Math.max(...fragmentDurations));
      }

      await uploadLivePlaylist(liveId, token, {
        firstIndex,
        fragmentDurations,
        targetDuration,
      });

      console.log(
        `[P] uploaded ${filepath} (${content
          .split('\n')
          .filter((x) => x && !x.startsWith('#'))
          .join(', ')})`
      );
    } catch (error) {
      process.stderr.write(
        `[ERROR] failed to upload playlist ${filename}\n${error}`
      );
    }
  };

  // start live
  await startLive(liveId, token);

  // create stream dir
  try {
    await mkdir(streamDir, {
      recursive: true,
    });
  } catch (_error) {
    // do nothing
  }

  // watch loop
  let started = false;
  let finished = false;
  while (!finished) {
    await sleep(poolInterval);

    try {
      const files = await readdir(streamDir);

      if (!files.includes(playlistFilename)) {
        if (!started) {
          continue;
        }

        finished = true;
      }

      started = true;

      // list .ts files in ascending order
      const fragmentFilenames = files
        .map((filename) => [filename, filename.match(/(\d+)\.ts$/)] as const)
        .filter((item) => item[1])
        .sort((a, b) => parseInt(a[1]![1], 10) - parseInt(b[1]![1], 10))
        .map((item) => item[0]);

      // exclude latest (currently processing) .ts file if streaming not finished
      if (!finished) {
        fragmentFilenames.pop();
      }

      if (fragmentFilenames.length === 0) {
        // nothing changed
        continue;
      }

      for (const filename of fragmentFilenames) {
        if (!filenameToIndex.has(filename)) {
          filenameToIndex.set(filename, ++lastFragmentIndex);
        }
      }

      // upload and delete fragments
      await Promise.all(
        fragmentFilenames.map((filename) =>
          uploadFragment(filename, filenameToIndex.get(filename)!)
        )
      );

      // upload playlist
      if (!finished) {
        await uploadPlaylist(playlistFilename);
      }
    } catch (error) {
      process.stderr.write(`[ERROR] error occurred in main loop\n${error}`);
    }
  }

  // live streaming finished

  // delete live.m3u8
  const { playlistKey } = await finishLive(liveId, token, {
    fragmentDurations: indexToDuration,
  });

  console.log(`finished; playlistKey = ${playlistKey}`);
}

async function main() {
  const [, , liveId, token] = process.argv;
  while (true) {
    await proc(liveId, token);
  }
}

main();
