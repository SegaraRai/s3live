import type {
  POSTCommentsRequest,
  POSTLivesRequest,
  POSTLivesResponse,
} from './apiTypes';
import { is } from './is';
import { fetchUserToken } from './userAccount';

export async function postComment(
  liveId: string,
  content: string
): Promise<void> {
  const response = await fetch(
    `${import.meta.env.VITE_API_ENDPOINT}/lives/${liveId}/comments`,
    {
      method: 'POST',
      headers: [
        ['Authorization', `Bearer ${await fetchUserToken()}`],
        ['Content-Type', 'application/json; charset=UTF-8'],
        ['X-Requested-With', 'fetch'],
      ],
      body: JSON.stringify(
        is<POSTCommentsRequest>({
          content,
        })
      ),
    }
  );
  if (!response.ok) {
    throw new Error(
      `API error POST /lives/${liveId}/comment returned ${response.status}`
    );
  }
}

export async function postViewer(liveId: string): Promise<void> {
  const response = await fetch(
    `${import.meta.env.VITE_API_ENDPOINT}/lives/${liveId}/viewers`,
    {
      method: 'POST',
      headers: [
        ['Authorization', `Bearer ${await fetchUserToken()}`],
        ['X-Requested-With', 'fetch'],
      ],
      body: null,
    }
  );
  if (!response.ok) {
    throw new Error(
      `API error POST /lives/${liveId}/comment returned ${response.status}`
    );
  }
}

export async function createLive(
  title: string,
  key: string
): Promise<POSTLivesResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/lives`, {
    method: 'POST',
    headers: [
      ['Authorization', `Bearer ${await fetchUserToken()}`],
      ['Content-Type', 'application/json; charset=UTF-8'],
      ['X-Requested-With', 'fetch'],
    ],
    body: JSON.stringify(
      is<POSTLivesRequest>({
        key,
        title,
      })
    ),
  });
  if (!response.ok) {
    throw new Error(`API error POST /lives returned ${response.status}`);
  }
  return (await response.json()) as POSTLivesResponse;
}
