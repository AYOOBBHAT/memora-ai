import { env } from '@/config/env';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { UsageQuotaModel, type UsageQuotaKind } from '@/models/UsageQuota.model';
import { ApiError } from '@/utils/ApiError';

export const AI_QUOTA_EXCEEDED_MESSAGE =
  'You have reached your daily AI usage limit. Please try again tomorrow.';

export const UPLOAD_QUOTA_EXCEEDED_MESSAGE =
  'You have reached your daily upload limit. Please try again tomorrow.';

/**
 * Quota windows are UTC calendar days (`YYYY-MM-DD` from `Date#toISOString`).
 * They reset at 00:00 UTC, not the user's local midnight.
 */
export function utcDateKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: number }).code === 11000,
  );
}

function quotaExceededError(kind: UsageQuotaKind): ApiError {
  return new ApiError(
    HTTP_STATUS.TOO_MANY_REQUESTS,
    kind === 'ai' ? AI_QUOTA_EXCEEDED_MESSAGE : UPLOAD_QUOTA_EXCEEDED_MESSAGE,
  );
}

/**
 * Atomically increments the user's UTC-day counter. If the new count exceeds
 * `limit`, the increment is rolled back and a 429 is thrown.
 *
 * Concurrent first-inserts may hit Mongo duplicate-key (E11000); those retry.
 * There is no Redis in this stack; Mongo `findOneAndUpdate` + unique index is the lock.
 */
export async function consumeDailyQuota(
  userId: string,
  kind: UsageQuotaKind,
  limit: number,
): Promise<void> {
  const dateKey = utcDateKey();
  const filter = { userId, kind, dateKey };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const updated = await UsageQuotaModel.findOneAndUpdate(
        filter,
        { $inc: { count: 1 } },
        { upsert: true, new: true },
      );

      if (!updated) {
        throw new Error('Quota update failed');
      }

      if (updated.count > limit) {
        await UsageQuotaModel.updateOne(
          { _id: updated._id, count: { $gt: 0 } },
          { $inc: { count: -1 } },
        );
        throw quotaExceededError(kind);
      }

      return;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (isDuplicateKeyError(error) && attempt < 2) {
        continue;
      }

      throw error;
    }
  }
}

export async function releaseDailyQuota(userId: string, kind: UsageQuotaKind): Promise<void> {
  await UsageQuotaModel.updateOne(
    { userId, kind, dateKey: utcDateKey(), count: { $gt: 0 } },
    { $inc: { count: -1 } },
  );
}

export async function consumeAiQuota(userId: string): Promise<void> {
  await consumeDailyQuota(userId, 'ai', env.AI_DAILY_REQUEST_LIMIT);
}

export async function releaseAiQuota(userId: string): Promise<void> {
  await releaseDailyQuota(userId, 'ai');
}

export async function consumeUploadQuota(userId: string): Promise<void> {
  await consumeDailyQuota(userId, 'upload', env.UPLOAD_DAILY_LIMIT);
}

export async function releaseUploadQuota(userId: string): Promise<void> {
  await releaseDailyQuota(userId, 'upload');
}
