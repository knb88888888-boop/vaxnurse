/**
 * Narzędzia operacyjne modułów: Kalkulator terminów, Łańcuch chłodniczy,
 * Procedury i checklisty oraz Sytuacje szczególne (inwentarz zestawu).
 *
 * Zasady bezpieczeństwa:
 * - Brak wbudowanych wartości klinicznych (odstępów, dawek) — operator wprowadza je
 *   z aktualnej ChPL / PSO, a narzędzie wykonuje wyłącznie arytmetykę dat.
 * - Brak danych pacjentów (PESEL, imiona, nazwiska) — rejestry zawierają tylko
 *   dane sprzętowe i organizacyjne punktu szczepień.
 * - Dane przechowywane wyłącznie lokalnie w localStorage z sanityzacją przy odczycie.
 */

export const COLD_CHAIN_STORAGE_KEY = 'vaxnurse_cold_chain_log_v1';
export const LOCAL_CHECKLIST_STORAGE_KEY = 'vaxnurse_local_checklist_v1';
export const EMERGENCY_KIT_STORAGE_KEY = 'vaxnurse_emergency_kit_inventory_v1';

export const COLD_CHAIN_REFERENCE_MIN_C = 2;
export const COLD_CHAIN_REFERENCE_MAX_C = 8;
export const MAX_COLD_CHAIN_RECORDS = 2000;
export const MAX_CHECKLIST_ITEMS = 200;
export const MAX_KIT_ITEMS = 200;
export const KIT_EXPIRY_WARNING_DAYS = 30;

const MS_PER_DAY = 86_400_000;
const DANGEROUS_TEXT = /<\s*\/?\s*(script|iframe|object|embed)\b|javascript\s*:|\bon\w+\s*=/i;
const PROTO_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export interface StorageSaveResult {
  success: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Pomocnicze
// ---------------------------------------------------------------------------

export function isSafeText(value: string): boolean {
  return !DANGEROUS_TEXT.test(value);
}

export function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[^\P{Cc}\t\n ]+/gu, ' ')
    .trim()
    .slice(0, maxLength);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return !Object.keys(value).some((k) => PROTO_KEYS.has(k));
}

export function generateLocalId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

function saveJson(storage: Storage | null, key: string, payload: unknown, label: string): StorageSaveResult {
  if (!storage) {
    return { success: false, error: 'Brak dostępu do lokalnej pamięci przeglądarki (localStorage).' };
  }
  try {
    storage.setItem(key, JSON.stringify(payload));
    return { success: true, error: null };
  } catch (err) {
    const quota =
      err instanceof Error && (err.name === 'QuotaExceededError' || /quota/i.test(err.message));
    return {
      success: false,
      error: quota
        ? `Przekroczono limit localStorage podczas zapisu: ${label}. Poprzednie dane pozostały bez zmian.`
        : `Nie udało się zapisać danych: ${label}.`
    };
  }
}

function readJsonArray(storage: Storage | null, key: string): unknown[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed) || !Array.isArray(parsed.items)) return [];
    return parsed.items;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Daty (wyłącznie arytmetyka kalendarzowa, UTC, format RRRR-MM-DD)
// ---------------------------------------------------------------------------

