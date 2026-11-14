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

/**
 * Dodaje miesiące kalendarzowe w UTC z jawnym przycięciem końca miesiąca
 * (np. 31.01 + 1 mies. -> 28.02 lub 29.02 w roku przestępnym).
 */
export function addMonths(date: Date, months: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + months;
  const targetYear = y + Math.floor(m / 12);
  const targetMonth = ((m % 12) + 12) % 12;
  const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const day = Math.min(date.getUTCDate(), lastDayOfTargetMonth);
  return new Date(Date.UTC(targetYear, targetMonth, day));
}

export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12);
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

export type IntervalUnit = 'days' | 'months' | 'years';

export interface NextDoseCalculationInput {
  lastDoseDate: string;
  minIntervalDays: string;
  intervalUnit?: IntervalUnit;
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

  const unit: IntervalUnit = input.intervalUnit ?? 'days';
  const maxByUnit: Record<IntervalUnit, number> = { days: 3650, months: 120, years: 100 };
  const intervalRaw = input.minIntervalDays.trim();
  const interval = /^\d{1,4}$/.test(intervalRaw) ? Number(intervalRaw) : NaN;
  if (!Number.isInteger(interval) || interval < 1 || interval > maxByUnit[unit]) {
    errors.push(
      `Minimalny odstęp musi być liczbą całkowitą z zakresu 1–${maxByUnit[unit]} (wartość z ChPL / PSO).`
    );
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

  const earliest =
    unit === 'months' ? addMonths(last, interval) : unit === 'years' ? addYears(last, interval) : addDays(last, interval);
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

export type ColdChainProfileId =
  | 'standard_2_8'
  | 'frozen_minus25_minus15'
  | 'frozen_minus50_minus15'
  | 'custom_chpl'
  | 'unspecified';

export interface ColdChainProfile {
  id: ColdChainProfileId;
  label: string;
  minC: number | null;
  maxC: number | null;
  source: string;
}

export const COLD_CHAIN_PROFILES: Record<ColdChainProfileId, ColdChainProfile> = {
  standard_2_8: {
    id: 'standard_2_8',
    label: 'Standardowy łańcuch chłodniczy (+2°C do +8°C, wg ChPL i GIS/GIF 17.09.2026)',
    minC: 2,
    maxC: 8,
    source: 'Wytyczne GIS i GIF z 17.09.2026 r. / ChPL produktu'
  },
  frozen_minus25_minus15: {
    id: 'frozen_minus25_minus15',
    label: 'Przechowywanie zamrożone (-25°C do -15°C, jeśli wskazane w ChPL)',
    minC: -25,
    maxC: -15,
    source: 'ChPL konkretnego produktu'
  },
  frozen_minus50_minus15: {
    id: 'frozen_minus50_minus15',
    label: 'Przechowywanie zamrożone (-50°C do -15°C, np. wybrane szczepionki mRNA wg ChPL)',
    minC: -50,
    maxC: -15,
    source: 'ChPL konkretnego produktu (pkt 6.3–6.4)'
  },
  custom_chpl: {
    id: 'custom_chpl',
    label: 'Zakres indywidualny wg ChPL produktu (np. rozmrożone / niestandardowe)',
    minC: null,
    maxC: null,
    source: 'ChPL konkretnego produktu'
  },
  unspecified: {
    id: 'unspecified',
    label: 'Nieokreślony profil magazynowania (brak deklaracji zgodności)',
    minC: null,
    maxC: null,
    source: 'Brak wybranego profilu'
  }
};

export type ColdChainStatus =
  | 'within_configured_range'
  | 'below_configured_range'
  | 'above_configured_range'
  | 'measurement_missing'
  | 'sensor_or_device_uncertain'
  | 'awaiting_review'
  | 'excursion_documented';

export interface ColdChainReading {
  id: string;
  deviceLabel: string;
  measuredAt: string; // RRRR-MM-DDTHH:mm (czas lokalny)
  currentC: number | null;
  minC: number | null;
  maxC: number | null;
  profileId?: ColdChainProfileId;
  customMinC?: number | null;
  customMaxC?: number | null;
  sensorUncertain?: boolean;
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
  profileId?: ColdChainProfileId;
  customMinC?: string;
  customMaxC?: string;
  sensorUncertain?: boolean;
  actionNote: string;
  recordedBy: string;
}

function parseTemperature(value?: string | null): number | null | 'invalid' {
  if (value === undefined || value === null) return null;
  const v = value.trim().replace(',', '.');
  if (!v) return null;
  if (!/^-?\d{1,2}(\.\d{1,2})?$/.test(v)) return 'invalid';
  const n = Number(v);
  if (n < -90 || n > 50) return 'invalid';
  return n;
}

function isValidLocalDateTime(value: string): boolean {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m || !parseIsoDate(m[1])) return false;
  return Number(m[2]) < 24 && Number(m[3]) < 60;
}

export function evaluateColdChainStatus(
  reading: Pick<ColdChainReading, 'currentC' | 'minC' | 'maxC' | 'profileId' | 'customMinC' | 'customMaxC' | 'sensorUncertain' | 'actionNote'>
): ColdChainStatus {
  if (reading.sensorUncertain) return 'sensor_or_device_uncertain';
  const values = [reading.currentC, reading.minC, reading.maxC].filter(
    (v): v is number => typeof v === 'number'
  );
  if (values.length === 0) return 'measurement_missing';

  const profileId = reading.profileId ?? 'standard_2_8';
  if (profileId === 'unspecified') return 'awaiting_review';

  const profile = COLD_CHAIN_PROFILES[profileId];
  if (!profile) return 'awaiting_review';
  const minBound = profileId === 'custom_chpl' ? (reading.customMinC ?? null) : profile.minC;
  const maxBound = profileId === 'custom_chpl' ? (reading.customMaxC ?? null) : profile.maxC;
  if (minBound === null || maxBound === null) return 'awaiting_review';

  if (values.some((v) => v < minBound)) return 'below_configured_range';
  if (values.some((v) => v > maxBound)) return 'above_configured_range';
  return 'within_configured_range';
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
    errors.push('Temperatura bieżąca jest wymagana (liczba od -90 do 50 °C, maks. 2 miejsca po przecinku).');
  }
  if (min === 'invalid') errors.push('Temperatura minimalna ma niepoprawny format.');
  if (max === 'invalid') errors.push('Temperatura maksymalna ma niepoprawny format.');
  if (typeof min === 'number' && typeof max === 'number' && min > max) {
    errors.push('Temperatura minimalna nie może być wyższa niż maksymalna.');
  }

