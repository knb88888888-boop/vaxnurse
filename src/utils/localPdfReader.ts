import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import type {
  LocalPdfMetadataStatus,
  LocalPdfMetadataSummary,
  LocalPdfTextLayerStatus
} from '../types/evidenceLedger';
import {
  LOCAL_PDF_TEXT_LAYER_DISCLAIMER,
  createEmptyPdfMetadataSummary,
  sanitizeUntrustedPdfMetadataField
} from './localPdfBridge';

export interface OpenedLocalPdfSession {
  pageCount: number;
  parserVersion: string;
  metadataStatus: LocalPdfMetadataStatus;
  textLayerStatus: LocalPdfTextLayerStatus;
  metadata: LocalPdfMetadataSummary;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
  getPagePlainText: (pageNumber: number) => Promise<string>;
  searchPlainText: (
    query: string,
    options?: { signal?: AbortSignal; maxMatches?: number }
  ) => Promise<LocalPdfTextSearchResult>;
  renderPageToCanvas: (params: {
    pageNumber: number;
    canvas: HTMLCanvasElement;
    scale: number;
  }) => {
    renderTaskPromise: Promise<RenderTask>;
    done: Promise<{ widthPx: number; heightPx: number }>;
    cancel: () => void;
  };
  destroy: () => Promise<void>;
}

export interface LocalPdfTextMatch {
  pageNumber: number;
  snippet: string;
}

export interface LocalPdfTextSearchResult {
  query: string;
  pagesScanned: number;
  totalPages: number;
  matches: LocalPdfTextMatch[];
  truncated: boolean;
  disclaimer: string;
}

let workerUrlConfigured = false;

async function loadPdfJsRuntime() {
  const [pdfjs, workerUrlMod] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  ]);
  if (!workerUrlConfigured && typeof Worker !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrlMod.default;
    workerUrlConfigured = true;
  }
  return pdfjs;
}

function classifyPdfOpenError(err: unknown): string {
  const rawMessage = err instanceof Error ? err.message : String(err ?? '');
  const errName = err instanceof Error ? err.name : '';
  if (/password/i.test(errName) || /password/i.test(rawMessage)) {
    return 'Plik PDF jest chroniony hasłem (PasswordException). Przeglądarkowy podgląd audytowy VaxNurse nie otwiera zaszyfrowanych plików bez jawnego hasła.';
  }
  if (/InvalidPDFException|MissingPDFException|FormatError/i.test(errName) || /Invalid PDF/i.test(rawMessage)) {
    return 'Parser PDF.js odrzucił plik jako uszkodzony lub niezgodny ze strukturą dokumentu PDF.';
  }
  return `Nie udało się otworzyć pliku PDF lokalnie w PDF.js: ${rawMessage || 'nieznany błąd parsera'}.`;
}

