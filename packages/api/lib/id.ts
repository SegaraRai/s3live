import { v4 as uuidv4 } from 'uuid';

function isUUIDv4(value: string | null | undefined): value is string {
  return /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(
    value || ''
  );
}

export function isLiveId(liveId: string | null | undefined): liveId is string {
  return isUUIDv4(liveId);
}

export function isUserId(userId: string | null | undefined): userId is string {
  return isUUIDv4(userId);
}

export function isComment(
  commentId: string | null | undefined
): commentId is string {
  return isUUIDv4(commentId);
}

export function generateLiveId(): string {
  return uuidv4();
}

export function generateUserId(): string {
  return uuidv4();
}

export function generateCommentId(): string {
  return uuidv4();
}
