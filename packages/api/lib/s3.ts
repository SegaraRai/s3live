import { PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  fragmentCacheControl,
  fragmentContentType,
  presignedURLExpiry,
} from './commonConfig';

const s3 = new S3({
  credentials: {
    accessKeyId: process.env.SECRET_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_S3_SECRET_ACCESS_KEY,
  },
  endpoint: process.env.S3_ENDPOINT_URL,
  region: process.env.S3_REGION,
});

export default s3;

export async function getSignedS3URL(key: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    CacheControl: fragmentCacheControl,
    ContentType: fragmentContentType,
  });
  return getSignedUrl(s3, command, {
    expiresIn: presignedURLExpiry,
  });
}
