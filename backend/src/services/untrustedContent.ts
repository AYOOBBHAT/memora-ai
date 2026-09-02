/**
 * Conservative handling of instruction-like text in user documents and queries.
 *
 * Does not blacklist ordinary words such as "ignore" or "override".
 * Does not delete document content. Used to (1) label jailbreak-like sentences
 * as data and (2) derive extra retrieval queries when a user question wraps
 * an information need in a command.
 */

export const INSTRUCTION_LIKE_LINE_PATTERNS: RegExp[] = [
  /\bignore\s+(all\s+)?(previous|prior|above|earlier)\s+instructions\b/i,
  /\bdisregard\s+(all\s+)?(previous|prior|above|earlier)\s+instructions\b/i,
  /\breveal\s+(your\s+|the\s+)?(system|hidden|developer)\s+prompt\b/i,
  /\brepeat\s+(any\s+|the\s+|all\s+)?(system|developer|hidden)?\s*instructions\b/i,
  /\bfollow\s+these\s+instructions\s+instead\b/i,
  /^(?:please\s+)?reveal\s+private\s+information\b/i,
  /\boverride\s+(the\s+|these\s+|your\s+)?(previous\s+|system\s+)?instructions\b/i,
  /\binstead\s+of\s+(the\s+)?(user'?s|users)\s+(question|prompt|request|instructions)\b/i,
  /\b(you\s+must|you\s+will|you\s+are\s+to)\s+(ignore|disregard)\s+(all\s+)?(previous|prior|system)\b/i,
  /\b(assistant|model)\s*[:,]\s*(ignore|disregard|reveal)\b/i,
];

const COMMAND_STRIP_PATTERNS: RegExp[] = [
  /\bignore\s+(all\s+)?(previous|prior|above|earlier)\s+instructions\b/gi,
  /\bdisregard\s+(all\s+)?(previous|prior|above|earlier)\s+instructions\b/gi,
  /\breveal\s+(your\s+|the\s+)?(system|hidden|developer)\s+prompt\b/gi,
  /\brepeat\s+(any\s+|the\s+|all\s+)?(system|developer|hidden)?\s*instructions\b/gi,
  /\bfollow\s+these\s+instructions\s+instead\b/gi,
];

export function lineLooksInstructionLike(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }

  return INSTRUCTION_LIKE_LINE_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(trimmed);
  });
}

/** True when any line of title+body is a jailbreak-like command, not ordinary prose. */
export function textContainsInstructionLikeContent(text: string): boolean {
  return text.split(/\r?\n/).some((line) => lineLooksInstructionLike(line));
}

/**
 * Wraps jailbreak-like lines so the model sees them as DATA.
 * Leaves ordinary prose, code, and procedural docs unchanged — including
 * sentences that merely contain "ignore" or "override".
 */
export function markInstructionLikeText(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      if (!lineLooksInstructionLike(line)) {
        return line;
      }
      return `<instruction_like>${line.trim()}</instruction_like>`;
    })
    .join('\n');
}

function addUniqueQuery(queries: string[], candidate: string): void {
  const normalized = candidate.replace(/\s+/g, ' ').trim();
  if (normalized.length < 4) {
    return;
  }
  const key = normalized.toLowerCase();
  if (queries.some((query) => query.toLowerCase() === key)) {
    return;
  }
  queries.push(normalized);
}

function looksLikeCommandWrappedQuestion(question: string): boolean {
  if (INSTRUCTION_LIKE_LINE_PATTERNS.some((pattern) => pattern.test(question))) {
    return true;
  }
  if (/\bthen\s+answer:/i.test(question)) {
    return true;
  }
  return /\band\s+say\s+(that\s+)?/i.test(question);
}

/**
 * Returns the original question plus, when it wraps an information need in a
 * command, extra queries that recover that information need.
 *
 * Extra searches run only for command-wrapped questions so ordinary RAG is
 * unchanged (one embedding + one $vectorSearch).
 */
export function deriveRetrievalQueries(userQuestion: string): string[] {
  const original = userQuestion.trim();
  if (!original) {
    return [];
  }

  const queries = [original];
  if (!looksLikeCommandWrappedQuestion(original)) {
    return queries;
  }

  const thenAnswerParts = original.split(/\bthen\s+answer:\s*/i);
  if (thenAnswerParts.length > 1) {
    addUniqueQuery(queries, thenAnswerParts.slice(1).join(' '));
  }

  let stripped = original;
  for (const pattern of COMMAND_STRIP_PATTERNS) {
    stripped = stripped.replace(pattern, ' ');
  }
  stripped = stripped
    .replace(/^\s*(and\s+)?say\s+(that\s+)?/i, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (stripped) {
    addUniqueQuery(queries, stripped.replace(/^(and\s+)?say\s+(that\s+)?/i, '').trim());

    const fact = stripped.match(/^(?:and\s+)?(?:say\s+(?:that\s+)?)?(.+?)\s+is\s+.+/i);
    const subject = fact?.[1]?.replace(/^(and\s+)?say\s+(that\s+)?/i, '').trim();
    if (subject) {
      addUniqueQuery(queries, subject);
    }
  }

  return queries;
}

export interface ScoredHit<T extends { id: string; title?: string }> {
  document: T;
  score: number;
}

/** Dedupes by document id, keeps the highest score, then applies top-k. */
export function mergeScoredHits<T extends { id: string; title?: string }>(
  groups: Array<Array<ScoredHit<T>>>,
  limit: number,
): Array<ScoredHit<T>> {
  const best = new Map<string, ScoredHit<T>>();

  for (const group of groups) {
    for (const hit of group) {
      const previous = best.get(hit.document.id);
      if (!previous || hit.score > previous.score) {
        best.set(hit.document.id, hit);
      }
    }
  }

  return [...best.values()]
    .sort(
      (left, right) =>
        right.score - left.score ||
        (left.document.title ?? '').localeCompare(right.document.title ?? ''),
    )
    .slice(0, Math.max(1, limit));
}