export function parseIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatPolishDate(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${date.getUTCFullYear()}`;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function diffDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

export function todayIsoDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface NextDoseCalculationInput {
  lastDoseDate: string;
  minIntervalDays: string;
  plannedDate?: string;
  referenceToday?: string;
}

export type PlannedDateStatus = 'not_set' | 'allowed' | 'too_early';

export interface NextDoseCalculationResult {
  ok: boolean;
  errors: string[];
  earliestDate: string | null;
  daysSinceLastDose: number | null;
  daysUntilEarliest: number | null;
  plannedStatus: PlannedDateStatus;
  plannedShortfallDays: number | null;
}

/**
 * Wylicza najwcześniejszy termin kolejnej dawki na podstawie daty ostatniej dawki
 * i minimalnego odstępu wprowadzonego przez operatora (z ChPL / PSO).
 */
export function calculateNextDoseDate(input: NextDoseCalculationInput): NextDoseCalculationResult {
  const errors: string[] = [];
  const last = parseIsoDate(input.lastDoseDate);
  if (!last) errors.push('Podaj poprawną datę ostatniej dawki (RRRR-MM-DD).');

  const intervalRaw = input.minIntervalDays.trim();
  const interval = /^\d{1,4}$/.test(intervalRaw) ? Number(intervalRaw) : NaN;
  if (!Number.isInteger(interval) || interval < 1 || interval > 3650) {
    errors.push('Minimalny odstęp musi być liczbą całkowitą dni z zakresu 1–3650 (wartość z ChPL / PSO).');
  }

  const today = parseIsoDate(input.referenceToday ?? todayIsoDate()) ?? new Date();
  if (last && last.getTime() > today.getTime()) {
    errors.push('Data ostatniej dawki nie może być datą przyszłą.');
  }

  let planned: Date | null = null;
  if (input.plannedDate && input.plannedDate.trim()) {
    planned = parseIsoDate(input.plannedDate);
    if (!planned) errors.push('Planowana data wizyty ma niepoprawny format (RRRR-MM-DD).');
  }

  if (errors.length > 0 || !last) {
    return {
      ok: false,
      errors,
      earliestDate: null,
      daysSinceLastDose: null,
      daysUntilEarliest: null,
      plannedStatus: 'not_set',
      plannedShortfallDays: null
    };
  }

  const earliest = addDays(last, interval);
  let plannedStatus: PlannedDateStatus = 'not_set';
  let shortfall: number | null = null;
  if (planned) {
    const delta = diffDays(planned, earliest);
    plannedStatus = delta > 0 ? 'too_early' : 'allowed';
    shortfall = delta > 0 ? delta : 0;
  }

  return {
    ok: true,
    errors: [],
    earliestDate: formatIsoDate(earliest),
    daysSinceLastDose: diffDays(last, today),
    daysUntilEarliest: Math.max(0, diffDays(today, earliest)),
    plannedStatus,
    plannedShortfallDays: shortfall
  };
}

export interface AgeCalculationResult {
  ok: boolean;
  error: string | null;
  totalDays: number;
  totalWeeks: number;
  fullMonths: number;
  fullYears: number;
  remainderMonths: number;
}

export function calculateAgeAt(birthDate: string, referenceDate: string): AgeCalculationResult {
  const empty = { totalDays: 0, totalWeeks: 0, fullMonths: 0, fullYears: 0, remainderMonths: 0 };
  const birth = parseIsoDate(birthDate);
  const ref = parseIsoDate(referenceDate);
  if (!birth || !ref) {
    return { ok: false, error: 'Podaj poprawne daty w formacie RRRR-MM-DD.', ...empty };
  }
  if (ref.getTime() < birth.getTime()) {
    return { ok: false, error: 'Data odniesienia nie może być wcześniejsza niż data urodzenia.', ...empty };
  }
  let months =
    (ref.getUTCFullYear() - birth.getUTCFullYear()) * 12 + (ref.getUTCMonth() - birth.getUTCMonth());
  if (ref.getUTCDate() < birth.getUTCDate()) months -= 1;
  const days = diffDays(birth, ref);
  return {
    ok: true,
    error: null,
    totalDays: days,
    totalWeeks: Math.floor(days / 7),
    fullMonths: months,
    fullYears: Math.floor(months / 12),
    remainderMonths: months % 12
  };
}

// ---------------------------------------------------------------------------
// Łańcuch chłodniczy — rejestr odczytów manualnych
// ---------------------------------------------------------------------------

export type ColdChainStatus = 'in_range' | 'excursion_low' | 'excursion_high';

export interface ColdChainReading {
  id: string;
  deviceLabel: string;
  measuredAt: string; // RRRR-MM-DDTHH:mm (czas lokalny)
  currentC: number;
  minC: number | null;
  maxC: number | null;
  actionNote: string;
  recordedBy: string;
  createdAt: string;
}

export interface ColdChainReadingDraft {
  deviceLabel: string;
  measuredAt: string;
  currentC: string;
  minC: string;
  maxC: string;
  actionNote: string;
  recordedBy: string;
}

function parseTemperature(value: string): number | null | 'invalid' {
  const v = value.trim().replace(',', '.');
  if (!v) return null;
  if (!/^-?\d{1,2}(\.\d{1,2})?$/.test(v)) return 'invalid';
  const n = Number(v);
  if (n < -40 || n > 50) return 'invalid';
  return n;
}

function isValidLocalDateTime(value: string): boolean {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m || !parseIsoDate(m[1])) return false;
  return Number(m[2]) < 24 && Number(m[3]) < 60;
}

export function evaluateColdChainStatus(
  reading: Pick<ColdChainReading, 'currentC' | 'minC' | 'maxC'>
): ColdChainStatus {
  const values = [reading.currentC, reading.minC, reading.maxC].filter(
    (v): v is number => typeof v === 'number'
  );
  if (values.some((v) => v < COLD_CHAIN_REFERENCE_MIN_C)) return 'excursion_low';
  if (values.some((v) => v > COLD_CHAIN_REFERENCE_MAX_C)) return 'excursion_high';
  return 'in_range';
}

export function validateColdChainDraft(
  draft: ColdChainReadingDraft,
  now: Date = new Date()
): { ok: true; reading: ColdChainReading } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const deviceLabel = normalizeText(draft.deviceLabel, 80);
  const actionNote = normalizeText(draft.actionNote, 500);
  const recordedBy = normalizeText(draft.recordedBy, 40);

  if (deviceLabel.length < 2) errors.push('Podaj oznaczenie urządzenia chłodniczego (min. 2 znaki).');
  if (!isValidLocalDateTime(draft.measuredAt)) errors.push('Podaj poprawną datę i godzinę odczytu.');
  for (const [label, v] of [
    ['oznaczenie urządzenia', deviceLabel],
    ['notatka', actionNote],
    ['osoba odczytująca', recordedBy]
  ] as const) {
    if (!isSafeText(v)) errors.push(`Pole „${label}” zawiera niedozwolone znaczniki.`);
  }

  const current = parseTemperature(draft.currentC);
  const min = parseTemperature(draft.minC);
  const max = parseTemperature(draft.maxC);
  if (current === null || current === 'invalid') {
    errors.push('Temperatura bieżąca jest wymagana (liczba od -40 do 50 °C, maks. 2 miejsca po przecinku).');
  }
  if (min === 'invalid') errors.push('Temperatura minimalna ma niepoprawny format.');
  if (max === 'invalid') errors.push('Temperatura maksymalna ma niepoprawny format.');
  if (typeof min === 'number' && typeof max === 'number' && min > max) {
    errors.push('Temperatura minimalna nie może być wyższa niż maksymalna.');
  }

  const reading: ColdChainReading = {
    id: generateLocalId('cc'),
    deviceLabel,
    measuredAt: draft.measuredAt.trim(),
    currentC: typeof current === 'number' ? current : 0,
    minC: typeof min === 'number' ? min : null,
    maxC: typeof max === 'number' ? max : null,
    actionNote,
    recordedBy,
    createdAt: now.toISOString()
  };

  if (errors.length === 0 && evaluateColdChainStatus(reading) !== 'in_range' && actionNote.length < 5) {
    errors.push(
      'Odczyt poza zakresem referencyjnym +2°C do +8°C wymaga opisu podjętych działań (min. 5 znaków) zgodnie z procedurą placówki.'
    );
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, reading };
}

function sanitizeColdChainReading(raw: unknown): ColdChainReading | null {
  if (!isPlainObject(raw)) return null;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= -40 && v <= 50 ? v : null);
  const current = num(raw.currentC);
  if (typeof raw.id !== 'string' || typeof raw.measuredAt !== 'string' || current === null) return null;
  if (!isValidLocalDateTime(raw.measuredAt)) return null;
  const deviceLabel = normalizeText(raw.deviceLabel, 80);
  const actionNote = normalizeText(raw.actionNote, 500);
  const recordedBy = normalizeText(raw.recordedBy, 40);
  if (!deviceLabel || ![deviceLabel, actionNote, recordedBy].every(isSafeText)) return null;
  return {
    id: normalizeText(raw.id, 64),
    deviceLabel,
    measuredAt: raw.measuredAt,
    currentC: current,
    minC: num(raw.minC),
    maxC: num(raw.maxC),
    actionNote,
    recordedBy,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : ''
  };
}

export function sortColdChainReadings(readings: readonly ColdChainReading[]): ColdChainReading[] {
  return [...readings].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt));
}

export function loadColdChainReadings(storage: Storage | null): ColdChainReading[] {
  const seen = new Set<string>();
  const out: ColdChainReading[] = [];
  for (const item of readJsonArray(storage, COLD_CHAIN_STORAGE_KEY)) {
    const clean = sanitizeColdChainReading(item);
    if (clean && !seen.has(clean.id)) {
      seen.add(clean.id);
      out.push(clean);
    }
  }
  return sortColdChainReadings(out).slice(0, MAX_COLD_CHAIN_RECORDS);
}

export function saveColdChainReadings(
  storage: Storage | null,
  readings: readonly ColdChainReading[]
): StorageSaveResult {
  return saveJson(
    storage,
    COLD_CHAIN_STORAGE_KEY,
    { schemaVersion: '1.0.0', items: readings.slice(0, MAX_COLD_CHAIN_RECORDS) },
    'rejestr odczytów temperatury'
  );
}

export interface ColdChainSummary {
  total: number;
  excursions: number;
  devices: number;
  lastReadingAt: string | null;
}

export function summarizeColdChain(readings: readonly ColdChainReading[]): ColdChainSummary {
  const sorted = sortColdChainReadings(readings);
  return {
    total: readings.length,
    excursions: readings.filter((r) => evaluateColdChainStatus(r) !== 'in_range').length,
    devices: new Set(readings.map((r) => r.deviceLabel.toLowerCase())).size,
    lastReadingAt: sorted[0]?.measuredAt ?? null
  };
}

/** Pole CSV z ochroną przed wstrzyknięciem formuł arkusza (=, +, -, @). */
export function escapeCsvField(value: string | number | null): string {
  if (value === null) return '';
  let s = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildColdChainCsv(readings: readonly ColdChainReading[]): string {
  const header = [
    'Data i godzina odczytu',
    'Urządzenie',
    'Temp. bieżąca [°C]',
    'Temp. min [°C]',
    'Temp. max [°C]',
    'Status (zakres ref. +2..+8°C)',
    'Podjęte działania',
    'Osoba odczytująca'
  ];
  const statusLabel: Record<ColdChainStatus, string> = {
    in_range: 'W zakresie',
    excursion_low: 'Poniżej zakresu',
    excursion_high: 'Powyżej zakresu'
  };
  const rows = sortColdChainReadings(readings).map((r) =>
    [
      r.measuredAt.replace('T', ' '),
      r.deviceLabel,
      r.currentC,
      r.minC,
      r.maxC,
      statusLabel[evaluateColdChainStatus(r)],
      r.actionNote,
      r.recordedBy
    ]
      .map(escapeCsvField)
      .join(';')
  );
  return `\ufeff${[header.map(escapeCsvField).join(';'), ...rows].join('\r\n')}`;
}

// ---------------------------------------------------------------------------
// Lokalna checklista punktu szczepień (treść definiowana przez placówkę)
// ---------------------------------------------------------------------------

export interface LocalChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export function validateChecklistText(text: string): string | null {
  const t = normalizeText(text, 200);
  if (t.length < 3) return 'Treść punktu checklisty musi mieć co najmniej 3 znaki.';
  if (!isSafeText(t)) return 'Treść punktu zawiera niedozwolone znaczniki.';
  return null;
}

export function loadLocalChecklist(storage: Storage | null): LocalChecklistItem[] {
  const out: LocalChecklistItem[] = [];
  const seen = new Set<string>();
  for (const raw of readJsonArray(storage, LOCAL_CHECKLIST_STORAGE_KEY)) {
    if (!isPlainObject(raw) || typeof raw.id !== 'string') continue;
    const text = normalizeText(raw.text, 200);
    if (text.length < 3 || !isSafeText(text) || seen.has(raw.id)) continue;
    seen.add(raw.id);
    out.push({ id: normalizeText(raw.id, 64), text, done: raw.done === true });
  }
  return out.slice(0, MAX_CHECKLIST_ITEMS);
}

export function saveLocalChecklist(
  storage: Storage | null,
  items: readonly LocalChecklistItem[]
): StorageSaveResult {
  return saveJson(
    storage,
    LOCAL_CHECKLIST_STORAGE_KEY,
    { schemaVersion: '1.0.0', items: items.slice(0, MAX_CHECKLIST_ITEMS) },
    'lokalna checklista'
  );
}

// ---------------------------------------------------------------------------
// Inwentarz zestawu przeciwwstrząsowego (nazwy i ilości definiuje placówka)
// ---------------------------------------------------------------------------

export type KitItemStatus = 'ok' | 'expiring' | 'expired' | 'missing';

export interface EmergencyKitItem {
  id: string;
  name: string;
  quantity: number;
  expiryDate: string; // RRRR-MM-DD
  lastCheckedAt: string | null;
}

export function evaluateKitItemStatus(item: EmergencyKitItem, today: string = todayIsoDate()): KitItemStatus {
  if (item.quantity <= 0) return 'missing';
  const exp = parseIsoDate(item.expiryDate);
  const ref = parseIsoDate(today);
  if (!exp || !ref) return 'expired';
  const left = diffDays(ref, exp);
  if (left < 0) return 'expired';
  if (left <= KIT_EXPIRY_WARNING_DAYS) return 'expiring';
  return 'ok';
}

export function validateKitDraft(draft: {
  name: string;
  quantity: string;
  expiryDate: string;
}): { ok: true; item: EmergencyKitItem } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const name = normalizeText(draft.name, 120);
  if (name.length < 2) errors.push('Podaj nazwę pozycji zestawu (min. 2 znaki).');
  if (!isSafeText(name)) errors.push('Nazwa pozycji zawiera niedozwolone znaczniki.');
  const qty = /^\d{1,3}$/.test(draft.quantity.trim()) ? Number(draft.quantity.trim()) : NaN;
  if (!Number.isInteger(qty) || qty < 0 || qty > 999) errors.push('Ilość musi być liczbą całkowitą 0–999.');
  if (!parseIsoDate(draft.expiryDate)) errors.push('Podaj poprawną datę ważności (RRRR-MM-DD).');
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    item: { id: generateLocalId('kit'), name, quantity: qty, expiryDate: draft.expiryDate.trim(), lastCheckedAt: null }
  };
}

export function loadEmergencyKit(storage: Storage | null): EmergencyKitItem[] {
  const out: EmergencyKitItem[] = [];
  const seen = new Set<string>();
  for (const raw of readJsonArray(storage, EMERGENCY_KIT_STORAGE_KEY)) {
    if (!isPlainObject(raw) || typeof raw.id !== 'string' || seen.has(raw.id)) continue;
    const name = normalizeText(raw.name, 120);
    const qty = typeof raw.quantity === 'number' && Number.isInteger(raw.quantity) ? raw.quantity : -1;
    const exp = typeof raw.expiryDate === 'string' ? raw.expiryDate : '';
    if (name.length < 2 || !isSafeText(name) || qty < 0 || qty > 999 || !parseIsoDate(exp)) continue;
    seen.add(raw.id);
    out.push({
      id: normalizeText(raw.id, 64),
      name,
      quantity: qty,
      expiryDate: exp,
      lastCheckedAt: typeof raw.lastCheckedAt === 'string' ? raw.lastCheckedAt : null
    });
  }
  return out.slice(0, MAX_KIT_ITEMS);
}

export function saveEmergencyKit(
  storage: Storage | null,
  items: readonly EmergencyKitItem[]
): StorageSaveResult {
  return saveJson(
    storage,
    EMERGENCY_KIT_STORAGE_KEY,
    { schemaVersion: '1.0.0', items: items.slice(0, MAX_KIT_ITEMS) },
    'inwentarz zestawu przeciwwstrząsowego'
  );
}

export function getBrowserStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}
