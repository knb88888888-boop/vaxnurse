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

export type ColdChainProfileId = 'standard_2_8' | 'frozen_minus25_minus15' | 'custom_chpl' | 'unspecified';

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
  if (n < -40 || n > 50) return 'invalid';
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
    errors.push('Temperatura bieżąca jest wymagana (liczba od -40 do 50 °C, maks. 2 miejsca po przecinku).');
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
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= -40 && v <= 50 ? v : null);
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
      COLD_CHAIN_PROFILES[r.profileId ?? 'standard_2_8'].label,
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
    sourceDocument: 'ChPL EMA/H/C/000296 Aneks I',
    documentVersionOrDate: '06/2024',
    qrdSection: '6.4',
    storageConditionText: '2°C–8°C, w lodówce, nie zamrażać, chronić przed światłem (stabilność do 72h w temp. do 25°C)',
    reviewStatus: 'verified_source_excerpt'
  },
  {
    vaccineId: 'vac-priorix',
    productName: 'Priorix (odra, świnka, różyczka MMR)',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL RPL ID 12151',
    documentVersionOrDate: '03/2023',
    qrdSection: '6.4',
    storageConditionText: '2°C–8°C, w lodówce, nie zamrażać, chronić przed światłem; po rekonstytucji zużyć niezwłocznie lub do 8h w 2°C–8°C',
    reviewStatus: 'verified_source_excerpt'
  },
  {
    vaccineId: 'vac-prevenar-13',
    productName: 'Prevenar 13 (pneumokoki PCV-13)',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL EMA/H/C/001104 Aneks I',
    documentVersionOrDate: '11/2023',
    qrdSection: '6.4',
    storageConditionText: '2°C–8°C, w lodówce, nie zamrażać (stabilna do 4 dni w temp. do 25°C)',
    reviewStatus: 'verified_source_excerpt'
  },
  {
    vaccineId: 'vac-engerix-b',
    productName: 'Engerix B (WZW B)',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL RPL ID 0147',
    documentVersionOrDate: '04/2024',
    qrdSection: '6.4',
    storageConditionText: '2°C–8°C, w lodówce, nie zamrażać, chronić przed światłem',
    reviewStatus: 'verified_source_excerpt'
  },
  {
    vaccineId: 'vac-boostrix',
    productName: 'Boostrix (dTpa)',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL RPL ID 12152',
    documentVersionOrDate: '05/2023',
    qrdSection: '6.4',
    storageConditionText: '2°C–8°C, w lodówce, nie zamrażać, chronić przed światłem',
    reviewStatus: 'verified_source_excerpt'
  },
  {
    vaccineId: 'vac-vaxigrip-tetra',
    productName: 'VaxigripTetra (grypa sezonowa 4-walentna)',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL RPL ID 38411',
    documentVersionOrDate: '08/2024',
    qrdSection: '6.4',
    storageConditionText: '2°C–8°C, w lodówce, nie zamrażać, chronić przed światłem (stabilność czasowa do 72h w temp. do 25°C)',
    reviewStatus: 'verified_source_excerpt'
  },
  {
    vaccineId: 'bcg_10',
    productName: 'Szczepionka przeciwgruźlicza BCG 10',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL RPL ID 19535',
    documentVersionOrDate: '06/2024',
    qrdSection: '6.4',
    storageConditionText: '2°C–8°C, w lodówce, chronić przed światłem, nie zamrażać; po rekonstytucji zużyć natychmiast',
    reviewStatus: 'verified_in_stage1_bundle'
  },
  {
    vaccineId: 'influvac_2026_2027',
    productName: 'Influvac (sezon 2026/2027)',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL RPL ID 49462',
    documentVersionOrDate: '06/2024',
    qrdSection: '6.4',
    storageConditionText: '2°C–8°C, w lodówce, nie zamrażać, chronić przed światłem',
    reviewStatus: 'verified_in_stage1_bundle'
  },
  {
    vaccineId: 'vaxigrip_2026_2027',
    productName: 'Vaxigrip (sezon 2026/2027)',
    profileId: 'standard_2_8',
    sourceDocument: 'ChPL RPL ID 50032',
    documentVersionOrDate: '08/2024',
    qrdSection: '6.4',
    storageConditionText: '2°C–8°C, w lodówce, nie zamrażać; dopuszczona stabilność 72 godz. w temp. do 25°C±2°C',
    reviewStatus: 'verified_in_stage1_bundle'
  },
  {
    vaccineId: 'spikevax_xfg',
    productName: 'Spikevax XFG (COVID-19 mRNA)',
    profileId: 'frozen_minus25_minus15',
    sourceDocument: 'ChPL EMA EPAR Aneks I',
    documentVersionOrDate: '07/2024',
    qrdSection: '6.3–6.4',
    storageConditionText: 'Zamrożony w -50°C do -15°C; po rozmrożeniu przechowywać w 2°C–8°C max 30 dni (lub 14 dni), 8°C–25°C max 24 h',
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

export const EMERGENCY_KIT_REGULATION_ANNEX_26: ReadonlyArray<EmergencyKitRegulationItem> = [
  {
    itemNumber: 1,
    substanceName: 'Adrenalinum',
    dosageForm: 'roztwór do wstrzykiwań 1 mg/ml lub ampułko-strzykawka / autowstrzykiwacz',
    requirements: {
      ambulatory_home: true,
      ambulatory_dental: true,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    },
    notes: 'Lek I rzutu w anafilaksji; podanie domięśniowe'
  },
  {
    itemNumber: 2,
    substanceName: 'Amiodaroni hydrochloridum',
    dosageForm: 'roztwór do wstrzykiwań 50 mg/ml',
    requirements: {
      ambulatory_home: false,
      ambulatory_dental: false,
      ambulatory_facility: false,
      inpatient_non_hospital: true,
      hospital: true
    },
    notes: 'Wymagany w placówkach stacjonarnych i szpitalach'
  },
  {
    itemNumber: 3,
    substanceName: 'Atropini sulfas',
    dosageForm: 'roztwór do wstrzykiwań 0,5 mg/ml lub 1 mg/ml',
    requirements: {
      ambulatory_home: true,
      ambulatory_dental: true,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 4,
    substanceName: 'Calcii chloridum lub Calcii gluconas',
    dosageForm: 'roztwór do wstrzykiwań 10%',
    requirements: {
      ambulatory_home: false,
      ambulatory_dental: false,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 5,
    substanceName: 'Captoprilum',
    dosageForm: 'tabletki lub tabletki podjęzykowe 12,5 mg lub 25 mg',
    requirements: {
      ambulatory_home: true,
      ambulatory_dental: true,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 6,
    substanceName: 'Clemastinum',
    dosageForm: 'roztwór do wstrzykiwań 1 mg/ml',
    requirements: {
      ambulatory_home: true,
      ambulatory_dental: true,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    },
    notes: 'Lek przeciwhistaminowy II rzutu'
  },
  {
    itemNumber: 7,
    substanceName: 'Clonazepamum',
    dosageForm: 'roztwór do wstrzykiwań 1 mg/ml',
    requirements: {
      ambulatory_home: false,
      ambulatory_dental: false,
      ambulatory_facility: false,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 8,
    substanceName: 'Dexamethasoni phosphas',
    dosageForm: 'roztwór do wstrzykiwań 4 mg/ml lub 8 mg/ml',
    requirements: {
      ambulatory_home: true,
      ambulatory_dental: true,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    },
    notes: 'Glikokortykosteroid'
  },
  {
    itemNumber: 9,
    substanceName: 'Diazepamum',
    dosageForm: 'roztwór do wstrzykiwań 5 mg/ml lub wlewka doodbytnicza',
    requirements: {
      ambulatory_home: true,
      ambulatory_dental: true,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 10,
    substanceName: 'Dopamini hydrochloridum',
    dosageForm: 'koncentrat do sporządzania roztworu do infuzji 40 mg/ml',
    requirements: {
      ambulatory_home: false,
      ambulatory_dental: false,
      ambulatory_facility: false,
      inpatient_non_hospital: false,
      hospital: true
    },
    notes: 'Wyłącznie świadczenia szpitalne'
  },
  {
    itemNumber: 11,
    substanceName: 'Ephedrini hydrochloridum',
    dosageForm: 'roztwór do wstrzykiwań 25 mg/ml lub 50 mg/ml',
    requirements: {
      ambulatory_home: false,
      ambulatory_dental: false,
      ambulatory_facility: false,
      inpatient_non_hospital: false,
      hospital: true
    },
    notes: 'Wyłącznie świadczenia szpitalne'
  },
  {
    itemNumber: 12,
    substanceName: 'Furosemidum',
    dosageForm: 'roztwór do wstrzykiwań 10 mg/ml',
    requirements: {
      ambulatory_home: false,
      ambulatory_dental: false,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 13,
    substanceName: 'Glucagonum',
    dosageForm: 'proszek i rozpuszczalnik do wstrzykiwań 1 mg',
    requirements: {
      ambulatory_home: true,
      ambulatory_dental: true,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 14,
    substanceName: 'Glukosum 5%',
    dosageForm: 'roztwór do infuzji',
    requirements: {
      ambulatory_home: false,
      ambulatory_dental: false,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 15,
    substanceName: 'Glukosum 20% lub Glukosum 40%',
    dosageForm: 'roztwór do wstrzykiwań / infuzji',
    requirements: {
      ambulatory_home: true,
      ambulatory_dental: true,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 16,
    substanceName: 'Glyceroli trinitras',
    dosageForm: 'aerozol podjęzykowy 0,4 mg/dawkę lub tabletki podjęzykowe 0,5 mg',
    requirements: {
      ambulatory_home: true,
      ambulatory_dental: true,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 17,
    substanceName: 'Hydrocortisonum lub Methylprednisolonum',
    dosageForm: 'proszek i rozpuszczalnik do wstrzykiwań (100 mg / 250 mg)',
    requirements: {
      ambulatory_home: true,
      ambulatory_dental: true,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    },
    notes: 'Hydrokortyzon lub bursztynian metyloprednizolonu'
  },
  {
    itemNumber: 18,
    substanceName: 'Ketoprofenum (lub inny NLPZ do wstrzykiwań)',
    dosageForm: 'roztwór do wstrzykiwań 50 mg/ml',
    requirements: {
      ambulatory_home: false,
      ambulatory_dental: false,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 19,
    substanceName: 'Lidocaini hydrochloridum',
    dosageForm: 'roztwór do wstrzykiwań 1% lub 2%',
    requirements: {
      ambulatory_home: false,
      ambulatory_dental: true,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 20,
    substanceName: 'Magnesii sulfas',
    dosageForm: 'roztwór do wstrzykiwań 20%',
    requirements: {
      ambulatory_home: false,
      ambulatory_dental: false,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 21,
    substanceName: 'Metoclopramidum',
    dosageForm: 'roztwór do wstrzykiwań 5 mg/ml',
    requirements: {
      ambulatory_home: false,
      ambulatory_dental: false,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 22,
    substanceName: 'Morphini sulfas',
    dosageForm: 'roztwór do wstrzykiwań 10 mg/ml lub 20 mg/ml',
    requirements: {
      ambulatory_home: false,
      ambulatory_dental: false,
      ambulatory_facility: false,
      inpatient_non_hospital: true,
      hospital: true
    },
    notes: 'Środek odurzający; stacjonarne całodobowe i szpital'
  },
  {
    itemNumber: 23,
    substanceName: 'Naloxoni hydrochloridum',
    dosageForm: 'roztwór do wstrzykiwań 0,4 mg/ml',
    requirements: {
      ambulatory_home: false,
      ambulatory_dental: false,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    },
    notes: 'Antagonista receptorów opioidowych'
  },
  {
    itemNumber: 24,
    substanceName: 'Natrii chloridum 0,9%',
    dosageForm: 'roztwór do infuzji oraz płukania / rozpuszczalnik',
    requirements: {
      ambulatory_home: true,
      ambulatory_dental: true,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 25,
    substanceName: 'Płyn wieloelektrolitowy izotoniczny (PWE)',
    dosageForm: 'roztwór do infuzji',
    requirements: {
      ambulatory_home: false,
      ambulatory_dental: false,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    }
  },
  {
    itemNumber: 26,
    substanceName: 'Salbutamolum',
    dosageForm: 'aerozol wziewny lub roztwór do nebulizacji',
    requirements: {
      ambulatory_home: true,
      ambulatory_dental: true,
      ambulatory_facility: true,
      inpatient_non_hospital: true,
      hospital: true
    },
    notes: 'Beta-2 mimetyk wziewny rozszerzający oskrzela'
  }
];
