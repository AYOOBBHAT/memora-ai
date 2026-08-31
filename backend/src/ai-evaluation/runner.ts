import type { EvalCase } from './cases';
import { EVAL_CASES } from './cases';
import type { EvalDocument } from './corpus';
import {
  PRODUCTION_NO_DOCUMENTS_ANSWER,
  judgeEvalCase,
  type FailureCategory,
  type JudgeResult,
} from './judge';
import { formatRetrievedDocuments, buildGroqUserPrompt } from '@/services/ragPrompt';
import { retrieveEvalDocuments, type EvalRetrievedDocument } from './retrieve';

export interface EvalGenerateFn {
  (context: string, question: string): Promise<string>;
}

export interface CaseEvaluation {
  id: string;
  category: EvalCase['category'];
  question: string;
  expectedBehavior: string;
  userId: string;
  retrievedTitles: string[];
  retrievedContext: string;
  groqContext: string;
  retrievedScores: Array<{ title: string; score: number }>;
  actualAnswer: string;
  citationPresent: boolean;
  citationCorrect: boolean;
  citationDocument: string[];
  supportingTextAvailable: boolean;
  retrievalFailed: boolean;
  injectionVulnerable: boolean;
  pass: boolean;
  categories: FailureCategory[];
  notes: string[];
}

export interface EvaluationReport {
  generatedAt: string;
  mode: 'live-groq' | 'stub';
  groqModel?: string;
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  breakdown: Record<FailureCategory, number>;
  cases: CaseEvaluation[];
}

export function describeExpectedBehavior(testCase: EvalCase): string {
  if (testCase.expectedBehavior) {
    return testCase.expectedBehavior;
  }

  const parts: string[] = [];
  if (testCase.mustInclude?.length) {
    parts.push(`Must include: ${testCase.mustInclude.join(', ')}`);
  }
  if (testCase.mustIncludeAny?.length) {
    parts.push(`Must include at least one of: ${testCase.mustIncludeAny.join(', ')}`);
  }
  if (testCase.mustNotInclude?.length) {
    parts.push(`Must not include: ${testCase.mustNotInclude.join(', ')}`);
  }
  if (testCase.expectedDocumentTitles?.length) {
    parts.push(`Retrieve: ${testCase.expectedDocumentTitles.join(', ')}`);
  }
  if (testCase.refusalExpected) {
    parts.push('Refuse when context is insufficient.');
  }
  if (testCase.notes) {
    parts.push(testCase.notes);
  }
  return parts.join(' ') || 'See case definition.';
}

/** Mirrors production document blocks from `ragPrompt.formatRetrievedDocuments`. */
export function buildEvalContext(documents: EvalDocument[]): string {
  return formatRetrievedDocuments(
    documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      sourceType: doc.sourceType,
      content: doc.content,
    })),
  );
}

export function emptyBreakdown(): Record<FailureCategory, number> {
  return {
    retrieval_failure: 0,
    hallucination: 0,
    unsupported_claim: 0,
    incomplete_answer: 0,
    contradiction: 0,
    incorrect_citation: 0,
    missing_citation: 0,
    incorrect_refusal: 0,
    prompt_injection_vulnerability: 0,
    cross_user_isolation_failure: 0,
    other: 0,
  };
}

export async function evaluateCase(
  testCase: EvalCase,
  generate: EvalGenerateFn,
): Promise<{ retrieved: EvalRetrievedDocument[]; answer: string; judge: JudgeResult; groqContext: string }> {
  const retrieved = retrieveEvalDocuments(testCase.userId, testCase.question);
  const groqContext =
    retrieved.length === 0 ? '' : buildEvalContext(retrieved.map((hit) => hit.document));

  let answer: string;
  if (retrieved.length === 0) {
    answer = PRODUCTION_NO_DOCUMENTS_ANSWER;
  } else {
    answer = await generate(groqContext, testCase.question);
  }

  return {
    retrieved,
    answer,
    groqContext,
    judge: judgeEvalCase(testCase, retrieved, answer),
  };
}

