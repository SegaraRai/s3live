import { createHmac, createSecretKey } from 'crypto';

const key = createSecretKey(
  Buffer.from(process.env.SECRET_FRAGMENT_HMAC_SECRET, 'ascii')
);

export function generateFragmentDirname(
  userId: string,
  liveId: string
): string {
  return liveId;
}

export function generateFragmentFilename(
  userId: string,
  liveId: string,
  index: number
): string {
  const strIndex = (index + 1).toString().padStart(8, '0');
  const hash = createHmac('sha256', key)
    .update(`${userId}/${liveId}/${strIndex}`)
    .digest('hex');
  return `${strIndex}-${hash}.ts`;
}

export function generateFragmentPathname(
  userId: string,
  liveId: string,
  index: number
): string {
  return `${generateFragmentDirname(userId, liveId)}/${generateFragmentFilename(
    userId,
    liveId,
    index
  )}`;
}

export function generateArchivePlaylistFilename(
  userId: string,
  liveId: string,
): string {
  const hash = createHmac('sha256', key)
    .update(`${userId}/${liveId}/playlist`)
    .digest('hex');
  return `playlist-${hash}.m3u8`;
}
