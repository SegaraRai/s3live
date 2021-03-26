import type { Comment, Live } from './commonTypes';

export type RedisLive = Live;

export type RedisComment = Comment;

export interface RedisPlaylist {
  readonly userId: string;
  readonly firstIndex: number;
  readonly targetDuration: number;
  readonly fragmentDurations: readonly number[];
}
