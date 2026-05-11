import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Search, Plus, Upload, Download, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { apiFetchFarmers, type FarmerRecord } from "@/data/farmerApi";
import FarmerRegistrationForm from "@/components/forms/FarmerRegistrationForm";
import FarmerDetailModal from "@/components/modules/FarmerDetailModal";
import FarmerReviewModal from "@/components/modules/FarmerReviewModal";

import iconVerified from "/icon-verified.png";
import iconPending from "/icon-pending.png";
import iconRejected from "/icon-rejected.png";
import iconSystem from "/icon-system.png";
import iconMobile from "/icon-mobile.png";
import iconReview from "/icon-review.png";
import iconView from "/icon-view.png";

/* ── Helpers ─────────────────────────────────────────── */

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getFullYear()).slice(-2)}`;
  } catch { return "—"; }
}

function daysSince(dateStr: string | undefined): number {
  if (!dateStr) return 0;
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 0 : Math.floor((Date.now() - d.getTime()) / 86_400_000);
  } catch { return 0; }
}

function getPriority(farmer: FarmerRecord): { label: "High"|"Mid"|"Low"; days: number; bg: string } | null {
  if (farmer.status !== "Pending") return null;
  const days = daysSince(farmer.addedAt);
  if (days > 7)  return { label:"High", days, bg:"bg-red-600" };
  if (days >= 3) return { label:"Mid",  days, bg:"bg-orange-500" };
  return { label:"Low", days, bg:"bg-green-600" };
}

/* ── Typewriter hook ─────────────────────────────────── */
const HINTS = [
  "Search by Name...",
  "Search by Aadhaar...",
  "Search by Khate Kramank...",
  "Search by Farmer ID...",
];

function useTypewriter() {
  const [display, setDisplay] = useState("");
  const idx   = useRef(0);
  const chr   = useRef(0);
  const deleting = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function tick() {
      const word = HINTS[idx.current];
      if (!deleting.current) {
        chr.current++;
        setDisplay(word.slice(0, chr.current));
        if (chr.current === word.length) {
          deleting.current = true;
          timer = setTimeout(tick, 1400);
        } else {
          timer = setTimeout(tick, 68);
        }
      } else {
        chr.current--;
        setDisplay(word.slice(0, chr.current));
        if (chr.current === 0) {
          deleting.current = false;
          idx.current = (idx.current + 1) % HINTS.length;
          timer = setTimeout(tick, 350);
        } else {
          timer = setTimeout(tick, 38);
        }
      }
    }
    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, []);

  return display;
}

/* ── Stat card ───────────────────────────────────────── */
type ActiveCard = "all"|"verified"|"pending"|"rejected"|"system"|"mobile";

function StatCard({ label, count, icon, cardKey, active, onClick, accent }:
  { label:string; count:number; icon:string; cardKey:ActiveCard; active:boolean; onClick:(k:ActiveCard)=>void; accent:string }) {
  return (
    <button onClick={() => onClick(cardKey)}
      className={`flex-1 min-w-[140px] bg-white rounded-xl border-2 p-4 flex items-center gap-4 text-left transition-all hover:shadow-md cursor-pointer ${active ? `${accent} shadow-md` : "border-black/10 hover:border-black/20"}`}>
      <img src={icon} alt={label} className="w-12 h-12 object-contain flex-shrink-0" />
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none" style={{fontFamily:"Poppins,sans-serif"}}>{count}</p>
        <p className="text-xs font-medium text-gray-500 mt-1 leading-snug" style={{fontFamily:"Poppins,sans-serif"}}>{label}</p>
        {active && <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-1">Filtered ✓</p>}
      </div>
    </button>
  );
}

/* ── Main component ──────────────────────────────────── */
export default function FarmerRegistry({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const { addNotification } = useNotifications();
  const [farmers, setFarmers]         = useState<FarmerRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [search, setSearch]           = useState("");
  const [gavFilter, setGavFilter]     = useState("");
  const [talukaFilter, setTalukaFilter] = useState("");
  const [distFilter, setDistFilter]   = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [page, setPage]               = useState(0);
  const [showAdd, setShowAdd]         = useState(false);
  const [viewFarmer, setViewFarmer]   = useState<FarmerRecord | null>(null);
  const [reviewFarmer, setReviewFarmer] = useState<FarmerRecord | null>(null);
  const [toast, setToast]             = useState("");
  const [activeCard, setActiveCard]   = useState<ActiveCard>("all");
  const placeholder = useTypewriter();

  const loadFarmers = useCallback(async () => {
    try {
      setError("");
      const data = await apiFetchFarmers();
      setFarmers(data);
    } catch { setError("Failed to load farmers. Please try again."); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { loadFarmers(); }, [loadFarmers]);
  useEffect(() => {
    const h = () => loadFarmers();
    window.addEventListener("farmer-registry-changed", h);
    return () => window.removeEventListener("farmer-registry-changed", h);
  }, [loadFarmers]);
  useEffect(() => { const t = setInterval(loadFarmers, 15000); return () => clearInterval(t); }, [loadFarmers]);

  /* unique filter options */
  const gavs    = useMemo(() => [...new Set(farmers.map(f => f.village).filter(Boolean))].sort(), [farmers]);
  const talukas = useMemo(() => [...new Set(farmers.map(f => f.taluka).filter(Boolean))].sort() as string[], [farmers]);
  const dists   = useMemo(() => [...new Set(farmers.map(f => f.district).filter(Boolean))].sort(), [farmers]);

  /* counts for cards */
  const counts = useMemo(() => ({
    verified: farmers.filter(f => f.status==="Verified"||f.status==="Active").length,
    pending:  farmers.filter(f => f.status==="Pending").length,
    rejected: farmers.filter(f => f.status==="Cancelled"||f.status==="Inactive").length,
    system:   farmers.filter(f => f.source!=="mobile_ocr").length,
    mobile:   farmers.filter(f => f.source==="mobile_ocr").length,
  }), [farmers]);

  const handleCardClick = (key: ActiveCard) => {
    setActiveCard(prev => prev === key ? "all" : key);
    setPage(0);
  };

  const filtered = useMemo(() => {
    return farmers.filter(f => {
      const s = search.toLowerCase();
      const matchSearch = !s || f.name.toLowerCase().includes(s) || f.farmerId.toLowerCase().includes(s) || f.aadhaar.includes(s) || (f.khateNumber||"").toLowerCase().includes(s);
      const matchGav    = !gavFilter    || f.village === gavFilter;
      const matchTaluka = !talukaFilter || f.taluka  === talukaFilter;
      const matchDist   = !distFilter   || f.district === distFilter;
      const pr = getPriority(f);
      const matchPriority = !priorityFilter || (pr?.label === priorityFilter);
      let matchCard = true;
      if (activeCard==="verified") matchCard = f.status==="Verified"||f.status==="Active";
      else if (activeCard==="pending")  matchCard = f.status==="Pending";
      else if (activeCard==="rejected") matchCard = f.status==="Cancelled"||f.status==="Inactive";
      else if (activeCard==="system")   matchCard = f.source!=="mobile_ocr";
      else if (activeCard==="mobile")   matchCard = f.source==="mobile_ocr";
      return matchSearch && matchGav && matchTaluka && matchDist && matchPriority && matchCard;
    });
  }, [search, gavFilter, talukaFilter, distFilter, priorityFilter, activeCard, farmers]);

  const totalPages = Math.ceil(filtered.length / 10);
  const pageData   = filtered.slice(page * 10, (page + 1) * 10);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleFarmerDeleted = (id: string) => {
    setFarmers(prev => prev.filter(f => f.farmerId !== id));
    setViewFarmer(null); showToast("Farmer deleted successfully");
  };

  const handleFarmerUpdated = (updated: FarmerRecord) => {
    setFarmers(prev => prev.map(f => f.farmerId===updated.farmerId ? updated : f));
    setViewFarmer(null);
    showToast(`Farmer ${updated.status==="Verified"?"verified ✓":updated.status==="Cancelled"?"rejected":"updated"}`);
    if (updated.status==="Verified")   addNotification({ type:"farmer", title:"Farmer Verified",      body:`${updated.name} (${updated.farmerId}) verified.`,  farmerName:updated.name, farmerId:updated.farmerId });
    if (updated.status==="Cancelled")  addNotification({ type:"system", title:"Registration Cancelled", body:`${updated.name} (${updated.farmerId}) cancelled.`, farmerName:updated.name, farmerId:updated.farmerId });
  };

  const handleReviewUpdated = (updated: FarmerRecord) => {
    setFarmers(prev => prev.map(f => f.farmerId===updated.farmerId ? updated : f));
    setReviewFarmer(null);
    showToast(updated.status==="Verified" ? "Farmer verification approved ✓" : "Farmer registration cancelled");
    if (updated.status==="Verified")   addNotification({ type:"farmer", title:"Farmer Verified ✓",    body:`${updated.name} (${updated.farmerId}) passed verification.`, farmerName:updated.name, farmerId:updated.farmerId });
    if (updated.status==="Cancelled")  addNotification({ type:"system", title:"Registration Rejected", body:`${updated.name} (${updated.farmerId}) was rejected.`,        farmerName:updated.name, farmerId:updated.farmerId });
  };

  const handleRegistrationSuccess = (msg:string, farmerName?:string, farmerId?:string) => {
    showToast(msg); loadFarmers();
    addNotification({ type:"farmer", title:"New Farmer Registered", body:farmerName?`${farmerName} (${farmerId}) registered.`:msg, farmerName, farmerId });
  };

  const poppins = { fontFamily: "Poppins, sans-serif" } as const;

  return (
    <div className="space-y-5 animate-fade-in" style={{ opacity:0, ...poppins }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in" style={{opacity:0}}>
          {toast}
        </div>
      )}

      {/* ── Page title + action buttons ── */}
      <div className="flex items-center justify-between gap-4 mb-1">
        <h1 className="font-heading text-2xl font-bold text-black" style={{fontFamily:"DM Serif Display, serif"}}>Farmer Registry</h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onNavigate ? onNavigate("newregistration") : setShowAdd(true)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 font-medium whitespace-nowrap">
            <Plus className="h-4 w-4" /> Add Farmer
          </button>
          <button onClick={() => showToast("✅ CSV imported successfully — 24 records added")}
            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-black font-medium whitespace-nowrap">
            <Upload className="h-4 w-4" /> Import
          </button>
          <button onClick={() => showToast("📁 Export started...")}
            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-black font-medium whitespace-nowrap">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* ── 5 Stat Cards ── */}
      <div className="flex flex-wrap gap-3">
        <StatCard cardKey="verified" label="Verified Farmers"     count={counts.verified} icon={iconVerified} active={activeCard==="verified"} onClick={handleCardClick} accent="border-emerald-500" />
        <StatCard cardKey="pending"  label="Pending Review"       count={counts.pending}  icon={iconPending}  active={activeCard==="pending"}  onClick={handleCardClick} accent="border-yellow-500" />
        <StatCard cardKey="rejected" label="Rejected / Cancelled" count={counts.rejected} icon={iconRejected} active={activeCard==="rejected"} onClick={handleCardClick} accent="border-red-500"     />
        <StatCard cardKey="system"   label="Via System Admin"     count={counts.system}   icon={iconSystem}   active={activeCard==="system"}   onClick={handleCardClick} accent="border-blue-500"    />
        <StatCard cardKey="mobile"   label="Via Farmer Mobile App" count={counts.mobile}  icon={iconMobile}   active={activeCard==="mobile"}   onClick={handleCardClick} accent="border-purple-500"  />
      </div>

      {/* ── Search + Filters row ── */}
      <div className="flex flex-wrap gap-2 items-center">

        {/* Pill search */}
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

        {/* गाव filter */}
        <select value={gavFilter} onChange={e => { setGavFilter(e.target.value); setPage(0); }}
          className="text-[13px] bg-white border border-gray-300 rounded-full px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-secondary/40" style={poppins}>
          <option value="">गाव</option>
          {gavs.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        {/* तालुका filter */}
        <select value={talukaFilter} onChange={e => { setTalukaFilter(e.target.value); setPage(0); }}
          className="text-[13px] bg-white border border-gray-300 rounded-full px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-secondary/40" style={poppins}>
          <option value="">तालुका</option>
          {talukas.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* जिल्हा filter */}
        <select value={distFilter} onChange={e => { setDistFilter(e.target.value); setPage(0); }}
          className="text-[13px] bg-white border border-gray-300 rounded-full px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-secondary/40" style={poppins}>
          <option value="">जिल्हा</option>
          {dists.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Priority filter */}
        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(0); }}
          className="text-[13px] bg-white border border-gray-300 rounded-full px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-secondary/40" style={poppins}>
          <option value="">Priority</option>
          <option value="High">High</option>
          <option value="Mid">Mid</option>
          <option value="Low">Low</option>
        </select>

        {/* Clear filter button */}
        {(activeCard !== "all" || gavFilter || talukaFilter || distFilter || priorityFilter || search) && (
          <button onClick={() => { setActiveCard("all"); setGavFilter(""); setTalukaFilter(""); setDistFilter(""); setPriorityFilter(""); setSearch(""); setPage(0); }}
            className="text-[13px] px-4 py-2 rounded-full bg-gray-100 border border-gray-200 hover:bg-gray-200 text-black" style={poppins}>
            Clear ×
          </button>
        )}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm" style={poppins}>Loading farmers...</span>
        </div>
      )}
      {error && !loading && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={loadFarmers} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && !error && (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={poppins}>
              <thead>
                <tr className="bg-white border-b-2 border-black text-left">
                  {["नोंदणी दिनांक","शेतकरी ID","नाव","गाव","तालुका","जिल्हा","खाते क्र.","भूमापन क्र.","Source","Priority","Status","Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-black whitespace-nowrap border-r border-black/20 last:border-r-0">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((f, idx) => {
                  const priority  = getPriority(f);
                  const isMobile  = f.source === "mobile_ocr";
                  const isVerified = f.status === "Verified" || f.status === "Active";
                  const isPending  = f.status === "Pending";
                  const isCancelled = f.status === "Cancelled" || f.status === "Inactive";

                  return (
                    <tr key={f.farmerId}
                      className={`bg-white hover:bg-gray-50 transition-colors ${idx < pageData.length-1 ? "border-b border-black/15" : ""}`}>

                      {/* Date */}
                      <td className="px-4 py-3 text-[13px] text-black font-mono whitespace-nowrap border-r border-black/10">{formatDate(f.addedAt)}</td>

                      {/* Farmer ID */}
                      <td className="px-4 py-3 text-[13px] text-black font-mono whitespace-nowrap border-r border-black/10">{f.farmerId}</td>

                      {/* Name */}
                      <td className="px-4 py-3 text-[13px] font-semibold text-black whitespace-nowrap border-r border-black/10">{f.name}</td>

                      {/* गाव */}
                      <td className="px-4 py-3 text-[13px] text-black">{f.village || <span className="text-gray-300">—</span>}</td>

                      {/* तालुका */}
                      <td className="px-4 py-3 text-[13px] text-black border-r border-black/10">{f.taluka  || <span className="text-gray-300">—</span>}</td>

                      {/* जिल्हा */}
                      <td className="px-4 py-3 text-[13px] text-black border-r border-black/10">{f.district|| <span className="text-gray-300">—</span>}</td>

                      {/* खाते क्रमांक */}
                      <td className="px-4 py-3 text-[13px] text-black font-mono border-r border-black/10">
                        {f.khateNumber && f.khateNumber !== "—" ? f.khateNumber : <span className="text-gray-300">—</span>}
                      </td>

                      {/* भूमापन क्रमांक */}
                      <td className="px-4 py-3 text-[13px] text-black font-mono border-r border-black/10">
                        {f.surveyNumber && f.surveyNumber !== "—" ? f.surveyNumber : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3 border-r border-black/10">
                        <span className={`inline-block text-[12px] px-3 py-1 rounded-full font-semibold text-white whitespace-nowrap ${isMobile ? "bg-purple-600" : "bg-blue-600"}`}>
                          {isMobile ? "Mobile" : "System"}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3 border-r border-black/10">
                        {priority ? (
                          <span className={`inline-block text-[12px] px-3 py-1 rounded-full font-semibold text-white whitespace-nowrap ${priority.bg}`}>
                            {priority.label} · {priority.days}d
                          </span>
                        ) : <span className="text-gray-300 text-[13px]">—</span>}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 border-r border-black/10">
                        {isVerified  && <span className="inline-block text-[12px] px-3 py-1 rounded-full font-semibold text-white bg-emerald-600 whitespace-nowrap">Verified</span>}
                        {isPending   && <span className="inline-block text-[12px] px-3 py-1 rounded-full font-semibold text-white bg-amber-500 whitespace-nowrap">Pending</span>}
                        {isCancelled && <span className="inline-block text-[12px] px-3 py-1 rounded-full font-semibold text-white bg-red-600 whitespace-nowrap">Rejected</span>}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        {isPending && (
                          <button onClick={() => setReviewFarmer(f)}
                            className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full font-semibold text-white bg-[#14532D] hover:opacity-85 transition-opacity whitespace-nowrap">
                            <img src={iconReview} alt="" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
                            Review
                          </button>
                        )}
                        {(isVerified || isCancelled) && (
                          <button onClick={() => setReviewFarmer(f)}
                            className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full font-semibold text-white transition-opacity whitespace-nowrap hover:opacity-85 ${isVerified ? "bg-blue-600" : "bg-gray-500"}`}>
                            <img src={iconView} alt="" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {pageData.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-[13px] text-gray-400" style={poppins}>
                      No farmers found matching your filters.
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
                ? `Showing ${page*10+1}–${Math.min((page+1)*10, filtered.length)} of ${filtered.length}`
                : "No results"}
              {activeCard !== "all" && <span className="ml-1 text-gray-400">(filtered)</span>}
            </span>
            <div className="flex gap-1">
              <button disabled={page===0} onClick={() => setPage(p => p-1)} className="p-1.5 rounded-full hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30">
                <ChevronLeft className="h-4 w-4 text-black" />
              </button>
              <button disabled={page>=totalPages-1} onClick={() => setPage(p => p+1)} className="p-1.5 rounded-full hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30">
                <ChevronRight className="h-4 w-4 text-black" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {reviewFarmer && <FarmerReviewModal farmer={reviewFarmer} onClose={() => setReviewFarmer(null)} onUpdated={handleReviewUpdated} />}
      {viewFarmer   && (
        <FarmerDetailModal farmer={viewFarmer} onClose={() => setViewFarmer(null)} onDeleted={handleFarmerDeleted}
          onUpdated={(updated) => { setFarmers(prev => prev.map(f => f.farmerId===updated.farmerId?updated:f)); setViewFarmer(updated); }} />
      )}
      {showAdd && <FarmerRegistrationForm onClose={() => setShowAdd(false)} onSuccess={handleRegistrationSuccess} />}
    </div>
  );
}
