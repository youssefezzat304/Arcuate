import type { TextTranslation } from '@arcuate/ai/schema';

type PdfLanguage = { code: string; label: string };

export type ReadingPdfInput = {
  title: string;
  paragraphs: string[];
  metadata: string;
  sourceLanguage: PdfLanguage;
  translationLanguage?: PdfLanguage;
  translation?: TextTranslation;
};

type JpegPage = { bytes: Uint8Array; width: number; height: number };
type TextStyle = {
  color: string;
  font: string;
  lineHeight: number;
  language: string;
  spaceAfter: number;
};

const PDF_WIDTH = 595.28;
const PDF_HEIGHT = 841.89;
const CANVAS_WIDTH = 1240;
const CANVAS_HEIGHT = 1754;
const MARGIN = 112;
const BOTTOM_MARGIN = 112;
const CONTENT_WIDTH = CANVAS_WIDTH - MARGIN * 2;
const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'ur']);

function ascii(value: string) {
  return new TextEncoder().encode(value);
}

function concatenate(chunks: Uint8Array[]) {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export function buildPdfFromJpegs(pages: JpegPage[]) {
  if (pages.length === 0) throw new Error('A PDF needs at least one page.');
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let byteLength = 0;
  const append = (chunk: Uint8Array) => {
    chunks.push(chunk);
    byteLength += chunk.length;
  };
  const appendText = (value: string) => append(ascii(value));
  const objectCount = 2 + pages.length * 3;

  appendText('%PDF-1.4\n% Arcuate\n');
  offsets[1] = byteLength;
  appendText('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  offsets[2] = byteLength;
  const pageIds = pages.map((_, index) => 3 + index * 3);
  appendText(
    `2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>\nendobj\n`,
  );

  pages.forEach((page, index) => {
    const pageId = 3 + index * 3;
    const imageId = pageId + 1;
    const contentId = pageId + 2;
    const imageName = `Im${index + 1}`;

    offsets[pageId] = byteLength;
    appendText(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /XObject << /${imageName} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`,
    );

    offsets[imageId] = byteLength;
    appendText(
      `${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`,
    );
    append(page.bytes);
    appendText('\nendstream\nendobj\n');

    const drawing = `q\n${PDF_WIDTH} 0 0 ${PDF_HEIGHT} 0 0 cm\n/${imageName} Do\nQ\n`;
    offsets[contentId] = byteLength;
    appendText(
      `${contentId} 0 obj\n<< /Length ${ascii(drawing).length} >>\nstream\n${drawing}endstream\nendobj\n`,
    );
  });

  const xrefOffset = byteLength;
  appendText(`xref\n0 ${objectCount + 1}\n`);
  appendText('0000000000 65535 f \n');
  for (let id = 1; id <= objectCount; id++) {
    appendText(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  }
  appendText(
    `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  );
  return concatenate(chunks);
}

function splitOversizedSegment(
  context: CanvasRenderingContext2D,
  segment: string,
  maxWidth: number,
  language: string,
) {
  const pieces: string[] = [];
  let piece = '';
  const graphemes = new Intl.Segmenter(language, { granularity: 'grapheme' });
  for (const { segment: grapheme } of graphemes.segment(segment)) {
    if (piece && context.measureText(piece + grapheme).width > maxWidth) {
      pieces.push(piece);
      piece = grapheme;
    } else {
      piece += grapheme;
    }
  }
  if (piece) pieces.push(piece);
  return pieces;
}

export function wrapCanvasText(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  language: string,
) {
  const lines: string[] = [];
  const segmenter = new Intl.Segmenter(language, { granularity: 'word' });
  for (const explicitLine of value.replace(/\r/g, '').split('\n')) {
    let line = '';
    for (const { segment } of segmenter.segment(explicitLine)) {
      const candidate = line + segment;
      if (!line || context.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      lines.push(line.trimEnd());
      const next = segment.trimStart();
      if (context.measureText(next).width <= maxWidth) {
        line = next;
        continue;
      }
      const pieces = splitOversizedSegment(context, next, maxWidth, language);
      lines.push(...pieces.slice(0, -1));
      line = pieces.at(-1) ?? '';
    }
    lines.push(line.trimEnd());
  }
  return lines.length ? lines : [''];
}

function canvasToJpeg(canvas: HTMLCanvasElement) {
  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('The PDF page could not be rendered.'));
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      'image/jpeg',
      0.92,
    );
  });
}

async function renderPages(input: ReadingPdfInput) {
  const canvases: HTMLCanvasElement[] = [];
  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D;
  let y = 0;

  function addPage() {
    canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    context = canvas.getContext('2d', { alpha: false })!;
    context.fillStyle = '#fcfbf7';
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.fillStyle = '#706a5e';
    context.font = '700 18px Arial, Helvetica, sans-serif';
    context.textAlign = 'left';
    context.direction = 'ltr';
    context.fillText('ARCUATE  /  READING EDITION', MARGIN, 70);
    context.fillStyle = '#f6bf13';
    context.fillRect(MARGIN, 88, 72, 5);
    y = 138;
    canvases.push(canvas);
  }

  function drawFooter(pageNumber: number) {
    context.fillStyle = '#706a5e';
    context.font = '18px Arial, Helvetica, sans-serif';
    context.textAlign = 'right';
    context.direction = 'ltr';
    context.fillText(String(pageNumber).padStart(2, '0'), CANVAS_WIDTH - MARGIN, 1690);
  }

  function newPage() {
    if (canvases.length) drawFooter(canvases.length);
    addPage();
  }

  function drawText(value: string, style: TextStyle) {
    context.font = style.font;
    const lines = wrapCanvasText(context, value, CONTENT_WIDTH, style.language);
    const rtl = RTL_LANGUAGES.has(style.language.split('-')[0]!);
    context.fillStyle = style.color;
    context.textAlign = rtl ? 'right' : 'left';
    context.direction = rtl ? 'rtl' : 'ltr';
    for (const line of lines) {
      if (y + style.lineHeight > CANVAS_HEIGHT - BOTTOM_MARGIN) newPage();
      context.fillText(line, rtl ? CANVAS_WIDTH - MARGIN : MARGIN, y);
      y += style.lineHeight;
    }
    y += style.spaceAfter;
  }

  function drawLabel(label: string) {
    if (y + 92 > CANVAS_HEIGHT - BOTTOM_MARGIN) newPage();
    context.fillStyle = '#706a5e';
    context.font = '700 17px Arial, Helvetica, sans-serif';
    context.textAlign = 'left';
    context.direction = 'ltr';
    context.fillText(label.toLocaleUpperCase(), MARGIN, y);
    y += 34;
  }

  addPage();
  drawText(input.title, {
    color: '#161616',
    font: '700 58px Georgia, "Times New Roman", serif',
    lineHeight: 68,
    language: input.sourceLanguage.code,
    spaceAfter: input.translation ? 10 : 24,
  });
  if (input.translation) {
    drawText(input.translation.title, {
      color: '#706a5e',
      font: '36px Georgia, "Times New Roman", serif',
      lineHeight: 46,
      language: input.translation.language,
      spaceAfter: 24,
    });
  }
  drawText(
    input.translationLanguage
      ? `${input.metadata}  /  Translation: ${input.translationLanguage.label}`
      : input.metadata,
    {
      color: '#706a5e',
      font: '700 19px Arial, Helvetica, sans-serif',
      lineHeight: 29,
      language: 'en',
      spaceAfter: 46,
    },
  );

  input.paragraphs.forEach((paragraph, index) => {
    drawLabel(`Original  /  ${input.sourceLanguage.label}`);
    drawText(paragraph, {
      color: '#161616',
      font: '29px Georgia, "Times New Roman", serif',
      lineHeight: 47,
      language: input.sourceLanguage.code,
      spaceAfter: input.translation ? 24 : 46,
    });
    const translated = input.translation?.paragraphs[index]?.sentences
      .map((sentence) => sentence.text)
      .join(' ');
    if (translated && input.translation && input.translationLanguage) {
      drawLabel(`Translation  /  ${input.translationLanguage.label}`);
      drawText(translated, {
        color: '#31312f',
        font: '27px Georgia, "Times New Roman", serif',
        lineHeight: 44,
        language: input.translation.language,
        spaceAfter: 52,
      });
    }
  });
  drawFooter(canvases.length);

  return Promise.all(
    canvases.map(async (page) => ({
      bytes: await canvasToJpeg(page),
      width: page.width,
      height: page.height,
    })),
  );
}

function safeFileName(title: string) {
  const name = title
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${name || 'reading'}.pdf`;
}

export async function downloadReadingPdf(input: ReadingPdfInput) {
  const pages = await renderPages(input);
  const pdf = buildPdfFromJpegs(pages);
  const blob = new Blob([pdf as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFileName(input.title);
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