function extractTextFromItems(items: Array<{ str?: unknown }>): string {
  const chunks: string[] = [];
  for (const item of items) {
    if (typeof item.str === 'string' && item.str.length > 0) {
      chunks.push(item.str);
    }
  }
  return chunks.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Otwiera walidowany uprzednio lokalny plik PDF wyłącznie po stronie przeglądarki przez lazy-loaded pdfjs-dist.
 * Wyłącza XFA, zewnętrzne żądania fetch workera oraz obsługę skryptów PDF.
 */
export async function openLocalPdfSessionDocument(bytes: Uint8Array): Promise<OpenedLocalPdfSession> {
  const pdfjs = await loadPdfJsRuntime();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(bytes.slice(0)),
    enableXfa: false,
    useWorkerFetch: false,
    disableRange: true,
    disableStream: true,
    disableAutoFetch: true,
    useSystemFonts: false,
    disableFontFace: false,
    stopAtErrors: false,
    verbosity: pdfjs.VerbosityLevel?.ERRORS ?? 0
  });

  let passwordTriggered = false;
  loadingTask.onPassword = () => {
    passwordTriggered = true;
    void loadingTask.destroy();
  };

  let pdfDocument: PDFDocumentProxy;
  try {
    pdfDocument = await loadingTask.promise;
  } catch (err) {
    try {
      await loadingTask.destroy();
    } catch {
      // Ignoruj wtórne błędy czyszczenia przy odrzuconym PDF
    }
    if (passwordTriggered) {
      throw new Error(classifyPdfOpenError(new Error('PasswordException')));
    }
    throw new Error(classifyPdfOpenError(err));
  }

  if (!Number.isInteger(pdfDocument.numPages) || pdfDocument.numPages < 1) {
    await loadingTask.destroy();
    throw new Error('Otwarty dokument PDF nie zawiera żadnej poprawnej strony.');
  }

  let metadataStatus: LocalPdfMetadataStatus = 'partial_or_empty';
  let metadata = createEmptyPdfMetadataSummary();

  try {
    const metaRes = await pdfDocument.getMetadata();
    const info = (metaRes?.info ?? {}) as Record<string, unknown>;
    const summary = createEmptyPdfMetadataSummary({
      title: sanitizeUntrustedPdfMetadataField(info.Title),
      author: sanitizeUntrustedPdfMetadataField(info.Author),
      subject: sanitizeUntrustedPdfMetadataField(info.Subject),
      creator: sanitizeUntrustedPdfMetadataField(info.Creator),
      producer: sanitizeUntrustedPdfMetadataField(info.Producer),
      creationDate: sanitizeUntrustedPdfMetadataField(info.CreationDate, 80),
      modDate: sanitizeUntrustedPdfMetadataField(info.ModDate, 80),
      pdfVersion: sanitizeUntrustedPdfMetadataField(info.PDFFormatVersion, 24)
    });
    metadata = summary;
    const hasAnyField = Boolean(
      summary.title ||
        summary.author ||
        summary.subject ||
        summary.creator ||
        summary.producer ||
        summary.pdfVersion
    );
    metadataStatus = hasAnyField ? 'extracted' : 'partial_or_empty';
  } catch {
    metadataStatus = 'failed';
  }

  // Sonda dostępności warstwy tekstowej na pierwszych maks. 3 stronach (bez OCR)
  let textLayerStatus: LocalPdfTextLayerStatus = 'no_text_layer';
  const pageTextCache = new Map<number, string>();

  const readPagePlainText = async (pageNumber: number): Promise<string> => {
    const cached = pageTextCache.get(pageNumber);
    if (cached !== undefined) {
      return cached;
    }
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = extractTextFromItems(textContent.items as Array<{ str?: unknown }>);
    pageTextCache.set(pageNumber, text);
    return text;
  };

  try {
    const probeCount = Math.min(pdfDocument.numPages, 3);
    for (let p = 1; p <= probeCount; p += 1) {
      const txt = await readPagePlainText(p);
      if (txt.length > 0) {
        textLayerStatus = 'text_layer_available';
        break;
      }
    }
  } catch {
    textLayerStatus = 'failed';
  }

  let destroyed = false;

  return {
    pageCount: pdfDocument.numPages,
    parserVersion: pdfjs.version,
    metadataStatus,
    textLayerStatus,
    metadata,
    getPage: (pageNumber: number) => pdfDocument.getPage(pageNumber),
    getPagePlainText: readPagePlainText,
    searchPlainText: async (
      query: string,
      options?: { signal?: AbortSignal; maxMatches?: number }
    ): Promise<LocalPdfTextSearchResult> => {
      const trimmed = query.trim();
      const maxMatches = options?.maxMatches ?? 40;
      const matches: LocalPdfTextMatch[] = [];
      let pagesScanned = 0;

      if (!trimmed) {
        return {
          query: trimmed,
          pagesScanned: 0,
          totalPages: pdfDocument.numPages,
          matches: [],
          truncated: false,
          disclaimer: LOCAL_PDF_TEXT_LAYER_DISCLAIMER
        };
      }

      const needle = trimmed.toLowerCase();
      for (let p = 1; p <= pdfDocument.numPages; p += 1) {
        if (options?.signal?.aborted || destroyed) {
          break;
        }
        pagesScanned = p;
        const text = await readPagePlainText(p);
        if (!text) {
          continue;
        }
        const idx = text.toLowerCase().indexOf(needle);
        if (idx >= 0) {
          const start = Math.max(0, idx - 50);
          const end = Math.min(text.length, idx + needle.length + 110);
          const rawSnippet = `${start > 0 ? '...' : ''}${text.slice(start, end)}${end < text.length ? '...' : ''}`;
          matches.push({
            pageNumber: p,
            snippet: sanitizeUntrustedPdfMetadataField(rawSnippet, 200) ?? ''
          });
          if (matches.length >= maxMatches) {
            return {
              query: trimmed,
              pagesScanned,
              totalPages: pdfDocument.numPages,
              matches,
              truncated: p < pdfDocument.numPages,
              disclaimer: LOCAL_PDF_TEXT_LAYER_DISCLAIMER
            };
          }
        }
      }

      return {
        query: trimmed,
        pagesScanned,
        totalPages: pdfDocument.numPages,
        matches,
        truncated: false,
        disclaimer: LOCAL_PDF_TEXT_LAYER_DISCLAIMER
      };
    },
    renderPageToCanvas: ({ pageNumber, canvas, scale }) => {
      let cancelled = false;
      let activeTask: RenderTask | null = null;

      let resolveTask!: (t: RenderTask) => void;
      const renderTaskPromise = new Promise<RenderTask>((resolve) => {
        resolveTask = resolve;
      });

      const done = (async () => {
        const page = await pdfDocument.getPage(pageNumber);
        if (cancelled || destroyed) {
          throw new Error('RENDER_CANCELLED');
        }
        const dpr =
          typeof window !== 'undefined' ? Math.min(Math.max(window.devicePixelRatio || 1, 1), 2) : 1;
        const viewport = page.getViewport({ scale });
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Brak kontekstu 2D Canvas w przeglądarce dla podglądu PDF.');
        }

        const pixelWidth = Math.max(1, Math.floor(viewport.width * dpr));
        const pixelHeight = Math.max(1, Math.floor(viewport.height * dpr));
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;

        const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;
        activeTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform,
          annotationMode: 0 // wyłącza aktywne adnotacje/formularze/linki na canvas
        });
        resolveTask(activeTask);
        await activeTask.promise;
        return {
          widthPx: Math.floor(viewport.width),
          heightPx: Math.floor(viewport.height)
        };
      })();

      return {
        renderTaskPromise,
        done,
        cancel: () => {
          cancelled = true;
          if (activeTask) {
            activeTask.cancel();
          }
        }
      };
    },
    destroy: async () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      pageTextCache.clear();
      try {
        await pdfDocument.cleanup();
      } finally {
        await loadingTask.destroy();
      }
    }
  };
}
