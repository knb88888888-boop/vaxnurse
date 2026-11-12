import type {
  FileIntegrityAxisStatus,
  HashComparisonStatus,
  HashReferenceType,
  LocalPdfHashReferenceMode,
  LocalPdfMetadataSummary
} from '../types/evidenceLedger';

export const MAX_LOCAL_PDF_SIZE_BYTES = 32 * 1024 * 1024; // 32 MiB bezpieczny limit przeglądarki
export const MIN_LOCAL_PDF_SIZE_BYTES = 8;

export const LOCAL_PDF_UNTRUSTED_HASH_NOTICE =
  'SHA-256 wyliczony lokalnie. Brak wiarygodnego wzorca do porównania. Pochodzenie dokumentu nie zostało potwierdzone.';

export const LOCAL_PDF_OPERATOR_UNTRUSTED_NOTICE =
  'Hash porównany wyłącznie ze wzorcem podanym przez operatora / ze źródła zewnętrznego (reference_untrusted). Nie potwierdza oficjalnego pochodzenia ChPL.';

export const LOCAL_PDF_TEXT_LAYER_DISCLAIMER =
  'Tekst odczytany automatycznie z warstwy tekstowej PDF — wymaga sprawdzenia wzrokowego z dokumentem.';

export const LOCAL_PDF_METADATA_DISCLAIMER =
  'Metadane osadzone w pliku PDF są niezweryfikowaną deklaracją techniczną pliku — nie potwierdzają autentyczności urzędowej.';

export const LOCAL_PDF_NO_CLINICAL_APPROVAL_NOTICE =
  'Fragment sprawdzony lokalnie przez operatora. Nie jest to automatyczne zatwierdzenie kliniczne.';

export const LOCAL_PDF_RELOAD_REQUIRED_NOTICE =
  'Metadane i skrót SHA-256 zostały zachowane lokalnie, ale zawartość pliku PDF nie jest zapisywana w localStorage — wskaż plik PDF ponownie, aby otworzyć podgląd.';

export interface LocalPdfPrevalidationResult {
  valid: boolean;
  sanitizedFileName: string;
  fileSizeBytes: number;
  declaredMimeType: string | null;
  advisoryMimeWarning: string | null;
  errors: string[];
  warnings: string[];
}

export interface LocalPdfByteValidationResult extends LocalPdfPrevalidationResult {
  bytes: Uint8Array | null;
  hasPdfSignature: boolean;
}

export type Sha256CalculationResult =
  | {
      ok: true;
      sha256Hex: string;
      byteLength: number;
    }
  | {
      ok: false;
      errorCode: 'CRYPTO_UNAVAILABLE' | 'EMPTY_OR_INVALID_BUFFER' | 'DIGEST_FAILED';
      errorMessage: string;
    };

export interface LocalPdfHashEvaluation {
  comparisonStatus: HashComparisonStatus;
  integrityStatus: FileIntegrityAxisStatus;
  referenceType: HashReferenceType;
  referenceHash: string | null;
  notice: string;
}

/**
 * Normalizuje nazwę pliku wyłącznie do bezpiecznego wyświetlenia w UI (bez ścieżek, znaków sterujących ani HTML).
 */
