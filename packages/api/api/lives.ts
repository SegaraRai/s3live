import { VercelRequest } from '@vercel/node';
import { Response } from 'node-fetch';
import type { POSTLivesRequest, POSTLivesResponse } from '../lib/apiTypes';
import { authUserId, issueLiveIdJWT } from '../lib/auth';
import { Live } from '../lib/commonTypes';
import { checkCSRF } from '../lib/csrf';
import { HTTPError } from '../lib/error';
import { createHandler } from '../lib/handler';
import { generateLiveId } from '../lib/id';
import redis, { getRedisLiveKey } from '../lib/redis';
import { createAPIResponse, createPreflightAPIResponse } from '../lib/response';
import { validate } from '../lib/validate';

export default createHandler(
  async (req: VercelRequest): Promise<Response> => {
    checkCSRF(req);

    if (req.method === 'OPTIONS') {
      // preflight request
      return createPreflightAPIResponse();
    }

    if (req.method !== 'POST') {
      throw new HTTPError(404);
    }

    // create live streaming

    const { userId } = await authUserId(req);

    const liveId = generateLiveId();

    const token = await issueLiveIdJWT(userId, liveId);

    const { key, title } = validate<POSTLivesRequest>(req.body, {
      type: 'object',
      required: ['title', 'key'],
      additionalProperties: false,
      properties: {
        title: {
          type: 'string',
          pattern: '\\S',
        },
        key: {
          type: 'string',
        },
      },
    });

    if (key !== 'graneple') {
      throw new HTTPError(403);
    }

    const liveInfo: Live = {
      id: liveId,
      userId,
      title,
      createdAt: Date.now(),
      startedAt: null,
      finishedAt: null,
    };

    await redis.set(getRedisLiveKey(liveId), JSON.stringify(liveInfo));

    return createAPIResponse<POSTLivesResponse>({
      liveId,
      token,
    });
  }
);
