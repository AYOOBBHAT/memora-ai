import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { EVAL_CASES } from '../src/ai-evaluation/cases';
import { retrieveEvalDocuments } from '../src/ai-evaluation/retrieve';
import { env } from '../src/config/env';
import { generateAnswerFromContext } from '../src/services/groq.service';
import { evalRetrievalQuery, formatEvaluationSummary, runEvaluation } from '../src/ai-evaluation/runner';

function printRetrievalAudit(): void {
  console.log('Retrieval audit (eval lexical retriever, no Groq)\n');

  let misses = 0;
  let isolationLeaks = 0;

  for (const testCase of EVAL_CASES) {
    const hits = retrieveEvalDocuments(testCase.userId, evalRetrievalQuery(testCase));
    const titles = hits.map((hit) => hit.document.title);
    const missing = (testCase.expectedDocumentTitles ?? []).filter((title) => !titles.includes(title));
    const leaked = (testCase.forbiddenDocumentTitles ?? []).filter((title) => titles.includes(title));

    if (missing.length > 0) {
      misses += 1;
      console.log(`RETRIEVE MISS ${testCase.id}: ${testCase.question}`);
      console.log(`  expected: ${testCase.expectedDocumentTitles?.join(', ')}`);
      console.log(`  got: ${titles.join(', ') || '(none)'}`);
    }

    if (leaked.length > 0) {
      isolationLeaks += 1;
      console.log(`ISOLATION LEAK ${testCase.id}: ${leaked.join(', ')}`);
    }
  }

  console.log(`\nCases: ${EVAL_CASES.length}`);
  console.log(`Retrieval misses (expected doc absent): ${misses}`);
  console.log(`Isolation leaks: ${isolationLeaks}`);
}

async function main(): Promise<void> {
  if (!env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not configured. Live Groq evaluation was skipped.\n');
    printRetrievalAudit();
    process.exitCode = 1;
    return;
  }

  const report = await runEvaluation({
    mode: 'live-groq',
    groqModel: env.GROQ_MODEL,
    generate: generateAnswerFromContext,
  });

  const reportPath = path.resolve(__dirname, '../src/ai-evaluation/last-report.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(formatEvaluationSummary(report));
  console.log(`\nWrote ${reportPath}`);
  const failed = report.cases.filter((entry) => !entry.pass);
  console.log(`Failed cases (${failed.length}):`);
  for (const result of failed) {
    console.log(
      `- ${result.id} [${result.categories.join(', ') || 'unclassified'}] retrieval=${result.retrievalFailed} injection=${result.injectionVulnerable} ${result.question}`,
    );
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