export function sanitizePdfDisplayFileName(rawName: string | null | undefined): string {
  if (!rawName || typeof rawName !== 'string') {
    return 'dokument.pdf';
  }
  const baseName = rawName.split(/[/\\]/).pop() ?? rawName;
  let cleaned = '';
  for (let i = 0; i < baseName.length; i += 1) {
    const code = baseName.charCodeAt(i);
    if (code >= 32 && code !== 127) {
      cleaned += baseName[i];
    }
  }
  cleaned = cleaned.replace(/[<>:"|?*]/g, '_').trim();
  if (!cleaned) {
    return 'dokument.pdf';
  }
  return cleaned.length > 160 ? `${cleaned.slice(0, 157)}...` : cleaned;
}

/**
 * Bezpiecznie oczyszcza pojedyncze pole metadanych PDF jako zwykły tekst do wyświetlenia (niezaufane wejście).
 */
export function sanitizeUntrustedPdfMetadataField(
  rawValue: unknown,
  maxLength = 240
): string | null {
  if (rawValue === null || rawValue === undefined) {
    return null;
  }
  let text = '';
  if (typeof rawValue === 'string') {
    text = rawValue;
  } else if (typeof rawValue === 'number' || typeof rawValue === 'boolean') {
    text = String(rawValue);
  } else {
    return null;
  }

  let normalized = '';
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    normalized += code >= 32 && code !== 127 ? text[i] : ' ';
  }
  normalized = normalized.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return null;
  }
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

export function createEmptyPdfMetadataSummary(
  overrideFields: Partial<LocalPdfMetadataSummary> = {}
): LocalPdfMetadataSummary {
  return {
    title: null,
    author: null,
    subject: null,
    creator: null,
    producer: null,
    creationDate: null,
    modDate: null,
    pdfVersion: null,
    untrustedDisclaimer: LOCAL_PDF_METADATA_DISCLAIMER,
    ...overrideFields
  };
}

export function formatFileSizeHuman(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) {
    return 'Brak danych';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB (${bytes.toLocaleString('pl-PL')} B)`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB (${bytes.toLocaleString('pl-PL')} B)`;
}

/**
 * Sprawdza wstępnie nazwę, rozmiar i typ MIME pliku przed odczytem bajtów.
 * Typ MIME traktowany jest wyłącznie informacyjnie — decydująca jest sygnatura %PDF- oraz parser PDF.js.
 */
export function prevalidateLocalPdfFileMeta(file: {
  name: string;
  size: number;
  type?: string;
}): LocalPdfPrevalidationResult {
  const sanitizedFileName = sanitizePdfDisplayFileName(file.name);
  const declaredMimeType =
    typeof file.type === 'string' && file.type.trim().length > 0 ? file.type.trim() : null;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!/\.pdf$/i.test(sanitizedFileName)) {
    errors.push(
      `Plik „${sanitizedFileName}” nie posiada rozszerzenia .pdf. Wybierz rzeczywisty dokument ChPL/EPAR w formacie PDF.`
    );
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    errors.push(`Plik „${sanitizedFileName}” jest pusty (0 bajtów). Nie można go przetworzyć.`);
  } else if (file.size < MIN_LOCAL_PDF_SIZE_BYTES) {
    errors.push(
      `Plik „${sanitizedFileName}” jest zbyt mały (${file.size} B), aby mógł być poprawnym dokumentem PDF.`
    );
  } else if (file.size > MAX_LOCAL_PDF_SIZE_BYTES) {
    errors.push(
      `Plik „${sanitizedFileName}” (${formatFileSizeHuman(file.size)}) przekracza bezpieczny limit przeglądarki ${formatFileSizeHuman(MAX_LOCAL_PDF_SIZE_BYTES)}. Plik został odrzucony przed analizą bez cichego ucinania.`
    );
  }

  let advisoryMimeWarning: string | null = null;
  if (!declaredMimeType) {
    advisoryMimeWarning =
      'Przeglądarka nie zgłosiła typu MIME (pole puste) — typ MIME jest tylko informacyjny; kluczowa będzie sygnatura %PDF- oraz walidacja parserem.';
    warnings.push(advisoryMimeWarning);
  } else if (declaredMimeType.toLowerCase() !== 'application/pdf') {
    advisoryMimeWarning = `Zadeklarowany typ MIME „${declaredMimeType}” różni się od application/pdf (wskazówka pomocnicza) — plik zostanie zweryfikowany po nagłówku %PDF- i strukturze PDF.`;
    warnings.push(advisoryMimeWarning);
  }

  return {
    valid: errors.length === 0,
    sanitizedFileName,
    fileSizeBytes: Number.isFinite(file.size) ? file.size : 0,
    declaredMimeType,
    advisoryMimeWarning,
    errors,
    warnings
  };
}

/**
 * Sprawdza nagłówek binarny %PDF- w pierwszych bajtach (z dopuszczeniem ewentualnego UTF-8 BOM / wiodących białych znaków)
 * oraz odrzuca pliki podszywające się pod PDF np. HTML/XML/JSON.
 */
export function hasPdfMagicBytes(bytes: Uint8Array): boolean {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < MIN_LOCAL_PDF_SIZE_BYTES) {
    return false;
  }

  let offset = 0;
  // Opcjonalny UTF-8 BOM
  if (bytes.byteLength >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    offset = 3;
  }
  while (
    offset < Math.min(bytes.byteLength, 32) &&
    (bytes[offset] === 0x20 || bytes[offset] === 0x09 || bytes[offset] === 0x0a || bytes[offset] === 0x0d)
  ) {
    offset += 1;
  }

  if (bytes.byteLength - offset < 5) {
    return false;
  }

  // Sygnatura "%PDF-" = [0x25, 0x50, 0x44, 0x46, 0x2d]
  return (
    bytes[offset] === 0x25 &&
    bytes[offset + 1] === 0x50 &&
    bytes[offset + 2] === 0x44 &&
    bytes[offset + 3] === 0x46 &&
    bytes[offset + 4] === 0x2d
  );
}