export async function runEvaluation(options: {
  generate: EvalGenerateFn;
  mode: EvaluationReport['mode'];
  groqModel?: string;
  cases?: EvalCase[];
}): Promise<EvaluationReport> {
  const cases = options.cases ?? EVAL_CASES;
  const results: CaseEvaluation[] = [];
  const breakdown = emptyBreakdown();

  for (const testCase of cases) {
    const { retrieved, answer, groqContext, judge } = await evaluateCase(testCase, options.generate);

    for (const category of judge.categories) {
      breakdown[category] += 1;
    }

    results.push({
      id: testCase.id,
      category: testCase.category,
      question: testCase.question,
      expectedBehavior: describeExpectedBehavior(testCase),
      userId: testCase.userId,
      retrievedTitles: retrieved.map((hit) => hit.document.title),
      retrievedContext: retrieved.map((hit) => hit.document.content).join('\n\n---\n\n'),
      groqContext:
        retrieved.length === 0
          ? '(empty — canned no-documents answer, Groq not called)'
          : buildGroqUserPrompt(groqContext, testCase.question),
      retrievedScores: retrieved.map((hit) => ({ title: hit.document.title, score: hit.score })),
      actualAnswer: answer,
      citationPresent: judge.citation.citationPresent,
      citationCorrect: judge.citation.citationCorrect,
      citationDocument: judge.citation.citationDocument,
      supportingTextAvailable: judge.citation.supportingTextAvailable,
      retrievalFailed: judge.retrievalFailed,
      injectionVulnerable: judge.injectionVulnerable,
      pass: judge.pass,
      categories: judge.categories,
      notes: judge.notes,
    });
  }

  const passed = results.filter((result) => result.pass).length;
  const failed = results.length - passed;

  return {
    generatedAt: new Date().toISOString(),
    mode: options.mode,
    groqModel: options.groqModel,
    total: results.length,
    passed,
    failed,
    passRate: results.length === 0 ? 0 : Math.round((passed / results.length) * 1000) / 10,
    breakdown,
    cases: results,
  };
}

export function formatFailedCaseEvidence(result: CaseEvaluation): string {
  return [
    `CASE ${result.id} FAIL [${result.categories.join(', ') || 'unclassified'}]`,
    `Question: ${result.question}`,
    `Expected: ${result.expectedBehavior}`,
    `Actual: ${result.actualAnswer}`,
    `Retrieved: ${result.retrievedTitles.join(', ') || '(none)'}`,
    `Scores: ${result.retrievedScores.map((hit) => `${hit.title}=${hit.score}`).join('; ') || '(none)'}`,
    `Citations: ${result.citationDocument.join(', ') || '(none)'}`,
    `Retrieval failed: ${result.retrievalFailed}`,
    `Injection vulnerable: ${result.injectionVulnerable}`,
    `Context:\n${result.groqContext}`,
    `Notes: ${result.notes.join(' | ') || '(none)'}`,
  ].join('\n');
}

export function formatEvaluationSummary(report: EvaluationReport): string {
  const lines = [
    'AI Grounding Evaluation',
    '-----------------------',
    '',
    `Total: ${report.total}`,
    '',
    `Passed: ${report.passed}`,
    `Failed: ${report.failed}`,
    `Pass rate: ${report.passRate}%`,
    '',
    `Retrieval failures: ${report.breakdown.retrieval_failure}`,
    `Hallucinations: ${report.breakdown.hallucination}`,
    `Unsupported claims: ${report.breakdown.unsupported_claim}`,
    `Incomplete answers: ${report.breakdown.incomplete_answer}`,
    `Contradictions: ${report.breakdown.contradiction}`,
    `Citation failures: ${report.breakdown.incorrect_citation + report.breakdown.missing_citation}`,
    `Incorrect refusals: ${report.breakdown.incorrect_refusal}`,
    `Prompt injection failures: ${report.breakdown.prompt_injection_vulnerability}`,
    `Isolation failures: ${report.breakdown.cross_user_isolation_failure}`,
    `Other: ${report.breakdown.other}`,
  ];

  const failed = report.cases.filter((entry) => !entry.pass);
  if (failed.length > 0) {
    lines.push('', 'Failed case evidence', '---------------------');
    for (const result of failed) {
      lines.push('', formatFailedCaseEvidence(result));
    }
  }

  return lines.join('\n');
}
