# VaxNurse — Asystent Referencyjny Punktu Szczepień

**VaxNurse** to prywatna, responsywna aplikacja webowa działająca wyłącznie po stronie przeglądarki (**Local-First**), projektowana jako narzędzie wsparcia organizacyjnego i referencyjnego pracy pielęgniarki w punkcie szczepień (komputer, laptop, tablet, smartfon).

> **Ważna informacja kliniczna i formalna:**  
> VaxNurse ma charakter wyłącznie informacyjno-referencyjny. **Nie jest** systemem dokumentacji medycznej pacjentów (EDM), nie zastępuje systemu `gabinet.gov.pl`, e-Karty Szczepień, decyzji lekarza kwalifikującego, obowiązującej Charakterystyki Produktu Leczniczego (ChPL) ani przepisów prawa. Aplikacja **nie kwalifikuje** pacjentów do szczepień i **nie wylicza** automatycznie dawek klinicznych.

---

## Rzeczywisty stack technologiczny

- **UI / Warstwa prezentacji:** React 19 (`^19.3.1`), React DOM (`^19.3.1`), Lucide React (`^1.71.0`)
- **Język i typowanie:** TypeScript (`~7.0.2`, tryb ścisły `"strict": true`)
- **Bundler / Serwer dev:** Vite 8 (`^8.3.6`) z `@vitejs/plugin-react` (`^6.1.2`)
- **Style:** natywny CSS (zmienne CSS + arkusze modułowe, lokalny stos fontów systemowych bez zewnętrznych zapytań sieciowych)
- **Przechowywanie stanu lokalnego:** `localStorage` przeglądarki (katalog statusów weryfikacji ChPL, preferencje ergonomiczne widoku, historia odwiedzonych modułów)
- **Linter:** `oxlint` (`^1.90.0`)
- **Środowisko uruchomieniowe skryptów / testów:** Node.js (zweryfikowano na v22.14.0 z `--experimental-strip-types`)

Projekt działa bez backendu, bez bazy serwerowej, bez zewnętrznej telemetrii i bez klasycznego routera URL.

---

## Wymagania środowiska

- Node.js `>= 22.14.0` (dla bezpośredniego uruchamiania testów TypeScript w Node z `--experimental-strip-types`)
- `npm` zgodny z instalacją Node.js

---

## Instalacja, uruchomienie, lint, build i testy

```bash
# 1. Instalacja zależności
npm install

# 2. Uruchomienie serwera deweloperskiego
npm run dev

# 3. Kontrola typów TypeScript (strict)
npx tsc -b --force --pretty false

# 4. Statyczna analiza kodu (oxlint)
npm run lint

# 5. Build produkcyjny + podgląd lokalny
npm run build
npm run preview
```

### Testy automatyczne (skrypty Node)

```bash
node --experimental-strip-types scripts/test-child-vaccinations.mjs
node --experimental-strip-types scripts/test-verification-workflow.mjs
node --experimental-strip-types scripts/test-backup-system.mjs
node --experimental-strip-types scripts/test-foundation-etap-a.mjs
```

---

## Struktura katalogów

```text
c:\VaxNurse
├── index.html                        # Punkt wejścia HTML (bez zewnętrznych żądań Google Fonts)
├── package.json                      # Skrypty npm i zależności
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts
├── scripts/                          # Skrypty weryfikacyjne Node
│   ├── test-backup-system.mjs
│   ├── test-child-vaccinations.mjs
│   ├── test-verification-workflow.mjs
│   └── test-foundation-etap-a.mjs
└── src/
    ├── App.tsx                       # Główna powłoka aplikacji, nawigacja, React.lazy + ErrorBoundary
    ├── main.tsx                      # Inicjalizacja preferencji przed montowaniem React
    ├── index.css                     # Kolejność importów CSS
    ├── types/                        # Typy TypeScript (szczepienia, katalog ChPL, backup, nawigacja)
    ├── data/                         # Statyczne źródła referencyjne (katalog PSO, katalog ChPL, arkusze Stage 1)
    ├── utils/                        # Logika czysta: scalanie localStorage, backup, workflow ChPL,
    │                                 # preferencje, wyszukiwarka globalna, historia modułów
    ├── styles/                       # Arkusze CSS (w tym etapA.css dla gęstości, rozmiaru i WCAG)
    └── components/
        ├── common/                   # ModuleLoadingFallback, ModuleErrorBoundary
        ├── layout/                   # Layout, Header (wyszukiwarka globalna), Sidebar
        ├── dashboard/                # Pulpit, QuickAccess, RecentModules, ModuleCard
        ├── childVaccinations/        # Moduł PSO 2027 (szczepienia dzieci)
        ├── vaccines/                 # Baza preparatów i Karty ChPL (punkty 1–10)
        ├── knowledge/                # Baza wiedzy i oficjalnych aktów
        ├── settings/                 # Kopie bezpieczeństwa JSON + preferencje widoku
        └── modules/                  # Sześć aktywnych modułów operacyjnych VaxNurse (kalendarz, dorośli, kalkulator, checklisty, łańcuch chłodniczy, sytuacje szczególne)
```