  const profileId = draft.profileId ?? 'standard_2_8';
  let customMinNum: number | null = null;
  let customMaxNum: number | null = null;
  if (profileId === 'custom_chpl') {
    const cMin = draft.customMinC ? parseTemperature(draft.customMinC) : null;
    const cMax = draft.customMaxC ? parseTemperature(draft.customMaxC) : null;
    if (cMin === null) errors.push('Podaj indywidualną dolną granicę temperatury.');
    if (cMax === null) errors.push('Podaj indywidualną górną granicę temperatury.');
    if (cMin === 'invalid') errors.push('Indywidualna dolna granica temperatury ma niepoprawny format.');
    if (cMax === 'invalid') errors.push('Indywidualna górna granica temperatury ma niepoprawny format.');
    if (typeof cMin === 'number' && typeof cMax === 'number' && cMin > cMax) {
      errors.push('Indywidualna dolna granica temperatury nie może być wyższa niż górna.');
    }
    customMinNum = typeof cMin === 'number' ? cMin : null;
    customMaxNum = typeof cMax === 'number' ? cMax : null;
  }

  const reading: ColdChainReading = {
    id: generateLocalId('cc'),
    deviceLabel,
    measuredAt: draft.measuredAt.trim(),
    currentC: typeof current === 'number' ? current : 0,
    minC: typeof min === 'number' ? min : null,
    maxC: typeof max === 'number' ? max : null,
    profileId,
    customMinC: customMinNum,
    customMaxC: customMaxNum,
    sensorUncertain: draft.sensorUncertain === true,
    actionNote,
    recordedBy,
    createdAt: now.toISOString()
  };

