/**
 * Deterministic retrieval-score audit against the evaluation corpus.
 * Does not call Atlas, Gemini, or Groq and does not write to the database.
 */
import { EVAL_CASES } from '../src/ai-evaluation/cases';
import { retrieveEvalDocuments } from '../src/ai-evaluation/retrieve';

function main(): void {
  const focus = new Set(['A1', 'A4', 'A10', 'C2', 'C3', 'D2', 'F3', 'I1', 'I3', 'I4', 'I5', 'B1']);

  console.log('Eval lexical retrieval audit (token overlap, top-k=5, no threshold)\n');

  for (const testCase of EVAL_CASES) {
    const hits = retrieveEvalDocuments(testCase.userId, testCase.question);
    const max = hits[0]?.score ?? 0;
    const rows = hits.map((hit) => {
      const ratio = max > 0 ? Math.round((hit.score / max) * 100) / 100 : 0;
      return `${hit.document.title}=${hit.score}(${ratio})`;
    });
    const expected = testCase.expectedDocumentTitles ?? [];
    const missing = expected.filter((title) => !hits.some((hit) => hit.document.title === title));
    const marker = focus.has(testCase.id) ? '*' : ' ';
    console.log(
      `${marker}${testCase.id} q=${JSON.stringify(testCase.question)}`,
    );
    console.log(`  hits: ${rows.join(' | ') || '(none)'}`);
    if (missing.length > 0) {
      console.log(`  MISSING expected: ${missing.join(', ')}`);
    }
  }
}

main();
