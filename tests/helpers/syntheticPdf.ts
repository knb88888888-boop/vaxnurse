import { createHash } from 'node:crypto';

export interface SyntheticPdfOptions {
  pages?: Array<{
    lines: string[];
  }>;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
}

function toAsciiSafeText(value: string): string {
  return value
    .replaceAll('ą', 'a')
    .replaceAll('Ą', 'A')
    .replaceAll('ć', 'c')
    .replaceAll('Ć', 'C')
    .replaceAll('ę', 'e')
    .replaceAll('Ę', 'E')
    .replaceAll('ł', 'l')
    .replaceAll('Ł', 'L')
    .replaceAll('ń', 'n')
    .replaceAll('Ń', 'N')
    .replaceAll('ó', 'o')
    .replaceAll('Ó', 'O')
    .replaceAll('ś', 's')
    .replaceAll('Ś', 'S')
    .replaceAll('ź', 'z')
    .replaceAll('Ź', 'Z')
    .replaceAll('ż', 'z')
    .replaceAll('Ż', 'Z')
    .replace(/[^\x20-\x7e]/g, ' ');
}

function escapePdfLiteralString(value: string): string {
  return toAsciiSafeText(value)
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)');
}

function pad10(n: number): string {
  return String(n).padStart(10, '0');
}

export function buildSyntheticPdfBytes(options: SyntheticPdfOptions = {}): Uint8Array<ArrayBuffer> {
  const pages =
    options.pages && options.pages.length > 0
      ? options.pages
      : [
          {
            lines: [
              'CHPL SYNTHETIC TEST DOCUMENT - PAGE 1',
              '4.2 Dawkowanie i sposob podawania: podanie srodskorne 0.1 ml.',
              '4.3 Przeciwwskazania: nadwrazliwosc na substancje czynna.'
            ]
          },
          {
            lines: [
              'CHPL SYNTHETIC TEST DOCUMENT - PAGE 2',
              '6.1 Wykaz substancji pomocniczych: sodu chlorek, woda do wstrzykiwan.',
              '10. Data zatwierdzenia tekstu ChPL: 2026-09-15.'
            ]
          }
        ];

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;

  const appendText = (text: string): number => {
    const bytes = encoder.encode(text);
    const startOffset = offset;
    chunks.push(bytes);
    offset += bytes.length;
    return startOffset;
  };

  appendText('%PDF-1.4\n%VaxNurse-Synthetic-Test\n');

  const objectOffsets: number[] = [0]; // index 1-based for xref

  const catalogObjId = 1;
  const pagesObjId = 2;
  const fontObjId = 3;

  const pageObjIds: number[] = [];
  const contentObjIds: number[] = [];
  let nextObjId = 4;
  for (let i = 0; i < pages.length; i += 1) {
    pageObjIds.push(nextObjId++);
    contentObjIds.push(nextObjId++);
  }

  const hasInfo = Boolean(
    options.title || options.author || options.subject || options.creator || options.producer
  );
  const infoObjId = hasInfo ? nextObjId++ : null;
  const totalObjects = nextObjId - 1;

  // Obj 1: Catalog
  objectOffsets[catalogObjId] = appendText(
    `${catalogObjId} 0 obj\n<< /Type /Catalog /Pages ${pagesObjId} 0 R >>\nendobj\n`
  );

  // Obj 2: Pages
  objectOffsets[pagesObjId] = appendText(
    `${pagesObjId} 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [${pageObjIds
      .map((id) => `${id} 0 R`)
      .join(' ')}] >>\nendobj\n`
  );

  // Obj 3: Helvetica Type1 Font
  objectOffsets[fontObjId] = appendText(
    `${fontObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`
  );

  // Page + Content stream pairs
  for (let i = 0; i < pages.length; i += 1) {
    const pageObjId = pageObjIds[i];
    const contentObjId = contentObjIds[i];
    const cleanLines = pages[i].lines.filter((line) => line.trim().length > 0);

    objectOffsets[pageObjId] = appendText(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent ${pagesObjId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
    );

    const streamBody =
      cleanLines.length > 0
        ? [
            'BT',
            '/F1 12 Tf',
            '50 780 Td',
            '16 TL',
            ...cleanLines.map((line, lineIdx) =>
              `${lineIdx === 0 ? '' : 'T* '}(${escapePdfLiteralString(line)}) Tj`
            ),
            'ET'
          ].join('\n')
        : '% empty scan-like page without text operators';

    const streamBytesLen = encoder.encode(streamBody).length;
    objectOffsets[contentObjId] = appendText(
      `${contentObjId} 0 obj\n<< /Length ${streamBytesLen} >>\nstream\n${streamBody}\nendstream\nendobj\n`
    );
  }

  if (infoObjId !== null) {
    const infoPairs: string[] = [];
    if (options.title) infoPairs.push(`/Title (${escapePdfLiteralString(options.title)})`);
    if (options.author) infoPairs.push(`/Author (${escapePdfLiteralString(options.author)})`);
    if (options.subject) infoPairs.push(`/Subject (${escapePdfLiteralString(options.subject)})`);
    if (options.creator) infoPairs.push(`/Creator (${escapePdfLiteralString(options.creator)})`);
    if (options.producer) infoPairs.push(`/Producer (${escapePdfLiteralString(options.producer)})`);
    infoPairs.push('/CreationDate (D:20261112000000Z)');
    objectOffsets[infoObjId] = appendText(
      `${infoObjId} 0 obj\n<< ${infoPairs.join(' ')} >>\nendobj\n`
    );
  }

  const xrefOffset = offset;
  appendText(`xref\n0 ${totalObjects + 1}\n`);
  appendText('0000000000 65535 f \n');
  for (let id = 1; id <= totalObjects; id += 1) {
    appendText(`${pad10(objectOffsets[id])} 00000 n \n`);
  }

  const infoRef = infoObjId !== null ? ` /Info ${infoObjId} 0 R` : '';
  appendText(
    `trailer\n<< /Size ${totalObjects + 1} /Root ${catalogObjId} 0 R${infoRef} >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  const out = new Uint8Array(new ArrayBuffer(offset));
  let pos = 0;
  for (const chunk of chunks) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  return out;
}

export function buildScanOnlyPdfBytes(pageCount = 1): Uint8Array<ArrayBuffer> {
  return buildSyntheticPdfBytes({
    pages: Array.from({ length: Math.max(1, pageCount) }, () => ({ lines: [] })),
    title: 'Scan Without Embedded Text Layer'
  });
}

export function buildCorruptPdfBytes(): Uint8Array<ArrayBuffer> {
  const src = new TextEncoder().encode('%PDF-1.4\n1 0 obj\n<< /Broken /Structure \n%%INVALID_XREF');
  const out = new Uint8Array(new ArrayBuffer(src.byteLength));
  out.set(src);
  return out;
}

export function buildFakeDisguisedPdfBytes(): Uint8Array<ArrayBuffer> {
  const src = new TextEncoder().encode('<!DOCTYPE html><html><body>Not a real PDF</body></html>');
  const out = new Uint8Array(new ArrayBuffer(src.byteLength));
  out.set(src);
  return out;
}

export function computeNodeSha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}
