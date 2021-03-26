import type { POSTSignupResponse } from './apiTypes';

let createAccountPromise: Promise<POSTSignupResponse> | undefined;

export async function fetchUserToken(): Promise<string> {
  let token = localStorage.getItem('token');
  if (!token) {
    if (!createAccountPromise) {
      createAccountPromise = (async () => {
        const response = await fetch(
          `${import.meta.env.VITE_API_ENDPOINT}/signup`,
          {
            method: 'POST',
            headers: [['X-Requested-With', 'fetch']],
          }
        );
        if (!response.ok) {
          throw new Error('');
        }
        return (await response.json()) as POSTSignupResponse;
      })();
    }
    const { token: tokenRet, userId } = await createAccountPromise;
    token = tokenRet;
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
  }
  return token;
}

export async function fetchUserId(): Promise<string> {
  await fetchUserToken();
  return localStorage.getItem('userId')!;
}
