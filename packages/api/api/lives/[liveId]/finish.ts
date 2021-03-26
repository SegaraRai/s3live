import { VercelRequest } from '@vercel/node';
import { Response } from 'node-fetch';
import { POSTFinishRequest, POSTFinishResponse } from '../../../lib/apiTypes';
import { authLiveId } from '../../../lib/auth';
import {
  archivePlaylistCacheControl,
  playlistContentType,
} from '../../../lib/commonConfig';
import { checkCSRF } from '../../../lib/csrf';
import { HTTPError } from '../../../lib/error';
import {
  generateArchivePlaylistFilename,
  generateFragmentDirname,
  generateFragmentFilename,
} from '../../../lib/fragment';
import { gzipAsync } from '../../../lib/gzip';
import { createHandler } from '../../../lib/handler';
import { isLiveId } from '../../../lib/id';
import { fetchLiveInfo, updateLiveInfo } from '../../../lib/live';
import { createAPIResponse } from '../../../lib/response';
import s3 from '../../../lib/s3';
import { validate } from '../../../lib/validate';

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

    if (req.method !== 'POST') {
      throw new HTTPError(404);
    }

    const { fragmentDurations } = validate<POSTFinishRequest>(req.body, {
      type: 'object',
      required: ['fragmentDurations'],
      additionalProperties: false,
      properties: {
        fragmentDurations: {
          type: 'array',
          items: {
            type: 'number',
            minimum: 0.01,
          },
        },
      },
    });

    const data = await fetchLiveInfo(liveId);
    if (!data.startedAt || data.finishedAt) {
      throw new HTTPError(409);
    }

    const targetDuration = Math.ceil(
      fragmentDurations.reduce((acc, cur) => Math.max(acc, cur))
    );

    let strPlaylist = `#EXTM3U
#EXT-X-TARGETDURATION:${targetDuration}
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:1
`;
    for (const [index, duration] of fragmentDurations.entries()) {
      strPlaylist += `#EXTINF:${duration.toFixed(6)},
${generateFragmentFilename(userId, liveId, index)}
`;
    }
    strPlaylist += `#EXT-X-ENDLIST
`;

    const compressedPlaylist = await gzipAsync(Buffer.from(strPlaylist), 9);

    const playlistKey = `${generateFragmentDirname(
      userId,
      liveId
    )}/${generateArchivePlaylistFilename(userId, liveId)}`;

    await s3.putObject({
      Bucket: process.env.S3_BUCKET,
      Key: playlistKey,
      CacheControl: archivePlaylistCacheControl,
      ContentType: playlistContentType,
      ContentEncoding: 'gzip',
      Body: compressedPlaylist,
    });

    await updateLiveInfo(liveId, {
      ...data,
      finishedAt: Date.now(),
    });

    return createAPIResponse<POSTFinishResponse>({
      playlistKey,
    });
  }
);
