import { Response } from 'node-fetch';

export function createAPIResponse<T = unknown>(payload: T): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: [
      ['Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN],
      ['Content-Type', 'application/json; charset=UTF-8'],
      ['Cache-Control', 'no-store'],
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
