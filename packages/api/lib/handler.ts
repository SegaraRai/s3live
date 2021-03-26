import type { VercelApiHandler, VercelRequest } from '@vercel/node';
import type { Response } from 'node-fetch';
import { createResponseFromError } from './error';

export type Handler = (req: VercelRequest) => Response | Promise<Response>;

export function createHandler(handler: Handler): VercelApiHandler {
  return (req, res) => {
    const respond = async (response: Response): Promise<void> => {
      res.status(response.status);
      for (const [key, value] of response.headers) {
        res.setHeader(key, value);
      }
      res.send(await response.buffer());
    };

    (async (): Promise<Response> => {
      try {
        return await handler(req);
      } catch (error) {
        return createResponseFromError(error);
      }
    })().then(respond);
  };
}
