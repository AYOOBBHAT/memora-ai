/**
 * Minimal synthetic PDFs for local extraction / cost audits.
 * Not used by production ingest. ASCII-only so Helvetica encoding is valid.
 */

export const FIRST_PAGE_TOKEN = 'ALPHA-FRONTIER-771';
export const MIDDLE_PAGE_TOKEN = 'BRAVO-MIDPOINT-442';
export const LAST_PAGE_TOKEN = 'CHARLIE-TAIL-993';
export const UNCOMMON_TERM = 'xenon-photocathode-calibration';
export const REPEATED_TERM = 'quarterly revenue forecast';

export interface SyntheticPdfOptions {
  /** Approximate unique body characters added per page (before wrapping). */
  charsPerPage?: number;
}

function pdfEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapLine(text: string, width = 90): string[] {
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += width) {
    lines.push(text.slice(i, i + width));
  }
  return lines.length > 0 ? lines : [''];
}

function pageContentStream(lines: string[]): string {
  const ops = ['BT', '/F1 11 Tf', '48 760 Td', '13 TL'];
  lines.forEach((line, index) => {
    if (index > 0) {
      ops.push('T*');
    }
    ops.push(`(${pdfEscape(line)}) Tj`);
  });
  ops.push('ET');
  return ops.join('\n');
}

function buildPageLines(page: number, pageCount: number, charsPerPage: number): string[] {
  const middle = Math.max(1, Math.ceil(pageCount / 2));
  const uncommon = Math.max(1, Math.floor((pageCount * 2) / 3) || 1);
  const tablePage = Math.min(2, pageCount);

  const lines: string[] = [
    `MEMORA_AUDIT page=${page}/${pageCount}`,
    `REPEATED_TERM: ${REPEATED_TERM}`,
  ];

  if (page === 1) {
    lines.push(`FIRST_PAGE_TOKEN: ${FIRST_PAGE_TOKEN}`);
  }
  if (page === middle) {
    lines.push(`MIDDLE_PAGE_TOKEN: ${MIDDLE_PAGE_TOKEN}`);
  }
  if (page === pageCount) {
    lines.push(`LAST_PAGE_TOKEN: ${LAST_PAGE_TOKEN}`);
  }
  if (page === uncommon) {
    lines.push(`UNCOMMON_TERM: ${UNCOMMON_TERM}`);
  }
  if (page === tablePage) {
    lines.push('TABLE Metric | Q1 | Q2');
    lines.push('Users | 12 | 18');
    lines.push('Revenue | 40 | 55');
  }

  const fillerUnit = `Page ${page} unique body. `;
  const repeats = Math.max(1, Math.ceil(charsPerPage / fillerUnit.length));
  const filler = fillerUnit.repeat(repeats).slice(0, charsPerPage);
  lines.push(...wrapLine(filler));

  return lines;
}

function assemblePdf(contentStreams: string[]): Buffer {
  const pageCount = contentStreams.length;
  const chunks: Buffer[] = [];
  const offsets = new Map<number, number>();
  let pos = 0;

  const add = (value: string | Buffer): void => {
    const buf = typeof value === 'string' ? Buffer.from(value, 'latin1') : value;
    chunks.push(buf);
    pos += buf.length;
  };

  const addObj = (id: number, body: string): void => {
    offsets.set(id, pos);
    add(`${id} 0 obj\n${body}\nendobj\n`);
  };

  add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  const fontId = 3;
  const pageIds = contentStreams.map((_, i) => 4 + i * 2);
  const contentIds = contentStreams.map((_, i) => 5 + i * 2);

  addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  addObj(2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`);
  addObj(3, `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);

  for (let i = 0; i < pageCount; i++) {
    const stream = contentStreams[i];
    const streamBytes = Buffer.byteLength(stream, 'latin1');
    addObj(
      pageIds[i],
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`,
    );
    offsets.set(contentIds[i], pos);
    add(`${contentIds[i]} 0 obj\n<< /Length ${streamBytes} >>\nstream\n`);
    add(stream);
    add('\nendstream\nendobj\n');
  }

  const maxId = 3 + pageCount * 2;
  const xrefPos = pos;
  let xref = `xref\n0 ${maxId + 1}\n`;
  xref += '0000000000 65535 f \n';
  for (let id = 1; id <= maxId; id++) {
    const offset = offsets.get(id);
    if (offset === undefined) {
      throw new Error(`Missing PDF object offset for id ${id}`);
    }
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  add(xref);
  add(`trailer << /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);

  return Buffer.concat(chunks);
}

/** Builds a text-based PDF with unique first / middle / last page tokens. */
export function buildSyntheticPdf(pageCount: number, options: SyntheticPdfOptions = {}): Buffer {
  if (pageCount < 1 || !Number.isInteger(pageCount)) {
    throw new Error('pageCount must be a positive integer');
  }

  const charsPerPage = options.charsPerPage ?? 480;
  const streams = Array.from({ length: pageCount }, (_, index) =>
    pageContentStream(buildPageLines(index + 1, pageCount, charsPerPage)),
  );

  return assemblePdf(streams);
}

/**
 * A PDF whose file size exceeds `targetBytes`. Used to confirm the 10MB multer
 * limit; not intended for extraction.
 */
export function buildOversizedPdf(targetBytes: number): Buffer {
  const base = buildSyntheticPdf(1, { charsPerPage: 80 });
  if (base.length >= targetBytes) {
    return base;
  }

  return Buffer.concat([base, Buffer.alloc(targetBytes - base.length, 0x41)]);
}
