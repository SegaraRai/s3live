import { VercelRequest } from '@vercel/node';
import { Response } from 'node-fetch';
import { authLiveId } from '../../../lib/auth';
import { getPusherLiveKey, pusherStartEvent } from '../../../lib/commonConfig';
import { checkCSRF } from '../../../lib/csrf';
import { HTTPError } from '../../../lib/error';
import { createHandler } from '../../../lib/handler';
import { isLiveId } from '../../../lib/id';
import { fetchLiveInfo, updateLiveInfo } from '../../../lib/live';
import pusher from '../../../lib/pusher';
import {
  createPreflightAPIResponse,
  createVoidAPIResponse,
} from '../../../lib/response';

export default createHandler(
  async (req: VercelRequest): Promise<Response> => {
    checkCSRF(req);

    const { liveId: liveIdQ } = req.query;
    if (typeof liveIdQ !== 'string' || !isLiveId(liveIdQ)) {
      throw new HTTPError(404);
    }

    if (req.method === 'OPTIONS') {
      // preflight request
      return createPreflightAPIResponse();
    }

    if (req.method !== 'POST') {
      throw new HTTPError(404);
    }

    const { liveId } = await authLiveId(req);
    if (liveId !== liveIdQ) {
      throw new HTTPError(401);
    }

    const data = await fetchLiveInfo(liveId);
    if (data.startedAt) {
      throw new HTTPError(409);
    }

    await updateLiveInfo(liveId, {
      ...data,
      startedAt: Date.now(),
    });

    await pusher.trigger(getPusherLiveKey(liveId), pusherStartEvent, null);

    return createVoidAPIResponse();
  }
);
