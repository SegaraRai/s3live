export const fragmentCacheControl = 'public, immutable';
export const fragmentContentType = 'video/mp2t';

export const playlistCacheControl = 'public, no-cache';
export const playlistContentType = 'application/vnd.apple.mpegurl';

export const archivePlaylistCacheControl = 'public, immutable';

export const maxTitleLength = 60;

export const maxCommentLength = 200;

export const presignedURLExpiry = 600;

export const viewerCountExpiry = 60;
export const viewerCountUpdate = viewerCountExpiry - 10;

export const viewerCountViewUpdate = 30;

export function getPusherLiveKey(liveId: string): string {
  return `l_${liveId}`;
}

export const pusherCommentEvent = 'c';
export const pusherViewerCountEvent = 'v';
export const pusherPlaylistEvent = 'p';
export const pusherStartEvent = 's';
export const pusherFinishEvent = 'f';

export const fragmentsPerPlaylist = 3;
