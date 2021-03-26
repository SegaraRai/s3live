import { VercelRequest } from '@vercel/node';
import { Response } from 'node-fetch';
import type { GETLiveResponse } from '../../lib/apiTypes';
import { checkCSRF } from '../../lib/csrf';
import { HTTPError } from '../../lib/error';
import { createHandler } from '../../lib/handler';
import { isLiveId } from '../../lib/id';
import {
  countLiveViewers,
  fetchLiveComments,
  fetchLiveInfo,
} from '../../lib/live';
import { createAPIResponse } from '../../lib/response';

export default createHandler(
  async (req: VercelRequest): Promise<Response> => {
    checkCSRF(req);

    const { liveId } = req.query;
    if (typeof liveId !== 'string' || !isLiveId(liveId)) {
      throw new HTTPError(404);
    }

    if (req.method !== 'GET') {
      throw new HTTPError(404);
    }

    const [info, comments, viewerCount] = await Promise.all([
      fetchLiveInfo(liveId),
      fetchLiveComments(liveId),
      countLiveViewers(liveId),
    ]);

    return createAPIResponse<GETLiveResponse>({
      live: info,
      viewerCount,
      comments,
    });
  }
);
