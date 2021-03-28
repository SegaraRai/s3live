import type { Comment, Live, ViewerCount } from './commonTypes';

//

export interface POSTSignupResponse {
  readonly userId: string;
  readonly token: string;
}

//

export interface GETLiveResponse {
  readonly live: Live;
  readonly viewerCount: number;
  readonly comments: readonly Comment[];
}

//

export type GETCommentsResponse = Comment[];

export interface POSTCommentsRequest {
  readonly content: string;
}

//

export interface POSTPlaylistRequest {
  readonly firstIndex: number;
  readonly targetDuration: number;
  readonly fragmentDurations: readonly number[];
}

//

export interface GETViewersResponse {
  readonly viewerCount: number;
}

//

export interface POSTFinishRequest {
  readonly fragmentDurations: readonly number[];
}

export interface POSTFinishResponse {
  readonly playlistKey: string;
}

//

export interface POSTLivesRequest {
  readonly key: string;
  readonly title: string;
}

export interface POSTLivesResponse {
  readonly liveId: string;
  readonly token: string;
}

//

export interface GETLivesURLsResponseURL {
  readonly index: number;
  readonly url: string;
}

export type GETLivesURLsResponse = readonly GETLivesURLsResponseURL[];

//

export type PusherEventDataComment = Comment;
export type PusherEventDataViewerCount = ViewerCount;
export type PusherEventDataPlaylist = string;
