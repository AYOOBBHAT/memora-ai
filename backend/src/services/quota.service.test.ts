import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/env', () => ({
  env: {
    AI_DAILY_REQUEST_LIMIT: 50,
    UPLOAD_DAILY_LIMIT: 20,
  },
}));

const { findOneAndUpdate, updateOne } = vi.hoisted(() => ({
  findOneAndUpdate: vi.fn(),
  updateOne: vi.fn(),
}));

vi.mock('@/models/UsageQuota.model', () => ({
  UsageQuotaModel: {
    findOneAndUpdate,
    updateOne,
  },
}));

import { HTTP_STATUS } from '@/constants/httpStatus';
import {
  AI_QUOTA_EXCEEDED_MESSAGE,
  UPLOAD_QUOTA_EXCEEDED_MESSAGE,
  consumeDailyQuota,
  releaseDailyQuota,
  utcDateKey,
} from '@/services/quota.service';

const USER_A = new Types.ObjectId().toString();
const USER_B = new Types.ObjectId().toString();

describe('utcDateKey', () => {
  it('uses a UTC calendar day YYYY-MM-DD', () => {
    expect(utcDateKey(new Date('2026-08-31T23:30:00.000Z'))).toBe('2026-08-31');
    expect(utcDateKey(new Date('2026-09-01T00:00:00.000Z'))).toBe('2026-09-01');
  });
});

describe('consumeDailyQuota', () => {
  beforeEach(() => {
    findOneAndUpdate.mockReset();
    updateOne.mockReset();
    updateOne.mockResolvedValue({ modifiedCount: 1 });
  });

  it('accepts a user below the limit', async () => {
    findOneAndUpdate.mockResolvedValue({ _id: 'q1', count: 1 });

    await expect(consumeDailyQuota(USER_A, 'ai', 50)).resolves.toBeUndefined();
    expect(updateOne).not.toHaveBeenCalled();
  });

  it('accepts a user at the last remaining slot', async () => {
    findOneAndUpdate.mockResolvedValue({ _id: 'q1', count: 50 });

    await expect(consumeDailyQuota(USER_A, 'ai', 50)).resolves.toBeUndefined();
  });

  it('rejects when the incremented count is above the limit and rolls back', async () => {
    findOneAndUpdate.mockResolvedValue({ _id: 'q1', count: 51 });

    await expect(consumeDailyQuota(USER_A, 'ai', 50)).rejects.toMatchObject({
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      message: AI_QUOTA_EXCEEDED_MESSAGE,
    });
    expect(updateOne).toHaveBeenCalledWith(
      { _id: 'q1', count: { $gt: 0 } },
      { $inc: { count: -1 } },
    );
  });

  it('keeps quotas independent per user', async () => {
    findOneAndUpdate
      .mockResolvedValueOnce({ _id: 'a', count: 50 })
      .mockResolvedValueOnce({ _id: 'b', count: 1 });

    await consumeDailyQuota(USER_A, 'ai', 50);
    await consumeDailyQuota(USER_B, 'ai', 50);

    expect(findOneAndUpdate.mock.calls[0]?.[0]).toMatchObject({ userId: USER_A, kind: 'ai' });
    expect(findOneAndUpdate.mock.calls[1]?.[0]).toMatchObject({ userId: USER_B, kind: 'ai' });
  });

  it('rejects upload quota with the upload message', async () => {
    findOneAndUpdate.mockResolvedValue({ _id: 'u1', count: 21 });

    await expect(consumeDailyQuota(USER_A, 'upload', 20)).rejects.toMatchObject({
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      message: UPLOAD_QUOTA_EXCEEDED_MESSAGE,
    });
  });

  it('does not let concurrent increments exceed the limit', async () => {
    let count = 0;
    findOneAndUpdate.mockImplementation(async () => {
      count += 1;
      return { _id: 'shared', count };
    });
    updateOne.mockImplementation(async () => {
      count -= 1;
      return { modifiedCount: 1 };
    });

    const results = await Promise.allSettled(
      Array.from({ length: 30 }, () => consumeDailyQuota(USER_A, 'ai', 10)),
    );

    const accepted = results.filter((result) => result.status === 'fulfilled').length;
    const rejected = results.filter((result) => result.status === 'rejected').length;

    expect(accepted).toBe(10);
    expect(rejected).toBe(20);
    expect(count).toBe(10);
  });
});

describe('releaseDailyQuota', () => {
  it('decrements only when count is positive', async () => {
    updateOne.mockResolvedValue({ modifiedCount: 1 });

    await releaseDailyQuota(USER_A, 'ai');

    expect(updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_A, kind: 'ai', count: { $gt: 0 } }),
      { $inc: { count: -1 } },
    );
  });
});
