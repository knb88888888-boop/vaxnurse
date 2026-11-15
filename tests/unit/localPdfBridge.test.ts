import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import {
  LOCAL_PDF_OPERATOR_UNTRUSTED_NOTICE,
  LOCAL_PDF_UNTRUSTED_HASH_NOTICE,
  MAX_LOCAL_PDF_SIZE_BYTES,
  computeSha256HexFromBytes,
  evaluateHashAgainstReference,
  formatFileSizeHuman,
  hasPdfMagicBytes,
  prevalidateLocalPdfFileMeta,
  sanitizePdfDisplayFileName,
  sanitizeUntrustedPdfMetadataField,
  validateLocalPdfFile
} from '../../src/utils/localPdfBridge';
import {
  buildCorruptPdfBytes,
  buildFakeDisguisedPdfBytes,
  buildSyntheticPdfBytes,
  computeNodeSha256Hex
} from '../helpers/syntheticPdf';

describe('Etap B4 — localPdfBridge: walidacja lokalnego pliku PDF, SHA-256 i proweniencja wzorców', () => {
  const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');

  beforeEach(() => {
    // Most dla różnicy realmów ArrayBuffer między jsdom a Node webcrypto.subtle
    const bridgedCrypto = {
      subtle: {
        digest: async (algorithm: AlgorithmIdentifier, data: BufferSource) => {
          const view =
            data instanceof ArrayBuffer
              ? new Uint8Array(data)
              : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
          return webcrypto.subtle.digest(algorithm, Buffer.from(view));
        }
      }
    };
    Object.defineProperty(globalThis, 'crypto', {
      value: bridgedCrypto,
      configurable: true
    });
  });

  afterEach(() => {
    if (originalCryptoDescriptor) {
      Object.defineProperty(globalThis, 'crypto', originalCryptoDescriptor);
    }
  });

  it('oczyszcza nazwy plików i niezaufane metadane PDF z elementów ścieżek, znaków sterujących i znaczników', () => {
    expect(sanitizePdfDisplayFileName('C:\\fakepath\\..\\secret\\ChPL\u0007_<test>?.pdf')).toBe(
      'ChPL__test__.pdf'
    );
    expect(sanitizePdfDisplayFileName('/tmp/docs/bcg10.pdf')).toBe('bcg10.pdf');
    expect(sanitizePdfDisplayFileName('   ')).toBe('dokument.pdf');

    expect(
      sanitizeUntrustedPdfMetadataField('  Charakterystyka\n\r\tProduktu \u0000 BCG  ')
    ).toBe('Charakterystyka Produktu BCG');
    expect(sanitizeUntrustedPdfMetadataField({ nested: true })).toBeNull();
    expect(sanitizeUntrustedPdfMetadataField(123)).toBe('123');
    const longText = 'A'.repeat(300);
    const truncated = sanitizeUntrustedPdfMetadataField(longText, 50);
    expect(truncated).toHaveLength(50);
    expect(truncated?.endsWith('...')).toBe(true);
  });

  it('przeprowadza prewalidację nazwy, pustego bufora, limitu 32 MiB oraz traktuje MIME wyłącznie informacyjnie', async () => {
    const validBytes = buildSyntheticPdfBytes();

    const emptyMeta = prevalidateLocalPdfFileMeta({
      name: 'pusty.pdf',
      size: 0,
      type: 'application/pdf'
    });
    expect(emptyMeta.valid).toBe(false);
    expect(emptyMeta.errors[0]).toMatch(/pusty/i);

    const tooSmallMeta = prevalidateLocalPdfFileMeta({
      name: 'tiny.pdf',
      size: 4,
      type: 'application/pdf'
    });
    expect(tooSmallMeta.valid).toBe(false);

    const oversizedMeta = prevalidateLocalPdfFileMeta({
      name: 'gigant.pdf',
      size: MAX_LOCAL_PDF_SIZE_BYTES + 1,
      type: 'application/pdf'
    });
    expect(oversizedMeta.valid).toBe(false);
    expect(oversizedMeta.errors[0]).toMatch(/przekracza bezpieczny limit przeglądarki/i);
    expect(formatFileSizeHuman(MAX_LOCAL_PDF_SIZE_BYTES)).toMatch(/32\.00 MB/);

    const badExtFile = new File([validBytes], 'arkusz.txt', { type: 'application/pdf' });
    const badExtResult = await validateLocalPdfFile(badExtFile);
    expect(badExtResult.valid).toBe(false);
    expect(badExtResult.errors.some((e) => /\.pdf/i.test(e))).toBe(true);

    // Puste lub nietypowe MIME nie blokuje poprawnego PDF z sygnaturą %PDF-
    const weirdMimePdf = new File([validBytes], 'chpl-bcg.pdf', {
      type: 'application/octet-stream'
    });
    const weirdMimeResult = await validateLocalPdfFile(weirdMimePdf);
    expect(weirdMimeResult.valid).toBe(true);
    expect(weirdMimeResult.hasPdfSignature).toBe(true);
    expect(weirdMimeResult.advisoryMimeWarning).toMatch(/application\/octet-stream/);

    const emptyMimePdf = new File([validBytes], 'chpl-bcg-nomime.pdf', { type: '' });
    const emptyMimeResult = await validateLocalPdfFile(emptyMimePdf);
    expect(emptyMimeResult.valid).toBe(true);
    expect(emptyMimeResult.advisoryMimeWarning).toMatch(/nie zgłosiła typu MIME/i);
  });

  it('wykrywa sygnaturę %PDF- (także po UTF-8 BOM) i odrzuca plik niebędący PDF mimo rozszerzenia .pdf', async () => {
    const validWithBom = new Uint8Array([
      0xef,
      0xbb,
      0xbf,
      0x20,
      ...new TextEncoder().encode('%PDF-1.7\n1 0 obj\n')
    ]);
    expect(hasPdfMagicBytes(validWithBom)).toBe(true);

    const disguised = new File([buildFakeDisguisedPdfBytes()], 'falszywy.pdf', {
      type: 'application/pdf'
    });
    const disguisedRes = await validateLocalPdfFile(disguised);
    expect(disguisedRes.valid).toBe(false);
    expect(disguisedRes.hasPdfSignature).toBe(false);
    expect(disguisedRes.errors[0]).toMatch(/%PDF-/);

    // Uszkodzony plik z poprawnym nagłówkiem %PDF- przechodzi bramkę sygnatury do parsera PDF.js
    const corrupt = new File([buildCorruptPdfBytes()], 'uszkodzony.pdf', {
      type: 'application/pdf'
    });
    const corruptRes = await validateLocalPdfFile(corrupt);
    expect(corruptRes.valid).toBe(true);
    expect(corruptRes.hasPdfSignature).toBe(true);
  });

  it('oblicza rzeczywisty skrót SHA-256 zgodny z wzorcem Node crypto oraz jawnie obsługuje błędy Web Crypto API', async () => {
    const pdfBytes = buildSyntheticPdfBytes({ title: 'Test SHA-256 Vector' });
    const expectedHex = computeNodeSha256Hex(pdfBytes);

    const shaRes = await computeSha256HexFromBytes(pdfBytes);
    if (!shaRes.ok) {
      throw new Error(`Unexpected SHA fail: ${shaRes.errorCode}: ${shaRes.errorMessage}`);
    }
    expect(shaRes.ok).toBe(true);
    expect(shaRes.sha256Hex).toBe(expectedHex);
    expect(shaRes.byteLength).toBe(pdfBytes.byteLength);

    const emptySha = await computeSha256HexFromBytes(new Uint8Array(0));
    expect(emptySha.ok).toBe(false);
    if (!emptySha.ok) {
      expect(emptySha.errorCode).toBe('EMPTY_OR_INVALID_BUFFER');
    }

    const originalCrypto = globalThis.crypto;
    try {
      Object.defineProperty(globalThis, 'crypto', {
        value: {},
        configurable: true
      });
      const unavailableRes = await computeSha256HexFromBytes(pdfBytes);
      expect(unavailableRes.ok).toBe(false);
      if (!unavailableRes.ok) {
        expect(unavailableRes.errorCode).toBe('CRYPTO_UNAVAILABLE');
      }

      Object.defineProperty(globalThis, 'crypto', {
        value: {
          subtle: {
            digest: async () => {
              throw new Error('SubtleCrypto simulated failure');
            }
          }
        },
        configurable: true
      });
      const failedRes = await computeSha256HexFromBytes(pdfBytes);
      expect(failedRes.ok).toBe(false);
      if (!failedRes.ok) {
        expect(failedRes.errorCode).toBe('DIGEST_FAILED');
      }
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true
      });
    }
  });

  it('uczciwie ocenia pochodzenie hasha (brak wzorca, niezaufany wzorzec operatora, zgodność/rozbieżność wzorca rejestru)', () => {
    const sampleHash = 'a'.repeat(64);
    const otherHash = 'b'.repeat(64);

    // Brak obliczonego SHA
    const calcFail = evaluateHashAgainstReference({
      calculatedSha256: null,
      referenceMode: 'registry_reference',
      registryReferenceHash: sampleHash
    });
    expect(calcFail.comparisonStatus).toBe('calculation_failed');
    expect(calcFail.integrityStatus).toBe('hash_calculation_failed');

    // Brak wzorca
    const noRef = evaluateHashAgainstReference({
      calculatedSha256: sampleHash,
      referenceMode: 'none',
      registryReferenceHash: sampleHash
    });
    expect(noRef.comparisonStatus).toBe('not_compared');
    expect(noRef.integrityStatus).toBe('hash_calculated');
    expect(noRef.notice).toBe(LOCAL_PDF_UNTRUSTED_HASH_NOTICE);

    // Brak wzorca w rejestrze przy trybie registry_reference
    const missingRegRef = evaluateHashAgainstReference({
      calculatedSha256: sampleHash,
      referenceMode: 'registry_reference',
      registryReferenceHash: null
    });
    expect(missingRegRef.comparisonStatus).toBe('not_compared');
    expect(missingRegRef.notice).toBe(LOCAL_PDF_UNTRUSTED_HASH_NOTICE);

    // Zgodność z wzorcem rejestru
    const regMatch = evaluateHashAgainstReference({
      calculatedSha256: sampleHash,
      referenceMode: 'registry_reference',
      registryReferenceHash: sampleHash
    });
    expect(regMatch.comparisonStatus).toBe('compared_with_trusted_reference');
    expect(regMatch.integrityStatus).toBe('hash_matches_known_reference');

    // Rozbieżność z wzorcem rejestru
    const regMismatch = evaluateHashAgainstReference({
      calculatedSha256: sampleHash,
      referenceMode: 'registry_reference',
      registryReferenceHash: otherHash
    });
    expect(regMismatch.comparisonStatus).toBe('hash_mismatch');
    expect(regMismatch.integrityStatus).toBe('hash_mismatch');

    // Wzorzec podany przez operatora -> ZAWSZE reference_untrusted nawet przy zgodności!
    const opMatch = evaluateHashAgainstReference({
      calculatedSha256: sampleHash,
      referenceMode: 'operator_untrusted',
      registryReferenceHash: null,
      operatorReferenceHash: sampleHash.toUpperCase()
    });
    expect(opMatch.comparisonStatus).toBe('reference_untrusted');
    expect(opMatch.integrityStatus).toBe('hash_calculated');
    expect(opMatch.referenceType).toBe('operator_untrusted');
    expect(opMatch.notice).toBe(LOCAL_PDF_OPERATOR_UNTRUSTED_NOTICE);

    const opInvalidHex = evaluateHashAgainstReference({
      calculatedSha256: sampleHash,
      referenceMode: 'operator_untrusted',
      registryReferenceHash: null,
      operatorReferenceHash: 'zly-hash'
    });
    expect(opInvalidHex.comparisonStatus).toBe('not_compared');
    expect(opInvalidHex.referenceType).toBe('none');

    const opMismatch = evaluateHashAgainstReference({
      calculatedSha256: sampleHash,
      referenceMode: 'operator_untrusted',
      registryReferenceHash: null,
      operatorReferenceHash: otherHash
    });
    expect(opMismatch.comparisonStatus).toBe('hash_mismatch');
    expect(opMismatch.integrityStatus).toBe('hash_mismatch');
  });

  it('zachowuje rozszerzenie .pdf przy skracaniu długich nazw plików (>160 znaków) i oczyszcza metadane z control chars', () => {
    const longName = `${'x'.repeat(210)}.pdf`;
    const sanitized = sanitizePdfDisplayFileName(longName);
    expect(sanitized.length).toBeLessThanOrEqual(160);
    expect(sanitized.toLowerCase().endsWith('.pdf')).toBe(true);

    const noCtrl = sanitizeUntrustedPdfMetadataField('ChPL\u0000\u0007 BCG-10');
    expect(noCtrl).toBe('ChPL BCG-10');
  });
});
