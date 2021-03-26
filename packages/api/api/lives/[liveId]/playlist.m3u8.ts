import { VercelRequest } from '@vercel/node';
import { Response } from 'node-fetch';
import type { POSTPlaylistRequest } from '../../../lib/apiTypes';
import { authLiveId } from '../../../lib/auth';
import {
  fragmentsPerPlaylist,
  playlistCacheControl,
  playlistContentType,
} from '../../../lib/commonConfig';
import { checkCSRF } from '../../../lib/csrf';
import { HTTPError } from '../../../lib/error';
import { generateFragmentPathname } from '../../../lib/fragment';
import { createHandler } from '../../../lib/handler';
import { isLiveId } from '../../../lib/id';
import { fetchLivePlaylist, updateLivePlaylist } from '../../../lib/live';
import {
  createPreflightAPIResponse,
  createVoidAPIResponse,
} from '../../../lib/response';
import type { RedisPlaylist } from '../../../lib/types';
import { validate } from '../../../lib/validate';

export default createHandler(
  async (req: VercelRequest): Promise<Response> => {
    const { liveId } = req.query;
    if (typeof liveId !== 'string' || !isLiveId(liveId)) {
      throw new HTTPError(404);
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      checkCSRF(req, true);

      const playlist = await fetchLivePlaylist(liveId);
      let strPlaylist = `#EXTM3U
#EXT-X-TARGETDURATION:${playlist.targetDuration}
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:${playlist.firstIndex + 1}
`;
      for (const [index, duration] of playlist.fragmentDurations.entries()) {
        strPlaylist += `#EXTINF:${duration.toFixed(6)},
${process.env.FRAGMENT_BASE_URI}/${generateFragmentPathname(
          playlist.userId,
          liveId,
          playlist.firstIndex + index
        )}
`;
      }
      return new Response(req.method === 'HEAD' ? null : strPlaylist, {
        status: 200,
        headers: [
          ['Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN],
          ['Cache-Control', playlistCacheControl],
          ['Content-Type', playlistContentType],
        ],
      });
    } else if (req.method === 'OPTIONS') {
      // preflight request
      return createPreflightAPIResponse();
    } else if (req.method === 'POST') {
      checkCSRF(req);

      const { liveId: liveId2, userId } = await authLiveId(req);
      if (liveId2 !== liveId) {
        throw new HTTPError(401);
      }

      const body = validate<POSTPlaylistRequest>(req.body, {
        type: 'object',
        required: ['firstIndex', 'targetDuration', 'fragmentDurations'],
        additionalProperties: false,
        properties: {
          firstIndex: {
            type: 'integer',
            minimum: 1,
          },
          targetDuration: {
            type: 'integer',
            minimum: 1,
          },
          fragmentDurations: {
            type: 'array',
            minItems: 1,
            maxItems: fragmentsPerPlaylist,
            items: {
              type: 'number',
              minimum: 0.01,
            },
          },
        },
      });

      const playlist: RedisPlaylist = {
        userId,
        firstIndex: body.firstIndex,
        targetDuration: body.targetDuration,
        fragmentDurations: body.fragmentDurations,
      };

      // TODO: pusher?
      await updateLivePlaylist(liveId, playlist);

      return createVoidAPIResponse();
    }

    throw new HTTPError(404);
  }
);
