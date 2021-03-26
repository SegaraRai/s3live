import type {
  GETCommentsResponse,
  GETLiveResponse,
  GETViewersResponse,
  POSTSignupResponse,
} from './apiTypes';

export async function createAccount(): Promise<POSTSignupResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/signup`, {
    method: 'POST',
    headers: [['X-Requested-With', 'fetch']],
  });
  if (!response.ok) {
    throw new Error(`API error POST /signup returned ${response.status}`);
  }
  return (await response.json()) as POSTSignupResponse;
}

export async function fetchLive(liveId: string): Promise<GETLiveResponse> {
  const response = await fetch(
    `${import.meta.env.VITE_API_ENDPOINT}/lives/${liveId}`,
    {
      method: 'GET',
      headers: [['X-Requested-With', 'fetch']],
    }
  );
  if (!response.ok) {
    throw new Error(
      `API error GET /lives/${liveId} returned ${response.status}`
    );
  }
  return (await response.json()) as GETLiveResponse;
}

export async function fetchComments(
  liveId: string
): Promise<GETCommentsResponse> {
  const response = await fetch(
    `${import.meta.env.VITE_API_ENDPOINT}/lives/${liveId}/comments`,
    {
      method: 'GET',
      headers: [['X-Requested-With', 'fetch']],
    }
  );
  if (!response.ok) {
    throw new Error(
      `API error GET /lives/${liveId}/comments returned ${response.status}`
    );
  }
  return (await response.json()) as GETCommentsResponse;
}

export async function fetchViewers(liveId: string): Promise<GETViewersResponse> {
  const response = await fetch(
    `${import.meta.env.VITE_API_ENDPOINT}/lives/${liveId}/viewers`,
    {
      method: 'GET',
      headers: [['X-Requested-With', 'fetch']],
    }
  );
  if (!response.ok) {
    throw new Error(
      `API error GET /lives/${liveId}/viewers returned ${response.status}`
    );
  }
  return (await response.json()) as GETViewersResponse;
}
