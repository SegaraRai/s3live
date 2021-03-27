import LRUCache from 'lru-cache';
import fetch from 'node-fetch';
import type {
  GETLivesURLsResponse,
  GETLivesURLsResponseURL,
  POSTFinishRequest,
  POSTFinishResponse,
  POSTPlaylistRequest,
} from './apiTypes';
import { apiEndpoint } from './config';

const cache = new LRUCache<number, Promise<readonly GETLivesURLsResponseURL[]>>(
  {
    max: 5,
  }
);

const urlsPerPage = 50;

async function fetchSignedURLPage(
  liveId: string,
  token: string,
  index: number
): Promise<string> {
  const key = Math.floor(index / urlsPerPage);
  if (!cache.has(key)) {
    cache.set(
      key,
      (async () => {
        const response = await fetch(
          `${apiEndpoint}/lives/${liveId}/urls?from=${
            key * urlsPerPage
          }&num=${urlsPerPage}`,
          {
            method: 'GET',
            headers: [
              ['Authorization', `Bearer ${token}`],
              ['X-Requested-With', 'node-fetch'],
            ],
          }
        );
        if (!response.ok) {
          throw new Error(`API error ${response.status} at fetchSignedURLPage`);
        }
        const urls = (await response.json()) as GETLivesURLsResponse;
        return urls;
      })()
    );
  }
  const page = await cache.get(key)!;
  return page.find((item) => item.index === index)!.url;
}

export async function fetchLiveFragmentURL(
  liveId: string,
  token: string,
  index: number
): Promise<string> {
  fetchSignedURLPage(liveId, token, index + 10);
  return await fetchSignedURLPage(liveId, token, index);
}

export async function startLive(liveId: string, token: string): Promise<void> {
  const response = await fetch(`${apiEndpoint}/lives/${liveId}/start`, {
    method: 'POST',
    headers: [
      ['Authorization', `Bearer ${token}`],
      ['X-Requested-With', 'node-fetch'],
    ],
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status} at startLive`);
  }
}

export async function finishLive(
  liveId: string,
  token: string,
  payload: POSTFinishRequest
): Promise<POSTFinishResponse> {
  const response = await fetch(`${apiEndpoint}/lives/${liveId}/finish`, {
    method: 'POST',
    headers: [
      ['Authorization', `Bearer ${token}`],
      ['Content-Type', 'application/json; charset=UTF-8'],
      ['X-Requested-With', 'node-fetch'],
    ],
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status} at finishLive`);
  }
  return (await response.json()) as POSTFinishResponse;
}

export async function uploadLivePlaylist(
  liveId: string,
  token: string,
  payload: POSTPlaylistRequest
): Promise<void> {
  const response = await fetch(`${apiEndpoint}/lives/${liveId}/playlist.m3u8`, {
    method: 'POST',
    headers: [
      ['Authorization', `Bearer ${token}`],
      ['Content-Type', 'application/json; charset=UTF-8'],
      ['X-Requested-With', 'node-fetch'],
    ],
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status} at uploadLivePlaylist`);
  }
}
