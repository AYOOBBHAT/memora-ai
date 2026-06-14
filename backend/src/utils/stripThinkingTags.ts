/**
 * Supported reasoning tag names in model outputs (case-insensitive, multiline).
 * Covers Groq, Gemini, Ollama, and other providers that wrap chain-of-thought in XML-like tags.
 */
const THINKING_TAG_NAME = '(?:redacted_thinking|think(?:ing)?|reasoning)';

/**
 * Matches innermost reasoning blocks first so nested tags are fully removed.
 */
const INNERMOST_THINKING_BLOCK = new RegExp(
  `<\\s*${THINKING_TAG_NAME}\\s*>(?:(?!<\\s*${THINKING_TAG_NAME}\\s*>)[\\s\\S])*?<\\s*\\/\\s*${THINKING_TAG_NAME}\\s*>`,
  'gi',
);

/**
 * Single point for stripping LLM reasoning tags from chat answers.
 *
 * Apply this to raw model text before returning user-facing answers. Citations come from
 * vector search (see `chat.service.ts`) and are not affected by this utility.
 *
 * Supported tags (case-insensitive, multiline): `redacted_thinking`, `think`, `thinking`,
 * `reasoning`. Currently wired in `groq.service.ts`; future Gemini/Ollama chat providers
 * should import and call this function on every completion path.
 */
export function stripThinkingTags(text: string): string {
  let result = text;
  let previous: string;

  do {
    previous = result;
    result = result.replace(new RegExp(INNERMOST_THINKING_BLOCK.source, 'gi'), '');
  } while (result !== previous);

  return result.trim();
}
