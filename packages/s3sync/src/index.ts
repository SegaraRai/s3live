import { readdir, unlink, mkdir, readFile } from 'fs/promises';
import { basename, dirname, join, relative } from 'path';
import { S3 } from '@aws-sdk/client-s3';

/** msec */
const poolInterval = 100 as const;
/** msec */
const finishWait = 10000 as const;

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

async function main() {
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
    relative('/live/data', streamDir),
  ].filter(x => x).join('/');

  if (keyPrefix) {
    keyPrefix += '/';
  }

  const uploadFragment = async (filename: string): Promise<void> => {
    try {
      const filepath = join(streamDir, filename);

      const content = await readFile(filepath);

      await s3.putObject({
        Bucket: bucket,
        Key: keyPrefix + filename,
        Body: content,
        ContentType: 'video/mp2t',
      });
      console.log(`uploaded ${filepath}`);

      await unlink(filepath);
      console.log(`>deleted ${filepath}`);
    } catch (error) {
      process.stderr.write(`[ERROR] failed to upload fragment ${filename}\n${error}`);
    }
  };

  const uploadPlaylist = async (filename: string): Promise<void> => {
    try {
      const filepath = join(streamDir, filename);

      const content = await readFile(filepath, 'utf-8');

      await s3.putObject({
        Bucket: bucket,
        Key: keyPrefix + filename,
        Body: content,
        ContentType: 'application/vnd.apple.mpegurl',
      });
      console.log(`uploaded ${filepath} (${content.split('\n').filter(x => x && !x.startsWith('#')).join(', ')})`);
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

  let lastUpload;

  // watch
  while (true) {
    await sleep(poolInterval);

    try {
      const files = await readdir(streamDir);

      // list .ts files in ascending order
      const fragmentFilenames = files
        .map(filename => [filename, filename.match(/-(\d+)\.ts$/)] as const)
        .filter(item => item[1])
        .sort((a, b) => parseInt(a[1]![1], 10) - parseInt(b[1]![1], 10))
        .map(item => item[0]);

      // exclude latest (currently processing) .ts file if streaming not finished
      if (!lastUpload || Date.now() - lastUpload <= finishWait) {
        fragmentFilenames.pop();
      }

      if (fragmentFilenames.length === 0) {
        // nothing changed
        continue;
      }

      // upload and delete fragments
      await Promise.all(fragmentFilenames.map(uploadFragment));

      // upload playlist
      await uploadPlaylist(playlistFilename);

      lastUpload = Date.now();
    } catch (error) {
      process.stderr.write(`[ERROR] error occurred in main loop\n${error}`);
    }
  }
}

main();
