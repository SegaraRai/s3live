import Redis from 'ioredis';

export default new Redis(process.env.SECRET_REDIS_URI);

export function getRedisLiveKey(liveId: string): string {
  return `l@l:${liveId}`;
}

export function getRedisLivePlaylistKey(liveId: string): string {
  return `p@l:${liveId}`;
}

export function getRedisLiveCommentsKey(liveId: string): string {
  return `c@l:${liveId}`;
}

export function getRedisLiveViewersKeyPrefix(liveId: string): string {
  return `v@l:${liveId}:v:`;
}

export function getRedisLiveViewerKey(liveId: string, userId: string): string {
  return `v@l:${liveId}:v:${userId}`;
}
