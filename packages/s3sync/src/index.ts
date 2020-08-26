import { readdir, unlink, mkdir, readFile } from 'fs/promises';
import { basename, dirname, join, relative } from 'path';
import { S3 } from '@aws-sdk/client-s3';

/** msec */
const poolInterval = 200 as const;

const liveDataDir = '/live/data' as const;

const archivePlaylistFilename = 'archive.m3u8' as const;
const livePlaylistFilename = 'live.m3u8' as const;

const fragmentMIMEType = 'video/mp2t' as const;
const playlistMIMEType = 'application/vnd.apple.mpegurl' as const;

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  S3_BUCKET_PATH,
  S3_ENDPOINT_URL,
  S3_REGION,
} = process.env;

function sleep(time: number): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(resolve, time);
  });
}

async function proc() {
  const s3 = new S3({
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID!,
      secretAccessKey: AWS_SECRET_ACCESS_KEY!,
    },
    endpoint: S3_ENDPOINT_URL || undefined,
    region: S3_REGION || undefined,
  });

  const playlistFilepath = process.argv[2];

  const streamDir = dirname(playlistFilepath);
  const playlistFilename = basename(playlistFilepath);

  const bucket = S3_BUCKET_PATH!.split('/')[0];

  let keyPrefix = [
    S3_BUCKET_PATH!.split('/').slice(1),
    relative(liveDataDir, streamDir),
  ].filter(x => x).join('/');

  if (keyPrefix) {
    keyPrefix += '/';
  }

  let maxFragmentDuration = 0;
  const archivedFragmentFilenameSet = new Set<string>();
  let archivePlaylistBody = '';

  const uploadFragment = async (filename: string): Promise<void> => {
    try {
      const filepath = join(streamDir, filename);

      const content = await readFile(filepath);

      await s3.putObject({
        Bucket: bucket,
        Key: keyPrefix + filename,
        Body: content,
        ContentType: fragmentMIMEType,
      });

      await unlink(filepath);

      console.log(`[F] uploaded ${filepath}`);
    } catch (error) {
      process.stderr.write(`[ERROR] failed to upload fragment ${filename}\n${error}`);
    }
  };

  const uploadPlaylist = async (filename: string): Promise<void> => {
    try {
      const filepath = join(streamDir, filename);

      const content = await readFile(filepath, 'utf-8');

      const fragments = content
        .split('\n')
        .filter(line => line && /^#EXTINF:|^[^#]/.test(line));

      for (let i = 0; i < fragments.length; i += 2) {
        const [extInf, fragmentFilename] = fragments.slice(i);

        if (archivedFragmentFilenameSet.has(fragmentFilename)) {
          continue;
        }

        archivedFragmentFilenameSet.add(fragmentFilename);
        archivePlaylistBody += extInf + '\n' + fragmentFilename + '\n';

        const fragmentDuration = parseInt(extInf.split(/[:,]/)[1], 10);
        maxFragmentDuration = Math.max(maxFragmentDuration, fragmentDuration);
      }

      const archivePlaylistPreamble = `
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:1
#EXT-X-TARGETDURATION:${Math.ceil(maxFragmentDuration)}
`.trim() + '\n';

      await Promise.all([
        s3.putObject({
          Bucket: bucket,
          Key: keyPrefix + archivePlaylistFilename,
          Body: archivePlaylistPreamble + archivePlaylistBody,
          ContentType: playlistMIMEType,
        }),
        s3.putObject({
          Bucket: bucket,
          Key: keyPrefix + livePlaylistFilename,
          Body: content,
          ContentType: playlistMIMEType,
        }),
      ]);

      console.log(`[P] uploaded ${filepath} (${content.split('\n').filter(x => x && !x.startsWith('#')).join(', ')})`);
    } catch (error) {
      process.stderr.write(`[ERROR] failed to upload playlist ${filename}\n${error}`);
    }
  };

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
        .map(filename => [filename, filename.match(/-(\d+)\.ts$/)] as const)
        .filter(item => item[1])
        .sort((a, b) => parseInt(a[1]![1], 10) - parseInt(b[1]![1], 10))
        .map(item => item[0]);

      // exclude latest (currently processing) .ts file if streaming not finished
      if (!finished) {
        fragmentFilenames.pop();
      }

      if (fragmentFilenames.length === 0) {
        // nothing changed
        continue;
      }

      // upload and delete fragments
      await Promise.all(fragmentFilenames.map(uploadFragment));

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
  await s3.deleteObject({
    Bucket: bucket,
    Key: keyPrefix + livePlaylistFilename,
  });
}

async function main() {
  while (true) {
    await proc();
  }
}

main();
