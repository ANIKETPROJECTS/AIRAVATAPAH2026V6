import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import Lottie from "lottie-react";
import {
  X, CheckCircle2, XCircle, ShieldCheck, Loader2,
  FileStack, Sprout, ClipboardCheck, CreditCard, BookOpen,
  UserCheck, RotateCcw, AlertTriangle, FileText, MessageSquare, ImageIcon, ZoomIn,
} from "lucide-react";
import {
  type DocTypeId,
  type ExtractionState,
  type LangCode,
  DEFAULT_STATE,
  EMPTY_PROFILE,
  FarmerProfileCard,
  FieldsTable,
  DOC_CARDS,
  DOC_CARD_SHORT,
  type FarmerProfile,
  extractProfileFromStates,
  DocLightbox,
  analyzeDocuments,
  AiSummaryPanel,
} from "./NewRegistration";
import { apiUpdateFarmer, type FarmerRecord } from "@/data/farmerApi";

type DocStates = Record<DocTypeId, ExtractionState>;

/* ── Status badge ─────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Verified:  "bg-emerald-600 text-white",
    Cancelled: "bg-red-600 text-white",
    Pending:   "bg-amber-500 text-white",
    Active:    "bg-emerald-600 text-white",
    Inactive:  "bg-gray-500 text-white",
  };
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${map[status] ?? "bg-gray-500 text-white"}`}>
      {status}
    </span>
  );
}

/* ── Doc tab icon ─────────────────────────────── */
function DocTabIcon({ id }: { id: DocTypeId }) {
  if (id === "form7")        return <FileStack    className="h-3.5 w-3.5 flex-shrink-0" />;
  if (id === "form12")       return <Sprout       className="h-3.5 w-3.5 flex-shrink-0" />;
  if (id === "form8a")       return <ClipboardCheck className="h-3.5 w-3.5 flex-shrink-0" />;
  if (id === "aadhar")       return <CreditCard   className="h-3.5 w-3.5 flex-shrink-0" />;
  return                            <BookOpen     className="h-3.5 w-3.5 flex-shrink-0" />;
}

