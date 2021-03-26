import { VercelRequest } from '@vercel/node';
import { Response } from 'node-fetch';
import type { POSTSignupResponse } from '../lib/apiTypes';
import { issueUserIdJWT } from '../lib/auth';
import { checkCSRF } from '../lib/csrf';
import { HTTPError } from '../lib/error';
import { createHandler } from '../lib/handler';
import { generateUserId } from '../lib/id';
import { createAPIResponse } from '../lib/response';

export default createHandler(
  async (req: VercelRequest): Promise<Response> => {
    checkCSRF(req);

    if (req.method !== 'POST') {
      throw new HTTPError(404);
    }

    const userId = generateUserId();
    const token = await issueUserIdJWT(userId);

    return createAPIResponse<POSTSignupResponse>({
      userId,
      token,
    });
  }
);
