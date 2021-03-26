import type { VercelRequest } from '@vercel/node';
import { createSecretKey } from 'crypto';
import { jwtVerify } from 'jose/jwt/verify';
import { SignJWT } from 'jose/jwt/sign';
import { HTTPError } from './error';

export type UserIdClaim = 'createLive' | 'postComment' | 'postViewer';

export type LiveIdClaim = 'getStorageURL' | 'finish';

export interface UserIdAuthInfo {
  readonly userId: string;
}

export interface LiveIdAuthInfo {
  readonly userId: string;
  readonly liveId: string;
}

const key = createSecretKey(
  Buffer.from(process.env.SECRET_JWT_SECRET, 'ascii')
);

async function getJWTSub(req: VercelRequest): Promise<string | undefined> {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return;
  }

  const result = await jwtVerify(authorizationHeader.substr(7), key);

  if (!result.payload.sub) {
    return;
  }

  return result.payload.sub;
}

function serializeUserIdSub(userId: string): string {
  return `users/${userId}`;
}

function serializeLiveIdSub(userId: string, liveId: string): string {
  return `users/${userId}/lives/${liveId}`;
}

function parseSubAsUserId(
  sub: string | undefined | null
): UserIdAuthInfo | undefined {
  if (!sub) {
    return;
  }
  const match = sub.match(/^users\/([a-z\d-]+)$/);
  if (!match) {
    return;
  }
  return {
    userId: match[1],
  };
}

function parseSubAsLiveId(
  sub: string | undefined | null
): LiveIdAuthInfo | undefined {
  if (!sub) {
    return;
  }
  const match = sub.match(/^users\/([a-z\d-]+)\/lives\/([a-z\d-]+)$/);
  if (!match) {
    return;
  }
  return {
    userId: match[1],
    liveId: match[2],
  };
}

export async function authUserId(req: VercelRequest): Promise<UserIdAuthInfo> {
  const info = parseSubAsUserId(await getJWTSub(req));
  if (!info) {
    throw new HTTPError(401);
  }
  return info;
}

export async function authLiveId(req: VercelRequest): Promise<LiveIdAuthInfo> {
  const info = parseSubAsLiveId(await getJWTSub(req));
  if (!info) {
    throw new HTTPError(401);
  }
  return info;
}

export function issueUserIdJWT(userId: string): Promise<string> {
  return new SignJWT({
    sub: serializeUserIdSub(userId),
  })
    .setProtectedHeader({
      alg: 'HS256',
    })
    .sign(key);
}

export function issueLiveIdJWT(
  userId: string,
  liveId: string
): Promise<string> {
  return new SignJWT({
    sub: serializeLiveIdSub(userId, liveId),
  })
    .setProtectedHeader({
      alg: 'HS256',
    })
    .sign(key);
}
