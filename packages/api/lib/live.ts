import { viewerCountExpiry } from './commonConfig';
import { redisPlaylistExpiry } from './config';
import { HTTPError } from './error';
import { isLiveId, isUserId } from './id';
import redis, {
  getRedisLiveCommentsKey,
  getRedisLiveKey,
  getRedisLivePlaylistKey,
  getRedisLiveViewerKey,
  getRedisLiveViewersKeyPrefix,
} from './redis';
import type { RedisComment, RedisLive, RedisPlaylist } from './types';

export async function checkLiveIdExistence(liveId: string): Promise<void> {
  if (!isLiveId(liveId) || !(await redis.exists(getRedisLiveKey(liveId)))) {
    throw new HTTPError(404);
  }
}

export async function fetchLiveInfo(liveId: string): Promise<RedisLive> {
  if (!isLiveId(liveId)) {
    throw new HTTPError(404);
  }
  const ret = await redis.get(getRedisLiveKey(liveId));
  if (!ret) {
    throw new HTTPError(404);
  }
  return JSON.parse(ret) as RedisLive;
}

export async function updateLiveInfo(
  liveId: string,
  data: RedisLive
): Promise<void> {
  await redis.set(getRedisLiveKey(liveId), JSON.stringify(data));
}

//

export async function fetchLiveComments(
  liveId: string
): Promise<RedisComment[]> {
  if (!isLiveId(liveId)) {
    throw new HTTPError(404);
  }
  const ret = await redis.lrange(getRedisLiveCommentsKey(liveId), 0, -1);
  return ret.map((value) => JSON.parse(value) as RedisComment);
}

export async function addLiveComment(
  liveId: string,
  data: RedisComment
): Promise<void> {
  await redis.rpush(getRedisLiveCommentsKey(liveId), JSON.stringify(data));
}

export async function fetchLivePlaylist(
  liveId: string
): Promise<RedisPlaylist> {
  if (!isLiveId(liveId)) {
    throw new HTTPError(404);
  }
  const ret = await redis.get(getRedisLivePlaylistKey(liveId));
  if (!ret) {
    throw new HTTPError(404);
  }
  return JSON.parse(ret) as RedisPlaylist;
}

export async function updateLivePlaylist(
  liveId: string,
  data: RedisPlaylist
): Promise<void> {
  await redis.setex(
    getRedisLivePlaylistKey(liveId),
    redisPlaylistExpiry,
    JSON.stringify(data)
  );
}

//

export async function countLiveViewers(liveId: string): Promise<number> {
  if (!isLiveId(liveId)) {
    throw new HTTPError(404);
  }
  const result = await redis.eval(
    `return #redis.pcall('keys','${getRedisLiveViewersKeyPrefix(liveId)}*')`,
    0
  );
  return result;
}

export async function addLiveViewer(
  liveId: string,
  userId: string
): Promise<void> {
  if (!isLiveId(liveId)) {
    throw new HTTPError(404);
  }
  if (!isUserId(userId)) {
    throw new HTTPError(400);
  }
  await redis.setex(
    getRedisLiveViewerKey(liveId, userId),
    viewerCountExpiry,
    1
  );
}
