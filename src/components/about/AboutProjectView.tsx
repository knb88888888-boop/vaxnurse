import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  HeartHandshake,
  Info,
  Layers,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users
} from 'lucide-react';
import type { ModuleDefinition, ModuleId } from '../../types/navigation';
import { PcwReferenceBanner } from '../common/PcwReferenceBanner';
import heroShieldImg from '../../assets/vaxnurse-hero-shield.png';

interface AboutProjectViewProps {
  module: ModuleDefinition;
  onBackToDashboard: () => void;
  onNavigateToModule?: (id: ModuleId) => void;
}

interface AudienceGroup {
  step: string;
  title: string;
  description: string;
}

interface WorkflowStage {
  stepLabel: string;
  title: string;
  description: string;
  links: Array<{ id: ModuleId; label: string }>;
}

interface CoreValueItem {
  number: string;
  title: string;
  description: string;
}

const AUDIENCE_GROUPS: AudienceGroup[] = [
  {
    step: 'Grupa 01',
    title: 'Pielęgniarki i pielęgniarze realizujący szczepienia ochronne',
    description:
      'Codzienne wsparcie w organizacji pracy gabinetu szczepień, porządkowaniu procedur i szybkim sprawdzaniu informacji o preparatach.'
  },
  {
    step: 'Grupa 02',
    title: 'Personel POZ i punktów szczepień',
    description:
      'Uporządkowany dostęp do kalendarzy, zasad łańcucha chłodniczego, zestawu przeciwwstrząsowego oraz checklist organizacyjnych.'
  },
  {
    step: 'Grupa 03',
    title: 'Osoby wracające do pracy lub porządkujące wiedzę szczepienną',
    description:
      'Spokojna struktura informacji ułatwiająca przypomnienie kolejnych etapów postępowania bez szukania w rozproszonych notatkach.'
  },
  {
    step: 'Grupa 04',
    title: 'Studenci pielęgniarstwa i osoby przygotowujące się do pracy w obszarze szczepień',
    description:
      'Przejrzyste ułożenie zagadnień klinicznych i logistycznych wraz ze wskazaniem oficjalnych źródeł dokumentacyjnych.'
  },
  {
    step: 'Grupa 05',
    title: 'Osoby chcące lepiej zrozumieć organizację i zasady szczepień ochronnych',
    description:
      'Czytelny przegląd struktury Programu Szczepień Ochronnych, roli dokumentów ChPL oraz zasad bezpiecznego przechowywania preparatów.'
  }
];

const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    stepLabel: 'Krok 1 • Plan i wiek',
    title: 'Kalendarze i grupy pacjentów',
    description:
      'Uporządkowanie szczepień obowiązkowych i zalecanych w oparciu o oficjalny PSO 2027 dla dzieci i dorosłych.',
    links: [
      { id: 'vaccination-calendar', label: 'Kalendarz szczepień' },
      { id: 'child-vaccinations', label: 'Szczepienia dzieci' },
      { id: 'adult-vaccinations', label: 'Szczepienia dorosłych' }
    ]
  },
  {
    stepLabel: 'Krok 2 • Preparat i termin',
    title: 'Preparaty i odstępy czasowe',
    description:
      'Wyszukiwanie preparatów, porównanie informacji o ChPL oraz pomocnicze wyliczanie odstępów między dawkami.',
    links: [
      { id: 'vaccines-database', label: 'Baza preparatów' },
      { id: 'vaccination-calculator', label: 'Kalkulator' }
    ]
  },
  {
    stepLabel: 'Krok 3 • Praktyka gabinetowa',
    title: 'Procedury, chłodnia i ostrożność',
    description:
      'Checklisty stanowiska, lokalny dziennik temperatur w łańcuchu chłodniczym oraz szybkie karty sytuacji szczególnych.',
    links: [
      { id: 'procedures-checklists', label: 'Procedury i checklisty' },
      { id: 'cold-chain', label: 'Łańcuch chłodniczy' },
      { id: 'special-situations', label: 'Sytuacje szczególne' }
    ]
  },
  {
    stepLabel: 'Krok 4 • Dokumenty źródłowe',
    title: 'Baza wiedzy i oficjalne akty',
    description:
      'Bezpośrednie odniesienia do komunikatów GIS, Dziennika Urzędowego MZ, URPL, RARS i EMA z oznaczeniem statusu weryfikacji.',
    links: [
      { id: 'knowledge-base', label: 'Baza wiedzy' },
      { id: 'settings', label: 'Ustawienia i kopia JSON' }
    ]
  }
];

