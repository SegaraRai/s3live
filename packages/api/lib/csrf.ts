import { VercelRequest } from '@vercel/node';
import { HTTPError } from './error';

export function checkCSRF(
  req: VercelRequest,
  allowNoCustomHeader = false
): void {
  if (!allowNoCustomHeader && req.method !== 'OPTIONS' && !req.headers['x-requested-with']) {
    throw new HTTPError(403);
  }
  if (
    req.headers.origin &&
    req.headers.origin !== process.env.FRONTEND_ORIGIN
  ) {
    throw new HTTPError(403);
  }
}
