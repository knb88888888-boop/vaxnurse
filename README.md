# VaxNurse — Asystent Punktu Szczepień

**VaxNurse** to bezpłatna, responsywna aplikacja webowa o charakterze informacyjno-edukacyjnym i pomocniczym, zaprojektowana z myślą o wspieraniu pielęgniarek i pielęgniarzy oraz personelu punktów szczepień w codziennej organizacji pracy (komputer, laptop, tablet, smartfon).

> **Zawsze bezpłatnie. Bez reklam.**  
> Aplikacja nie wymaga kont ani logowania, nie zawiera reklam, paywalli ani skryptów śledzących, a jej logika wykonuje się lokalnie po stronie przeglądarki.

---

## Wersja produkcyjna online

Aplikacja jest wdrożona publicznie na platformie Vercel (automatyczne wdrożenia z gałęzi `main` repozytorium GitHub):

- **Adres produkcyjny:** [https://vaxnurse-app.vercel.app](https://vaxnurse-app.vercel.app)

---

## Cel projektu i dla kogo powstał

VaxNurse powstał, aby uporządkować w jednym, spokojnym wizualnie i czytelnym miejscu informacje pomocnicze dotyczące szczepień ochronnych, procedur gabinetowych, zasad łańcucha chłodniczego oraz odniesień do oficjalnych dokumentów (PSO i ChPL).

### Odbiorcy projektu

- pielęgniarki i pielęgniarze realizujący szczepienia ochronne,
- personel POZ i punktów szczepień,
- osoby wracające do pracy lub porządkujące wiedzę szczepienną,
- studenci pielęgniarstwa i osoby przygotowujące się do pracy w obszarze szczepień,
- osoby chcące lepiej zrozumieć organizację i zasady szczepień ochronnych.

---

## Najważniejsze funkcjonalności i moduły

1. **Pulpit operacyjny i globalna wyszukiwarka** — szybki dostęp do modułów, ostatnio odwiedzanych sekcji oraz wyszukiwania po katalogu funkcji i Bibliotece Wiedzy.
2. **Szczepienia dzieci (PSO 2027)** — ustrukturyzowana prezentacja wszystkich siedmiu części Programu Szczepień Ochronnych na 2027 rok (Dziennik Urzędowy MZ z 30.10.2026 r., poz. 77), w tym rozbicie na procedury i jawne oznaczenie statusów weryfikacji z dokumentacją ChPL (m.in. 12 pozycji wymagających wyjaśnienia źródłowego oraz 31 oczekujących na pełną weryfikację ChPL; w tabeli VII.C zachowane jest jawne oznaczenie konfliktu dla meningokoków).
3. **Baza preparatów i Stanowisko audytu ChPL** — katalog produktów leczniczych w strukturze druku ChPL (punkty 1–10 EMA QRD), mechanizm wykrywania rozbieżności źródłowych (np. `vac-infanrix-hexa` z zarejestrowaną rozbieżnością fenyloalaniny `0,0289 µg` vs `0,0298 µg` i blokadą automatycznego zatwierdzenia), skorygowany kod ATC dla `VaxigripTetra` (`J07BB02`), lokalny podgląd PDF (`pdfjs-dist`) z weryfikacją SHA-256 oraz rejestr dowodów.
4. **Kalendarz szczepień i Szczepienia dorosłych** — uporządkowany przegląd etapów wiekowych oraz szczepień zalecanych dla dorosłych i wybranych grup ryzyka.
5. **Kalkulator odstępów szczepień** — narzędzie pomocnicze do wyliczania dat i odstępów między dawkami zgodnie z wybranym wariantem referencyjnym.
6. **Procedury i checklisty / Sytuacje szczególne** — lokalnie zapisywane checklisty organizacyjne stanowiska oraz inwentarz zestawu przeciwwstrząsowego.
7. **Łańcuch chłodniczy** — lokalny dziennik odczytów temperatury oraz profile przechowywania preparatów.
8. **Baza wiedzy** — uporządkowane odnośniki do oficjalnych portali i dokumentów źródłowych.
9. **Ustawienia i Kopia zapasowa JSON** — dostosowanie gęstości widoku i wielkości tekstu oraz bezpieczny eksport/import lokalnego stanu katalogu (`localStorage`) z automatyczną kopią zabezpieczającą i ochroną przed sfałszowaniem statusów weryfikacji.
10. **O projekcie i autorach** — prezentacja misji, wartości, architektury modułów oraz zasad działania lokalnego.

---

## Autorzy i inspiracja

- **P.M. — inicjator i twórca projektu VaxNurse**  
  Osoba odpowiedzialna za pomysł, rozwój koncepcji, organizację informacji i tworzenie narzędzia wspierającego codzienną pracę osób wykonujących zawód pielęgniarki i pielęgniarza.
- **M.M. — pielęgniarka, ważna inspiracja projektu**  
  Jej doświadczenie zawodowe i perspektywa pracy pielęgniarskiej stanowią ważny punkt odniesienia dla idei projektu (rola inspirująca i kierunkowa — bez pełnienia funkcji formalnej współautorki merytorycznej ani osoby zatwierdzającej treści kliniczne).

---

## Dostępność: zawsze bezpłatnie i bez reklam

VaxNurse jest udostępniany całkowicie bezpłatnie. Aplikacja nie zawiera reklam, płatnych planów, barier subskrypcyjnych ani zewnętrznych trackerów analitycznych. Dane robocze użytkownika (preferencje widoku, lokalne checklisty, wpisy łańcucha chłodniczego, robocze notatki audytu ChPL) zapisywane są wyłącznie w pamięci `localStorage` jego własnej przeglądarki (bez szyfrowania i bez wysyłania na serwer aplikacyjny). Połączenia z zewnętrznymi stronami urzędowymi (GIS, URPL, RARS, EMA, Dziennik Urzędowy MZ) są otwierane wyłącznie po świadomym kliknięciu odnośnika przez użytkownika.

---

## Technologie

- **Interfejs:** React 19 (`19.3.x`), Lucide React (`^1.71.0`), natywny CSS (zmienne CSS, systemowy stos fontów, wsparcie trybu zwięzłego i powiększonego tekstu)
- **Język:** TypeScript (`~7.0.2`, tryb ścisły `"strict": true`)
- **Bundler / Serwer dev:** Vite 8 (`^8.3.6`) + `@vitejs/plugin-react`
- **Obsługa lokalnych plików PDF:** `pdfjs-dist` (`6.5.438`)
- **Kontrola jakości i testy:** `oxlint`, Vitest, Testing Library, Playwright, `axe-core` (audyt WCAG 2.2 AA)

---

## Uruchomienie lokalne i budowanie

Wymagania: **Node.js >= 22.14.0** oraz `npm`.

```bash
# 1. Instalacja zależności
npm ci

# 2. Uruchomienie serwera deweloperskiego
npm run dev

# 3. Kontrola typów TypeScript (aplikacja i testy)
npx tsc -b --force --pretty false
npx tsc -p tsconfig.test.json --noEmit

# 4. Statyczna analiza kodu
npm run lint

# 5. Budowanie wersji produkcyjnej do katalogu dist/
npm run build

# 6. Lokalny podgląd buildu produkcyjnego
npm run preview
```

### Testy automatyczne

```bash
# Testy jednostkowe, komponentowe i a11y (jsdom)
npm run test:run

# Testy E2E i dostępności w Chromium (Playwright)
npm run test:e2e

# Skrypty weryfikacji integralności danych i backupu
npx tsx scripts/test-foundation-etap-a.mjs
npx tsx scripts/test-child-vaccinations.mjs
npx tsx scripts/test-backup-system.mjs
npx tsx scripts/test-verification-workflow.mjs
```

---

## Ważne informacje

- **Charakter pomocniczy i edukacyjny:** VaxNurse jest narzędziem informacyjno-edukacyjnym oraz organizacyjnym. Nie stanowi certyfikowanego wyrobu medycznego ani w pełni zweryfikowanej bazy klinicznej.
- **Brak funkcji EDM:** Aplikacja **nie jest** systemem elektronicznej dokumentacji medycznej (EDM) i nie zastępuje systemów takich jak `gabinet.gov.pl` czy e-Karta Szczepień.
- **Brak kwalifikacji medycznej:** Aplikacja **nie zastępuje** badania i kwalifikacji lekarskiej do szczepienia, indywidualnych decyzji personelu medycznego ani aktualnych wytycznych klinicznych.
- **Pierwszeństwo dokumentów urzędowych:** Zastosowane opisy nie zastępują obowiązujących Charakterystyk Produktów Leczniczych (ChPL), Programu Szczepień Ochronnych (PSO) ani komunikatów urzędowych.
- **Brak danych osobowych pacjentów:** VaxNurse nie posiada formularzy pacjentów, nie zbiera numerów PESEL i **nie jest przeznaczony** do przechowywania danych osobowych pacjentów ani dokumentacji medycznej konkretnych osób.
- **Status audytu danych:** Katalog preparatów i procedur posiada jawnie oznaczony status roboczy (`verified_full = 0`) oraz zawiera rekordy i procedury oczekujące na dalszą weryfikację źródłową lub rozstrzygnięcie rozbieżności przez upoważniony personel.

---

## Oficjalne źródła referencyjne

- **Program Szczepień Ochronnych na 2027 r. (GIS):** [gov.pl/web/gis/program-szczepien-ochronnych-na-2027-rok](https://www.gov.pl/web/gis/program-szczepien-ochronnych-na-2027-rok)
- **Dziennik Urzędowy Ministra Zdrowia z 30.10.2026 r., poz. 77 (PDF):** [gov.pl/attachment/f5e1ac73-5b24-41dc-b281-1160c8db8f6d](https://www.gov.pl/attachment/f5e1ac73-5b24-41dc-b281-1160c8db8f6d)
- **Rejestr Produktów Leczniczych (URPL):** [rejestry.ezdrowie.gov.pl/rpl/search/public](https://rejestry.ezdrowie.gov.pl/rpl/search/public)
- **Europejska Agencja Leków (EMA):** [ema.europa.eu](https://www.ema.europa.eu/)
- **Rządowa Agencja Rezerw Strategicznych (RARS):** [rars.gov.pl](https://www.rars.gov.pl/)