  if (errors.length === 0 && evaluateColdChainStatus(reading) !== 'within_configured_range' && actionNote.length < 5) {
    errors.push(
      'Odczyt poza skonfigurowanym zakresem lub wymagający przeglądu wymaga opisu podjętych działań (min. 5 znaków) zgodnie z procedurą placówki.'
    );
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, reading };
}

function sanitizeColdChainReading(raw: unknown): ColdChainReading | null {
  if (!isPlainObject(raw)) return null;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= -90 && v <= 50 ? v : null);
  const current = num(raw.currentC);
  if (typeof raw.id !== 'string' || typeof raw.measuredAt !== 'string' || current === null) return null;
  if (!isValidLocalDateTime(raw.measuredAt)) return null;
  const deviceLabel = normalizeText(raw.deviceLabel, 80);
  const actionNote = normalizeText(raw.actionNote, 500);
  const recordedBy = normalizeText(raw.recordedBy, 40);
  if (!deviceLabel || ![deviceLabel, actionNote, recordedBy].every(isSafeText)) return null;

  const validProfileId: ColdChainProfileId =
    typeof raw.profileId === 'string' && raw.profileId in COLD_CHAIN_PROFILES
      ? (raw.profileId as ColdChainProfileId)
      : 'standard_2_8';

  return {
    id: normalizeText(raw.id, 64),
    deviceLabel,
    measuredAt: raw.measuredAt,
    currentC: current,
    minC: num(raw.minC),
    maxC: num(raw.maxC),
    profileId: validProfileId,
    customMinC: num(raw.customMinC),
    customMaxC: num(raw.customMaxC),
    sensorUncertain: raw.sensorUncertain === true,
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
    excursions: readings.filter((r) => evaluateColdChainStatus(r) !== 'within_configured_range').length,
    devices: new Set(readings.map((r) => r.deviceLabel.toLowerCase())).size,
    lastReadingAt: sorted[0]?.measuredAt ?? null
  };
}

