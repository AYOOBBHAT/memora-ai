/**
 * Conversation-aware retrieval query rewriting.
 *
 * Used only to build the embedding/vector-search query for follow-ups.
 * The original user question is still what Groq sees. Conversation text is
 * untrusted user content and is never applied as system instructions.
 */

export const MAX_PRIOR_USER_TURNS = 2;
export const MAX_PRIOR_ASSISTANT_TURNS = 1;
export const MAX_TURN_CHARS = 400;
export const MAX_RETRIEVAL_QUERY_CHARS = 800;

export interface RetrievalTurn {
  role: 'user' | 'assistant';
  content: string;
}

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'about',
  'also',
  'be',
  'can',
  'did',
  'do',
  'does',
  'for',
  'how',
  'in',
  'is',
  'it',
  'me',
  'of',
  'on',
  'or',
  'tell',
  'than',
  'that',
  'the',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'to',
  'was',
  'what',
  'when',
  'where',
  'which',
  'who',
  'will',
  'with',
]);

const DEICTIC = /\b(it|that|this|them|they|those|these)\b/i;
const WHAT_ABOUT = /^(what|how)\s+about\b/i;
const AND_FRAGMENT = /^(and|also)\s+\S+/i;
const OTHER_ONE = /\bthe other (one|plan|document|option)\b/i;
const BARE_DIFFERENCE = /\b(the )?difference\b/i;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function clipTurn(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= MAX_TURN_CHARS) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_TURN_CHARS - 1)}…`;
}

/**
 * True when the current question is unlikely to retrieve well without prior turns.
 * Self-contained questions are left unchanged, including after an unrelated topic.
 */
export function looksLikeFollowUp(question: string): boolean {
  const trimmed = question.trim();
  if (!trimmed) {
    return false;
  }

  if (WHAT_ABOUT.test(trimmed) || AND_FRAGMENT.test(trimmed) || OTHER_ONE.test(trimmed)) {
    return true;
  }

  if (DEICTIC.test(trimmed)) {
    return true;
  }

  if (BARE_DIFFERENCE.test(trimmed) && tokenize(trimmed).length <= 2) {
    return true;
  }

  return false;
}

/**
 * Builds the vector-search query. Returns the current question unchanged unless
 * it is a follow-up and prior turns exist.
 */
export function rewriteRetrievalQuery(currentQuestion: string, priorTurns: RetrievalTurn[]): string {
  const current = currentQuestion.trim();
  if (!current) {
    return current;
  }

  if (!looksLikeFollowUp(current) || priorTurns.length === 0) {
    return current;
  }

  const userTurns = priorTurns
    .filter((turn) => turn.role === 'user')
    .slice(-MAX_PRIOR_USER_TURNS)
    .map((turn) => clipTurn(turn.content))
    .filter(Boolean);

  const assistantTurns = priorTurns
    .filter((turn) => turn.role === 'assistant')
    .slice(-MAX_PRIOR_ASSISTANT_TURNS)
    .map((turn) => clipTurn(turn.content))
    .filter(Boolean);

  const contextParts = [...userTurns, ...assistantTurns];
  if (contextParts.length === 0) {
    return current;
  }

  const rewritten = `${current} ${contextParts.join(' ')}`.replace(/\s+/g, ' ').trim();
  if (rewritten.length <= MAX_RETRIEVAL_QUERY_CHARS) {
    return rewritten;
  }

  return `${rewritten.slice(0, MAX_RETRIEVAL_QUERY_CHARS - 1)}…`;
}

/**
 * From a newest-first message list, keep at most 2 user turns and 1 assistant turn.
 * Returns chronological order: older user, newer user, latest assistant.
 */
export function selectTurnsForRetrieval(
  messagesNewestFirst: RetrievalTurn[],
): RetrievalTurn[] {
  const users: RetrievalTurn[] = [];
  let assistant: RetrievalTurn | undefined;

  for (const message of messagesNewestFirst) {
    const content = message.content.trim();
    if (!content) {
      continue;
    }
    if (message.role === 'user' && users.length < MAX_PRIOR_USER_TURNS) {
      users.push({ role: 'user', content });
    } else if (message.role === 'assistant' && !assistant) {
      assistant = { role: 'assistant', content };
    }
    if (users.length >= MAX_PRIOR_USER_TURNS && assistant) {
      break;
    }
  }

  return [...users.reverse(), ...(assistant ? [assistant] : [])];
}
