import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, ChevronDown,
  FileText, LifeBuoy, IndianRupee, Shield,
} from "lucide-react";
import iconView from "/icon-view.png";
import { apiFetchFarmers, type FarmerRecord } from "@/data/farmerApi";
import VerifiedFarmerCard from "@/components/modules/VerifiedFarmerCard";
import {
  SchemeApplicationsPage,
  InsuranceApplicationsPage,
  SubsidyApplicationsPage,
  GrievancesPage,
  DocumentsPage,
  AllApplicationsPage,
} from "@/components/modules/FarmerSubPages";

/* ── helpers ──────────────────────────────── */
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
  } catch { return "—"; }
}

/* ── Typewriter hook ──────────────────────── */
const HINTS = ["Search by Name...", "Search by Aadhaar...", "Search by Farmer ID...", "Search by Village..."];
function useTypewriter() {
  const [display, setDisplay] = useState("");
  const idx      = useRef(0);
  const chr      = useRef(0);
  const deleting = useRef(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function tick() {
      const word = HINTS[idx.current];
      if (!deleting.current) {
        chr.current++;
        setDisplay(word.slice(0, chr.current));
        if (chr.current === word.length) { deleting.current = true; timer = setTimeout(tick, 1400); }
        else timer = setTimeout(tick, 68);
      } else {
        chr.current--;
        setDisplay(word.slice(0, chr.current));
        if (chr.current === 0) { deleting.current = false; idx.current = (idx.current + 1) % HINTS.length; timer = setTimeout(tick, 350); }
        else timer = setTimeout(tick, 38);
      }
    }
    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, []);
  return display;
}

/* ── Sub-page types ───────────────────────── */
type SubPageKey = "scheme_apps" | "insurance_apps" | "subsidy_apps" | "applications" | "grievances" | "documents";
const SUB_PAGE_META: Record<SubPageKey, { label: string; icon: React.ReactNode }> = {
  scheme_apps:    { label: "Scheme Applications",    icon: <Shield      className="h-4 w-4" /> },
  insurance_apps: { label: "Insurance Applications", icon: <LifeBuoy    className="h-4 w-4" /> },
  subsidy_apps:   { label: "Subsidy Applications",   icon: <IndianRupee className="h-4 w-4" /> },
  applications:   { label: "Applications",           icon: <Shield      className="h-4 w-4" /> },
  grievances:     { label: "Grievances",             icon: <AlertCircle className="h-4 w-4" /> },
  documents:      { label: "Documents",              icon: <FileText    className="h-4 w-4" /> },
};

/* ── Sub-page wrapper ─────────────────────── */
function SubPageView({ farmer, subPage }: { farmer: FarmerRecord; subPage: SubPageKey }) {
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [subPage]);
  const meta = SUB_PAGE_META[subPage];
  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="border-b border-border px-6 py-4 flex items-center gap-3 bg-slate-50/70">
        <span className="text-secondary">{meta.icon}</span>
        <div>
          <h2 className="font-bold text-base text-foreground">{meta.label}</h2>
          <p className="text-xs text-muted-foreground">{farmer.name} · {farmer.farmerId}</p>
        </div>
      </div>
      <div className="p-5">
        {subPage === "scheme_apps"    && <SchemeApplicationsPage    farmer={farmer} />}
        {subPage === "insurance_apps" && <InsuranceApplicationsPage farmer={farmer} />}
        {subPage === "subsidy_apps"   && <SubsidyApplicationsPage   farmer={farmer} />}
        {subPage === "applications"   && <AllApplicationsPage       farmer={farmer} />}
        {subPage === "grievances"     && <GrievancesPage            farmer={farmer} />}
        {subPage === "documents"      && <DocumentsPage             farmer={farmer} />}
      </div>
    </div>
  );
}

const poppinsCss = { fontFamily: "Poppins, sans-serif" } as const;
const dmSerif   = { fontFamily: "DM Serif Display, serif" } as const;

