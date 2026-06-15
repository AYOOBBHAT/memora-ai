import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/models/Conversation.model', () => ({
  ConversationModel: {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndDelete: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/models/ChatMessage.model', () => ({
  ChatMessageModel: {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
    aggregate: vi.fn(),
    distinct: vi.fn(),
  },
}));

vi.mock('@/services/chat.service', () => ({
  generateRagAnswer: vi.fn(),
}));

vi.mock('@/services/collection.service', () => ({
  verifyUserCollections: vi.fn(),
}));

import { Types } from 'mongoose';

import { ChatMessageModel } from '@/models/ChatMessage.model';
import { ConversationModel } from '@/models/Conversation.model';
import { generateRagAnswer } from '@/services/chat.service';
import {
  deriveConversationTitle,
  deleteUserConversation,
  listUserConversations,
  searchUserConversations,
  sendChatWithPersistence,
} from '@/services/conversation.service';

const userId = new Types.ObjectId().toString();

function createConversationDoc(overrides: Record<string, unknown> = {}) {
  const id = new Types.ObjectId();
  return {
    _id: id,
    userId: new Types.ObjectId(userId),
    title: 'First question',
    collectionIds: [],
    createdAt: new Date('2026-06-14T10:00:00.000Z'),
    updatedAt: new Date('2026-06-14T12:00:00.000Z'),
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('deriveConversationTitle', () => {
  it('returns the full message when it is short', () => {
    expect(deriveConversationTitle('What is Memora?')).toBe('What is Memora?');
  });

  it('truncates long messages with an ellipsis', () => {
    const longMessage = 'a'.repeat(100);
    expect(deriveConversationTitle(longMessage)).toBe(`${'a'.repeat(79)}…`);
  });
});

describe('listUserConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('scopes conversation queries to the authenticated user', async () => {
    const conversation = createConversationDoc();
    vi.mocked(ConversationModel.find).mockReturnValue({
      sort: vi.fn().mockResolvedValue([conversation]),
    } as never);
    vi.mocked(ChatMessageModel.aggregate)
      .mockResolvedValueOnce([{ _id: conversation._id, count: 2 }])
      .mockResolvedValueOnce([{ _id: conversation._id, content: 'Latest answer' }]);

    const result = await listUserConversations(userId);

    expect(ConversationModel.find).toHaveBeenCalledWith({ userId });
    expect(result).toEqual([
      expect.objectContaining({
        id: conversation._id.toString(),
        preview: 'Latest answer',
        messageCount: 2,
      }),
    ]);
  });
});

describe('searchUserConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches titles and message content for the authenticated user', async () => {
    const conversation = createConversationDoc({ title: 'Study notes' });
    const matchingConversationId = new Types.ObjectId();

    vi.mocked(ChatMessageModel.find).mockReturnValue({
      distinct: vi.fn().mockResolvedValue([matchingConversationId]),
    } as never);
    vi.mocked(ConversationModel.find).mockReturnValue({
      sort: vi.fn().mockResolvedValue([conversation]),
    } as never);
    vi.mocked(ChatMessageModel.aggregate)
      .mockResolvedValueOnce([{ _id: conversation._id, count: 1 }])
      .mockResolvedValueOnce([{ _id: conversation._id, content: 'Study notes summary' }]);

    await searchUserConversations(userId, 'notes');

    expect(ChatMessageModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        content: expect.any(RegExp),
      }),
    );

    expect(ConversationModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        $or: [{ title: expect.any(RegExp) }, { _id: { $in: [matchingConversationId] } }],
      }),
    );
  });
});

describe('deleteUserConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes owned conversations and their messages', async () => {
    const conversationId = new Types.ObjectId().toString();
    vi.mocked(ConversationModel.findOneAndDelete).mockResolvedValue(createConversationDoc() as never);

    await deleteUserConversation(userId, conversationId);

    expect(ConversationModel.findOneAndDelete).toHaveBeenCalledWith({
      _id: conversationId,
      userId,
    });
    expect(ChatMessageModel.deleteMany).toHaveBeenCalledWith({
      conversationId,
      userId,
    });
  });
});

describe('sendChatWithPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a conversation and persists user and assistant messages', async () => {
    const conversation = createConversationDoc();
    const assistantMessageId = new Types.ObjectId();

    vi.mocked(ConversationModel.create).mockResolvedValue(conversation as never);
    vi.mocked(ChatMessageModel.create)
      .mockResolvedValueOnce({ _id: new Types.ObjectId() } as never)
      .mockResolvedValueOnce({ _id: assistantMessageId } as never);
    vi.mocked(generateRagAnswer).mockResolvedValue({
      answer: 'Persisted answer',
      sources: [],
    });

    const result = await sendChatWithPersistence(userId, {
      message: 'What is Memora?',
    });

    expect(ConversationModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        title: 'What is Memora?',
      }),
    );
    expect(ChatMessageModel.create).toHaveBeenCalledTimes(2);
    expect(generateRagAnswer).toHaveBeenCalledWith(userId, 'What is Memora?', undefined);
    expect(result).toEqual({
      answer: 'Persisted answer',
      sources: [],
      conversationId: conversation._id.toString(),
      messageId: assistantMessageId.toString(),
    });
  });

  it('reuses an existing conversation when conversationId is provided', async () => {
    const conversation = createConversationDoc();
    const assistantMessageId = new Types.ObjectId();

    vi.mocked(ConversationModel.findOne).mockResolvedValue(conversation as never);
    vi.mocked(ChatMessageModel.create)
      .mockResolvedValueOnce({ _id: new Types.ObjectId() } as never)
      .mockResolvedValueOnce({ _id: assistantMessageId } as never);
    vi.mocked(generateRagAnswer).mockResolvedValue({
      answer: 'Follow-up answer',
      sources: [],
    });

    const result = await sendChatWithPersistence(userId, {
      message: 'Tell me more',
      conversationId: conversation._id.toString(),
    });

    expect(ConversationModel.create).not.toHaveBeenCalled();
    expect(ConversationModel.findOne).toHaveBeenCalledWith({
      _id: conversation._id.toString(),
      userId,
    });
    expect(result.conversationId).toBe(conversation._id.toString());
  });
});
