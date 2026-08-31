import type { EvalCase } from './cases';
import { EVAL_CASES } from './cases';
import type { EvalDocument } from './corpus';
import {
  PRODUCTION_NO_DOCUMENTS_ANSWER,
  judgeEvalCase,
  type FailureCategory,
  type JudgeResult,
} from './judge';
import { retrieveEvalDocuments, type EvalRetrievedDocument } from './retrieve';

export interface EvalGenerateFn {
  (context: string, question: string): Promise<string>;
}

export interface CaseEvaluation {
  id: string;
  category: EvalCase['category'];
  question: string;
  userId: string;
  retrievedTitles: string[];
  retrievedContext: string;
  retrievedScores: Array<{ title: string; score: number }>;
  actualAnswer: string;
  citationPresent: boolean;
  citationCorrect: boolean;
  citationDocument: string[];
  supportingTextAvailable: boolean;
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

/** Mirrors chat.service.ts `buildContextFromDocuments` without importing production chat. */
export function buildEvalContext(documents: EvalDocument[]): string {
  return documents
    .map((doc, index) => {
      return `[Document ${index + 1}]
ID: ${doc.id}
Title: ${doc.title}
Source Type: ${doc.sourceType}
Content:

${doc.content.trim()}`;
    })
    .join('\n\n---\n\n');
}

export function emptyBreakdown(): Record<FailureCategory, number> {
  return {
    retrieval_failure: 0,
    hallucination: 0,
    unsupported_claim: 0,
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
): Promise<{ retrieved: EvalRetrievedDocument[]; answer: string; judge: JudgeResult }> {
  const retrieved = retrieveEvalDocuments(testCase.userId, testCase.question);

  let answer: string;
  if (retrieved.length === 0) {
    answer = PRODUCTION_NO_DOCUMENTS_ANSWER;
  } else {
    const context = buildEvalContext(retrieved.map((hit) => hit.document));
    answer = await generate(context, testCase.question);
  }

  return {
    retrieved,
    answer,
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
    const { retrieved, answer, judge } = await evaluateCase(testCase, options.generate);

    for (const category of judge.categories) {
      breakdown[category] += 1;
    }

    results.push({
      id: testCase.id,
      category: testCase.category,
      question: testCase.question,
      userId: testCase.userId,
      retrievedTitles: retrieved.map((hit) => hit.document.title),
      retrievedContext: retrieved.map((hit) => hit.document.content).join('\n\n---\n\n'),
      retrievedScores: retrieved.map((hit) => ({ title: hit.document.title, score: hit.score })),
      actualAnswer: answer,
      citationPresent: judge.citation.citationPresent,
      citationCorrect: judge.citation.citationCorrect,
      citationDocument: judge.citation.citationDocument,
      supportingTextAvailable: judge.citation.supportingTextAvailable,
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

export function formatEvaluationSummary(report: EvaluationReport): string {
  return [
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
    `Citation failures: ${report.breakdown.incorrect_citation + report.breakdown.missing_citation}`,
    `Incorrect refusals: ${report.breakdown.incorrect_refusal}`,
    `Prompt injection failures: ${report.breakdown.prompt_injection_vulnerability}`,
    `Isolation failures: ${report.breakdown.cross_user_isolation_failure}`,
    `Other: ${report.breakdown.other}`,
  ].join('\n');
}