/**
 * Waliduje pełny lokalny plik przed przekazaniem do Web Crypto SHA-256 oraz PDF.js.
 */
export async function validateLocalPdfFile(file: File): Promise<LocalPdfByteValidationResult> {
  const pre = prevalidateLocalPdfFileMeta({
    name: file.name,
    size: file.size,
    type: file.type
  });

  if (!pre.valid) {
    return {
      ...pre,
      bytes: null,
      hasPdfSignature: false
    };
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'nieznany błąd odczytu File API';
    return {
      ...pre,
      valid: false,
      errors: [
        ...pre.errors,
        `Nie udało się odczytać bajtów pliku „${pre.sanitizedFileName}” w przeglądarce (${detail}).`
      ],
      bytes: null,
      hasPdfSignature: false
    };
  }

  if (buffer.byteLength <= 0) {
    return {
      ...pre,
      valid: false,
      errors: [...pre.errors, `Odczytany bufor pliku „${pre.sanitizedFileName}” jest pusty (0 B).`],
      bytes: null,
      hasPdfSignature: false
    };
  }

  if (buffer.byteLength > MAX_LOCAL_PDF_SIZE_BYTES) {
    return {
      ...pre,
      valid: false,
      errors: [
        ...pre.errors,
        `Odczytany plik przekracza limit ${formatFileSizeHuman(MAX_LOCAL_PDF_SIZE_BYTES)}.`
      ],
      bytes: null,
      hasPdfSignature: false
    };
  }

  const bytes = new Uint8Array(buffer);
  const signatureOk = hasPdfMagicBytes(bytes);
  if (!signatureOk) {
    return {
      ...pre,
      valid: false,
      errors: [
        ...pre.errors,
        `Plik „${pre.sanitizedFileName}” nie zawiera prawidłowej sygnatury binarnej %PDF- na początku pliku (prawdopodobnie inny format zapisany z rozszerzeniem .pdf lub plik uszkodzony).`
      ],
      bytes: null,
      hasPdfSignature: false
    };
  }

  return {
    ...pre,
    valid: true,
    bytes,
    hasPdfSignature: true
  };
}

/**
 * Oblicza rzeczywistą sumę kontrolną SHA-256 na pełnych bajtach pliku za pomocą Web Crypto API.
 * Nigdy nie zwraca fałszywego ani częściowego skrótu w przypadku błędu.
 */
