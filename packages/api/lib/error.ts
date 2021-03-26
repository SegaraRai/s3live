import { Response } from 'node-fetch';

export class HTTPError extends Error {
  constructor(
    public readonly status: number,
    public readonly httpMessage = ''
  ) {
    super(`HTTPError ${status}\n${httpMessage}`.trimRight());

    this.name = 'HTTPError';

    console.error(this.name, this.message);
  }
}

export function createResponseFromError(error: unknown): Response {
  const status = error instanceof HTTPError ? error.status : 500;
  const body = error instanceof Error ? error.message : String(error);

  return new Response(body, {
    status,
    headers: [
      ['Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN],
      ['Cache-Control', 'no-store'],
      ['Content-Type', 'text/plain; charset=UTF-8'],
    ],
  });
}
