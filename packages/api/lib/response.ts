import { Response } from 'node-fetch';

export function createAPIResponse<T = unknown>(
  payload: T,
  isHEAD = false
): Response {
  return new Response(isHEAD ? null : JSON.stringify(payload, null, 2), {
    status: 200,
    headers: [
      ['Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN],
      ['Content-Type', 'application/json; charset=UTF-8'],
      ['Cache-Control', 'no-store'],
    ],
  });
}

export function createPreflightAPIResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: [
      ['Allow', 'GET, HEAD, OPTIONS, POST'],
      ['Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST'],
      ['Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With'],
      ['Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN],
      ['Cache-Control', 'public'],
    ],
  });
}

export function createVoidAPIResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: [
      ['Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN],
      ['Cache-Control', 'no-store'],
    ],
  });
}