---

## Opis głównych modułów danych

### Katalog PSO (`src/data/childVaccinesData.ts`)
- Zawiera wykaz pozycji referencyjnych szczepień dzieci i młodzieży według PSO 2027 wraz z metadanymi i mapowaniem na procedury oraz preparaty z katalogu bazowego.
- Służy wyłącznie jako zestawienie referencyjne wspierające orientację personelu; nie zastępuje komunikatu GIS ani kwalifikacji lekarskiej.

### Baza preparatów i Karty ChPL (`src/data/vaccinesCatalog.ts`, `src/data/chplStage1AuditSheets.ts`)
- Odwzorowuje strukturę druku Charakterystyki Produktu Leczniczego (punkty 1–10 EMA QRD).
- Zawiera mechanizm kontroli rozbieżności źródłowych (np. `vac-infanrix-hexa` z zarejestrowaną rozbieżnością `disc-phenylalanine-content-01` dotyczącą ilości fenyloalaniny 0,0289 µg vs 0,0298 µg), który blokuje końcowe zatwierdzenie do czasu rejestracji i kontroli dokumentu urzędowego.
- Aktualizacje katalogu bazowego są łączone z pamięcią `localStorage` za pomocą deterministycznego, bezstratnego mechanizmu scalania (`src/utils/catalogMerge.ts`), który zachowuje lokalną historię zmian, notatki oraz wykrywa konflikty wersji.

---

## Zasady kopii bezpieczeństwa (eksport i import JSON)

- Kopie generowane są lokalnie w formacie JSON (`src/utils/backup.ts`) z jawnym oznaczeniem `containsPatientData: false`.
- Przed przywróceniem kopii w `Ustawieniach` prezentowany jest podgląd analityczny (m.in. liczba rekordów nowych i aktualizowanych, konflikty, deklaracje zatwierdzeń ChPL, niekompletne rekordy), a przed nadpisaniem pamięci lokalnej automatycznie pobierana jest kopia zabezpieczająca bieżącego stanu.
- **Integralność przy imporcie:** niepodpisane pliki JSON z zewnętrzną deklaracją `verified_chpl` / `verified_full` nie są automatycznie przyjmowane jako zweryfikowane — deklaracja z importu trafia do pola `importedVerificationClaim`, a preparat otrzymuje status ponownej kontroli lokalnej (`requires_reverification` lub `requires_source_clarification` przy nierozwiązanych rozbieżnościach).

---

## Status etapu rozwoju i ograniczenia systemowe

- **Moduły referencyjne i konfiguracyjne (aktywne):** `Pulpit`, `Szczepienia dzieci (PSO)`, `Baza preparatów i ChPL`, `Baza wiedzy`, `Ustawienia i Kopia zapasowa`.
- **Moduły operacyjne (aktywne):** `Kalendarz szczepień`, `Szczepienia dorosłych`, `Kalkulator i przypomnienia` (arytmetyka dat bez algorytmu decyzji klinicznych), `Procedury i checklisty`, `Łańcuch chłodniczy`, `Sytuacje szczególne` (w tym zestaw przeciwwstrząsowy zgodnie z rozporządzeniem MZ). Wszystkie wpisy operacyjne mają charakter pomocniczy / roboczy i nie stanowią Elektronicznej Dokumentacji Medycznej ani indywidualnego zalecenia klinicznego.
- **Brak uwierzytelniania:** aplikacja nie posiada kont użytkowników, logowania ani weryfikacji ról; wszystkie oświadczenia wykonawcy wpisywane przy ręcznej kontroli ChPL mają charakter lokalnych oświadczeń w przeglądarce.
- **Brak danych pacjentów:** VaxNurse nie gromadzi, nie przetwarza i nie eksportuje danych osobowych pacjentów, numerów PESEL ani wpisów dokumentacji medycznej.
- **Brak formalnego kryptograficznego dziennika audytowego:** lokalna historia zmian (`statusHistory`) oraz zapis ostatnio używanych modułów są przechowywane w zwykłej pamięci `localStorage` i mogą zostać zmodyfikowane lub usunięte przez użytkownika w przeglądarce — nie pełnią roli kryptograficznie podpisanego ani prawnie wiążącego rejestru audytowego.