const CORE_VALUES: CoreValueItem[] = [
  {
    number: '01',
    title: 'Szacunek dla codziennej pracy personelu pielęgniarskiego',
    description:
      'Projekt powstaje z uznaniem dla odpowiedzialności, dokładności i uważności, jakie każdego dnia wnoszą pielęgniarki i pielęgniarze.'
  },
  {
    number: '02',
    title: 'Przejrzystość informacji',
    description:
      'Oddzielamy treści pomocnicze od oficjalnych źródeł i wprost oznaczamy, które elementy wymagają weryfikacji w ChPL lub w dokumentach GIS.'
  },
  {
    number: '03',
    title: 'Bezpieczeństwo i odpowiedzialność',
    description:
      'Narzędzie wspiera organizację pracy i przypomina o standardach postępowania, nigdy nie zastępując decyzji lekarza ani personelu medycznego.'
  },
  {
    number: '04',
    title: 'Prostota i wygoda obsługi',
    description:
      'Spokojny interfejs bez zbędnych bodźców wizualnych, czytelna hierarchia treści oraz dostosowanie do komputerów, tabletów i smartfonów.'
  },
  {
    number: '05',
    title: 'Powszechna dostępność bez barier finansowych',
    description:
      'Brak płatnych progów, abonamentów i reklam — każdy zainteresowany korzysta z pełnej funkcjonalności na równych zasadach.'
  },
  {
    number: '06',
    title: 'Ciągłe doskonalenie narzędzia',
    description:
      'Stopniowe uzupełnianie i porządkowanie modułów zgodnie z publikowanymi aktami urzędowymi oraz praktycznymi potrzebami gabinetów.'
  }
];

