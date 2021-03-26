import { VercelRequest } from '@vercel/node';
import { Response } from 'node-fetch';
import type { GETLivesURLsResponse } from '../../../lib/apiTypes';
import { authLiveId } from '../../../lib/auth';
import { checkCSRF } from '../../../lib/csrf';
import { HTTPError } from '../../../lib/error';
import { generateFragmentPathname } from '../../../lib/fragment';
import { createHandler } from '../../../lib/handler';
import { isLiveId } from '../../../lib/id';
import { createAPIResponse } from '../../../lib/response';
import { getSignedS3URL } from '../../../lib/s3';

const maxNum = 100;

export default createHandler(
  async (req: VercelRequest): Promise<Response> => {
    checkCSRF(req);

    const { liveId: liveIdQ } = req.query;
    if (typeof liveIdQ !== 'string' || !isLiveId(liveIdQ)) {
      throw new HTTPError(404);
    }

    const { liveId, userId } = await authLiveId(req);
    if (liveId !== liveIdQ) {
      throw new HTTPError(401);
    }

    if (req.method !== 'GET') {
      throw new HTTPError(404);
    }

    const from = parseInt(String(req.query.from) || '', 10);
    if (isNaN(from) || from < 0) {
      throw new HTTPError(400);
    }

    const num = parseInt(String(req.query.num) || '', 10);
    if (isNaN(num) || num < 1 || num > maxNum) {
      throw new HTTPError(400);
    }

    const urls: GETLivesURLsResponse = await Promise.all(
      new Array(num).fill(0).map(async (_, i) => {
        const index = i + from;
        return {
          index: i,
          url: await getSignedS3URL(
            generateFragmentPathname(userId, liveId, index)
          ),
        };
      })
    );

    return createAPIResponse<GETLivesURLsResponse>(urls);
  }
);
