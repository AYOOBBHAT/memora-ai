import { describe, expect, it } from 'vitest';

import { stripThinkingTags } from './stripThinkingTags';

const THINK_OPEN = '<' + 'think' + '>';
const THINK_CLOSE = '</' + 'think' + '>';

describe('stripThinkingTags', () => {
  it('removes think blocks and preserves answer text', () => {
    const input = `${THINK_OPEN}internal reasoning${THINK_CLOSE}The final answer.`;
    expect(stripThinkingTags(input)).toBe('The final answer.');
  });

  it('removes <think>content</think> blocks', () => {
    const input =
      '<think>content</think>Here is the response.';
    expect(stripThinkingTags(input)).toBe('Here is the response.');
  });

  it('removes multiline redacted_thinking blocks', () => {
    const input = `<think>step one
step two
step three</think>The final answer.`;
    expect(stripThinkingTags(input)).toBe('The final answer.');
  });

  it('is case insensitive for redacted_thinking tags', () => {
    const input =
      '<REDACTED_THINKING>hidden reasoning</Redacted_Thinking>Visible answer.';
    expect(stripThinkingTags(input)).toBe('Visible answer.');
  });

  it('removes redacted_thinking when answer follows with whitespace', () => {
    const input =
      '<think>internal chain of thought</think>\n\nUser-facing answer.';
    expect(stripThinkingTags(input)).toBe('User-facing answer.');
  });

  it('handles multiline thinking blocks', () => {
    const input = `${THINK_OPEN}line one
line two${THINK_CLOSE}

Answer after thinking.`;

    expect(stripThinkingTags(input)).toBe('Answer after thinking.');
  });

  it('is case insensitive for tag names', () => {
    const input = '<THINK>hidden</Think>Visible text.';
    expect(stripThinkingTags(input)).toBe('Visible text.');
  });

  it('removes multiple thinking blocks', () => {
    const input = `${THINK_OPEN}first${THINK_CLOSE}Middle.${THINK_OPEN}second${THINK_CLOSE}End.`;
    expect(stripThinkingTags(input)).toBe('Middle.End.');
  });

  it('removes thinking and reasoning variants', () => {
    const input =
      '<thinking>a</thinking>Part 1.<reasoning>b</reasoning>Part 2.';
    expect(stripThinkingTags(input)).toBe('Part 1.Part 2.');
  });

  it('returns empty string when only thinking content remains', () => {
    expect(stripThinkingTags(`${THINK_OPEN}only reasoning${THINK_CLOSE}`)).toBe('');
  });

  it('trims surrounding whitespace after stripping', () => {
    const input = `  ${THINK_OPEN}x${THINK_CLOSE}  Final answer.  `;
    expect(stripThinkingTags(input)).toBe('Final answer.');
  });

  it('returns unchanged trimmed text when no thinking tags are present', () => {
    const input = '  Plain answer with no tags.  ';
    expect(stripThinkingTags(input)).toBe('Plain answer with no tags.');
  });

  it('handles nested-looking tags by stripping outer blocks iteratively', () => {
    const input = `${THINK_OPEN}outer ${THINK_OPEN}inner${THINK_CLOSE} remainder${THINK_CLOSE}Done.`;
    expect(stripThinkingTags(input)).toBe('Done.');
  });
});