/* ── Profile page view ────────────────────── */
function ProfileView({ farmer, onBack, onNavigate }: {
  farmer: FarmerRecord; onBack: () => void; onNavigate: (key: string) => void;
}) {
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  return (
    <div>
      <div className="flex justify-end mb-5">
        <button onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#14532D] px-4 py-2 rounded-xl transition-all flex-shrink-0"
          style={poppinsCss}>
          <ChevronLeft className="h-4 w-4" /> Back to Farmers
        </button>
      </div>
      <VerifiedFarmerCard farmer={farmer} onNavigate={onNavigate} />
    </div>
  );
}

/* ── Breadcrumb ───────────────────────────── */
function Breadcrumb({ farmer, subPage, onBack, onBackToProfile }: {
  farmer: FarmerRecord; subPage: SubPageKey | null; onBack: () => void; onBackToProfile: () => void;
}) {
  return (
    <div className="flex justify-end mb-5">
      <button onClick={subPage ? onBackToProfile : onBack}
        className="flex items-center gap-2 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#14532D] px-4 py-2 rounded-xl transition-all flex-shrink-0"
        style={poppinsCss}>
        <ChevronLeft className="h-4 w-4" />
        {subPage ? `Back to ${farmer.name.split(" ")[0]}'s Profile` : "Back to Farmers"}
      </button>
    </div>
  );
}