/* ── Document content viewer ──────────────────── */
export function DocContentView({
  state, docId, lang, rawDocImage,
}: {
  state: ExtractionState;
  docId: DocTypeId;
  lang: LangCode;
  rawDocImage?: { base64: string; mimeType: string } | null;
}) {
  const [showRawText, setShowRawText] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const hasFields    = state.sections.some(s => s.fields.some(f => f.value && f.value !== "—"));
  const hasTables    = state.sections.some(s => s.tables && s.tables.length > 0);
  const hasRawTables = state.rawTables && state.rawTables.length > 0;
  const hasTextBlocks = state.textBlocks && state.textBlocks.length > 0;
  const hasMeaningfulContent = hasFields || hasTables || hasRawTables;

  const docImageSrc = rawDocImage
    ? `data:${rawDocImage.mimeType};base64,${rawDocImage.base64}`
    : state.rawFileDataUrl ?? null;

  return (
    <div className="space-y-4">
      {state.filename && (
        <div className="flex items-center gap-2 text-xs text-black bg-gray-100 rounded-md px-3 py-2 border border-black/20">
          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-mono truncate">{state.filename}</span>
        </div>
      )}

      {docId === "aadhar" && state.aadharPhoto && (
        <div className="flex justify-center mb-2">
          <img
            src={`data:${state.aadharPhoto.mimeType};base64,${state.aadharPhoto.base64}`}
            alt="Aadhaar photo"
            className="h-28 w-28 rounded-full object-cover border-4 border-black/20 shadow"
          />
        </div>
      )}

      {lightboxSrc && (
        <DocLightbox src={lightboxSrc} label="Original Document" onClose={() => setLightboxSrc(null)} />
      )}

      {docImageSrc ? (
        <div className="flex gap-4 items-start">
          <div className="w-[220px] flex-shrink-0 sticky top-2">
            <div className="rounded-xl border border-black/20 bg-white overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-black/20 bg-gray-50">
                <ImageIcon className="h-3 w-3 text-black flex-shrink-0" />
                <span className="text-[11px] font-semibold text-black truncate flex-1">Original Document</span>
                <button type="button" onClick={() => setLightboxSrc(docImageSrc)}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  <ZoomIn className="h-3 w-3" /> Expand
                </button>
              </div>
              <button type="button" onClick={() => setLightboxSrc(docImageSrc)}
                className="w-full block focus:outline-none group relative">
                <img src={docImageSrc} alt="Original uploaded document" className="w-full object-contain max-h-[480px] bg-white" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-xs font-semibold rounded-full px-3 py-1.5 flex items-center gap-1.5">
                    <ZoomIn className="h-3.5 w-3.5" /> View fullscreen
                  </div>
                </div>
              </button>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            {(state.sections.length > 0 || hasRawTables) && (
              <FieldsTable sections={state.sections} rawTables={state.rawTables ?? []} textBlocks={[]} docId={docId} lang={lang} />
            )}
          </div>
        </div>
      ) : (
        (state.sections.length > 0 || hasRawTables) && (
          <FieldsTable sections={state.sections} rawTables={state.rawTables ?? []} textBlocks={[]} docId={docId} lang={lang} />
        )
      )}

      {!hasMeaningfulContent && state.sections.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-black">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-black">Limited structured data extracted</p>
            <p className="text-xs mt-1 text-black/70">
              The OCR could not extract structured fields from this document.
              {hasTextBlocks ? " Raw text is available below." : " The document may be unclear or in an unsupported format."}
            </p>
          </div>
        </div>
      )}

      {state.sections.length === 0 && !hasRawTables && !hasTextBlocks && (
        <div className="flex flex-col items-center justify-center py-16 text-black gap-3">
          <BookOpen className="h-10 w-10 opacity-20" />
          <p className="text-sm">No data extracted from this document.</p>
        </div>
      )}

      {hasTextBlocks && (
        <div>
          <button type="button" onClick={() => setShowRawText(o => !o)}
            className="flex items-center gap-2 text-xs font-semibold text-black hover:text-black/70 transition-colors w-full text-left px-1 py-1.5">
            <FileText className="h-3.5 w-3.5" />
            Raw extracted text ({state.textBlocks.length} block{state.textBlocks.length !== 1 ? "s" : ""})
            <span className="ml-auto text-[10px]">{showRawText ? "▲ hide" : "▼ show"}</span>
          </button>
          {(showRawText || !hasMeaningfulContent) && (
            <div className="mt-2 space-y-2 max-h-80 overflow-y-auto">
              {state.textBlocks.map((tb, i) => (
                <div key={i} className="border-l-4 border-l-black/30 bg-gray-50 border border-black/10 rounded-md px-4 py-3 text-xs whitespace-pre-wrap break-words text-black font-mono">
                  {tb}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Reject reason dialog ─────────────────────── */
function RejectReasonDialog({
  onCancel, onConfirm, saving,
}: {
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  saving: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 10001 }}>
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-black/20 w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-black/10 bg-red-50">
          <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-base text-black">Reject Registration</h3>
            <p className="text-xs text-red-600 mt-0.5">This action will notify the farmer of the rejection.</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">
              <MessageSquare className="h-4 w-4 inline mr-1.5 text-black/50" />
              Reason for Rejection <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Aadhaar document is unclear / blurry. Please re-upload a clear scan."
              rows={5} autoFocus
              className="w-full text-sm px-3 py-2.5 rounded-lg border border-black/20 bg-white focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 resize-none transition-all text-black"
            />
            <p className="text-xs text-black/50 mt-1.5">This reason will be shown to the farmer in their mobile app.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-black/10 bg-gray-50">
          <button onClick={onCancel} disabled={saving}
            className="px-4 py-2.5 rounded-lg border border-black/20 bg-white text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 text-black">
            Cancel
          </button>
          <button onClick={() => onConfirm(reason.trim())} disabled={saving || !reason.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main modal ───────────────────────────────── */
export default function FarmerReviewModal({
  farmer, onClose, onUpdated,
}: {
  farmer: FarmerRecord;
  onClose: () => void;
  onUpdated: (f: FarmerRecord) => void;
}) {
  const [lang, setLang]               = useState<LangCode>("mr");
  const [customPhoto, setCustomPhoto]  = useState<string | null>(null);
  const [saving, setSaving]            = useState<string | null>(null);
  const [modalStep, setModalStep]      = useState<"review" | "verify">("review");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [docImages, setDocImages]      = useState<Record<string, { base64: string; mimeType: string }>>({});
  const [airavataAnim, setAiravataAnim] = useState<object | null>(null);
  const [resolvedIssueIds, setResolvedIssueIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/animations/airavata-sidebar.json").then(r => r.json()).then(setAiravataAnim).catch(() => {});
  }, []);

  useEffect(() => {
    if (!farmer.farmerId) return;
    fetch(`/api/farmers/${farmer.farmerId}/documents`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: { documents: { docType: string; base64: string; mimeType: string }[] }) => {
        const map: Record<string, { base64: string; mimeType: string }> = {};
        for (const d of data.documents ?? []) map[d.docType] = { base64: d.base64, mimeType: d.mimeType };
        setDocImages(map);
      })
      .catch(() => {});
  }, [farmer.farmerId]);

  const docStates: DocStates = useMemo(() => {
    const states = Object.fromEntries(DOC_CARDS.map(c => [c.id, { ...DEFAULT_STATE }])) as DocStates;
    if (farmer.extractionData) {
      for (const [docId, saved] of Object.entries(farmer.extractionData)) {
        states[docId as DocTypeId] = {
          status: "complete",
          filename: saved.filename ?? "",
          requestId: null,
          sections: Array.isArray(saved.sections) ? saved.sections : [],
          images: null,
          rawTables: Array.isArray(saved.rawTables) ? saved.rawTables : [],
          textBlocks: Array.isArray(saved.textBlocks) ? saved.textBlocks : [],
          aadharPhoto: saved.aadharPhoto ?? null,
          error: null,
        };
      }
    }
    return states;
  }, [farmer]);

  const initialProfile: FarmerProfile = useMemo(() => {
    if (farmer.farmerProfile) return farmer.farmerProfile as unknown as FarmerProfile;
    const base: FarmerProfile = {
      ...EMPTY_PROFILE,
      name: farmer.name ?? "",
      village: farmer.village ?? "",
      taluka: farmer.taluka ?? "",
      district: farmer.district ?? "",
      aadhaar: farmer.aadhaar ?? "",
      khateNumber: farmer.khateNumber ?? "",
      surveyNumber: farmer.surveyNumber ?? "",
      land: String(farmer.land ?? ""),
      crop: farmer.crop ?? "",
      bankAccount: farmer.bankAccount ?? "",
    };
    const extracted = extractProfileFromStates(docStates);
    (Object.keys(extracted) as (keyof FarmerProfile)[]).forEach((k) => {
      if (!base[k] && extracted[k]) base[k] = extracted[k]!;
    });
    return base;
  }, [farmer, docStates]);

  const [profile, setProfile] = useState<FarmerProfile>(initialProfile);

  const handleProfileChange = (field: keyof FarmerProfile, value: string) => {
    setProfile(p => ({ ...p, [field]: value }));
  };

  const completedCards = DOC_CARDS.filter(c => docStates[c.id].status === "complete");
  const [activeTab, setActiveTab] = useState<DocTypeId | "profile">(
    completedCards.length > 0 ? completedCards[0].id : "profile"
  );

  /* Aadhaar photo for header */
  const aadharPhoto = docStates["aadhar"]?.aadharPhoto ?? null;
  const photoSrc = aadharPhoto
    ? `data:${aadharPhoto.mimeType};base64,${aadharPhoto.base64}`
    : null;

  /* AI Summary issues */
  const allIssues = useMemo(() => analyzeDocuments(docStates), [docStates]);
  const activeIssues = allIssues.filter(i => !resolvedIssueIds.has(i.id));
  const issueCount = activeIssues.length;

  const handleUpdateStatus = async (status: FarmerRecord["status"], rejectionReason?: string) => {
    setSaving(status);
    try {
      const payload: Partial<FarmerRecord> = {
        status,
        farmerProfile: profile as unknown as Record<string, string>,
        name: profile.name || farmer.name,
        village: profile.village || farmer.village,
        taluka: profile.taluka || farmer.taluka,
        district: profile.district || farmer.district,
        khateNumber: profile.khateNumber || farmer.khateNumber,
      };
      if (rejectionReason) payload.rejectionReason = rejectionReason;
      const updated = await apiUpdateFarmer(farmer.farmerId, payload);
      onUpdated(updated);
      onClose();
    } catch { setSaving(null); }
  };

  const handleRejectConfirm = async (reason: string) => {
    setShowRejectDialog(false);
    await handleUpdateStatus("Cancelled", reason);
  };

  const isPending   = farmer.status === "Pending";
  const isVerified  = farmer.status === "Verified";
  const isCancelled = farmer.status === "Cancelled";

  /* Detail chips for header */
  const detailChips = [
    { label: "ID",          value: farmer.farmerId },
    { label: "आधार",        value: farmer.aadhaar  && farmer.aadhaar !== "—" ? farmer.aadhaar : null },
    { label: "गाव",         value: farmer.village  && farmer.village !== "—" ? farmer.village : null },
    { label: "तालुका",      value: farmer.taluka   && farmer.taluka !== "—"  ? farmer.taluka  : null },
    { label: "जिल्हा",      value: farmer.district && farmer.district !== "—"? farmer.district: null },
    { label: "खाते क्र.",   value: farmer.khateNumber && farmer.khateNumber !== "—" ? farmer.khateNumber : null },
    { label: "भूमापन क्र.", value: farmer.surveyNumber && farmer.surveyNumber !== "—" ? farmer.surveyNumber : null },
  ].filter(c => c.value);

  const poppins = { fontFamily: "Poppins, sans-serif" } as const;

  const content = (
    <div className="fixed inset-0 bg-background flex flex-col" style={{ zIndex: 9999 }}>

      {/* Rejection reason dialog */}
      {showRejectDialog && (
        <RejectReasonDialog onCancel={() => setShowRejectDialog(false)} onConfirm={handleRejectConfirm} saving={!!saving} />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-4">

          {/* Aadhaar photo or placeholder avatar */}
          {photoSrc ? (
            <img src={photoSrc} alt="Aadhaar photo"
              className="w-14 h-14 rounded-full object-cover border-2 border-black/20 shadow flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-200 border-2 border-black/20 flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-7 w-7 text-black/40" />
            </div>
          )}

          {/* Name + detail chips */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h2 className="font-bold text-lg text-black" style={poppins}>{farmer.name}</h2>
              <StatusBadge status={farmer.status} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {detailChips.map(chip => (
                <span key={chip.label}
                  className="inline-flex items-center gap-1 text-[11px] bg-gray-100 border border-black/15 rounded-md px-2 py-0.5 text-black font-medium"
                  style={poppins}>
                  <span className="text-black/50 font-normal">{chip.label}:</span>
                  <span className="font-semibold">{chip.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
          <X className="h-5 w-5 text-black" />
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-border bg-muted/30 flex-shrink-0 overflow-x-auto">
        {completedCards.map(card => (
          <button key={card.id} onClick={() => setActiveTab(card.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === card.id ? "bg-black text-white" : "text-black hover:bg-gray-200"
            }`} style={poppins}>
            <DocTabIcon id={card.id} />
            {DOC_CARD_SHORT[card.id]?.["en"] ?? card.id}
          </button>
        ))}
        <button onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === "profile" ? "bg-black text-white" : "text-black hover:bg-gray-200"
          }`} style={poppins}>
          <UserCheck className="h-3.5 w-3.5 flex-shrink-0" />
          Farmer Profile
          {issueCount > 0 && (
            <span className="ml-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 bg-red-600 text-white">
              {issueCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-y-auto p-6 bg-background">

        {/* No docs uploaded */}
        {completedCards.length === 0 && activeTab !== "profile" && (
          <div className="flex flex-col items-center justify-center py-20 text-black gap-3">
            <BookOpen className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium text-black">No documents saved for this farmer.</p>
            <p className="text-xs text-black/50">Documents were not uploaded during registration.</p>
          </div>
        )}

        {/* Document tab content */}
        {activeTab !== "profile" && docStates[activeTab as DocTypeId]?.status === "complete" && (
          <DocContentView
            state={docStates[activeTab as DocTypeId]}
            docId={activeTab as DocTypeId}
            lang={lang}
            rawDocImage={docImages[activeTab as string] ?? null}
          />
        )}

        {/* Farmer Profile tab — two-column layout with AI Summary */}
        {activeTab === "profile" && (
          <div className="flex gap-5 items-start">
            {/* Profile card */}
            <div className="flex-1 min-w-0">
              <FarmerProfileCard
                docStates={docStates}
                profile={profile}
                onChange={handleProfileChange}
                onApprove={() => {}}
                approved={false}
                onBack={() => setActiveTab(completedCards[0]?.id ?? "profile")}
                lang={lang}
                onLangChange={setLang}
                customPhoto={customPhoto}
                onCustomPhotoChange={setCustomPhoto}
                hideFooter={true}
                extraDocImages={Object.fromEntries(
                  Object.entries(docImages).map(([k, v]) => [k, `data:${v.mimeType};base64,${v.base64}`])
                )}
              />
            </div>

            {/* AI Summary side panel */}
            <div className="w-72 flex-shrink-0 sticky top-0 max-h-[calc(100vh-220px)] overflow-y-auto pb-4">
              {/* Airavata Intelligence header */}
              <div className="flex items-center gap-2 mb-3">
                {airavataAnim && (
                  <Lottie animationData={airavataAnim} loop style={{ width: 58, height: 58, flexShrink: 0 }} />
                )}
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: "13px", fontWeight: 500, letterSpacing: "0.13em", color: "#D97706" }}
                    className="uppercase leading-tight">AIRAVATA INTELLIGENCE</p>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: "11px", fontWeight: 500, color: "#000000" }}
                    className="leading-tight">AI SUMMARY</p>
                </div>
                {issueCount > 0 && (
                  <span className="ml-auto min-w-[20px] h-[20px] flex items-center justify-center rounded-full text-[11px] font-bold px-1 bg-red-600 text-white">
                    {issueCount}
                  </span>
                )}
              </div>

              <AiSummaryPanel
                docStates={docStates}
                resolvedIds={resolvedIssueIds}
                onResolve={(id) => setResolvedIssueIds(prev => new Set([...prev, id]))}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Footer actions ── */}
      <div className="flex-shrink-0 border-t border-border bg-card px-6 py-4">

        {/* Pending — step 1 */}
        {isPending && modalStep === "review" && (
          <div className="flex items-center gap-3 justify-between flex-wrap gap-y-2">
            <p className="text-sm text-black font-medium" style={poppins}>Review all documents and farmer profile before deciding.</p>
            <button onClick={() => setModalStep("verify")} disabled={!!saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
              style={poppins}>
              <CheckCircle2 className="h-4 w-4" /> Accept Farmer
            </button>
          </div>
        )}

        {/* Pending — step 2: confirm */}
        {isPending && modalStep === "verify" && (
          <div className="flex items-center gap-3 justify-between flex-wrap gap-y-2">
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              Farmer accepted — verify data and approve, or reject if any issue is found.
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setModalStep("review")} disabled={!!saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-black/20 bg-white text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 text-black">
                Back
              </button>
              <button onClick={() => setShowRejectDialog(true)} disabled={!!saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50">
                {saving === "Cancelled" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject
              </button>
              <button onClick={() => handleUpdateStatus("Verified")} disabled={!!saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#14532D] hover:bg-[#14532D]/90 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                style={poppins}>
                {saving === "Verified" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Approve Verification
              </button>
            </div>
          </div>
        )}

        {/* Verified */}
        {isVerified && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border bg-emerald-50 border-emerald-300 text-emerald-700">
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
              This farmer has been verified and approved.
            </div>
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-black/20 bg-white text-sm font-medium hover:bg-gray-100 transition-colors text-black">
              Close
            </button>
          </div>
        )}

        {/* Cancelled */}
        {isCancelled && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border bg-red-50 border-red-300 text-red-700">
                <XCircle className="h-4 w-4 flex-shrink-0" />
                This farmer registration was rejected.
              </div>
              {farmer.rejectionReason && (
                <div className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg border bg-red-50/50 border-red-100 text-black max-w-lg">
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span><strong>Reason:</strong> {farmer.rejectionReason}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => handleUpdateStatus("Pending")} disabled={!!saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-800 text-sm font-medium hover:bg-yellow-100 transition-colors disabled:opacity-50">
                {saving === "Pending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Restore to Pending
              </button>
              <button onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-black/20 bg-white text-sm font-medium hover:bg-gray-100 transition-colors text-black">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