/** Pole CSV z ochroną przed wstrzyknięciem formuł arkusza (=, +, -, @, tab, CR, LF, pełnoszerokie i po spacjach). */
export function escapeCsvField(value: string | number | null): string {
  if (value === null) return '';
  let s = String(value);
  if (typeof value === 'string' && /^[ \u00a0]*[=+\-@\t\r\n\uff1d\uff0b\uff0d\uff20]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildColdChainCsv(readings: readonly ColdChainReading[]): string {
  const header = [
    'Data i godzina odczytu',
    'Urządzenie',
    'Profil temperaturowy',
    'Temp. bieżąca [°C]',
    'Temp. min [°C]',
    'Temp. max [°C]',
    'Status',
    'Podjęte działania',
    'Osoba odczytująca'
  ];
  const statusLabel: Record<ColdChainStatus, string> = {
    within_configured_range: 'W skonfigurowanym zakresie',
    below_configured_range: 'Poniżej zakresu',
    above_configured_range: 'Powyżej zakresu',
    measurement_missing: 'Brak pomiaru',
    sensor_or_device_uncertain: 'Czujnik/urządzenie niepewne',
    awaiting_review: 'Oczekuje na ocenę',
    excursion_documented: 'Odchylenie udokumentowane'
  };
  const rows = sortColdChainReadings(readings).map((r) =>
    [
      r.measuredAt.replace('T', ' '),
      r.deviceLabel,
      COLD_CHAIN_PROFILES[r.profileId ?? 'standard_2_8']?.label ?? 'Nieokreślony profil',
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

export type FacilityCareCategory =
  | 'ambulatory_home'
  | 'ambulatory_dental'
  | 'ambulatory_facility'
  | 'inpatient_non_hospital'
  | 'hospital';

export const FACILITY_CARE_CATEGORIES: ReadonlyArray<{ id: FacilityCareCategory; label: string }> = [
  { id: 'ambulatory_home', label: 'Ambulatoryjne świadczenia zdrowotne udzielane w miejscu pobytu pacjenta' },
  { id: 'ambulatory_dental', label: 'Ambulatoryjne świadczenia zdrowotne z zakresu stomatologii' },
  { id: 'ambulatory_facility', label: 'Ambulatoryjne świadczenia zdrowotne udzielane w pomieszczeniach zakładu leczniczego' },
  { id: 'inpatient_non_hospital', label: 'Stacjonarne i całodobowe świadczenia zdrowotne inne niż szpitalne' },
  { id: 'hospital', label: 'Świadczenia szpitalne' }
];

export type KitItemStatus = 'available' | 'missing' | 'expired' | 'damaged' | 'requires_review' | 'not_assessed';

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
  if (left <= KIT_EXPIRY_WARNING_DAYS) return 'requires_review';
  return 'available';
}

export function validateKitDraft(draft: {
  name: string;
  quantity: string;
  expiryDate: string;
}): { ok: true; item: EmergencyKitItem } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const name = normalizeText(draft.name, 200);
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
    const name = normalizeText(raw.name, 200);
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

// ---------------------------------------------------------------------------
// Macierz warunków przechowywania preparatów wg ChPL (pkt 6.4)
// ---------------------------------------------------------------------------

export interface ProductStorageReference {
  vaccineId: string;
  productName: string;
  profileId: ColdChainProfileId;
  sourceDocument: string;
  documentVersionOrDate: string;
  qrdSection: string;
  storageConditionText: string;
  reviewStatus: 'verified_source_excerpt' | 'verified_in_stage1_bundle' | 'pending_verification';
}

export const PRODUCT_STORAGE_REFERENCE_MATRIX: ReadonlyArray<ProductStorageReference> = [
  {
    vaccineId: 'vac-infanrix-hexa',
    productName: 'Infanrix hexa (DTPa-HBV-IPV+Hib)',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL EMA / GSK PL (H/0296 VR 323859)',
    documentVersionOrDate: '12.02.2026 (druk GSK PL; pkt 10 EPAR -> EMA)',
    qrdSection: '6.3–6.4',
    storageConditionText:
      '2°C–8°C, w lodówce, nie zamrażać, chronić przed światłem; stabilność do 25°C przez 72 h przy czasowych wahaniach temperatury',
    reviewStatus: 'verified_source_excerpt'
  },
  {
    vaccineId: 'vac-priorix',
    productName: 'Priorix (odra, świnka, różyczka MMR)',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL RPL ID 22425 (poz. 04830)',
    documentVersionOrDate: '04/2026',
    qrdSection: '6.3–6.4',
    storageConditionText:
      '2°C–8°C, w lodówce (przechowywać i przewozić w stanie schłodzonym), nie zamrażać, chronić przed światłem; po rekonstytucji zużyć natychmiast lub w 2°C–8°C w ciągu 8 h',
    reviewStatus: 'verified_source_excerpt'
  },
  {
    vaccineId: 'vac-prevenar-13',
    productName: 'Prevenar 13 (pneumokoki PCV-13)',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL EMA EPAR Aneks I (EU/1/09/590)',
    documentVersionOrDate: 'EPAR 08.10.2026 (pkt 10 -> EMA)',
    qrdSection: '6.4',
    storageConditionText:
      '2°C–8°C, w lodówce, nie zamrażać; stabilność do 25°C przez 4 dni przy przejściowych wahaniach temperatury',
    reviewStatus: 'verified_source_excerpt'
  },
  {
    vaccineId: 'vac-engerix-b',
    productName: 'Engerix B (WZW B)',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL RPL ID 19604 (20 µg) / 22426 (10 µg)',
    documentVersionOrDate: '04/2023',
    qrdSection: '6.4',
    storageConditionText:
      '2°C–8°C, w lodówce, nie zamrażać, chronić przed światłem; stabilność przy chwilowym przekroczeniu: 3 dni do 37°C lub 7 dni do 25°C',
    reviewStatus: 'verified_source_excerpt'
  },
  {
    vaccineId: 'vac-boostrix',
    productName: 'Boostrix (dTpa)',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL RPL ID 21134 (poz. 14239)',
    documentVersionOrDate: '04/2023',
    qrdSection: '6.4',
    storageConditionText:
      '2°C–8°C, w lodówce, nie zamrażać, chronić przed światłem; stabilność do 37°C przez 7 dni przy tymczasowej zmianie temperatury',
    reviewStatus: 'verified_source_excerpt'
  },
  {
    vaccineId: 'vac-vaxigrip-tetra',
    productName: 'VaxigripTetra (grypa sezonowa 4-walentna)',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL RPL ID 35346 (poz. 23540, druk hist. 4-walentny)',
    documentVersionOrDate: '05/2025',
    qrdSection: '6.4',
    storageConditionText:
      '2°C–8°C, w lodówce, nie zamrażać, przechowywać w opakowaniu zewnętrznym w celu ochrony przed światłem (brak adnotacji o stabilności poza 2°C–8°C w pkt 6.4 RPL 35346)',
    reviewStatus: 'verified_source_excerpt'
  },
  {
    vaccineId: 'bcg_10',
    productName: 'Szczepionka przeciwgruźlicza BCG 10',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL RPL ID 19535 (poz. R/0210)',
    documentVersionOrDate: 'pkt 10 brak daty (plik OLI-2023-12-08.pdf)',
    qrdSection: '6.3–6.4',
    storageConditionText:
      '2°C–8°C, w lodówce, przechowywać w opakowaniu zewnętrznym w celu ochrony przed światłem; po rekonstytucji zużyć bezpośrednio (pkt 6.3)',
    reviewStatus: 'verified_in_stage1_bundle'
  },
  {
    vaccineId: 'influvac_2026_2027',
    productName: 'Influvac (sezon 2026/2027)',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL RPL ID 49462 (poz. 28478)',
    documentVersionOrDate: '06/2026',
    qrdSection: '6.4',
    storageConditionText: '2°C–8°C, w lodówce, nie zamrażać, chronić przed światłem',
    reviewStatus: 'verified_in_stage1_bundle'
  },
  {
    vaccineId: 'vaxigrip_2026_2027',
    productName: 'Vaxigrip (sezon 2026/2027)',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL RPL ID 50032 (poz. 28778)',
    documentVersionOrDate: '08/2026',
    qrdSection: '6.4',
    storageConditionText:
      '2°C–8°C, w lodówce, nie zamrażać; dopuszczona stabilność 72 godz. w temp. do 25°C±2°C przy czasowych wahaniach',
    reviewStatus: 'verified_in_stage1_bundle'
  },
  {
    vaccineId: 'spikevax_xfg',
    productName: 'Spikevax XFG (COVID-19 mRNA)',
    profileId: 'frozen_minus50_minus15',
    sourceDocument: 'ChPL EMA EPAR Aneks I PL (str. 64–92)',
    documentVersionOrDate: 'pkt 10 brak daty (EMA EPAR 29.10.2026)',
    qrdSection: '6.3–6.4',
    storageConditionText:
      'Zamrożony w -50°C do -15°C (9 mies. + max 30 dni w 2°C–8°C lub 12 mies. + max 14 dni w 2°C–8°C), 8°C–25°C max 24 h, po przekłuciu 19 h',
    reviewStatus: 'verified_in_stage1_bundle'
  }
];

// ---------------------------------------------------------------------------
// Pełna macierz 26 pozycji zestawu przeciwwstrząsowego (Dz.U. 2026 poz. 429)
// ---------------------------------------------------------------------------

export interface EmergencyKitRegulationItem {
  itemNumber: number;
  substanceName: string;
  dosageForm: string;
  requirements: Record<FacilityCareCategory, boolean>;
  notes?: string;
}

const kitReq = (
  itemNumber: number,
  substanceName: string,
  dosageForm: string,
  [ambulatory_home, ambulatory_dental, ambulatory_facility, inpatient_non_hospital, hospital]: readonly [
    boolean,
    boolean,
    boolean,
    boolean,
    boolean
  ],
  notes?: string
): EmergencyKitRegulationItem => ({
  itemNumber,
  substanceName,
  dosageForm,
  requirements: {
    ambulatory_home,
    ambulatory_dental,
    ambulatory_facility,
    inpatient_non_hospital,
    hospital
  },
  ...(notes ? { notes } : {})
});

export const EMERGENCY_KIT_REGULATION_ANNEX_26: ReadonlyArray<EmergencyKitRegulationItem> = [
  kitReq(1, 'Adrenalinum', '1 mg/ml lub 300 μg/0,3 ml, lub 150 μg/0,3 ml, lub 1 mg/10 ml – roztwór do wstrzykiwań', [true, true, true, true, true]),
  kitReq(2, 'Amiodaroni hydrochloridum', '50 mg/ml – roztwór do wstrzykiwań', [false, false, false, false, true]),
  kitReq(3, 'Aqua pro injectione', 'rozpuszczalnik do sporządzania leków parenteralnych', [true, true, true, true, true]),
  kitReq(4, 'Atropini sulfas', '1 mg/ml – roztwór do wstrzykiwań', [false, false, true, true, true]),
  kitReq(5, 'Captoprilum', '12,5 mg lub 25 mg – tabletki', [true, true, true, true, true]),
  kitReq(6, 'Clonazepamum', '1 mg/ml – roztwór do wstrzykiwań', [false, false, true, true, true]),
  kitReq(7, 'Furosemidum', '10 mg/ml – roztwór do wstrzykiwań', [false, true, true, true, true]),
  kitReq(8, 'Glyceroli trinitras', '0,4 mg/dawkę – aerozol podjęzykowy', [true, true, true, true, true]),
  kitReq(9, 'Glucosum 20 % lub 40 %', 'roztwór do wstrzykiwań', [true, true, true, true, true]),
  kitReq(
    10,
    'Hydrocortisonum hemisuccinatum',
    'proszek i rozpuszczalnik do sporządzania roztworu do wstrzykiwań lub infuzji lub odpowiedniki terapeutyczne',
    [true, false, true, true, true]
  ),
  kitReq(11, 'Ketoprofenum', '50 mg/ml – roztwór do wstrzykiwań', [false, false, true, true, true]),
  kitReq(12, 'Lidocaini hydrochloridum 2 %', 'roztwór do wstrzykiwań', [false, false, false, true, true]),
  kitReq(13, 'Metoprololi tartras', '1 mg/ml – roztwór do wstrzykiwań', [false, false, false, false, true]),
  kitReq(14, 'Midazolam 2,5 mg', 'roztwór do stosowania w jamie ustnej', [false, false, false, false, true]),
  kitReq(15, 'Morphini sulfas', '10 mg/ml – roztwór do wstrzykiwań', [false, false, false, false, true]),
  kitReq(16, 'Naloxoni hydrochloridum', '0,4 mg/ml – roztwór do wstrzykiwań', [false, false, false, false, true]),
  kitReq(
    17,
    'Natrii chloridum 0,9 %',
    'rozpuszczalnik do sporządzania leków parenteralnych lub roztwór do infuzji',
    [true, true, true, true, true]
  ),
  kitReq(18, 'Natrii hydrogenocarbonas', '84 mg/ml – roztwór do wstrzykiwań', [false, false, false, true, true]),
  kitReq(19, 'Noradrenalinum', '1 mg/ml – koncentrat do sporządzania roztworu do infuzji', [false, false, false, false, true]),
  kitReq(20, 'Oxygenium', 'gaz medyczny (tlen medyczny; poz. 20 wykazu)', [false, true, true, true, true]),
  kitReq(
    21,
    'Prednisoloni hemisuccinas',
    'proszek i rozpuszczalnik do sporządzania roztworu do wstrzykiwań lub infuzji',
    [false, false, false, false, true]
  ),
  kitReq(
    22,
    'Salbutamolum',
    '0,5 mg/ml – roztwór do wstrzykiwań lub 1 mg/ml – roztwór do nebulizacji',
    [false, false, true, true, true]
  ),
  kitReq(23, 'Glucosum 5 % lub 10 %', 'roztwór do infuzji', [true, true, true, true, true], 'Płyny infuzyjne'),
  kitReq(24, 'Mannitolum', '200 mg/ml – roztwór do infuzji', [false, false, false, true, true], 'Płyny infuzyjne'),
  kitReq(25, 'Natrii chloridum 0,9 %', 'roztwór do infuzji', [true, true, true, true, true], 'Płyny infuzyjne'),
  kitReq(
    26,
    'Natrii chloridum + Kalii chloridum + Calcii chloridum dihydricum',
    '(8,6 mg + 0,3 mg + 0,33 mg)/ml – roztwór do infuzji dożylnych',
    [false, false, false, true, true],
    'Płyny infuzyjne'
  )
];
