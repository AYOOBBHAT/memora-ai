/**
 * Local large-PDF + Groq context measurement.
 * Does not upload to user accounts, MongoDB, or production.
 *
 * Run from backend/: npx tsx scripts/pdf-cost-audit.ts
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import dotenv from 'dotenv';

import {
  FIRST_PAGE_TOKEN,
  LAST_PAGE_TOKEN,
  MIDDLE_PAGE_TOKEN,
  UNCOMMON_TERM,
  buildOversizedPdf,
  buildSyntheticPdf,
} from '../src/ai-evaluation/syntheticPdf';
import { PDF_MAX_FILE_SIZE_BYTES } from '../src/middleware/upload.middleware';
import { RAG_SYSTEM_PROMPT, buildGroqUserPrompt } from '../src/services/ragPrompt';
import { extractTextFromPdf } from '../src/services/pdf.service';
import {
  groqInputCharacterCount,
  packRetrievedDocumentsForGroq,
} from '../src/services/ragContextBudget';

dotenv.config();

const EMBED_CHAR_LIMIT = 8_000;
const CHARS_PER_TOKEN = 4;
const GROQ_CONTEXT_WINDOW = 131_072;
const GROQ_MAX_OUTPUT = 1_024;
const RAG_MAX_CONTEXT_TOKENS = 24_000;
const PDF_MAX_PAGES = 50;
const PDF_MAX_EXTRACTED_CHARS = 50_000;
const CHARS_PER_PAGE = 480;

const PAGE_COUNTS = [1, 15, 50, 100, 300, 500] as const;

function estimateTokens(chars: number): number {
  return Math.ceil(chars / CHARS_PER_TOKEN);
}

function rssMb(): number | undefined {
  const rss = process.memoryUsage().rss;
  return Math.round((rss / (1024 * 1024)) * 10) / 10;
}

function tokenIndex(text: string, token: string): number {
  return text.indexOf(token);
}

function inEmbeddingWindow(text: string, token: string): boolean {
  const index = tokenIndex(text, token);
  return index >= 0 && index < EMBED_CHAR_LIMIT;
}

interface PdfRow {
  label: string;
  pagesRequested: number;
  fileSizeBytes: number;
  fileSizeKb: number;
  pageCountExtracted: number | null;
  extractionMs: number | null;
  extractedChars: number | null;
  embeddingChars: number | null;
  embeddingWouldTruncate: boolean | null;
  firstPageInEmbedding: boolean | null;
  middlePageInEmbedding: boolean | null;
  lastPageInEmbedding: boolean | null;
  uncommonTermInEmbedding: boolean | null;
  embeddingMs: number | null;
  totalProcessingMs: number | null;
  embeddingStatus: string;
  launchLimit: 'accepted' | 'rejected_pages' | 'rejected_text' | 'rejected_file_size';
  error: string | null;
  rssMbAfter: number | undefined;
}

function groqPromptForDocs(
  docs: Array<{ id: string; title: string; content: string }>,
  question: string,
): {
  systemChars: number;
  userChars: number;
  totalChars: number;
  estInputTokens: number;
  includedDocs: number;
  packed: boolean;
} {
  const packed = packRetrievedDocumentsForGroq(
    docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      sourceType: 'pdf',
      content: doc.content,
    })),
    question,
    RAG_MAX_CONTEXT_TOKENS,
  );
  const totalChars = groqInputCharacterCount(packed.context, question);
  const user = buildGroqUserPrompt(packed.context, question);
  return {
    systemChars: RAG_SYSTEM_PROMPT.length,
    userChars: user.length,
    totalChars,
    estInputTokens: packed.estimatedInputTokens,
    includedDocs: packed.includedCount,
    packed: true,
  };
}

function launchLimitForExtract(pages: number | null, chars: number | null): 'accepted' | 'rejected_pages' | 'rejected_text' {
  if (pages !== null && pages > PDF_MAX_PAGES) {
    return 'rejected_pages';
  }
  if (chars !== null && chars > PDF_MAX_EXTRACTED_CHARS) {
    return 'rejected_text';
  }
  return 'accepted';
}

async function measurePdf(pageCount: number): Promise<{ row: PdfRow; text: string | null }> {
  const label = pageCount === 1 ? 'small' : `${pageCount} pages`;
  const rssBefore = rssMb();
  const file = buildSyntheticPdf(pageCount, { charsPerPage: CHARS_PER_PAGE });
  const extractStarted = performance.now();
  const extraction = await extractTextFromPdf(file);
  const extractionMs = Math.round(performance.now() - extractStarted);

  if (extraction.status === 'failed' || !extraction.text) {
    return {
      text: null,
      row: {
        label,
        pagesRequested: pageCount,
        fileSizeBytes: file.length,
        fileSizeKb: Math.round((file.length / 1024) * 10) / 10,
        pageCountExtracted: extraction.pageCount ?? null,
        extractionMs,
        extractedChars: null,
        embeddingChars: null,
        embeddingWouldTruncate: null,
        firstPageInEmbedding: null,
        middlePageInEmbedding: null,
        lastPageInEmbedding: null,
        uncommonTermInEmbedding: null,
        embeddingMs: null,
        totalProcessingMs: extractionMs,
        embeddingStatus: 'not_run',
        launchLimit: launchLimitForExtract(extraction.pageCount ?? null, null),
        error: extraction.error ?? 'extraction failed',
        rssMbAfter: rssMb(),
      },
    };
  }

  const text = extraction.text;
  const embeddingChars = Math.min(text.length, EMBED_CHAR_LIMIT);

  return {
    text,
    row: {
      label,
      pagesRequested: pageCount,
      fileSizeBytes: file.length,
      fileSizeKb: Math.round((file.length / 1024) * 10) / 10,
      pageCountExtracted: extraction.pageCount ?? null,
      extractionMs,
      extractedChars: text.length,
      embeddingChars,
      embeddingWouldTruncate: text.length > EMBED_CHAR_LIMIT,
      firstPageInEmbedding: inEmbeddingWindow(text, FIRST_PAGE_TOKEN),
      middlePageInEmbedding: inEmbeddingWindow(text, MIDDLE_PAGE_TOKEN),
      lastPageInEmbedding: inEmbeddingWindow(text, LAST_PAGE_TOKEN),
      uncommonTermInEmbedding: inEmbeddingWindow(text, UNCOMMON_TERM),
      embeddingMs: null,
      totalProcessingMs: extractionMs,
      embeddingStatus: 'truncated_locally_not_persisted',
      launchLimit: launchLimitForExtract(extraction.pageCount ?? null, text.length),
      error: null,
      rssMbAfter: rssMb() ?? rssBefore,
    },
  };
}

async function maybeTimeEmbedding(sampleText: string): Promise<{
  skipped: boolean;
  ms?: number;
  error?: string;
}> {
  const hasKey = Boolean(process.env.GOOGLE_AI_API_KEY?.trim());
  const hasMongo = Boolean(process.env.MONGODB_URI?.trim());
  const hasJwt =
    (process.env.JWT_ACCESS_SECRET?.length ?? 0) >= 32 &&
    (process.env.JWT_REFRESH_SECRET?.length ?? 0) >= 32;

  if (!hasKey || !hasMongo || !hasJwt) {
    return { skipped: true, error: 'GOOGLE_AI_API_KEY or required env not available in this process' };
  }

  try {
    const started = performance.now();
    const { generateEmbedding } = await import('../src/services/embedding.service');
    await generateEmbedding(sampleText.slice(0, EMBED_CHAR_LIMIT));
    return { skipped: false, ms: Math.round(performance.now() - started) };
  } catch (error) {
    return {
      skipped: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main(): Promise<void> {
  const rows: PdfRow[] = [];
  const extractedText = new Map<number, string>();

  for (const pages of PAGE_COUNTS) {
    process.stderr.write(`Measuring ${pages}-page synthetic PDF...\n`);
    const measured = await measurePdf(pages);
    rows.push(measured.row);
    if (measured.text) {
      extractedText.set(pages, measured.text);
    }
  }

  process.stderr.write('Measuring 51-page synthetic PDF (page-limit reject)...\n');
  const overPage = await measurePdf(51);
  overPage.row.launchLimit = launchLimitForExtract(
    overPage.row.pageCountExtracted,
    overPage.row.extractedChars,
  );
  rows.push(overPage.row);

  const oversized = buildOversizedPdf(PDF_MAX_FILE_SIZE_BYTES + 1024);
  rows.push({
    label: 'oversize >10MB',
    pagesRequested: 1,
    fileSizeBytes: oversized.length,
    fileSizeKb: Math.round((oversized.length / 1024) * 10) / 10,
    pageCountExtracted: null,
    extractionMs: null,
    extractedChars: null,
    embeddingChars: null,
    embeddingWouldTruncate: null,
    firstPageInEmbedding: null,
    middlePageInEmbedding: null,
    lastPageInEmbedding: null,
    uncommonTermInEmbedding: null,
    embeddingMs: null,
    totalProcessingMs: null,
    embeddingStatus: 'rejected_by_multer_limit',
    launchLimit: 'rejected_file_size',
    error: `file ${oversized.length} bytes exceeds PDF_MAX_FILE_SIZE_BYTES=${PDF_MAX_FILE_SIZE_BYTES}`,
    rssMbAfter: rssMb(),
  });

  const text100 = extractedText.get(100) ?? 'Large document body. '.repeat(2500);
  const text500 = extractedText.get(500) ?? 'Huge. '.repeat(50_000);

  const largestOk = rows.find((row) => row.pagesRequested === 500 && row.extractedChars);
  const embedSample = largestOk
    ? 'x'.repeat(EMBED_CHAR_LIMIT)
    : 'Memora cost audit embedding sample '.repeat(40);
  const embeddingTiming = await maybeTimeEmbedding(embedSample);

  if (!embeddingTiming.skipped && embeddingTiming.ms !== undefined) {
    for (const row of rows) {
      if (row.extractedChars) {
        row.embeddingMs = embeddingTiming.ms;
        row.totalProcessingMs = (row.extractionMs ?? 0) + embeddingTiming.ms;
        row.embeddingStatus = 'completed_unpersisted_local_call';
      }
    }
  }

  const shortDocs = [
    { id: 's1', title: 'Short note A', content: 'Memora launched on June 15, 2026. Maximum PDF size is 10MB.' },
    { id: 's2', title: 'Short note B', content: 'Free plan provides 50 AI questions per month.' },
    { id: 's3', title: 'Short note C', content: 'Vector search uses MongoDB Atlas.' },
  ];

  const mediumContent = 'Medium document body. '.repeat(400); // ~8k chars
  const mediumDocs = Array.from({ length: 5 }, (_, i) => ({
    id: `m${i + 1}`,
    title: `Medium doc ${i + 1}`,
    content: `${mediumContent} Unique marker ${i + 1}.`,
  }));

  const largeDocs = Array.from({ length: 5 }, (_, i) => ({
    id: `l${i + 1}`,
    title: `Large PDF ${i + 1}`,
    content: text100,
  }));

  const questionShort = 'What is the maximum PDF size?';
  const questionLong = 'What does the uncommon xenon photocathode calibration section say about Q4?';

  const contextScenarios = [
    { name: '3 short notes', docs: shortDocs, question: questionShort },
    { name: '5 medium (~8k chars each)', docs: mediumDocs, question: questionShort },
    { name: '1 large 100-page PDF', docs: [largeDocs[0]], question: questionLong },
    { name: '5 large 100-page PDFs', docs: largeDocs, question: questionLong },
    {
      name: '5 x 500-page PDFs (worst retrieved set)',
      docs: Array.from({ length: 5 }, (_, i) => ({
        id: `w${i + 1}`,
        title: `Huge PDF ${i + 1}`,
        content: text500,
      })),
      question: questionLong,
    },
  ];

  const contextRows = [];
  for (const scenario of contextScenarios) {
    const prompt = groqPromptForDocs(scenario.docs, scenario.question);
    contextRows.push({
      scenario: scenario.name,
      docs: scenario.docs.length,
      includedDocs: prompt.includedDocs,
      characters: prompt.totalChars,
      estInputTokens: prompt.estInputTokens,
      questionChars: scenario.question.length,
      questionEstTokens: estimateTokens(scenario.question.length),
      exceedsConfiguredBudget: prompt.estInputTokens > RAG_MAX_CONTEXT_TOKENS,
      exceedsGroqContext: prompt.estInputTokens > GROQ_CONTEXT_WINDOW,
      result:
        prompt.estInputTokens > RAG_MAX_CONTEXT_TOKENS
          ? 'EXCEEDS_CONFIGURED_BUDGET'
          : 'within_24000_budget',
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    isolated: true,
    uploadedToUserAccounts: false,
    groqContextWindow: GROQ_CONTEXT_WINDOW,
    groqMaxOutputTokens: GROQ_MAX_OUTPUT,
    ragMaxContextTokens: RAG_MAX_CONTEXT_TOKENS,
    pdfMaxPages: PDF_MAX_PAGES,
    pdfMaxExtractedChars: PDF_MAX_EXTRACTED_CHARS,
    embedCharLimit: EMBED_CHAR_LIMIT,
    pdfMaxFileSizeBytes: PDF_MAX_FILE_SIZE_BYTES,
    charsPerTokenEstimate: CHARS_PER_TOKEN,
    embeddingTiming,
    pdfs: rows,
    context: contextRows,
    rssMb: rssMb(),
  };

  const outPath = path.resolve(__dirname, '../src/ai-evaluation/pdf-cost-audit-results.json');
  await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nWrote ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