/* ── Main component ───────────────────────── */
export default function VerifiedFarmers() {
  const [farmers, setFarmers]         = useState<FarmerRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [search, setSearch]           = useState("");
  const [gavFilter, setGavFilter]     = useState("");
  const [talukaFilter, setTalukaFilter] = useState("");
  const [distFilter, setDistFilter]   = useState("");
  const [khateFilter, setKhateFilter] = useState("");
  const [surveyFilter, setSurveyFilter] = useState("");
  const [page, setPage]               = useState(0);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [subPage, setSubPage]         = useState<SubPageKey | null>(null);
  const placeholder = useTypewriter();

  const poppins = { fontFamily: "Poppins, sans-serif" } as const;

  const loadFarmers = useCallback(async () => {
    try {
      setError("");
      const data = await apiFetchFarmers();
      setFarmers(data.filter(f => f.status === "Verified" || f.status === "Active"));
    } catch { setError("Failed to load farmers. Please try again."); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { loadFarmers(); }, [loadFarmers]);
  useEffect(() => {
    const h = () => loadFarmers();
    window.addEventListener("farmer-registry-changed", h);
    return () => window.removeEventListener("farmer-registry-changed", h);
  }, [loadFarmers]);

  const gavs    = useMemo(() => [...new Set(farmers.map(f => f.village).filter(Boolean))].sort(), [farmers]);
  const talukas = useMemo(() => [...new Set(farmers.map(f => f.taluka).filter(Boolean))].sort() as string[], [farmers]);
  const dists   = useMemo(() => [...new Set(farmers.map(f => f.district).filter(Boolean))].sort(), [farmers]);
  const khates  = useMemo(() => [...new Set(farmers.map(f => f.khateNumber).filter(v => v && v !== "—"))].sort() as string[], [farmers]);
  const surveys = useMemo(() => [...new Set(farmers.map(f => f.surveyNumber).filter(v => v && v !== "—"))].sort() as string[], [farmers]);

  const filtered = useMemo(() => farmers.filter(f => {
    const s = search.toLowerCase();
    const matchSearch  = !s || f.name.toLowerCase().includes(s) || f.farmerId.toLowerCase().includes(s) || f.aadhaar.includes(s) || (f.village || "").toLowerCase().includes(s);
    const matchGav     = !gavFilter    || f.village === gavFilter;
    const matchTaluka  = !talukaFilter || f.taluka  === talukaFilter;
    const matchDist    = !distFilter   || f.district === distFilter;
    const matchKhate   = !khateFilter  || f.khateNumber === khateFilter;
    const matchSurvey  = !surveyFilter || f.surveyNumber === surveyFilter;
    return matchSearch && matchGav && matchTaluka && matchDist && matchKhate && matchSurvey;
  }), [search, gavFilter, talukaFilter, distFilter, khateFilter, surveyFilter, farmers]);

  const totalPages = Math.ceil(filtered.length / 10);
  const pageData   = filtered.slice(page * 10, (page + 1) * 10);

  const selectedFarmer = farmers.find(f => f.farmerId === selectedId) ?? null;

  const handleNavigate    = useCallback((key: string) => { setSubPage(key as SubPageKey); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  const handleBackToGrid  = useCallback(() => { setSelectedId(null); setSubPage(null); }, []);
  const handleBackToProfile = useCallback(() => { setSubPage(null); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  const hasFilters = !!(search || gavFilter || talukaFilter || distFilter || khateFilter || surveyFilter);
  const clearFilters = () => { setSearch(""); setGavFilter(""); setTalukaFilter(""); setDistFilter(""); setKhateFilter(""); setSurveyFilter(""); setPage(0); };

  /* ── Loading ── */
  if (loading) return (
    <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="text-sm" style={poppins}>Loading verified farmers...</span>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <span>{error}</span>
      <button onClick={loadFarmers} className="ml-auto text-xs underline">Retry</button>
    </div>
  );

  /* ── Sub-page (level 3) ── */
  if (selectedFarmer && subPage) return (
    <div>
      <Breadcrumb farmer={selectedFarmer} subPage={subPage} onBack={handleBackToGrid} onBackToProfile={handleBackToProfile} />
      <SubPageView farmer={selectedFarmer} subPage={subPage} />
    </div>
  );

  /* ── Profile page (level 2) ── */
  if (selectedFarmer) return (
    <ProfileView farmer={selectedFarmer} onBack={handleBackToGrid} onNavigate={handleNavigate} />
  );

  /* ── List page (level 1) ── */
  return (
    <div className="space-y-5" style={poppins}>

      {/* ── Search + Filters ── */}
      <div className="flex flex-wrap gap-2 items-center">

        {/* Search pill */}
        <div className="relative w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 text-[13px] bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-secondary/40 text-black"
            style={poppins}
          />
        </div>

        {/* गाव */}
        <div className="relative">
          <select value={gavFilter} onChange={e => { setGavFilter(e.target.value); setPage(0); }}
            className="appearance-none text-[13px] bg-white border border-gray-300 rounded-full pl-4 pr-8 py-2 text-black focus:outline-none focus:ring-2 focus:ring-secondary/40 cursor-pointer" style={poppins}>
            <option value="">गाव</option>
            {gavs.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        </div>

        {/* तालुका */}
        <div className="relative">
          <select value={talukaFilter} onChange={e => { setTalukaFilter(e.target.value); setPage(0); }}
            className="appearance-none text-[13px] bg-white border border-gray-300 rounded-full pl-4 pr-8 py-2 text-black focus:outline-none focus:ring-2 focus:ring-secondary/40 cursor-pointer" style={poppins}>
            <option value="">तालुका</option>
            {talukas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        </div>

        {/* जिल्हा */}
        <div className="relative">
          <select value={distFilter} onChange={e => { setDistFilter(e.target.value); setPage(0); }}
            className="appearance-none text-[13px] bg-white border border-gray-300 rounded-full pl-4 pr-8 py-2 text-black focus:outline-none focus:ring-2 focus:ring-secondary/40 cursor-pointer" style={poppins}>
            <option value="">जिल्हा</option>
            {dists.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        </div>

        {/* खाते क्र. */}
        <div className="relative">
          <select value={khateFilter} onChange={e => { setKhateFilter(e.target.value); setPage(0); }}
            className="appearance-none text-[13px] bg-white border border-gray-300 rounded-full pl-4 pr-8 py-2 text-black focus:outline-none focus:ring-2 focus:ring-secondary/40 cursor-pointer" style={poppins}>
            <option value="">खाते क्र.</option>
            {khates.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        </div>

        {/* भूमापन क्र. */}
        <div className="relative">
          <select value={surveyFilter} onChange={e => { setSurveyFilter(e.target.value); setPage(0); }}
            className="appearance-none text-[13px] bg-white border border-gray-300 rounded-full pl-4 pr-8 py-2 text-black focus:outline-none focus:ring-2 focus:ring-secondary/40 cursor-pointer" style={poppins}>
            <option value="">भूमापन क्र.</option>
            {surveys.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        </div>

        {/* Clear */}
        {hasFilters && (
          <button onClick={clearFilters}
            className="text-[13px] px-4 py-2 rounded-full bg-gray-100 border border-gray-200 hover:bg-gray-200 text-black" style={poppins}>
            Clear ×
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={poppins}>
            <thead>
              <tr className="bg-white border-b-2 border-black text-left">
                {["पडताळणी दिनांक", "शेतकरी ID", "नाव", "गाव", "तालुका", "जिल्हा", "खाते क्र.", "भूमापन क्र.", "आधार क्र.", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-black whitespace-nowrap border-r border-black/20 last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map((f, idx) => (
                <tr key={f.farmerId}
                  className={`bg-white hover:bg-gray-50 transition-colors ${idx < pageData.length - 1 ? "border-b border-black/15" : ""}`}>

                  {/* पडताळणी दिनांक */}
                  <td className="px-4 py-3 text-[13px] text-black font-mono whitespace-nowrap border-r border-black/10">
                    {formatDate((f as FarmerRecord & { verifiedAt?: string }).verifiedAt || f.updatedAt || f.addedAt)}
                  </td>

                  {/* शेतकरी ID */}
                  <td className="px-4 py-3 text-[13px] text-black font-mono whitespace-nowrap border-r border-black/10">{f.farmerId}</td>

                  {/* नाव */}
                  <td className="px-4 py-3 text-[13px] font-semibold text-black whitespace-nowrap border-r border-black/10">{f.name}</td>

                  {/* गाव */}
                  <td className="px-4 py-3 text-[13px] text-black border-r border-black/10">
                    {f.village && f.village !== "—" ? f.village : <span className="text-gray-300">—</span>}
                  </td>

                  {/* तालुका */}
                  <td className="px-4 py-3 text-[13px] text-black border-r border-black/10">
                    {f.taluka && f.taluka !== "—" ? f.taluka : <span className="text-gray-300">—</span>}
                  </td>

                  {/* जिल्हा */}
                  <td className="px-4 py-3 text-[13px] text-black border-r border-black/10">
                    {f.district && f.district !== "—" ? f.district : <span className="text-gray-300">—</span>}
                  </td>

                  {/* खाते क्र. */}
                  <td className="px-4 py-3 text-[13px] text-black font-mono border-r border-black/10">
                    {f.khateNumber && f.khateNumber !== "—" ? f.khateNumber : <span className="text-gray-300">—</span>}
                  </td>

                  {/* भूमापन क्र. */}
                  <td className="px-4 py-3 text-[13px] text-black font-mono border-r border-black/10">
                    {f.surveyNumber && f.surveyNumber !== "—" ? f.surveyNumber : <span className="text-gray-300">—</span>}
                  </td>

                  {/* आधार क्र. */}
                  <td className="px-4 py-3 text-[13px] text-black font-mono border-r border-black/10">
                    {f.aadhaar && f.aadhaar !== "—" ? f.aadhaar : <span className="text-gray-300">—</span>}
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSelectedId(f.farmerId); setSubPage(null); }}
                      className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full font-semibold text-white bg-blue-600 hover:opacity-85 transition-opacity whitespace-nowrap">
                      <img src={iconView} alt="" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}

              {pageData.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-[13px] text-gray-400" style={poppins}>
                    {farmers.length === 0 ? "No verified farmers yet. Verify farmers from the Farmer Registry." : "No farmers match your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t-2 border-black bg-white" style={poppins}>
          <span className="text-[12px] text-black">
            {filtered.length > 0
              ? `Showing ${page * 10 + 1}–${Math.min((page + 1) * 10, filtered.length)} of ${filtered.length}`
              : "No results"}
            {hasFilters && <span className="ml-1 text-gray-400">(filtered)</span>}
          </span>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-full hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30">
              <ChevronLeft className="h-4 w-4 text-black" />
            </button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-full hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30">
              <ChevronRight className="h-4 w-4 text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