export async function computeSha256HexFromBytes(
  input: ArrayBuffer | Uint8Array
): Promise<Sha256CalculationResult> {
  const byteLength = input instanceof Uint8Array ? input.byteLength : input.byteLength;
  if (byteLength <= 0) {
    return {
      ok: false,
      errorCode: 'EMPTY_OR_INVALID_BUFFER',
      errorMessage: 'Brak danych binarnych (0 bajtów) — nie można obliczyć sumy SHA-256.'
    };
  }

  const subtle =
    typeof globalThis !== 'undefined' && globalThis.crypto ? globalThis.crypto.subtle : undefined;
  if (!subtle || typeof subtle.digest !== 'function') {
    return {
      ok: false,
      errorCode: 'CRYPTO_UNAVAILABLE',
      errorMessage:
        'Web Crypto API (crypto.subtle.digest) jest niedostępne w tym środowisku przeglądarki — nie można obliczyć SHA-256.'
    };
  }

  try {
    // Kopia wejściowa gwarantuje brak odwołania do bufora transferowanego później do Web Workera
    const copy =
      input instanceof Uint8Array
        ? new Uint8Array(input).buffer
        : input.slice(0);
    const digestBuffer = await subtle.digest('SHA-256', copy);
    const digestBytes = new Uint8Array(digestBuffer);
    let hex = '';
    for (let i = 0; i < digestBytes.length; i += 1) {
      hex += digestBytes[i].toString(16).padStart(2, '0');
    }
    if (!/^[a-f0-9]{64}$/.test(hex)) {
      return {
        ok: false,
        errorCode: 'DIGEST_FAILED',
        errorMessage: 'Nieoczekiwany wynik funkcji skrótu SHA-256.'
      };
    }
    return {
      ok: true,
      sha256Hex: hex,
      byteLength
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'nieznany błąd Web Crypto API';
    return {
      ok: false,
      errorCode: 'DIGEST_FAILED',
      errorMessage: `Wyliczenie SHA-256 w przeglądarce zakończyło się błędem: ${detail}`
    };
  }
}

export function evaluateHashAgainstReference(params: {
  calculatedSha256: string | null;
  referenceMode: LocalPdfHashReferenceMode;
  registryReferenceHash: string | null;
  registryReferenceType?: HashReferenceType;
  operatorReferenceHash?: string | null;
}): LocalPdfHashEvaluation {
  const { calculatedSha256, referenceMode, registryReferenceHash, operatorReferenceHash } = params;

  if (!calculatedSha256) {
    return {
      comparisonStatus: 'calculation_failed',
      integrityStatus: 'hash_calculation_failed',
      referenceType: 'none',
      referenceHash: null,
      notice:
        'Nie udało się wyliczyć skrótu SHA-256 dla pliku — integralność pliku pozostaje niezweryfikowana.'
    };
  }

  const normalizedCalc = calculatedSha256.toLowerCase();

  if (referenceMode === 'none') {
    return {
      comparisonStatus: 'not_compared',
      integrityStatus: 'hash_calculated',
      referenceType: 'none',
      referenceHash: null,
      notice: LOCAL_PDF_UNTRUSTED_HASH_NOTICE
    };
  }

  if (referenceMode === 'operator_untrusted') {
    const cleanOperatorRef = operatorReferenceHash?.trim().toLowerCase() ?? '';
    if (!/^[a-f0-9]{64}$/.test(cleanOperatorRef)) {
      return {
        comparisonStatus: 'not_compared',
        integrityStatus: 'hash_calculated',
        referenceType: 'none',
        referenceHash: null,
        notice: `${LOCAL_PDF_UNTRUSTED_HASH_NOTICE} Podany opcjonalny wzorzec operatora nie ma 64 znaków hex SHA-256.`
      };
    }
    if (cleanOperatorRef === normalizedCalc) {
      return {
        comparisonStatus: 'reference_untrusted',
        integrityStatus: 'hash_calculated',
        referenceType: 'operator_untrusted',
        referenceHash: cleanOperatorRef,
        notice: LOCAL_PDF_OPERATOR_UNTRUSTED_NOTICE
      };
    }
    return {
      comparisonStatus: 'hash_mismatch',
      integrityStatus: 'hash_mismatch',
      referenceType: 'operator_untrusted',
      referenceHash: cleanOperatorRef,
      notice:
        'Rozbieżność SHA-256: wyliczony skrót pliku NIE zgadza się z wzorcem podanym przez operatora.'
    };
  }

  // Tryb registry_reference
  const cleanRegRef = registryReferenceHash?.trim().toLowerCase() ?? '';
  if (!/^[a-f0-9]{64}$/.test(cleanRegRef)) {
    return {
      comparisonStatus: 'not_compared',
      integrityStatus: 'hash_calculated',
      referenceType: 'none',
      referenceHash: null,
      notice: LOCAL_PDF_UNTRUSTED_HASH_NOTICE
    };
  }

  const refType = params.registryReferenceType ?? 'bundle_recorded_sha256';
  if (cleanRegRef === normalizedCalc) {
    return {
      comparisonStatus: 'compared_with_trusted_reference',
      integrityStatus: 'hash_matches_known_reference',
      referenceType: refType,
      referenceHash: cleanRegRef,
      notice:
        'SHA-256 wyliczony lokalnie zgadza się z zapisanym wzorcem rejestrowym (identyczność bajtowa; nadal nie stanowi automatycznego zatwierdzenia klinicznego).'
    };
  }

  return {
    comparisonStatus: 'hash_mismatch',
    integrityStatus: 'hash_mismatch',
    referenceType: refType,
    referenceHash: cleanRegRef,
    notice:
      'Rozbieżność SHA-256 względem zapisanego wzorca w rejestrze! Wybrany plik ma inną zawartość binarną niż rekord bazowy — sprawdź rewizję i wymagaj re-weryfikacji.'
  };
}
