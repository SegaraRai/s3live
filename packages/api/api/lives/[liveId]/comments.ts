import { VercelRequest } from '@vercel/node';
import { Response } from 'node-fetch';
import type {
  GETCommentsResponse,
  POSTCommentsRequest,
  PusherEventDataComment,
} from '../../../lib/apiTypes';
import { authUserId } from '../../../lib/auth';
import {
  getPusherLiveKey,
  maxCommentLength,
  pusherCommentEvent,
} from '../../../lib/commonConfig';
import type { Comment } from '../../../lib/commonTypes';
import { checkCSRF } from '../../../lib/csrf';
import { HTTPError } from '../../../lib/error';
import { createHandler } from '../../../lib/handler';
import { generateCommentId, isLiveId } from '../../../lib/id';
import { is } from '../../../lib/is';
import {
  addLiveComment,
  fetchLiveComments,
  fetchLiveInfo,
} from '../../../lib/live';
import pusher from '../../../lib/pusher';
import {
  createAPIResponse,
  createPreflightAPIResponse,
  createVoidAPIResponse,
} from '../../../lib/response';
import { validate } from '../../../lib/validate';

export default createHandler(
  async (req: VercelRequest): Promise<Response> => {
    checkCSRF(req);

    const { liveId } = req.query;
    if (typeof liveId !== 'string' || !isLiveId(liveId)) {
      throw new HTTPError(404);
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      // get all comments
      return createAPIResponse<GETCommentsResponse>(
        await fetchLiveComments(liveId),
        req.method === 'HEAD'
      );
    } else if (req.method === 'OPTIONS') {
      // preflight request
      return createPreflightAPIResponse();
    } else if (req.method === 'POST') {
      // post comment
      const { userId } = await authUserId(req);

      const liveInfo = await fetchLiveInfo(liveId);
      if (liveInfo.finishedAt) {
        throw new HTTPError(409);
      }

      const body = validate<POSTCommentsRequest>(req.body, {
        type: 'object',
        required: ['content'],
        additionalProperties: false,
        properties: {
          content: {
            type: 'string',
            pattern: '\\S',
            minLength: 1,
            maxLength: maxCommentLength,
          },
        },
      });

      const id = generateCommentId();
      const timestamp = Date.now();
      const content = body.content.trim();

      const comment: Comment = {
        userId,
        id,
        timestamp,
        content,
      };

      await Promise.all([
        addLiveComment(liveId, comment),
        pusher.trigger(
          getPusherLiveKey(liveId),
          pusherCommentEvent,
          is<PusherEventDataComment>(comment)
        ),
      ]);

      return createVoidAPIResponse();
    }

    throw new HTTPError(404);
  }
);
