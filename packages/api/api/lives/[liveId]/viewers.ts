import { VercelRequest } from '@vercel/node';
import { Response } from 'node-fetch';
import type {
  GETViewersResponse,
  PusherEventDataViewerCount,
} from '../../../lib/apiTypes';
import { authUserId } from '../../../lib/auth';
import {
  getPusherLiveKey,
  pusherViewerCountEvent,
} from '../../../lib/commonConfig';
import { checkCSRF } from '../../../lib/csrf';
import { HTTPError } from '../../../lib/error';
import { createHandler } from '../../../lib/handler';
import { isLiveId } from '../../../lib/id';
import { is } from '../../../lib/is';
import {
  addLiveViewer,
  checkLiveIdExistence,
  countLiveViewers,
} from '../../../lib/live';
import pusher from '../../../lib/pusher';
import {
  createAPIResponse,
  createVoidAPIResponse,
} from '../../../lib/response';

export default createHandler(
  async (req: VercelRequest): Promise<Response> => {
    checkCSRF(req);

    const { liveId } = req.query;
    if (typeof liveId !== 'string' || !isLiveId(liveId)) {
      throw new HTTPError(404);
    }

    await checkLiveIdExistence(liveId);

    if (req.method === 'GET') {
      // count viewers
      return createAPIResponse<GETViewersResponse>({
        viewerCount: await countLiveViewers(liveId),
      });
    } else if (req.method === 'POST') {
      // add viewer
      const { userId } = await authUserId(req);

      await addLiveViewer(liveId, userId);

      await pusher.trigger(
        getPusherLiveKey(liveId),
        pusherViewerCountEvent,
        is<PusherEventDataViewerCount>({
          viewerCount: await countLiveViewers(liveId),
        })
      );

      return createVoidAPIResponse();
    }

    throw new HTTPError(404);
  }
);