export const AboutProjectView: React.FC<AboutProjectViewProps> = ({
  module,
  onBackToDashboard,
  onNavigateToModule
}) => {
  return (
    <div className="module-view-container about-container" data-testid="about-project-view">
      {/* Breadcrumb Navigation */}
      <div className="module-breadcrumb">
        <button type="button" className="back-link" onClick={onBackToDashboard}>
          <ArrowLeft size={16} />
          <span>Powrót do pulpitu</span>
        </button>
        <span className="breadcrumb-divider">/</span>
        <span className="breadcrumb-current">{module.label}</span>
      </div>

      {/* Editorial Hero Header */}
      <section className="about-hero-card" aria-labelledby="about-hero-heading">
        <div className="about-hero-grid">
          <div>
            <div className="about-eyebrow">
              <HeartHandshake size={15} />
              <span>VaxNurse • O projekcie i idei wsparcia</span>
            </div>
            <h1 id="about-hero-heading" className="about-hero-title">
              O projekcie i autorach
            </h1>
            <p className="about-hero-motto">
              Wiedza, odpowiedzialność i troska — z szacunku do codziennej pracy pielęgniarek i pielęgniarzy.
            </p>
            <blockquote className="about-hero-quote">
              „Za każdą procedurą stoi człowiek, wiedza i odpowiedzialność. VaxNurse powstał po to,
              aby wspierać tych, którzy każdego dnia dbają o zdrowie innych.”
            </blockquote>
            <div className="about-hero-meta">
              <span className="about-meta-pill">
                <CheckCircle2 size={14} />
                Zawsze bezpłatnie i bez reklam
              </span>
              <span className="about-meta-pill">
                <Lock size={14} />
                Praca lokalna w przeglądarce
              </span>
              <span className="about-meta-pill">
                <Stethoscope size={14} />
                Narzędzie pomocnicze dla praktyki szczepień
              </span>
            </div>
          </div>

          <div className="about-hero-visual">
            <div className="about-hero-visual-stage">
              <img
                src={heroShieldImg}
                alt="Trójwymiarowa ilustracja tarczy klinicznej VaxNurse symbolizująca bezpieczne procedury szczepień i weryfikację ChPL"
                className="about-hero-shield-img"
                width={960}
                height={399}
              />
            </div>
            <p className="about-hero-visual-caption">
              Spokojne, czytelne stanowisko referencyjne porządkujące wiedzę, procedury i odnośniki
              do dokumentów urzędowych w jednym miejscu.
            </p>
          </div>
        </div>
      </section>

      {/* Authors & Nursing Inspiration */}
      <section className="about-section" aria-labelledby="about-authors-heading">
        <div className="about-section-header">
          <div className="about-section-icon">
            <Users size={20} />
          </div>
          <div>
            <h2 id="about-authors-heading" className="about-section-title">
              Autorzy i inspiracja projektu
            </h2>
            <p className="about-section-subtitle">
              Kto stoi za inicjatywą VaxNurse i jaka perspektywa zawodowa wyznacza kierunek jego rozwoju.
            </p>
          </div>
        </div>

        <div className="about-authors-grid">
          <article className="about-author-card" aria-label="P.M. — inicjator i twórca projektu VaxNurse">
            <div className="about-author-top">
              <div className="about-monogram about-monogram-initiator" aria-hidden="true">
                P.M.
              </div>
              <div>
                <h3 className="about-author-name">P.M.</h3>
                <span className="about-author-role about-author-role-initiator">
                  Inicjator i twórca projektu VaxNurse
                </span>
              </div>
            </div>
            <p className="about-author-bio">
              Osoba odpowiedzialna za pomysł, rozwój koncepcji, organizację informacji i tworzenie
              narzędzia, którego celem jest wspieranie codziennej pracy osób wykonujących zawód
              pielęgniarki i pielęgniarza.
            </p>
          </article>

          <article className="about-author-card" aria-label="M.M. — pielęgniarka, ważna inspiracja projektu">
            <div className="about-author-top">
              <div className="about-monogram about-monogram-inspiration" aria-hidden="true">
                M.M.
              </div>
              <div>
                <h3 className="about-author-name">M.M.</h3>
                <span className="about-author-role about-author-role-inspiration">
                  Pielęgniarka, ważna inspiracja projektu
                </span>
              </div>
            </div>
            <p className="about-author-bio">
              Jej doświadczenie zawodowe i perspektywa pracy pielęgniarskiej stanowią ważny punkt
              odniesienia dla idei projektu. VaxNurse powstaje również z myślą o realnych potrzebach
              osób, które każdego dnia odpowiadają za bezpieczeństwo, edukację i opiekę nad pacjentem.
            </p>
          </article>
        </div>

        <p className="about-role-clarification">
          <Info size={15} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} />
          <strong>Przejrzystość ról:</strong> P.M. odpowiada za opracowanie i utrzymanie aplikacji
          VaxNurse, natomiast doświadczenie zawodowe M.M. jest ważną inspiracją kierunkową projektu
          (M.M. nie pełni w projekcie roli formalnej współautorki merytorycznej ani osoby
          zatwierdzającej treści kliniczne).
        </p>
      </section>

      {/* Mission & Why It Was Created */}
      <div className="about-two-col">
        <section className="about-section" aria-labelledby="about-mission-heading">
          <div className="about-section-header">
            <div className="about-section-icon">
              <Compass size={20} />
            </div>
            <div>
              <h2 id="about-mission-heading" className="about-section-title">
                O projekcie (Misja projektu)
              </h2>
              <p className="about-section-subtitle">
                Jedno uporządkowane miejsce zamiast pośpiesznego szukania w dziesiątkach plików.
              </p>
            </div>
          </div>
          <p className="about-prose">
            VaxNurse to aplikacja wspierająca organizację codziennej pracy wokół szczepień
            ochronnych. Jej zadaniem jest zebranie w jednym, spójnym interfejsie kluczowych modułów
            pomocniczych: od struktury Programu Szczepień Ochronnych i katalogu preparatów po
            checklisty gabinetowe, narzędzia łańcucha chłodniczego oraz bazę odnośników do oficjalnych
            dokumentów.
          </p>
          <p className="about-prose">
            Aplikacja ma ułatwiać szybkie sprawdzenie informacji organizacyjnych i dokumentacyjnych,
            oszczędzać czas w gabinecie szczepień oraz wspierać kulturę bezpieczeństwa i rzetelnego
            powoływania się na źródła urzędowe.
          </p>
        </section>

        <section className="about-section" aria-labelledby="about-why-heading">
          <div className="about-section-header">
            <div className="about-section-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 id="about-why-heading" className="about-section-title">
                Dlaczego powstał?
              </h2>
              <p className="about-section-subtitle">
                Odpowiedź na rozproszenie materiałów i presję czasu w praktyce gabinetowej.
              </p>
            </div>
          </div>
          <p className="about-prose">
            W codziennej pracy przy szczepieniach potrzebne informacje bywają rozproszone pomiędzy
            wielostronicowymi załącznikami PDF, komunikatami urzędowymi, dokumentacjami ChPL oraz
            własnymi notatkami stanowiskowymi. W natłoku obowiązków odnalezienie konkretnego zapisu
            lub procedury zabiera cenny czas.
          </p>
          <p className="about-prose">
            VaxNurse narodził się z potrzeby stworzenia spokojnego wizualnie, przejrzystego i
            uporządkowanego narzędzia, które zmniejsza chaos informacyjny, zachowując pełną uczciwość
            co do granic danych pomocniczych oraz statusu weryfikacji źródeł.
          </p>
        </section>
      </div>

      {/* Audience (Dla kogo?) */}
      <section className="about-section" aria-labelledby="about-audience-heading">
        <div className="about-section-header">
          <div className="about-section-icon">
            <Stethoscope size={20} />
          </div>
          <div>
            <h2 id="about-audience-heading" className="about-section-title">
              Dla kogo powstał VaxNurse?
            </h2>
            <p className="about-section-subtitle">
              Zakres projektu odpowiada potrzebom zarówno doświadczonych praktyków, jak i osób uczących się.
            </p>
          </div>
        </div>

        <div className="about-audience-grid">
          {AUDIENCE_GROUPS.map(group => (
            <article key={group.step} className="about-audience-card">
              <span className="about-audience-step">{group.step}</span>
              <h3 className="about-audience-title">{group.title}</h3>
              <p className="about-audience-desc">{group.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How It Works (Jak działa?) */}
      <section className="about-section" aria-labelledby="about-workflow-heading">
        <div className="about-section-header">
          <div className="about-section-icon">
            <Layers size={20} />
          </div>
          <div>
            <h2 id="about-workflow-heading" className="about-section-title">
              Jak działa? — Architektura modułów w praktyce
            </h2>
            <p className="about-section-subtitle">
              Przepływ pracy od kalendarza i doboru preparatu, przez bezpieczne przygotowanie stanowiska,
              aż po bezpośredni podgląd źródeł urzędowych.
            </p>
          </div>
        </div>

        <div className="about-workflow-grid">
          {WORKFLOW_STAGES.map(stage => (
            <article key={stage.stepLabel} className="about-workflow-stage">
              <span className="about-workflow-stage-badge">{stage.stepLabel}</span>
              <h3 className="about-workflow-stage-title">{stage.title}</h3>
              <p className="about-workflow-stage-desc">{stage.description}</p>
              <div className="about-module-links">
                {stage.links.map(link => (
                  <button
                    key={link.id}
                    type="button"
                    className="about-module-link-btn"
                    onClick={() => onNavigateToModule?.(link.id)}
                  >
                    <span>{link.label}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Free & Ad-Free Banner */}
      <section className="about-free-banner" aria-labelledby="about-free-heading">
        <div className="about-free-content">
          <div className="about-free-kicker">
            <HeartHandshake size={16} />
            <span>Otwarty dostęp dla środowiska medycznego</span>
          </div>
          <h2 id="about-free-heading" className="about-free-title">
            Zawsze bezpłatnie. Bez reklam.
          </h2>
          <p className="about-free-text">
            VaxNurse powstaje jako niezależna inicjatywa wspierająca środowisko pielęgniarskie i
            medyczne. Korzystanie z aplikacji nie wymaga opłat, subskrypcji ani zakładania konta.
            Interfejs jest całkowicie wolny od banerów reklamowych, okienek sprzedażowych oraz
            rozpraszających elementów marketingowych.
          </p>
        </div>

        <div className="about-free-pills">
          <span className="about-free-pill">
            <CheckCircle2 size={15} />
            Brak opłat i paywalli
          </span>
          <span className="about-free-pill">
            <CheckCircle2 size={15} />
            Zero banerów reklamowych
          </span>
          <span className="about-free-pill">
            <CheckCircle2 size={15} />
            Bez rejestracji i kont
          </span>
        </div>
      </section>

      {/* Core Values */}
      <section className="about-section" aria-labelledby="about-values-heading">
        <div className="about-section-header">
          <div className="about-section-icon">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 id="about-values-heading" className="about-section-title">
              Wartości projektu
            </h2>
            <p className="about-section-subtitle">
              Zasady, według których projektujemy funkcje, język i strukturę danych w VaxNurse.
            </p>
          </div>
        </div>

        <div className="about-values-grid">
          {CORE_VALUES.map(value => (
            <article key={value.number} className="about-value-card">
              <h3 className="about-value-title">
                <span className="about-value-num">{value.number}</span>
                <span>{value.title}</span>
              </h3>
              <p className="about-value-desc">{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Technology, Local Operation & Privacy (Code-verified) */}
      <section className="about-section" aria-labelledby="about-privacy-heading">
        <div className="about-section-header">
          <div className="about-section-icon">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 id="about-privacy-heading" className="about-section-title">
              Technologia, działanie lokalne i prywatność
            </h2>
            <p className="about-section-subtitle">
              Rzeczywisty opis działania aplikacji w przeglądarce zgodnie z jej architekturą techniczną.
            </p>
          </div>
        </div>

        <div className="about-privacy-grid">
          <article className="about-privacy-item">
            <h3 className="about-privacy-heading">
              <Lock size={16} />
              <span>Aplikacja SPA działająca po stronie przeglądarki</span>
            </h3>
            <p className="about-privacy-text">
              Logika aplikacji (React + TypeScript) wykonuje się bezpośrednio w przeglądarce
              użytkownika bez własnego serwera aplikacyjnego do przetwarzania danych, bez systemu kont
              oraz bez zewnętrznej analityki lub telemetrii w kodzie aplikacji.
            </p>
          </article>

          <article className="about-privacy-item">
            <h3 className="about-privacy-heading">
              <ShieldCheck size={16} />
              <span>Zakres pamięci lokalnej (localStorage)</span>
            </h3>
            <p className="about-privacy-text">
              W pamięci lokalnej przeglądarki zapisywane są wyłącznie preferencje ergonomii widoku,
              historia ostatnio otwieranych modułów, lokalne listy operacyjne (łańcuch chłodniczy,
              checklisty, zestaw przeciwwstrząsowy) oraz robocze metadane audytu ChPL z opcją
              eksportu i przywracania pliku JSON.
            </p>
          </article>

          <article className="about-privacy-item">
            <h3 className="about-privacy-heading">
              <Users size={16} />
              <span>Brak formularzy pacjentów i numerów PESEL</span>
            </h3>
            <p className="about-privacy-text">
              VaxNurse nie zawiera formularzy danych osobowych pacjentów, nie pobiera numerów PESEL
              i nie służy do prowadzenia ani przechowywania indywidualnej dokumentacji medycznej.
            </p>
          </article>

          <article className="about-privacy-item">
            <h3 className="about-privacy-heading">
              <Info size={16} />
              <span>Odnośniki zewnętrzne wyłącznie po kliknięciu</span>
            </h3>
            <p className="about-privacy-text">
              Po wczytaniu aplikacji w przeglądarce nie są wysyłane zapytania sieciowe w tle.
              Połączenie z zewnętrznymi portalami (np. GIS, URPL, RARS, EMA, Dz.U.) następuje dopiero
              wtedy, gdy użytkownik świadomie otworzy wybrany odnośnik do źródła urzędowego.
            </p>
          </article>
        </div>
      </section>

      {/* Sister Portal: Pielęgniarskie Centrum Wiedzy (PCW) */}
      <PcwReferenceBanner variant="about" />

      {/* Important Clinical Disclaimer */}
      <section className="about-disclaimer-box" aria-labelledby="about-disclaimer-heading">
        <h2 id="about-disclaimer-heading" className="about-disclaimer-title">
          <ShieldAlert size={19} />
          <span>Ważne zastrzeżenie</span>
        </h2>
        <p className="about-disclaimer-text">
          Aplikacja VaxNurse ma charakter wyłącznie pomocniczy, informacyjny i edukacyjny. Nie
          stanowi wyrobu medycznego ani dokumentacji medycznej i nie zastępuje aktualnych aktów
          prawnych, oficjalnego Programu Szczepień Ochronnych (PSO), Charakterystyk Produktów
          Leczniczych (ChPL), wytycznych klinicznych ani indywidualnej kwalifikacji i decyzji lekarza
          oraz uprawnionego personelu medycznego.
        </p>
      </section>
    </div>
  );
};
