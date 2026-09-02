import { beforeEach, describe, expect, it, vi } from 'vitest';

const USER_A_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const USER_B_ID = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const CONVERSATION_ID = 'dddddddddddddddddddddddd';

const { find } = vi.hoisted(() => ({
  find: vi.fn(),
}));

vi.mock('@/models/ChatMessage.model', () => ({
  ChatMessageModel: {
    find,
  },
}));

vi.mock('@/models/Conversation.model', () => ({
  ConversationModel: {},
}));

vi.mock('@/services/chat.service', () => ({
  generateRagAnswer: vi.fn(),
}));

vi.mock('@/services/collection.service', () => ({
  getCollectionById: vi.fn(),
  verifyUserCollections: vi.fn(),
}));

import { ChatMessageModel } from '@/models/ChatMessage.model';
import { getRecentTurnsForRetrieval } from '@/services/conversation.service';

function mockFindChain(docs: Array<{ role: string; content: string }>) {
  const lean = vi.fn().mockResolvedValue(docs);
  const select = vi.fn().mockReturnValue({ lean });
  const limit = vi.fn().mockReturnValue({ select });
  const sort = vi.fn().mockReturnValue({ limit });
  find.mockReturnValue({ sort });
  return { sort, limit, select, lean };
}

describe('getRecentTurnsForRetrieval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('G: always queries messages with both conversationId and the authenticated userId', async () => {
    mockFindChain([]);

    await getRecentTurnsForRetrieval(USER_A_ID, CONVERSATION_ID);

    expect(ChatMessageModel.find).toHaveBeenCalledWith({
      conversationId: CONVERSATION_ID,
      userId: USER_A_ID,
    });
    expect(vi.mocked(ChatMessageModel.find).mock.calls[0]?.[0]).not.toEqual(
      expect.objectContaining({ userId: USER_B_ID }),
    );
  });

  it('returns at most two user turns and the latest assistant turn', async () => {
    mockFindChain([
      { role: 'assistant', content: 'Pro provides 500.' },
      { role: 'user', content: 'What about Pro?' },
      { role: 'assistant', content: 'Free provides 50.' },
      { role: 'user', content: 'How many AI questions does the Free plan provide?' },
    ]);

    const turns = await getRecentTurnsForRetrieval(USER_A_ID, CONVERSATION_ID);
    expect(turns.map((turn) => turn.content)).toEqual([
      'How many AI questions does the Free plan provide?',
      'What about Pro?',
      'Pro provides 500.',
    ]);
  });
});
