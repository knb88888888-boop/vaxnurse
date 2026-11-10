import React, { useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Building2,
  FileText,
  FileCheck,
  Clock,
  Layers,
  ThermometerSnowflake,
  Activity,
  Heart,
  Info,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Package,
  Calendar,
  CheckCircle2,
  RotateCcw,
  DownloadCloud,
  UserCheck,
  Search,
  X
} from 'lucide-react';
import type {
  VaccineProduct,
  ChPLSection,
  VaccineVerificationStatus,
  DiscrepancyResolution,
  DocumentVerificationCheck,
  SourceDiscrepancy,
  StatusHistoryEntry
} from '../../types/vaccines';
import {
  VERIFICATION_STATUS_META,
  DISCREPANCY_STATUS_META,
  VACCINE_TYPE_LABELS,
  TARGET_GROUP_LABELS
} from '../../data/vaccinesCatalog';

interface VaccineDetailViewProps {
  vaccine: VaccineProduct;
  onBackToList: () => void;
  onUpdateVaccine?: (updatedVaccine: VaccineProduct) => void;
  storageError?: string | null;
  onDismissStorageError?: () => void;
}

export const VaccineDetailView: React.FC<VaccineDetailViewProps> = ({
  vaccine: initialVaccine,
  onBackToList,
  onUpdateVaccine,
  storageError,
  onDismissStorageError
}) => {
  const [currentVaccine, setCurrentVaccine] = useState<VaccineProduct>(initialVaccine);
  const statusMeta = VERIFICATION_STATUS_META[currentVaccine.verificationStatus];

  // Niezgodności w oficjalnej dokumentacji ChPL
  const primaryDiscrepancy = currentVaccine.sourceDiscrepancies?.[0];
  const isDiscrepancyResolved = primaryDiscrepancy?.status === 'resolved_with_official_document';
  const isDiscrepancySubmitted = primaryDiscrepancy?.status === 'clarification_submitted';
  const isDiscrepancyRequiresClarification = !primaryDiscrepancy || primaryDiscrepancy.status === 'requires_clarification';

  // Blokada zatwierdzenia obowiązuje dopóki niezgodność nie ma statusu resolved_with_official_document
  const hasUnresolvedDiscrepancies = !isDiscrepancyResolved;
  const unresolvedCount = hasUnresolvedDiscrepancies ? 1 : 0;

  // 6 wymaganych pól formularza rejestracji formalnego wyjaśnienia (Etap 1)
  const [documentId, setDocumentId] = useState(
    primaryDiscrepancy?.resolution?.documentId || currentVaccine.clarificationDocument || ''
  );
  const [issuer, setIssuer] = useState(
    primaryDiscrepancy?.resolution?.issuer || currentVaccine.clarificationSource || ''
  );
  const [documentDate, setDocumentDate] = useState(
    primaryDiscrepancy?.resolution?.documentDate || ''
  );
  const [receivedDate, setReceivedDate] = useState(
    primaryDiscrepancy?.resolution?.receivedDate || currentVaccine.clarificationDate || ''
  );
  const [documentUrlOrLocation, setDocumentUrlOrLocation] = useState(
    primaryDiscrepancy?.resolution?.documentUrlOrLocation || ''
  );
  const [verifierJustification, setVerifierJustification] = useState(
    primaryDiscrepancy?.resolution?.verifierJustification || currentVaccine.userVerificationNotes || ''
  );

  // Stan błędów walidacji formularza Etapu 1
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showValidationBanner, setShowValidationBanner] = useState(false);

  const clearFieldError = (field: string) => {
    setFormErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Etap 2 – Ręczna kontrola dokumentu źródłowego przez personel
  const [docOpenedConfirmed, setDocOpenedConfirmed] = useState<boolean>(
    primaryDiscrepancy?.resolution?.documentCheck?.sourceDocumentOpenedOrIndicated || false
  );
  const [docCheckDate, setDocCheckDate] = useState<string>(
    primaryDiscrepancy?.resolution?.documentCheck?.checkDate || ''
  );
  const [checkerNameAndRole, setCheckerNameAndRole] = useState<string>(
    primaryDiscrepancy?.resolution?.documentCheck?.checkerNameAndRole || ''
  );
  const [checkerJustification, setCheckerJustification] = useState<string>(
    primaryDiscrepancy?.resolution?.documentCheck?.checkerJustification || ''
  );

  const [docCheckErrors, setDocCheckErrors] = useState<Record<string, string>>({});
  const [showDocCheckValidationBanner, setShowDocCheckValidationBanner] = useState(false);

  const clearDocCheckError = (field: string) => {
    setDocCheckErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // ETAP 1: Rejestracja formalnego wyjaśnienia rozbieżności (ścisła walidacja 6 pól)
  const handleRegisterClarification = () => {
    const errors: Record<string, string> = {};

    if (!documentId.trim()) {
      errors.documentId = 'Wymagane: Podaj identyfikator dokumentu (np. sygnatura URPL/DPR/2026/012 lub GSK-PL-VR-323859-CORR-01).';
    }
    if (!issuer.trim()) {
      errors.issuer = 'Wymagane: Podaj instytucję lub podmiot wystawiający (np. URPLWMiPB lub GSK Services Sp. z o.o.).';
    }
    if (!documentDate.trim()) {
      errors.documentDate = 'Wymagane: Podaj datę wydania dokumentu urzędowego.';
    }
    if (!receivedDate.trim()) {
      errors.receivedDate = 'Wymagane: Podaj datę otrzymania dokumentu przez punkt szczepień.';
    }
    if (!documentUrlOrLocation.trim()) {
      errors.documentUrlOrLocation = 'Wymagane: Podaj odnośnik URL do rejestru lub lokalizację w archiwum punktu szczepień.';
    }
    if (!verifierJustification.trim()) {
      errors.verifierJustification = 'Wymagane: Podaj uzasadnienie osoby weryfikującej, ocenę wpływu klinicznego i podpis.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setShowValidationBanner(true);
      return;
    }

    setFormErrors({});
    setShowValidationBanner(false);

    const now = new Date();
    const formattedTimestamp = `${now.toLocaleDateString('pl-PL')} r., ${now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;

    const resolutionData: DiscrepancyResolution = {
      documentId: documentId.trim(),
      issuer: issuer.trim(),
      documentDate: documentDate.trim(),
      receivedDate: receivedDate.trim(),
      documentUrlOrLocation: documentUrlOrLocation.trim(),
      verifierJustification: verifierJustification.trim(),
      registeredAt: formattedTimestamp,
      registeredBy: 'Pielęgniarka koordynująca punktu szczepień',
      isResolved: false, // W Etapie 1 jeszcze nierozwiązana (wymaga Etapu 2)
      clarificationDocument: `${documentId.trim()} (${issuer.trim()})`,
      source: issuer.trim(),
      verifierNotes: verifierJustification.trim(),
      documentCheck: undefined
    };

    const updatedDiscrepancies: SourceDiscrepancy[] = (currentVaccine.sourceDiscrepancies || []).map(d => ({
      ...d,
      status: 'clarification_submitted',
      resolution: resolutionData
    }));

    const historyEntry: StatusHistoryEntry = {
      id: `hist-${Date.now()}`,
      timestamp: formattedTimestamp,
      previousStatus: currentVaccine.verificationStatus,
      newStatus: 'requires_source_clarification',
      reason: `Zarejestrowano dane urzędowego wyjaśnienia dla rozbieżności ${primaryDiscrepancy?.id || 'ChPL'} (dok. ${documentId.trim()}, wystawca: ${issuer.trim()}). Status niezgodności: Zgłoszono wyjaśnienie. Preparat pozostaje w stanie «Wymaga wyjaśnienia źródłowego» do czasu ręcznej kontroli dokumentu (Etap 2). Zatwierdzenie zablokowane.`,
      author: 'Pielęgniarka koordynująca punktu szczepień'
    };

    // ETAP 1: status preparatu POZOSTAJE requires_source_clarification; zatwierdzenie NIE jest odblokowane
    const updated: VaccineProduct = {
      ...currentVaccine,
      verificationStatus: 'requires_source_clarification',
      clarificationDocument: documentId.trim(),
      clarificationDate: receivedDate.trim(),
      clarificationSource: issuer.trim(),
      userVerificationDate: null,
      userVerificationNotes: null,
      sourceDiscrepancies: updatedDiscrepancies,
      statusHistory: [historyEntry, ...(currentVaccine.statusHistory || [])]
    };

    setCurrentVaccine(updated);
    if (onUpdateVaccine) {
      onUpdateVaccine(updated);
    }
  };

  // ETAP 2: Ręczna kontrola dokumentu źródłowego przez uprawniony personel
  const handleConfirmDocumentCheck = () => {
    const errors: Record<string, string> = {};

    if (!docOpenedConfirmed) {
      errors.docOpenedConfirmed = 'Wymagane: Potwierdź otwarcie lub wskazanie dokumentu źródłowego (zaznacz pole wyboru).';
    }
    if (!docCheckDate.trim()) {
      errors.docCheckDate = 'Wymagane: Podaj datę dokonania sprawdzenia dokumentu.';
    }
    if (!checkerNameAndRole.trim()) {
      errors.checkerNameAndRole = 'Wymagane: Wskaż osobę dokonującą sprawdzenia (imię, nazwisko, tytuł zawodowy).';
    }
    if (!checkerJustification.trim()) {
      errors.checkerJustification = 'Wymagane: Podaj uzasadnienie, dlaczego dokument rozwiązuje daną niezgodność.';
    }

    if (Object.keys(errors).length > 0) {
      setDocCheckErrors(errors);
      setShowDocCheckValidationBanner(true);
      return;
    }

    setDocCheckErrors({});
    setShowDocCheckValidationBanner(false);

    const now = new Date();
    const formattedTimestamp = `${now.toLocaleDateString('pl-PL')} r., ${now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;

    const documentCheck: DocumentVerificationCheck = {
      sourceDocumentOpenedOrIndicated: true,
      sourceDocumentLocation: documentUrlOrLocation.trim(),
      checkDate: docCheckDate.trim(),
      checkerNameAndRole: checkerNameAndRole.trim(),
      checkerJustification: checkerJustification.trim(),
      isConfirmed: true,
      confirmedAt: formattedTimestamp
    };

    const resolutionData: DiscrepancyResolution = {
      ...(primaryDiscrepancy?.resolution || {
        documentId: documentId.trim(),
        issuer: issuer.trim(),
        documentDate: documentDate.trim(),
        receivedDate: receivedDate.trim(),
        documentUrlOrLocation: documentUrlOrLocation.trim(),
        verifierJustification: verifierJustification.trim()
      }),
      documentCheck,
      isResolved: true
    };

    const updatedDiscrepancies: SourceDiscrepancy[] = (currentVaccine.sourceDiscrepancies || []).map(d => ({
      ...d,
      status: 'resolved_with_official_document',
      resolution: resolutionData
    }));

    const historyEntry: StatusHistoryEntry = {
      id: `hist-${Date.now()}`,
      timestamp: formattedTimestamp,
      previousStatus: currentVaccine.verificationStatus,
      newStatus: 'ready_for_manual_verification',
      reason: `Ręcznie potwierdzono sprawdzenie dokumentu źródłowego przez: ${checkerNameAndRole.trim()}. Niezgodność ${primaryDiscrepancy?.id || 'ChPL'} oznaczono jako «Wyjaśniona dokumentem urzędowym». Status preparatu zmieniono na: Gotowy do ręcznej weryfikacji. Karta oczekuje na ostateczną autoryzację ChPL.`,
      author: checkerNameAndRole.trim()
    };

    // ETAP 3: Po formalnej rejestracji I ręcznym potwierdzeniu sprawdzenia dokumentu:
    // status preparatu: ready_for_manual_verification (NIE verified_chpl!)
    const updated: VaccineProduct = {
      ...currentVaccine,
      verificationStatus: 'ready_for_manual_verification',
      userVerificationDate: null,
      userVerificationNotes: null,
      sourceDiscrepancies: updatedDiscrepancies,
      statusHistory: [historyEntry, ...(currentVaccine.statusHistory || [])]
    };

    setCurrentVaccine(updated);
    if (onUpdateVaccine) {
      onUpdateVaccine(updated);
    }
  };

  // Cofnięcie sprawdzenia dokumentu (powrót do Etapu 1: status clarification_submitted, status preparatu: requires_source_clarification)
  const handleRevokeDocumentCheck = () => {
    const now = new Date();
    const formattedTimestamp = `${now.toLocaleDateString('pl-PL')} r., ${now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;

    const resolutionData: DiscrepancyResolution = {
      ...(primaryDiscrepancy?.resolution || {
        documentId: documentId.trim(),
        issuer: issuer.trim(),
        documentDate: documentDate.trim(),
        receivedDate: receivedDate.trim(),
        documentUrlOrLocation: documentUrlOrLocation.trim(),
        verifierJustification: verifierJustification.trim()
      }),
      documentCheck: undefined,
      isResolved: false
    };

    const updatedDiscrepancies: SourceDiscrepancy[] = (currentVaccine.sourceDiscrepancies || []).map(d => ({
      ...d,
      status: 'clarification_submitted',
      resolution: resolutionData
    }));

    const historyEntry: StatusHistoryEntry = {
      id: `hist-${Date.now()}`,
      timestamp: formattedTimestamp,
      previousStatus: currentVaccine.verificationStatus,
      newStatus: 'requires_source_clarification',
      reason: 'Cofnięto ręczne sprawdzenie dokumentu. Status niezgodności powrócił do «Zgłoszono wyjaśnienie», a preparatu do «Wymaga wyjaśnienia źródłowego» (zatwierdzenie ponownie zablokowane).',
      author: checkerNameAndRole.trim() || 'Personel punktu szczepień'
    };

    const updated: VaccineProduct = {
      ...currentVaccine,
      verificationStatus: 'requires_source_clarification',
      userVerificationDate: null,
      userVerificationNotes: null,
      sourceDiscrepancies: updatedDiscrepancies,
      statusHistory: [historyEntry, ...(currentVaccine.statusHistory || [])]
    };

    setDocOpenedConfirmed(false);
    setDocCheckDate('');
    setCheckerNameAndRole('');
    setCheckerJustification('');
    setDocCheckErrors({});
    setShowDocCheckValidationBanner(false);
    setCurrentVaccine(updated);
    if (onUpdateVaccine) {
      onUpdateVaccine(updated);
    }
  };

  // Cofnięcie wyjaśnienia (powrót do stanu początkowego: Wymaga wyjaśnienia źródłowego, przywrócenie blokady)
  const handleResetClarification = () => {
    const now = new Date();
    const formattedTimestamp = `${now.toLocaleDateString('pl-PL')} r., ${now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;

    const updatedDiscrepancies: SourceDiscrepancy[] = (currentVaccine.sourceDiscrepancies || []).map(d => ({
      ...d,
      status: 'requires_clarification',
      resolution: {
        documentId: '',
        issuer: '',
        documentDate: '',
        receivedDate: '',
        documentUrlOrLocation: '',
        verifierJustification: '',
        isResolved: false,
        documentCheck: undefined
      }
    }));

    const historyEntry: StatusHistoryEntry = {
      id: `hist-${Date.now()}`,
      timestamp: formattedTimestamp,
      previousStatus: currentVaccine.verificationStatus,
      newStatus: 'requires_source_clarification',
      reason: 'Cofnięto rejestrację wyjaśnienia urzędowego. Niezgodność powróciła do statusu «Wymaga wyjaśnienia», a zatwierdzenie zostało ponownie zablokowane.',
      author: 'Pielęgniarka koordynująca punktu szczepień'
    };

    const updated: VaccineProduct = {
      ...currentVaccine,
      verificationStatus: 'requires_source_clarification',
      clarificationDocument: null,
      clarificationDate: null,
      clarificationSource: null,
      userVerificationDate: null,
      userVerificationNotes: null,
      sourceDiscrepancies: updatedDiscrepancies,
      statusHistory: [historyEntry, ...(currentVaccine.statusHistory || [])]
    };

    setDocumentId('');
    setIssuer('');
    setDocumentDate('');
    setReceivedDate('');
    setDocumentUrlOrLocation('');
    setVerifierJustification('');
    setFormErrors({});
    setShowValidationBanner(false);
    setDocOpenedConfirmed(false);
    setDocCheckDate('');
    setCheckerNameAndRole('');
    setCheckerJustification('');
    setDocCheckErrors({});
    setShowDocCheckValidationBanner(false);
    setCurrentVaccine(updated);
    if (onUpdateVaccine) {
      onUpdateVaccine(updated);
    }
  };

  // State to manage collapsible section groups
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sec1: true,
    sec2: true,
    sec3: true,
    sec4: true, // 4. Szczegółowe dane kliniczne
    sec5: true, // 5. Właściwości farmakologiczne
    sec6: true, // 6. Dane farmaceutyczne
    sec7: true,
    sec8: true,
    sec9: true,
    sec10: true,
    secOptional: false
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    setExpandedSections({
      sec1: true,
      sec2: true,
      sec3: true,
      sec4: true,
      sec5: true,
      sec6: true,
      sec7: true,
      sec8: true,
      sec9: true,
      sec10: true,
      secOptional: true
    });
  };

  const collapseAll = () => {
    setExpandedSections({
      sec1: false,
      sec2: false,
      sec3: false,
      sec4: false,
      sec5: false,
      sec6: false,
      sec7: false,
      sec8: false,
      sec9: false,
      sec10: false,
      secOptional: false
    });
  };

  // Helper to update verification status across the product and its sections
  const handleUpdateStatus = (newStatus: VaccineVerificationStatus) => {
    // Blokada – zatwierdzenie jest dozwolone wyłącznie w stanie ready_for_manual_verification
    if (newStatus === 'verified_chpl' && currentVaccine.verificationStatus !== 'ready_for_manual_verification') {
      alert(
        'Blokada bezpieczeństwa: Zatwierdzenie karty i przejście do statusu «Zweryfikowany na podstawie dokumentacji» jest dozwolone wyłącznie w stanie «Gotowy do ręcznej weryfikacji» (po formalnej rejestracji i ręcznym potwierdzeniu sprawdzenia dokumentu urzędowego).'
      );
      return;
    }

    // Stan „Gotowy do ręcznej weryfikacji” może wystąpić tylko wtedy, gdy wszystkie niezgodności zostały formalnie rozwiązane
    if (newStatus === 'ready_for_manual_verification' && hasUnresolvedDiscrepancies) {
      alert('Blokada bezpieczeństwa: Stan «Gotowy do ręcznej weryfikacji» może nastąpić tylko po formalnym wyjaśnieniu i ręcznym potwierdzeniu sprawdzenia dokumentu.');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pl-PL')} r., ${now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
    
    const updateSectionStatus = (sec: ChPLSection): ChPLSection => ({
      ...sec,
      verificationStatus: newStatus,
      verificationNote: newStatus === 'verified_chpl'
        ? 'Zweryfikowano z oficjalną dokumentacją ChPL przez personel medyczny punktu szczepień.'
        : sec.verificationNote
    });

    const historyEntry: StatusHistoryEntry = {
      id: `hist-${Date.now()}`,
      timestamp: formattedDate,
      previousStatus: currentVaccine.verificationStatus,
      newStatus: newStatus,
      reason: newStatus === 'verified_chpl'
        ? 'Świadome zatwierdzenie poprawności karty ChPL przez uprawniony personel medyczny po formalnym wyjaśnieniu rozbieżności i ręcznej kontroli dokumentu.'
        : 'Ręczne cofnięcie zatwierdzenia karty ChPL przez personel medyczny (powrót do etapu: Gotowy do ręcznej weryfikacji).',
      author: checkerNameAndRole || 'Pielęgniarka koordynująca punktu szczepień'
    };

    const updated: VaccineProduct = {
      ...currentVaccine,
      verificationStatus: newStatus,
      userVerificationDate: newStatus === 'verified_chpl' ? formattedDate : null,
      userVerificationNotes: newStatus === 'verified_chpl'
        ? verifierJustification || `Zatwierdzono w punkcie szczepień na podstawie oficjalnej ChPL (wersja: ${currentVaccine.chplRevisionDate || 'b.d.'}) po formalnym wyjaśnieniu rozbieżności.`
        : null,
      statusHistory: [historyEntry, ...(currentVaccine.statusHistory || [])],
      chpl: {
        ...currentVaccine.chpl,
        name: updateSectionStatus(currentVaccine.chpl.name),
        composition: updateSectionStatus(currentVaccine.chpl.composition),
        pharmaceuticalForm: updateSectionStatus(currentVaccine.chpl.pharmaceuticalForm),
        clinicalParticulars: {
          indications: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.indications),
          dosageAndAdministration: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.dosageAndAdministration),
          contraindications: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.contraindications),
          warningsAndPrecautions: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.warningsAndPrecautions),
          interactions: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.interactions),
          fertilityPregnancyLactation: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.fertilityPregnancyLactation),
          driveAndMachines: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.driveAndMachines),
          undesirableEffects: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.undesirableEffects),
          overdose: updateSectionStatus(currentVaccine.chpl.clinicalParticulars.overdose)
        },
        pharmacologicalProperties: {
          pharmacodynamics: updateSectionStatus(currentVaccine.chpl.pharmacologicalProperties.pharmacodynamics),
          pharmacokinetics: updateSectionStatus(currentVaccine.chpl.pharmacologicalProperties.pharmacokinetics),
          preclinicalSafety: updateSectionStatus(currentVaccine.chpl.pharmacologicalProperties.preclinicalSafety)
        },
        pharmaceuticalParticulars: {
          excipients: updateSectionStatus(currentVaccine.chpl.pharmaceuticalParticulars.excipients),
          incompatibilities: updateSectionStatus(currentVaccine.chpl.pharmaceuticalParticulars.incompatibilities),
          shelfLife: updateSectionStatus(currentVaccine.chpl.pharmaceuticalParticulars.shelfLife),
          storageSpecialPrecautions: updateSectionStatus(currentVaccine.chpl.pharmaceuticalParticulars.storageSpecialPrecautions),
          containerNatureAndContents: updateSectionStatus(currentVaccine.chpl.pharmaceuticalParticulars.containerNatureAndContents),
          disposalAndHandling: updateSectionStatus(currentVaccine.chpl.pharmaceuticalParticulars.disposalAndHandling)
        },
        marketingAuthorisationHolder: updateSectionStatus(currentVaccine.chpl.marketingAuthorisationHolder),
        marketingAuthorisationNumber: updateSectionStatus(currentVaccine.chpl.marketingAuthorisationNumber),
        firstAuthorisationAndRenewal: updateSectionStatus(currentVaccine.chpl.firstAuthorisationAndRenewal),
        revisionDate: updateSectionStatus(currentVaccine.chpl.revisionDate)
      }
    };

    setCurrentVaccine(updated);
    if (onUpdateVaccine) {
      onUpdateVaccine(updated);
    }
  };

  // Helper render for single section or subsection
  const renderSectionBox = (sec: ChPLSection, icon: React.ReactNode, isSub: boolean = false) => {
    const secStatus = VERIFICATION_STATUS_META[sec.verificationStatus];
    const sectionDiscrepancies = currentVaccine.sourceDiscrepancies?.filter(
      d => d.firstSection === sec.sectionNumber || d.secondSection === sec.sectionNumber
    ) || [];

    return (
      <div key={sec.sectionNumber} className={`chpl-point-box ${isSub ? 'subsection' : ''} ${sectionDiscrepancies.length > 0 ? 'has-discrepancy' : ''}`}>
        <div className="point-box-header">
          <div className="point-box-title-group">
            <span className="point-icon-wrapper">{icon}</span>
            <div>
              <span className="point-number-tag">Punkt {sec.sectionNumber} ChPL</span>
              <h4 className="point-title-text">{sec.sectionTitle}</h4>
            </div>
          </div>

          <div className="point-box-meta-badges">
            {sectionDiscrepancies.length > 0 && (
              <span className="point-discrepancy-tag" title="W tym punkcie występuje niezgodność wewnętrzna w oficjalnej ChPL">
                <AlertTriangle size={12} /> Rozbieżność w ChPL
              </span>
            )}
            {sec.pdfPageNumber && (
              <span className="point-page-tag" title="Numer strony w oficjalnym druku PDF ChPL">
                Strona PDF: str. {sec.pdfPageNumber}
              </span>
            )}
            <span className="point-source-tag" title={sec.officialSource || undefined}>
              Źródło: {sec.officialSource || 'RPL (eZdrowie)'}
            </span>
            <span className={`point-status-tag ${secStatus.badgeClass}`}>
              <span className="status-mini-dot"></span>
              {secStatus.label}
            </span>
          </div>
        </div>

        <div className="point-box-body">
          {sectionDiscrepancies.length > 0 && (
            <div className="point-section-discrepancy-alert">
              <div className="p-disc-alert-header">
                <AlertTriangle size={16} className="p-disc-icon" />
                <span className="p-disc-title">
                  Niezgodność wewnętrzna oficjalnej ChPL: {sectionDiscrepancies[0].fieldName}
                </span>
                <span className="p-disc-status-tag">
                  Status: {DISCREPANCY_STATUS_META[sectionDiscrepancies[0].status]?.label || 'Wymaga wyjaśnienia'}
                </span>
              </div>
              <div className="p-disc-alert-content">
                <p>
                  W punkcie <strong>{sec.sectionNumber}</strong> oficjalny dokument podaje:{' '}
                  <strong className="p-disc-highlight">
                    {sec.sectionNumber === sectionDiscrepancies[0].firstSection
                      ? sectionDiscrepancies[0].firstValue
                      : sectionDiscrepancies[0].secondValue}
                  </strong>
                  , natomiast w punkcie{' '}
                  <strong>
                    {sec.sectionNumber === sectionDiscrepancies[0].firstSection
                      ? sectionDiscrepancies[0].secondSection
                      : sectionDiscrepancies[0].firstSection}
                  </strong>{' '}
                  widnieje:{' '}
                  <strong className="p-disc-highlight">
                    {sec.sectionNumber === sectionDiscrepancies[0].firstSection
                      ? sectionDiscrepancies[0].secondValue
                      : sectionDiscrepancies[0].firstValue}
                  </strong>
                  .
                </p>
                <div className="p-disc-notes-row">
                  <span className="p-disc-rule-note">
                    <ShieldAlert size={13} /> Zachowano obie wartości zgodnie z tekstem ChPL bez automatycznego ujednolicania.
                  </span>
                  <a
                    href={sectionDiscrepancies[0].documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-disc-source-link"
                  >
                    <span>Sprawdź w oficjalnej ChPL GSK (12.02.2026)</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {sec.content ? (
            <div className="point-content-present">
              <div className="point-text-block">
                {sec.content.split('\n').map((line, idx) => (
                  <p key={idx} className="point-text-line">
                    {line}
                  </p>
                ))}
              </div>

              {sec.sourceDocumentUrl && (
                <div className="point-source-link-row">
                  <a
                    href={sec.sourceDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-point-source-link"
                    title="Otwórz oficjalny druk ChPL w formacie PDF"
                  >
                    <span>Otwórz oficjalny PDF ChPL {sec.pdfPageNumber ? `(str. ${sec.pdfPageNumber})` : ''}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {sec.verificationNote && (
                <span className="point-note-text">
                  <Info size={13} /> {sec.verificationNote}
                </span>
              )}
            </div>
          ) : (
            <div className="point-content-unverified">
              <div className="unverified-icon-col">
                <AlertTriangle size={16} className="unverified-alert-icon" />
              </div>
              <div className="unverified-text-col">
                <strong>Punkt {sec.sectionNumber} – treść oczekuje na weryfikację z drukiem ChPL</strong>
                <p>
                  Aplikacja VaxNurse nie uzupełnia danych klinicznych domysłami. Treść tego punktu nie została jeszcze zweryfikowana z oficjalnym drukiem w Rejestrze Produktów Leczniczych.
                </p>
                {sec.verificationNote && (
                  <span className="unverified-note">
                    <strong>Wskazówka:</strong> {sec.verificationNote}
                  </span>
                )}
                <div className="unverified-link-row">
                  <a
                    href={currentVaccine.currentChplUrl || 'https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-verify-in-rpl"
                  >
                    <span>Weryfikuj w oficjalnym źródle ChPL / RPL</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const { chpl } = currentVaccine;

  return (
    <div className="vaccine-detail-container">
      {/* Pamięć podręczna – banner błędu odczytu / zapisu localStorage (Etap 5) */}
      {storageError && (
        <div className="v-storage-error-alert" role="alert">
          <AlertTriangle size={20} className="v-storage-error-icon" />
          <div className="v-storage-error-content">
            <strong>Błąd pamięci podręcznej przeglądarki (localStorage):</strong>
            <p>{storageError}</p>
          </div>
          {onDismissStorageError && (
            <button
              type="button"
              className="btn-dismiss-storage-error"
              onClick={onDismissStorageError}
              title="Zamknij komunikat o błędzie pamięci"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Top Navigation */}
      <div className="module-view-nav">
        <button
          type="button"
          className="back-to-dashboard-btn"
          onClick={onBackToList}
        >
          <ArrowLeft size={16} />
          <span>Powrót do Bazy preparatów</span>
        </button>
        <span className="view-mode-pill">Karta ChPL (EMA QRD v10.4)</span>
      </div>

      {/* Main Product Header Card */}
      <div className="v-detail-header-card">
        <div className="v-detail-header-top">
          <div className="v-detail-badges">
            <span className={`v-status-badge ${statusMeta.badgeClass}`}>
              <span className="v-status-dot"></span>
              {statusMeta.label}
            </span>
            <span className="v-type-badge">
              {VACCINE_TYPE_LABELS[currentVaccine.vaccineType]}
            </span>
            <span className="v-target-badge">
              {TARGET_GROUP_LABELS[currentVaccine.targetGroup]}
            </span>
            {currentVaccine.atcCode && (
              <span className="v-atc-pill">Kod ATC: {currentVaccine.atcCode} (Pkt 5.1)</span>
            )}
          </div>

          <div className="v-detail-quick-actions">
            {currentVaccine.rplRecordUrl ? (
              <a
                href={currentVaccine.rplRecordUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-rpl-official"
              >
                <span>Rekord w RPL</span>
                <ExternalLink size={15} />
              </a>
            ) : (
              <a
                href="https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-rpl-search"
                title="Brak jednoznacznego trwałego permalinka w RPL eZdrowie dla procedury centralnej EMA – kliknij, aby przejść do wyszukiwarki ogólnej"
              >
                <Search size={14} />
                <span>Szukaj w RPL (brak permalinka)</span>
                <ExternalLink size={13} />
              </a>
            )}

            {currentVaccine.currentChplUrl && (
              <a
                href={currentVaccine.currentChplUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-chpl-official"
                title="Pobierz lub wyświetl oficjalny plik PDF ChPL"
              >
                <FileText size={15} />
                <span>Oficjalny druk ChPL (PDF)</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        <div className="v-detail-header-body">
          <h1 className="v-detail-title">{currentVaccine.tradeName}</h1>
          <p className="v-detail-substance">
            <strong>Substancja czynna (Pkt 2 ChPL):</strong> {currentVaccine.activeSubstance}
          </p>

          <div className="v-detail-specs-grid">
            <div className="v-spec-item">
              <span className="v-spec-label">Podmiot odpowiedzialny (Pkt 7):</span>
              <span className="v-spec-value">{currentVaccine.manufacturer}</span>
            </div>
            <div className="v-spec-item">
              <span className="v-spec-label">Postać farmaceutyczna (Pkt 3):</span>
              <span className="v-spec-value">{currentVaccine.pharmaceuticalForm}</span>
            </div>
            <div className="v-spec-item">
              <span className="v-spec-label">Numer pozwolenia (Pkt 8):</span>
              <span className="v-spec-value">{currentVaccine.marketingAuthorizationNumber || 'Brak danych w bazie'}</span>
            </div>
            <div className="v-spec-item">
              <span className="v-spec-label">Powiązanie z rejestrem RPL:</span>
              <span className={`v-spec-value ${currentVaccine.rplRecordUrl ? '' : 'rpl-null-notice'}`}>
                {currentVaccine.rplRecordUrl ? 'Dostępny bezpośredni permalink' : 'Brak permalinka (wyszukiwanie wg nazwy)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* OSTRZEŻENIE O ROZBIEŻNOŚCIACH W DOKUMENTACJI CHPL (ZADANIE 1)  */}
      {/* ============================================================== */}
      {hasUnresolvedDiscrepancies && currentVaccine.sourceDiscrepancies && currentVaccine.sourceDiscrepancies.length > 0 && (
        <section className="v-discrepancy-banner-card" aria-label="Wykryte rozbieżności w oficjalnej dokumentacji ChPL">
          <div className="v-disc-card-header">
            <div className="v-disc-header-left">
              <span className="v-disc-icon-box">
                <AlertTriangle size={24} className="v-disc-icon" />
              </span>
              <div>
                <div className="v-disc-badges-row">
                  <span className="v-disc-alert-pill">Wykryto niezgodność w druku ChPL</span>
                  <span className="v-disc-status-pill">
                    Status: {DISCREPANCY_STATUS_META[primaryDiscrepancy?.status || 'requires_clarification']?.label || 'Wymaga wyjaśnienia'}
                  </span>
                </div>
                <h2 className="v-disc-headline">
                  Niezgodność wewnętrzna oficjalnej Charakterystyki Produktu Leczniczego
                </h2>
              </div>
            </div>
          </div>

          <div className="v-disc-card-body">
            <p className="v-disc-intro">
              W trakcie badania dokumentacji źródłowej (polska ChPL GSK z 12.02.2026 oraz unijna EPAR SmPC) wykryto rozbieżność liczbową w oficjalnym tekście urzędowym.
              Zgodnie z zasadami rzetelności medycznej <strong>aplikacja VaxNurse zachowuje obie wartości zgodnie z sekcjami dokumentu</strong> i nie modyfikuje ich domysłem ani automatycznym ujednoliceniem.
            </p>

            <div className="v-disc-items-grid">
              {currentVaccine.sourceDiscrepancies.map(disc => (
                <div key={disc.id} className="v-disc-item-card">
                  <div className="v-disc-item-header">
                    <span className="v-disc-field-label">Badany parametr:</span>
                    <strong className="v-disc-field-name">{disc.fieldName}</strong>
                    <span className="v-disc-clarif-badge">{DISCREPANCY_STATUS_META[disc.status]?.label || 'Wymaga wyjaśnienia'}</span>
                  </div>

                  <div className="v-disc-compare-boxes">
                    <div className="v-disc-compare-tile sec-first">
                      <span className="v-disc-tile-sec">Punkt {disc.firstSection} ChPL (Skład jakościowy i ilościowy)</span>
                      <span className="v-disc-tile-val">{disc.firstValue}</span>
                    </div>
                    <div className="v-disc-compare-vs">vs</div>
                    <div className="v-disc-compare-tile sec-second">
                      <span className="v-disc-tile-sec">Punkt {disc.secondSection} ChPL (Specjalne ostrzeżenia i środki ostrożności)</span>
                      <span className="v-disc-tile-val">{disc.secondValue}</span>
                    </div>
                  </div>

                  <p className="v-disc-desc-paragraph">
                    <strong>Opis rozbieżności:</strong> {disc.description}
                  </p>

                  <div className="v-disc-actions-bar">
                    <a
                      href={disc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-disc-source-link primary"
                      title="Otwórz oficjalny PDF ChPL GSK z 12.02.2026"
                    >
                      <FileText size={14} />
                      <span>Oficjalna ChPL GSK Polska (12.02.2026)</span>
                      <ExternalLink size={13} />
                    </a>
                    <a
                      href="https://www.ema.europa.eu/pl/documents/product-information/infanrix-hexa-epar-product-information_pl.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-disc-source-link secondary"
                      title="Otwórz oficjalny polski druk EPAR SmPC Europejskiej Agencji Leków (EMA)"
                    >
                      <FileCheck size={14} />
                      <span>Porównaj z wersją EMA PL</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="v-disc-footer-warning">
              <ShieldAlert size={18} className="v-disc-shield-icon" />
              <span>
                <strong>Blokada statusu weryfikacji:</strong> Dopóki rozbieżność w oficjalnym druku nie zostanie sprostowana przez wytwórcę lub URPL/EMA (status: <code>requires_clarification</code>), nadanie statusu <em>Zweryfikowany na podstawie ChPL</em> jest zablokowane ze względów bezpieczeństwa.
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* KROK 3: PANEL ROZDZIELENIA DAT                                 */}
      {/* ============================================================== */}
      <section className="v-dates-panel" aria-label="Daty rejestracji, pobrania i weryfikacji dokumentacji">
        <div className="v-dates-header">
          <div className="v-dates-title-group">
            <Calendar size={20} className="v-dates-header-icon" />
            <div>
              <h2 className="v-dates-title">Metryka czasowa dokumentacji i weryfikacji</h2>
              <p className="v-dates-subtitle">
                Wyraźne rozdzielenie daty sporządzenia ChPL, daty pobrania pliku źródłowego oraz ręcznej weryfikacji klinicznej.
              </p>
            </div>
          </div>
        </div>

        <div className="v-dates-cards-grid">
          {/* Data 1: Data rewizji tekstu ChPL (Pkt 10) */}
          <div className="v-date-card">
            <div className="v-date-card-top">
              <span className="v-date-icon-box blue">
                <Clock size={16} />
              </span>
              <span className="v-date-pill">Punkt 10 ChPL</span>
            </div>
            <span className="v-date-label">Data zatwierdzenia / rewizji tekstu ChPL</span>
            <span className="v-date-value">
              {currentVaccine.chplRevisionDate || 'Brak w dokumencie'}
            </span>
            <span className="v-date-desc">
              Data zmiany druków wg procedury wytwórcy / EMA (odrębna od daty publikacji portalu EMA oraz odnowienia pozwolenia).
            </span>
          </div>

          {/* Data 2: Data pobrania dokumentu źródłowego */}
          <div className="v-date-card">
            <div className="v-date-card-top">
              <span className="v-date-icon-box teal">
                <DownloadCloud size={16} />
              </span>
              <span className="v-date-pill">Źródło oficjalne</span>
            </div>
            <span className="v-date-label">Data pobrania dokumentu źródłowego</span>
            <span className="v-date-value">
              {currentVaccine.documentDownloadDate || 'Brak daty'}
            </span>
            <span className="v-date-desc">
              Pobrano z oficjalnego repozytorium wytwórcy (GSK Polska / EMA) do bazy referencyjnej VaxNurse.
            </span>
          </div>

          {/* Data 3: Data ręcznej weryfikacji przez personel */}
          <div className={`v-date-card ${currentVaccine.userVerificationDate ? 'verified' : 'pending'}`}>
            <div className="v-date-card-top">
              <span className={`v-date-icon-box ${currentVaccine.userVerificationDate ? 'green' : 'amber'}`}>
                <UserCheck size={16} />
              </span>
              <span className={`v-date-pill ${currentVaccine.userVerificationDate ? 'green' : 'amber'}`}>
                {currentVaccine.userVerificationDate ? 'Zweryfikowano' : 'Oczekuje na akcję'}
              </span>
            </div>
            <span className="v-date-label">Data ręcznej weryfikacji przez personel</span>
            <span className="v-date-value">
              {currentVaccine.userVerificationDate || 'Brak weryfikacji użytkownika'}
            </span>
            <span className="v-date-desc">
              {currentVaccine.userVerificationDate
                ? `Potwierdzono przez personel: ${currentVaccine.userVerificationNotes || 'Zgodność z drukiem ChPL'}`
                : 'Wymaga świadomego zatwierdzenia zgodności przez personel medyczny poniżej.'}
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SZYBKA METRYKA STATUSU Z ODSYŁACZEM DO KOŃCOWEGO PANELU        */}
      {/* ============================================================== */}
      <section className="v-top-verif-anchor-card" aria-label="Informacja o statusie weryfikacji dokumentacji">
        <div className="v-top-anchor-left">
          <div className="v-top-anchor-icon-box">
            {currentVaccine.verificationStatus === 'verified_chpl' ? (
              <CheckCircle2 size={22} className="v-top-anchor-icon verified" />
            ) : hasUnresolvedDiscrepancies ? (
              <AlertTriangle size={22} className="v-top-anchor-icon warning" />
            ) : (
              <ShieldAlert size={22} className="v-top-anchor-icon info" />
            )}
          </div>
          <div className="v-top-anchor-info">
            <div className="v-top-anchor-meta">
              <span className="v-top-anchor-label">Status weryfikacji:</span>
              <span className={`v-status-badge ${statusMeta.badgeClass}`}>
                <span className="v-status-dot"></span>
                {statusMeta.label}
              </span>
              {hasUnresolvedDiscrepancies && (
                <span className="v-top-disc-pill">
                  Nierozwiązane niezgodności: <strong>{unresolvedCount}</strong>
                </span>
              )}
            </div>
            <p className="v-top-anchor-desc">
              {hasUnresolvedDiscrepancies
                ? 'Wykryto wewnętrzną rozbieżność w druku ChPL (zawartość fenyloalaniny). Zatwierdzenie dokumentacji pozostaje zablokowane do czasu urzędowego sprostowania.'
                : 'Karta preparatu podlega formalnej kontroli i weryfikacji w punkcie szczepień.'}
            </p>
          </div>
        </div>
        <a href="#final-chpl-verification-panel" className="btn-jump-to-final-panel">
          <span>Przejdź do panelu kontroli na końcu karty</span>
          <ChevronDown size={15} />
        </a>
      </section>

      {/* Mandatory Clinical Safety Banner */}
      <section className="v-detail-safety-alert" aria-label="Komunikat bezpieczeństwa">
        <div className="v-safety-icon-wrapper">
          <ShieldAlert size={24} className="v-safety-alert-icon" />
        </div>
        <div className="v-safety-content">
          <h2 className="v-safety-title">
            Struktura oficjalnej Charakterystyki Produktu Leczniczego (Punkty 1–10)
          </h2>
          <p className="v-safety-desc">
            Układ poniższej karty odwzorowuje europejski wzorzec <strong>EMA QRD Product Information Template (v10.4, 02/2024)</strong>.
            Zgodnie z zasadami rzetelności medycznej <strong>aplikacja VaxNurse nie generuje automatycznych dawek ani przeciwwskazań</strong>.
            Wszelkie decyzje kwalifikacyjne wymagają weryfikacji aktualnego druku ChPL w państwowym Rejestrze Produktów Leczniczych.
          </p>
          <div className="v-safety-links">
            <a
              href="https://rejestrymedyczne.ezdrowie.gov.pl/rpl/search/public"
              target="_blank"
              rel="noopener noreferrer"
              className="v-safety-link"
            >
              <span>Rejestr RPL eZdrowie (wyszukiwarka)</span>
              <ExternalLink size={13} />
            </a>
            <a
              href="https://leki.urpl.gov.pl/index.php"
              target="_blank"
              rel="noopener noreferrer"
              className="v-safety-link"
            >
              <span>URPL (źródło pomocnicze)</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* Accordion Controls Bar */}
      <div className="chpl-view-toolbar">
        <span className="toolbar-info-text">
          Układ oficjalny: <strong>10 głównych punktów ChPL</strong>
        </span>
        <div className="toolbar-buttons">
          <button type="button" className="btn-toolbar-toggle" onClick={expandAll}>
            Rozwiń wszystkie punkty
          </button>
          <button type="button" className="btn-toolbar-toggle" onClick={collapseAll}>
            Zwiń wszystkie punkty
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 10 GŁÓWNYCH PUNKTÓW CHPL (EMA QRD v10.4)                      */}
      {/* ============================================================== */}
      <div className="chpl-points-container">
        {/* PUNKT 1: Nazwa produktu leczniczego */}
        <section className="chpl-main-card" id="chpl-point-1">
          <header className="chpl-card-header" onClick={() => toggleSection('sec1')}>
            <div className="card-header-left">
              <span className="card-num-circle">1</span>
              <div>
                <h3 className="card-header-title">1. Nazwa produktu leczniczego</h3>
                <span className="card-header-subtitle">Name of the medicinal product</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 1">
              {expandedSections.sec1 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec1 && (
            <div className="chpl-card-body">
              {renderSectionBox(chpl.name, <Info size={17} />)}
            </div>
          )}
        </section>

        {/* PUNKT 2: Skład jakościowy i ilościowy */}
        <section className="chpl-main-card" id="chpl-point-2">
          <header className="chpl-card-header" onClick={() => toggleSection('sec2')}>
            <div className="card-header-left">
              <span className="card-num-circle">2</span>
              <div>
                <h3 className="card-header-title">2. Skład jakościowy i ilościowy</h3>
                <span className="card-header-subtitle">Qualitative and quantitative composition</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 2">
              {expandedSections.sec2 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec2 && (
            <div className="chpl-card-body">
              {renderSectionBox(chpl.composition, <Layers size={17} />)}
            </div>
          )}
        </section>

        {/* PUNKT 3: Postać farmaceutyczna */}
        <section className="chpl-main-card" id="chpl-point-3">
          <header className="chpl-card-header" onClick={() => toggleSection('sec3')}>
            <div className="card-header-left">
              <span className="card-num-circle">3</span>
              <div>
                <h3 className="card-header-title">3. Postać farmaceutyczna</h3>
                <span className="card-header-subtitle">Pharmaceutical form</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 3">
              {expandedSections.sec3 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec3 && (
            <div className="chpl-card-body">
              {renderSectionBox(chpl.pharmaceuticalForm, <FileText size={17} />)}
            </div>
          )}
        </section>

        {/* PUNKT 4: Szczegółowe dane kliniczne (4.1 – 4.9) */}
        <section className="chpl-main-card clinical-highlight" id="chpl-point-4">
          <header className="chpl-card-header" onClick={() => toggleSection('sec4')}>
            <div className="card-header-left">
              <span className="card-num-circle highlight">4</span>
              <div>
                <h3 className="card-header-title">4. Szczegółowe dane kliniczne</h3>
                <span className="card-header-subtitle">Clinical particulars (podpunkty 4.1 – 4.9)</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 4">
              {expandedSections.sec4 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec4 && (
            <div className="chpl-card-body">
              <div className="subsections-stack">
                {renderSectionBox(chpl.clinicalParticulars.indications, <Activity size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.dosageAndAdministration, <Clock size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.contraindications, <AlertTriangle size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.warningsAndPrecautions, <ShieldAlert size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.interactions, <FileCheck size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.fertilityPregnancyLactation, <Heart size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.driveAndMachines, <Activity size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.undesirableEffects, <AlertTriangle size={16} />, true)}
                {renderSectionBox(chpl.clinicalParticulars.overdose, <Info size={16} />, true)}
              </div>
            </div>
          )}
        </section>

        {/* PUNKT 5: Właściwości farmakologiczne (5.1 – 5.3) */}
        <section className="chpl-main-card" id="chpl-point-5">
          <header className="chpl-card-header" onClick={() => toggleSection('sec5')}>
            <div className="card-header-left">
              <span className="card-num-circle">5</span>
              <div>
                <h3 className="card-header-title">5. Właściwości farmakologiczne</h3>
                <span className="card-header-subtitle">Pharmacological properties (podpunkty 5.1 – 5.3)</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 5">
              {expandedSections.sec5 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec5 && (
            <div className="chpl-card-body">
              <div className="subsections-stack">
                {renderSectionBox(chpl.pharmacologicalProperties.pharmacodynamics, <FlaskConical size={16} />, true)}
                {renderSectionBox(chpl.pharmacologicalProperties.pharmacokinetics, <Activity size={16} />, true)}
                {renderSectionBox(chpl.pharmacologicalProperties.preclinicalSafety, <ShieldAlert size={16} />, true)}
              </div>
            </div>
          )}
        </section>

        {/* PUNKT 6: Dane farmaceutyczne (6.1 – 6.6) */}
        <section className="chpl-main-card" id="chpl-point-6">
          <header className="chpl-card-header" onClick={() => toggleSection('sec6')}>
            <div className="card-header-left">
              <span className="card-num-circle">6</span>
              <div>
                <h3 className="card-header-title">6. Dane farmaceutyczne</h3>
                <span className="card-header-subtitle">Pharmaceutical particulars (podpunkty 6.1 – 6.6)</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 6">
              {expandedSections.sec6 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec6 && (
            <div className="chpl-card-body">
              <div className="subsections-stack">
                {renderSectionBox(chpl.pharmaceuticalParticulars.excipients, <Layers size={16} />, true)}
                {renderSectionBox(chpl.pharmaceuticalParticulars.incompatibilities, <AlertTriangle size={16} />, true)}
                {renderSectionBox(chpl.pharmaceuticalParticulars.shelfLife, <Calendar size={16} />, true)}
                {renderSectionBox(chpl.pharmaceuticalParticulars.storageSpecialPrecautions, <ThermometerSnowflake size={16} />, true)}
                {renderSectionBox(chpl.pharmaceuticalParticulars.containerNatureAndContents, <Package size={16} />, true)}
                {renderSectionBox(chpl.pharmaceuticalParticulars.disposalAndHandling, <FileText size={16} />, true)}
              </div>
            </div>
          )}
        </section>

        {/* PUNKT 7: Podmiot odpowiedzialny */}
        <section className="chpl-main-card" id="chpl-point-7">
          <header className="chpl-card-header" onClick={() => toggleSection('sec7')}>
            <div className="card-header-left">
              <span className="card-num-circle">7</span>
              <div>
                <h3 className="card-header-title">7. Podmiot odpowiedzialny posiadający pozwolenie na dopuszczenie do obrotu</h3>
                <span className="card-header-subtitle">Marketing authorisation holder</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 7">
              {expandedSections.sec7 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec7 && (
            <div className="chpl-card-body">
              {renderSectionBox(chpl.marketingAuthorisationHolder, <Building2 size={17} />)}
            </div>
          )}
        </section>

        {/* PUNKT 8: Numer(-y) pozwolenia */}
        <section className="chpl-main-card" id="chpl-point-8">
          <header className="chpl-card-header" onClick={() => toggleSection('sec8')}>
            <div className="card-header-left">
              <span className="card-num-circle">8</span>
              <div>
                <h3 className="card-header-title">8. Numer(-y) pozwolenia na dopuszczenie do obrotu</h3>
                <span className="card-header-subtitle">Marketing authorisation number(s)</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 8">
              {expandedSections.sec8 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec8 && (
            <div className="chpl-card-body">
              {renderSectionBox(chpl.marketingAuthorisationNumber, <FileCheck size={17} />)}
            </div>
          )}
        </section>

        {/* PUNKT 9: Data pierwszego pozwolenia / przedłużenia */}
        <section className="chpl-main-card" id="chpl-point-9">
          <header className="chpl-card-header" onClick={() => toggleSection('sec9')}>
            <div className="card-header-left">
              <span className="card-num-circle">9</span>
              <div>
                <h3 className="card-header-title">9. Data wydania pierwszego pozwolenia i data przedłużenia pozwolenia</h3>
                <span className="card-header-subtitle">Date of first authorisation / renewal of the authorisation</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 9">
              {expandedSections.sec9 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec9 && (
            <div className="chpl-card-body">
              {renderSectionBox(chpl.firstAuthorisationAndRenewal, <Calendar size={17} />)}
            </div>
          )}
        </section>

        {/* PUNKT 10: Data zatwierdzenia tekstu lub jego zmiany */}
        <section className="chpl-main-card" id="chpl-point-10">
          <header className="chpl-card-header" onClick={() => toggleSection('sec10')}>
            <div className="card-header-left">
              <span className="card-num-circle">10</span>
              <div>
                <h3 className="card-header-title">10. Data zatwierdzenia lub częściowej zmiany tekstu ChPL</h3>
                <span className="card-header-subtitle">Date of revision of the text</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń punkt 10">
              {expandedSections.sec10 ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.sec10 && (
            <div className="chpl-card-body">
              {renderSectionBox(chpl.revisionDate, <Clock size={17} />)}
            </div>
          )}
        </section>

        {/* OPCJONALNA SEKCJA: Punkty 11 i 12 EMA QRD (Radiofarmaceutyki) */}
        <section className="chpl-main-card optional-card" id="chpl-point-optional">
          <header className="chpl-card-header" onClick={() => toggleSection('secOptional')}>
            <div className="card-header-left">
              <span className="card-num-circle muted">11-12</span>
              <div>
                <h3 className="card-header-title">Punkty 11 i 12 szablonu EMA QRD (Opcjonalne)</h3>
                <span className="card-header-subtitle">Dawkometria i instrukcje dla radiofarmaceutyków</span>
              </div>
            </div>
            <button type="button" className="card-collapse-icon" aria-label="Zwiń / rozwiń informację o punktach 11 i 12">
              {expandedSections.secOptional ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </header>
          {expandedSections.secOptional && (
            <div className="chpl-card-body">
              <div className="chpl-optional-notice">
                <Info size={18} className="optional-info-icon" />
                <p>
                  Zgodnie z oficjalnym szablonem <strong>EMA QRD Product Information Template v10.4</strong>, punkty 11 (Dosimetry) oraz 12 (Instructions for preparation of radiopharmaceuticals) dotyczą wyłącznie preparatów radiofarmaceutycznych. 
                  Dla szczepionek i standardowych produktów leczniczych stosowanych w punkcie szczepień punkty te <strong>nie mają zastosowania i nie wchodzą w zakres druku ChPL</strong>.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ============================================================== */}
      {/* 1. PANEL WERYFIKACJI NA KOŃCU KARTY                           */}
      {/* Tytuł: Kontrola i weryfikacja dokumentacji ChPL.              */}
      {/* ============================================================== */}
      <section className="v-final-chpl-verification-panel" id="final-chpl-verification-panel" aria-label="Kontrola i weryfikacja dokumentacji ChPL">
        <header className="v-final-verif-header">
          <div className="v-final-verif-header-left">
            <div className="v-final-verif-icon-box">
              <FileCheck size={26} className="v-final-icon" />
            </div>
            <div>
              <span className="v-final-verif-kicker">Panel weryfikacji karty preparatu</span>
              <h2 className="v-final-verif-title">Kontrola i weryfikacja dokumentacji ChPL.</h2>
              <p className="v-final-verif-subtitle">
                Oficjalna procedura weryfikacji zgodności danych klinicznych i farmaceutycznych z drukami urzędowymi URPL / EMA.
              </p>
            </div>
          </div>
          <div className="v-final-verif-badge-group">
            <span className={`v-status-badge ${statusMeta.badgeClass} large`}>
              <span className="v-status-dot"></span>
              {statusMeta.label}
            </span>
          </div>
        </header>

        {/* Sekcja statusu i niezgodności */}
        <div className="v-final-verif-body">
          {/* Status i liczba niezgodności */}
          <div className="v-final-summary-strip">
            <div className="v-summary-item">
              <span className="v-sum-label">Aktualny status preparatu:</span>
              <strong className="v-sum-val">{statusMeta.label}</strong>
            </div>
            <div className="v-summary-divider" />
            <div className="v-summary-item">
              <span className="v-sum-label">Liczba nierozwiązanych niezgodności:</span>
              <strong className={`v-sum-val ${unresolvedCount > 0 ? 'text-amber' : 'text-green'}`}>
                {unresolvedCount} {unresolvedCount === 1 ? 'nierozwiązana niezgodność' : 'nierozwiązanych niezgodności'}
              </strong>
            </div>
            <div className="v-summary-divider" />
            <div className="v-summary-item">
              <span className="v-sum-label">Weryfikacja przez personel:</span>
              <strong className="v-sum-val">
                {currentVaccine.userVerificationDate || 'Oczekuje na weryfikację'}
              </strong>
            </div>
          </div>

          {/* Szczegóły rozbieżności w dokumentacji (Zadanie 1) */}
          {primaryDiscrepancy && (
            <div className="v-final-disc-details-card">
              <div className="v-final-disc-card-head">
                <div className="v-final-disc-head-title">
                  <AlertTriangle size={18} className="v-final-disc-alert-icon" />
                  <div>
                    <h3 className="v-final-disc-title">
                      Identyfikator niezgodności: <code>{primaryDiscrepancy.id}</code>
                    </h3>
                    <span className="v-final-disc-subtitle">
                      Parametr: <strong>{primaryDiscrepancy.fieldName}</strong> &bull; Status niezgodności: <code>{DISCREPANCY_STATUS_META[primaryDiscrepancy.status]?.label || 'Wymaga wyjaśnienia'}</code>
                    </span>
                  </div>
                </div>
              </div>

              <div className="v-final-disc-card-content">
                <p className="v-final-disc-desc">
                  <strong>Opis rozbieżności fenyloalaniny:</strong> {primaryDiscrepancy.description}
                </p>

                <div className="v-final-disc-comparison-grid">
                  <div className="v-disc-box-cell sec1">
                    <span className="v-disc-box-tag">Sekcja źródłowa {primaryDiscrepancy.firstSection} (Skład jakościowy i ilościowy):</span>
                    <span className="v-disc-box-value">{primaryDiscrepancy.firstValue}</span>
                    <span className="v-disc-box-note">0,0289 mikrograma na dawkę</span>
                  </div>
                  <div className="v-disc-box-cell vs">vs</div>
                  <div className="v-disc-box-cell sec2">
                    <span className="v-disc-box-tag">Sekcja źródłowa {primaryDiscrepancy.secondSection} (Specjalne ostrzeżenia i środki ostrożności):</span>
                    <span className="v-disc-box-value">{primaryDiscrepancy.secondValue}</span>
                    <span className="v-disc-box-note">0,0298 mikrograma na dawkę</span>
                  </div>
                </div>

                <div className="v-final-disc-links-grid">
                  <a
                    href="https://pl.gsk.com/media/b2ip1snt/infanrix-hexa-druki-pl-h-0296-ia-vr-323859-12_02_2026.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="v-final-link-button gsk"
                    title="Otwórz oficjalną polską ChPL GSK z 12.02.2026"
                  >
                    <FileText size={16} />
                    <div>
                      <strong>Polska ChPL GSK (12.02.2026)</strong>
                      <span>pl.gsk.com/media/.../infanrix-hexa-druki-pl-12_02_2026.pdf</span>
                    </div>
                    <ExternalLink size={14} className="link-arrow" />
                  </a>

                  <a
                    href="https://www.ema.europa.eu/pl/documents/product-information/infanrix-hexa-epar-product-information_pl.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="v-final-link-button ema"
                    title="Otwórz oficjalną polską dokumentację EPAR SmPC Europejskiej Agencji Leków (EMA)"
                  >
                    <FileCheck size={16} />
                    <div>
                      <strong>Polska dokumentacja EMA (EPAR SmPC PL)</strong>
                      <span>ema.europa.eu/.../infanrix-hexa-epar-product-information_pl.pdf</span>
                    </div>
                    <ExternalLink size={14} className="link-arrow" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* BLOKADA ZATWIERDZENIA LUB STATUS GOTOWOŚCI DO ZATWIERDZENIA    */}
          {/* ============================================================== */}
          {hasUnresolvedDiscrepancies ? (
            <div className="v-final-approval-block-box">
              <div className="v-block-box-header">
                <ShieldAlert size={22} className="v-block-shield-icon" />
                <div>
                  <h3 className="v-block-title">Blokada zatwierdzenia karty preparatu</h3>
                  <p className="v-block-subtitle">
                    Przycisk zatwierdzania został wyszarzony i zablokowany z przyczyn bezpieczeństwa prawnego i medycznego.
                  </p>
                </div>
              </div>
              <div className="v-block-reason-box">
                <strong>Powód blokady:</strong>{' '}
                {isDiscrepancySubmitted ? (
                  <span>
                    Zgłoszono dane wyjaśnienia urzędowego w Etapie 1 (sygnatura: <code>{documentId || primaryDiscrepancy?.resolution?.documentId || 'b.d.'}</code>), lecz dokument ten nie został jeszcze ręcznie skontrolowany przez personel punktu szczepień (status niezgodności: <code>Zgłoszono wyjaśnienie</code>). 
                    Wymagane jest formalne potwierdzenie sprawdzenia dokumentu w Etapie 2. Dopóki kontrola nie zostanie potwierdzona, status preparatu pozostaje <em>Wymaga wyjaśnienia źródłowego</em>, a zatwierdzenie jest zablokowane.
                  </span>
                ) : (
                  <span>
                    Wykryto nierozwiązaną niezgodność wewnętrzną tekstu ChPL (status niezgodności: <code>Wymaga wyjaśnienia</code>: zawartość fenyloalaniny w Pkt 2 vs Pkt 4.4 wynosi 0,0289 µg vs 0,0298 µg). 
                    Brak zarejestrowanego dokumentu urzędowego w Etapie 1. Dopóki oficjalna dokumentacja nie zostanie sprostowana przez wytwórcę (GSK) lub właściwy organ rejestracyjny (URPL / EMA), system uniemożliwia nadanie statusu <em>Zweryfikowany na podstawie dokumentacji (verified_chpl)</em>. 
                    Niezgodności nie można usunąć samym kliknięciem ani pominąć bez kompletnego dokumentu urzędowego.
                  </span>
                )}
              </div>
              <div className="v-block-actions-row">
                <button
                  type="button"
                  className="btn-approval-blocked"
                  disabled
                  aria-disabled="true"
                  title="Zatwierdzenie zablokowane: preparat posiada nierozwiązane lub nieskontrolowane niezgodności ChPL"
                >
                  <ShieldAlert size={17} />
                  <span>Zatwierdzenie zablokowane</span>
                </button>
                <span className="v-block-hint">
                  {isDiscrepancySubmitted
                    ? 'Do zdjęcia blokady wymagane jest ręczne potwierdzenie sprawdzenia dokumentu w Etapie 2 poniżej.'
                    : 'Do zdjęcia blokady wymagana jest rejestracja wyjaśnienia (Etap 1) oraz ręczna kontrola dokumentu (Etap 2).'}
                </span>
              </div>
            </div>
          ) : (
            <div className="v-final-approval-ready-box">
              <div className="v-ready-box-header">
                <CheckCircle2 size={22} className="v-ready-icon" />
                <div>
                  <h3 className="v-ready-title">
                    {currentVaccine.verificationStatus === 'verified_chpl'
                      ? 'Dokumentacja preparatu została zatwierdzona'
                      : 'Niezgodności zostały formalnie wyjaśnione i skontrolowane – Gotowy do ręcznej weryfikacji'}
                  </h3>
                  <p className="v-ready-subtitle">
                    {currentVaccine.verificationStatus === 'verified_chpl'
                      ? 'Uprawniony personel medyczny potwierdził zgodność danych z oficjalnym drukiem ChPL.'
                      : 'Wszystkie niezgodności w druku zostały zarejestrowane dokumentem urzędowym oraz ręcznie skontrolowane przez personel. Karta oczekuje na osobną, świadomą decyzję o autoryzacji ChPL.'}
                  </p>
                </div>
              </div>
              <div className="v-ready-actions-row">
                {currentVaccine.verificationStatus === 'verified_chpl' ? (
                  <div className="v-approval-done-info">
                    <span className="v-approval-done-badge">
                      <CheckCircle2 size={16} /> Zweryfikowany na podstawie dokumentacji ({currentVaccine.userVerificationDate})
                    </span>
                    <button
                      type="button"
                      className="btn-revoke-approval"
                      onClick={() => handleUpdateStatus('ready_for_manual_verification')}
                      title="Cofnij zatwierdzenie (powrót do stanu: Gotowy do ręcznej weryfikacji)"
                    >
                      <RotateCcw size={15} />
                      <span>Cofnij zatwierdzenie (powrót do: Gotowy do ręcznej weryfikacji)</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-approve-verified"
                    onClick={() => handleUpdateStatus('verified_chpl')}
                    title="Potwierdź zgodność karty ChPL i nadaj status: Zweryfikowany na podstawie dokumentacji"
                  >
                    <CheckCircle2 size={17} />
                    <span>Zatwierdź dokumentację (nadaj status: Zweryfikowany na podstawie dokumentacji)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* ETAP 1 – REJESTRACJA WYJAŚNIENIA URZĘDOWEGO (6 PÓL)             */}
          {/* ============================================================== */}
          <div className="v-future-verification-section">
            <div className="v-future-verif-header">
              <FileCheck size={20} className="v-future-icon" />
              <div>
                <h3 className="v-future-title">Etap 1 – Rejestracja wyjaśnienia urzędowego</h3>
                <p className="v-future-subtitle">
                  Wprowadzenie kompletu danych urzędowego dokumentu korygującego lub orzeczenia rejestracyjnego.
                </p>
              </div>
            </div>

            <div className="v-future-verif-notice">
              <ShieldAlert size={16} className="v-notice-icon" />
              <span>
                <strong>Zasada rzetelności klinicznej:</strong> Samo zapisanie formularza nie oznacza potwierdzenia autentyczności dokumentu ani zatwierdzenia karty. 
                Po zarejestrowaniu 6 wymaganych parametrów niezgodność otrzymuje status <em>Zgłoszono wyjaśnienie</em>, a preparat nadal pozostaje w stanie <em>Wymaga wyjaśnienia źródłowego</em> (zatwierdzenie pozostaje zablokowane do momentu wykonania Etapu 2).
              </span>
            </div>

            {/* Banner błędu walidacji formularza Etapu 1 */}
            {showValidationBanner && (
              <div className="v-form-validation-banner" role="alert">
                <AlertTriangle size={18} className="v-banner-error-icon" />
                <div className="v-banner-error-text">
                  <strong>Niekompletny formularz wyjaśnienia:</strong>
                  <span> Wyjaśnienie można zarejestrować dopiero po podaniu wszystkich 6 wymaganych danych urzędowych. Popraw zaznaczone pola poniżej.</span>
                </div>
              </div>
            )}

            {isDiscrepancyRequiresClarification ? (
              <>
                <div className="v-future-verif-form-grid">
                  {/* Pole 1 */}
                  <div className={`v-form-group ${formErrors.documentId ? 'has-error' : ''}`}>
                    <label htmlFor="clarif-doc-id" className="v-form-label">
                      1. Identyfikator dokumentu <span className="req">*</span>
                    </label>
                    <input
                      id="clarif-doc-id"
                      type="text"
                      className={`v-form-input ${formErrors.documentId ? 'input-error' : ''}`}
                      placeholder="np. URPL/DPR/2026/012 lub GSK-PL-VR-323859-CORR-01"
                      value={documentId}
                      onChange={(e) => {
                        setDocumentId(e.target.value);
                        if (formErrors.documentId) clearFieldError('documentId');
                      }}
                    />
                    {formErrors.documentId ? (
                      <span className="v-form-field-error">{formErrors.documentId}</span>
                    ) : (
                      <span className="v-form-hint">Sygnatura decyzji korygującej, pisma producenta lub orzeczenia URPL/EMA.</span>
                    )}
                  </div>

                  {/* Pole 2 */}
                  <div className={`v-form-group ${formErrors.issuer ? 'has-error' : ''}`}>
                    <label htmlFor="clarif-issuer" className="v-form-label">
                      2. Instytucja lub podmiot wystawiający <span className="req">*</span>
                    </label>
                    <input
                      id="clarif-issuer"
                      type="text"
                      className={`v-form-input ${formErrors.issuer ? 'input-error' : ''}`}
                      placeholder="np. Urząd Rejestracji Produktów Leczniczych (URPLWMiPB) lub GSK Services Sp. z o.o."
                      value={issuer}
                      onChange={(e) => {
                        setIssuer(e.target.value);
                        if (formErrors.issuer) clearFieldError('issuer');
                      }}
                    />
                    {formErrors.issuer ? (
                      <span className="v-form-field-error">{formErrors.issuer}</span>
                    ) : (
                      <span className="v-form-hint">Organ rejestracyjny lub podmiot odpowiedzialny wydający oficjalne sprostowanie.</span>
                    )}
                  </div>

                  {/* Pole 3 */}
                  <div className={`v-form-group ${formErrors.documentDate ? 'has-error' : ''}`}>
                    <label htmlFor="clarif-doc-date" className="v-form-label">
                      3. Data dokumentu <span className="req">*</span>
                    </label>
                    <input
                      id="clarif-doc-date"
                      type="text"
                      className={`v-form-input ${formErrors.documentDate ? 'input-error' : ''}`}
                      placeholder="np. 01.03.2026 r. lub 2026-03-01"
                      value={documentDate}
                      onChange={(e) => {
                        setDocumentDate(e.target.value);
                        if (formErrors.documentDate) clearFieldError('documentDate');
                      }}
                    />
                    {formErrors.documentDate ? (
                      <span className="v-form-field-error">{formErrors.documentDate}</span>
                    ) : (
                      <span className="v-form-hint">Data sporządzenia lub podpisania dokumentu urzędowego.</span>
                    )}
                  </div>

                  {/* Pole 4 */}
                  <div className={`v-form-group ${formErrors.receivedDate ? 'has-error' : ''}`}>
                    <label htmlFor="clarif-received-date" className="v-form-label">
                      4. Data otrzymania <span className="req">*</span>
                    </label>
                    <input
                      id="clarif-received-date"
                      type="text"
                      className={`v-form-input ${formErrors.receivedDate ? 'input-error' : ''}`}
                      placeholder="np. 05.03.2026 r. lub 2026-03-05"
                      value={receivedDate}
                      onChange={(e) => {
                        setReceivedDate(e.target.value);
                        if (formErrors.receivedDate) clearFieldError('receivedDate');
                      }}
                    />
                    {formErrors.receivedDate ? (
                      <span className="v-form-field-error">{formErrors.receivedDate}</span>
                    ) : (
                      <span className="v-form-hint">Data wpływu dokumentu do punktu szczepień lub publikacji w rejestrze.</span>
                    )}
                  </div>

                  {/* Pole 5 */}
                  <div className={`v-form-group full-width ${formErrors.documentUrlOrLocation ? 'has-error' : ''}`}>
                    <label htmlFor="clarif-url-loc" className="v-form-label">
                      5. Odnośnik lub lokalizacja dokumentu <span className="req">*</span>
                    </label>
                    <input
                      id="clarif-url-loc"
                      type="text"
                      className={`v-form-input ${formErrors.documentUrlOrLocation ? 'input-error' : ''}`}
                      placeholder="np. https://urpl.gov.pl/decyzje/2026/VR323859 lub Segregator ChPL 2026 / teczka Infanrix hexa"
                      value={documentUrlOrLocation}
                      onChange={(e) => {
                        setDocumentUrlOrLocation(e.target.value);
                        if (formErrors.documentUrlOrLocation) clearFieldError('documentUrlOrLocation');
                      }}
                    />
                    {formErrors.documentUrlOrLocation ? (
                      <span className="v-form-field-error">{formErrors.documentUrlOrLocation}</span>
                    ) : (
                      <span className="v-form-hint">Bezpośredni adres URL do publikatora urzędowego lub fizyczna sygnatura w archiwum punktu szczepień.</span>
                    )}
                  </div>

                  {/* Pole 6 */}
                  <div className={`v-form-group full-width ${formErrors.verifierJustification ? 'has-error' : ''}`}>
                    <label htmlFor="clarif-justification" className="v-form-label">
                      6. Uzasadnienie osoby weryfikującej <span className="req">*</span>
                    </label>
                    <textarea
                      id="clarif-justification"
                      rows={3}
                      className={`v-form-textarea ${formErrors.verifierJustification ? 'input-error' : ''}`}
                      placeholder="Wpisz ocenę merytoryczną wpływu klinicznego rozbieżności, potwierdzenie zgodności z dokumentem urzędowym oraz imię, nazwisko i tytuł zawodowy weryfikatora..."
                      value={verifierJustification}
                      onChange={(e) => {
                        setVerifierJustification(e.target.value);
                        if (formErrors.verifierJustification) clearFieldError('verifierJustification');
                      }}
                    />
                    {formErrors.verifierJustification ? (
                      <span className="v-form-field-error">{formErrors.verifierJustification}</span>
                    ) : (
                      <span className="v-form-hint">Podpis osoby weryfikującej (pielęgniarka / lekarz koordynator punktu szczepień) wraz z oceną medyczną.</span>
                    )}
                  </div>
                </div>

                <div className="v-future-actions-bar">
                  <button
                    type="button"
                    className="btn-register-clarification"
                    onClick={handleRegisterClarification}
                  >
                    <FileCheck size={16} />
                    <span>Zarejestruj formalne wyjaśnienie urzędowe (Etap 1)</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="v-clarification-registered-container">
                <div className="v-clarification-registered-box">
                  <div className="v-clarif-badge">
                    <CheckCircle2 size={16} /> Wyjaśnienie urzędowe zarejestrowane (Etap 1 ukończony)
                  </div>
                  <button
                    type="button"
                    className="btn-revoke-clarification"
                    onClick={handleResetClarification}
                    title="Cofnij rejestrację wyjaśnienia i przywróć status Wymaga wyjaśnienia źródłowego"
                  >
                    <RotateCcw size={14} />
                    <span>Cofnij wyjaśnienie urzędowe (powrót do stanu początkowego)</span>
                  </button>
                </div>

                {/* Zarejestrowane dane w Etapie 1 */}
                <div className="v-registered-summary-grid">
                  <div className="v-reg-item">
                    <span className="v-reg-label">1. Identyfikator dokumentu:</span>
                    <strong className="v-reg-val">{documentId || primaryDiscrepancy?.resolution?.documentId || 'b.d.'}</strong>
                  </div>
                  <div className="v-reg-item">
                    <span className="v-reg-label">2. Wystawca:</span>
                    <span className="v-reg-val">{issuer || primaryDiscrepancy?.resolution?.issuer || 'b.d.'}</span>
                  </div>
                  <div className="v-reg-item">
                    <span className="v-reg-label">3. Data dokumentu:</span>
                    <span className="v-reg-val">{documentDate || primaryDiscrepancy?.resolution?.documentDate || 'b.d.'}</span>
                  </div>
                  <div className="v-reg-item">
                    <span className="v-reg-label">4. Data otrzymania:</span>
                    <span className="v-reg-val">{receivedDate || primaryDiscrepancy?.resolution?.receivedDate || 'b.d.'}</span>
                  </div>
                  <div className="v-reg-item full-width">
                    <span className="v-reg-label">5. Odnośnik / lokalizacja dokumentu:</span>
                    <span className="v-reg-val">{documentUrlOrLocation || primaryDiscrepancy?.resolution?.documentUrlOrLocation || 'b.d.'}</span>
                  </div>
                  <div className="v-reg-item full-width">
                    <span className="v-reg-label">6. Uzasadnienie osoby weryfikującej:</span>
                    <span className="v-reg-val">{verifierJustification || primaryDiscrepancy?.resolution?.verifierJustification || 'b.d.'}</span>
                  </div>
                </div>

                {!isDiscrepancyResolved && (
                  <div className="v-clarif-unapproved-notice">
                    <Info size={16} className="v-unapproved-info-icon" />
                    <span>
                      <strong>Status niezgodności: <em>Zgłoszono wyjaśnienie</em>.</strong> Preparat pozostaje w stanie <strong>«Wymaga wyjaśnienia źródłowego»</strong>. 
                      Samo zarejestrowanie formularza nie potwierdza autentyczności dokumentu. Przejdź do <strong>Etapu 2</strong> poniżej, aby uprawniony personel potwierdził sprawdzenie dokumentu źródłowego.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* ETAP 2 – RĘCZNA KONTROLA DOKUMENTU ŹRÓDŁOWEGO                   */}
          {/* ============================================================== */}
          <div className="v-doc-check-section">
            <div className="v-doc-check-header">
              <UserCheck size={22} className="v-doc-check-icon" />
              <div>
                <h3 className="v-doc-check-title">Etap 2 – Ręczna kontrola dokumentu źródłowego przez personel</h3>
                <p className="v-doc-check-subtitle">
                  Świadome potwierdzenie otwarcia, sprawdzenia treści i adekwatności dokumentu wyjaśniającego przed odblokowaniem weryfikacji.
                </p>
              </div>
            </div>

            {/* Oświadczenie personelu – disclaimer o zapisie lokalnym */}
            <div className="v-doc-check-statement-disclaimer">
              <ShieldAlert size={18} className="v-disc-shield-icon" />
              <div>
                <strong>Oświadczenie personelu punktu szczepień (zapis lokalny w przeglądarce):</strong>
                <p style={{ margin: '4px 0 0 0', lineHeight: 1.45 }}>
                  W obecnej wersji aplikacji VaxNurse jest to oświadczenie zapisywane lokalnie w przeglądarce, bez uwierzytelniania tożsamości użytkownika. Wykonanie tej czynności stanowi formalne poświadczenie przez personel medyczny faktu otwarcia i sprawdzenia dokumentu źródłowego oraz jego adekwatności dla rozstrzygnięcia rozbieżności.
                </p>
              </div>
            </div>

            {isDiscrepancyRequiresClarification ? (
              <div className="v-doc-check-waiting-box">
                <p>Etap 2 wymaga wcześniejszego zarejestrowania danych dokumentu urzędowego w Etapie 1 powyżej.</p>
              </div>
            ) : isDiscrepancySubmitted ? (
              <>
                {/* Banner błędu walidacji kontroli dokumentu */}
                {showDocCheckValidationBanner && (
                  <div className="v-form-validation-banner" role="alert" style={{ marginBottom: 16 }}>
                    <AlertTriangle size={18} className="v-banner-error-icon" />
                    <div className="v-banner-error-text">
                      <strong>Niekompletne potwierdzenie kontroli dokumentu:</strong>
                      <span> Wypełnij wszystkie 4 wymagane elementy (oświadczenie o otwarciu/wskazaniu, datę, osobę sprawdzającą oraz uzasadnienie). Popraw zaznaczone pola poniżej.</span>
                    </div>
                  </div>
                )}

                <div className="v-doc-check-form-grid">
                  {/* Wymóg 1: Checkbox potwierdzenia otwarcia / wskazania */}
                  <div className={`v-checkbox-group ${docCheckErrors.docOpenedConfirmed ? 'has-error' : ''}`}>
                    <label className="v-checkbox-label">
                      <input
                        type="checkbox"
                        className="v-checkbox-input"
                        checked={docOpenedConfirmed}
                        onChange={(e) => {
                          setDocOpenedConfirmed(e.target.checked);
                          if (docCheckErrors.docOpenedConfirmed) clearDocCheckError('docOpenedConfirmed');
                        }}
                      />
                      <span>
                        Oświadczam, że otworzyłem/am i zapoznałem/am się z treścią dokumentu źródłowego lub wskazałem/am jego fizyczną lokalizację w archiwum punktu szczepień. <span className="req">*</span>
                      </span>
                    </label>
                    <span className="v-checkbox-hint">
                      Wskazany dokument: <strong>{documentUrlOrLocation || primaryDiscrepancy?.resolution?.documentUrlOrLocation || 'b.d.'}</strong>
                    </span>
                    {docCheckErrors.docOpenedConfirmed && (
                      <span className="v-form-field-error" style={{ display: 'block', marginTop: 6, marginLeft: 28 }}>
                        {docCheckErrors.docOpenedConfirmed}
                      </span>
                    )}
                  </div>

                  {/* Wymóg 2: Data sprawdzenia */}
                  <div className={`v-form-group ${docCheckErrors.docCheckDate ? 'has-error' : ''}`}>
                    <label htmlFor="doc-check-date" className="v-form-label">
                      Data sprawdzenia dokumentu <span className="req">*</span>
                    </label>
                    <input
                      id="doc-check-date"
                      type="text"
                      className={`v-form-input ${docCheckErrors.docCheckDate ? 'input-error' : ''}`}
                      placeholder="np. 10.11.2026 r. lub 2026-11-10"
                      value={docCheckDate}
                      onChange={(e) => {
                        setDocCheckDate(e.target.value);
                        if (docCheckErrors.docCheckDate) clearDocCheckError('docCheckDate');
                      }}
                    />
                    {docCheckErrors.docCheckDate ? (
                      <span className="v-form-field-error">{docCheckErrors.docCheckDate}</span>
                    ) : (
                      <span className="v-form-hint">Data faktycznego otwarcia i oceny dokumentu przez personel.</span>
                    )}
                  </div>

                  {/* Wymóg 3: Osoba sprawdzająca */}
                  <div className={`v-form-group ${docCheckErrors.checkerNameAndRole ? 'has-error' : ''}`}>
                    <label htmlFor="doc-checker-name" className="v-form-label">
                      Osoba dokonująca sprawdzenia <span className="req">*</span>
                    </label>
                    <input
                      id="doc-checker-name"
                      type="text"
                      className={`v-form-input ${docCheckErrors.checkerNameAndRole ? 'input-error' : ''}`}
                      placeholder="np. mgr pielęgniarstwa Anna Nowak, koordynator punktu szczepień"
                      value={checkerNameAndRole}
                      onChange={(e) => {
                        setCheckerNameAndRole(e.target.value);
                        if (docCheckErrors.checkerNameAndRole) clearDocCheckError('checkerNameAndRole');
                      }}
                    />
                    {docCheckErrors.checkerNameAndRole ? (
                      <span className="v-form-field-error">{docCheckErrors.checkerNameAndRole}</span>
                    ) : (
                      <span className="v-form-hint">Imię, nazwisko oraz tytuł zawodowy lub rola w punkcie szczepień.</span>
                    )}
                  </div>

                  {/* Wymóg 4: Uzasadnienie merytoryczne */}
                  <div className={`v-form-group full-width ${docCheckErrors.checkerJustification ? 'has-error' : ''}`}>
                    <label htmlFor="doc-checker-justification" className="v-form-label">
                      Uzasadnienie, dlaczego dokument rozwiązuje konkretną niezgodność <span className="req">*</span>
                    </label>
                    <textarea
                      id="doc-checker-justification"
                      rows={3}
                      className={`v-form-textarea ${docCheckErrors.checkerJustification ? 'input-error' : ''}`}
                      placeholder="Opisz, w jaki sposób treść dokumentu jednoznacznie rozstrzyga wykrytą niezgodność (np. orzeczenie URPL wyjaśniające rozbieżność w zawartości fenyloalaniny 0,0289 µg vs 0,0298 µg)..."
                      value={checkerJustification}
                      onChange={(e) => {
                        setCheckerJustification(e.target.value);
                        if (docCheckErrors.checkerJustification) clearDocCheckError('checkerJustification');
                      }}
                    />
                    {docCheckErrors.checkerJustification ? (
                      <span className="v-form-field-error">{docCheckErrors.checkerJustification}</span>
                    ) : (
                      <span className="v-form-hint">Szczegółowa ocena merytoryczna: dlaczego ten konkretny dokument usuwa rozbieżność w druku ChPL.</span>
                    )}
                  </div>
                </div>

                <div className="v-future-actions-bar">
                  <button
                    type="button"
                    className="btn-confirm-doc-check"
                    onClick={handleConfirmDocumentCheck}
                  >
                    <UserCheck size={16} />
                    <span>Potwierdź sprawdzenie dokumentu</span>
                  </button>
                  <span className="v-block-hint" style={{ marginTop: 8 }}>
                    Dopiero wykonanie tej czynności zmieni status niezgodności na <code>Wyjaśniona dokumentem urzędowym</code> i ustawi status preparatu na <code>Gotowy do ręcznej weryfikacji</code>.
                  </span>
                </div>
              </>
            ) : (
              /* isDiscrepancyResolved */
              <div className="v-doc-check-confirmed-card">
                <div className="v-doc-check-confirmed-head">
                  <span className="v-doc-check-confirmed-badge">
                    <CheckCircle2 size={16} /> Ręczna kontrola dokumentu potwierdzona przez personel
                  </span>
                  <button
                    type="button"
                    className="btn-revoke-doc-check"
                    onClick={handleRevokeDocumentCheck}
                    title="Cofnij sprawdzenie dokumentu (powrót do Etapu 1: Zgłoszono wyjaśnienie)"
                  >
                    <RotateCcw size={14} />
                    <span>Cofnij sprawdzenie dokumentu (powrót do Etapu 1)</span>
                  </button>
                </div>

                <div className="v-doc-check-confirmed-grid">
                  <div className="v-confirmed-item">
                    <span className="v-confirmed-label">Osoba sprawdzająca:</span>
                    <strong className="v-confirmed-val">{checkerNameAndRole || primaryDiscrepancy?.resolution?.documentCheck?.checkerNameAndRole || 'b.d.'}</strong>
                  </div>
                  <div className="v-confirmed-item">
                    <span className="v-confirmed-label">Data sprawdzenia:</span>
                    <span className="v-confirmed-val">{docCheckDate || primaryDiscrepancy?.resolution?.documentCheck?.checkDate || 'b.d.'}</span>
                  </div>
                  <div className="v-confirmed-item">
                    <span className="v-confirmed-label">Otwarcie / wskazanie dokumentu:</span>
                    <span className="v-confirmed-val">Potwierdzono zapoznanie się z dokumentem źródłowym</span>
                  </div>
                  <div className="v-confirmed-item">
                    <span className="v-confirmed-label">Czas zarejestrowania w przeglądarce:</span>
                    <span className="v-confirmed-val">{primaryDiscrepancy?.resolution?.documentCheck?.confirmedAt || 'zapis lokalny'}</span>
                  </div>
                  <div className="v-confirmed-item full-width">
                    <span className="v-confirmed-label">Uzasadnienie rozwiązania niezgodności:</span>
                    <span className="v-confirmed-val">{checkerJustification || primaryDiscrepancy?.resolution?.documentCheck?.checkerJustification || 'b.d.'}</span>
                  </div>
                </div>

                <div className="v-clarif-unapproved-notice" style={{ marginTop: 4 }}>
                  <Info size={16} className="v-unapproved-info-icon" />
                  <span>
                    <strong>Niezgodność została wyjaśniona (status: <em>Wyjaśniona dokumentem urzędowym</em>).</strong> Preparat ma status <strong>«Gotowy do ręcznej weryfikacji»</strong>. 
                    Karta oczekuje na ostateczne, świadome zatwierdzenie całej dokumentacji ChPL przez uprawniony personel w panelu powyżej.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* ETAP 3 – HIERARCHIA 3 STANÓW STATUSU PREPARATU                 */}
          {/* ============================================================== */}
          <div className="v-status-lifecycle-card">
            <div className="v-lifecycle-header">
              <Layers size={19} className="v-lifecycle-icon" />
              <div>
                <h3 className="v-lifecycle-title">Hierarchia stanów weryfikacji preparatu</h3>
                <p className="v-lifecycle-subtitle">
                  Jednolite etykiety i cykl życia karty preparatu w aplikacji VaxNurse:
                </p>
              </div>
            </div>

            <div className="v-lifecycle-steps-grid">
              {/* Stan 1 */}
              <div className={`v-lifecycle-step step-1 ${currentVaccine.verificationStatus === 'requires_source_clarification' ? 'active warning' : ''}`}>
                <div className="v-step-badge-col">
                  <span className="v-step-number">1</span>
                  {currentVaccine.verificationStatus === 'requires_source_clarification' && (
                    <span className="v-current-indicator warning">Obecny status</span>
                  )}
                </div>
                <div className="v-step-content-col">
                  <div className="v-step-title-row">
                    <strong className="v-step-title">Wymaga wyjaśnienia źródłowego</strong>
                    <span className="v-step-code">requires_source_clarification</span>
                  </div>
                  <p className="v-step-desc">
                    W oficjalnym druku ChPL stwierdzono rozbieżność (zawartość fenyloalaniny 0,0289 µg w Pkt 2 vs 0,0298 µg w Pkt 4.4). 
                    Zatwierdzenie karty preparatu jest zablokowane ze względów bezpieczeństwa prawnego i medycznego.
                  </p>
                </div>
              </div>

              {/* Stan 2 */}
              <div className={`v-lifecycle-step step-2 ${currentVaccine.verificationStatus === 'ready_for_manual_verification' ? 'active green' : ''}`}>
                <div className="v-step-badge-col">
                  <span className="v-step-number">2</span>
                  {currentVaccine.verificationStatus === 'ready_for_manual_verification' && (
                    <span className="v-current-indicator green">Obecny status</span>
                  )}
                </div>
                <div className="v-step-content-col">
                  <div className="v-step-title-row">
                    <strong className="v-step-title">Gotowy do ręcznej weryfikacji</strong>
                    <span className="v-step-code">ready_for_manual_verification</span>
                  </div>
                  <p className="v-step-desc">
                    Wszystkie niezgodności w druku zostały formalnie zarejestrowane dokumentem urzędowym (Etap 1) oraz ręcznie skontrolowane przez personel (Etap 2). 
                    Karta jest odblokowana do oceny personelu, lecz preparat nie jest jeszcze zweryfikowany.
                  </p>
                </div>
              </div>

              {/* Stan 3 */}
              <div className={`v-lifecycle-step step-3 ${currentVaccine.verificationStatus === 'verified_chpl' ? 'active verified' : ''}`}>
                <div className="v-step-badge-col">
                  <span className="v-step-number">3</span>
                  {currentVaccine.verificationStatus === 'verified_chpl' && (
                    <span className="v-current-indicator verified">Obecny status</span>
                  )}
                </div>
                <div className="v-step-content-col">
                  <div className="v-step-title-row">
                    <strong className="v-step-title">Zweryfikowany na podstawie dokumentacji</strong>
                    <span className="v-step-code">verified_chpl</span>
                  </div>
                  <p className="v-step-desc">
                    Ostateczny status nadawany po świadomym zatwierdzeniu przez uprawniony personel punktu szczepień po weryfikacji zgodności z oficjalnym drukiem ChPL z Rejestru Produktów Leczniczych.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* ETAP 4 – LOKALNA HISTORIA ZMIAN                                */}
          {/* ============================================================== */}
          <div className="v-audit-history-box">
            <div className="v-audit-header">
              <Clock size={18} className="v-audit-icon" />
              <div>
                <h3 className="v-audit-title">Lokalna historia zmian</h3>
                <p className="v-audit-subtitle">
                  Lokalny ślad rejestracji wyjaśnień, sprawdzeń dokumentów oraz decyzji personelu:
                </p>
              </div>
            </div>

            {/* Informacja wymagana w Etapie 4 */}
            <div className="v-audit-disclaimer-box">
              <p className="v-audit-disclaimer-text">
                Historia przechowywana lokalnie w przeglądarce.<br />
                Nie jest zabezpieczonym dziennikiem audytowym.<br />
                Nie potwierdza tożsamości osoby dokonującej zmian.<br />
                Dane nie są synchronizowane pomiędzy urządzeniami.
              </p>
            </div>

            <div className="v-audit-list">
              {(currentVaccine.statusHistory && currentVaccine.statusHistory.length > 0) ? (
                currentVaccine.statusHistory.map((entry) => (
                  <div key={entry.id} className="v-audit-item">
                    <div className="v-audit-item-header">
                      <span className="v-audit-timestamp">{entry.timestamp}</span>
                      <span className="v-audit-transition">
                        <span className="v-audit-prev">{VERIFICATION_STATUS_META[entry.previousStatus]?.label || entry.previousStatus}</span>
                        <span className="v-audit-arrow">&rarr;</span>
                        <span className="v-audit-next">{VERIFICATION_STATUS_META[entry.newStatus]?.label || entry.newStatus}</span>
                      </span>
                      <span className="v-audit-author">Autor: {entry.author}</span>
                    </div>
                    <p className="v-audit-reason">{entry.reason}</p>
                  </div>
                ))
              ) : (
                <p className="v-audit-empty">Brak zarejestrowanych zmian statusu w bieżącej sesji.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Navigation Back */}
      <div className="module-view-footer">
        <p className="footer-status-note">
          Karta ChPL (punkty 1–10, szablon EMA QRD v10.4) – status weryfikacji dokumentacji: {statusMeta.label}.
        </p>
        <button
          type="button"
          className="btn-primary-dashboard"
          onClick={onBackToList}
        >
          Powrót do Bazy preparatów
        </button>
      </div>
    </div>
  );
};
