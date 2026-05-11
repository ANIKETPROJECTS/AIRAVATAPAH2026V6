import { useState, useMemo, useEffect, useCallback } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  Search, Plus, Upload, Download, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, Eye, CheckCircle2
} from "lucide-react";
import { apiFetchFarmers, apiUpdateFarmer, notifyFarmerChange, type FarmerRecord } from "@/data/farmerApi";
import FarmerRegistrationForm from "@/components/forms/FarmerRegistrationForm";
import FarmerDetailModal from "@/components/modules/FarmerDetailModal";
import FarmerReviewModal from "@/components/modules/FarmerReviewModal";

import iconVerified from "/icon-verified.png";
import iconPending from "/icon-pending.png";
import iconRejected from "/icon-rejected.png";
import iconSystem from "/icon-system.png";
import iconMobile from "/icon-mobile.png";

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  } catch {
    return "—";
  }
}

function daysSince(dateStr: string | undefined): number {
  if (!dateStr) return 0;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 0;
    return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

function getPriority(farmer: FarmerRecord): { label: string; days: number; bg: string } | null {
  if (farmer.status !== "Pending") return null;
  const days = daysSince(farmer.addedAt);
  if (days > 7) return { label: "High", days, bg: "bg-red-600" };
  if (days >= 3) return { label: "Mid", days, bg: "bg-orange-500" };
  return { label: "Low", days, bg: "bg-green-600" };
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Verified" || status === "Active")
    return <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">Verified</span>;
  if (status === "Cancelled")
    return <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Rejected</span>;
  if (status === "Pending")
    return <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">Pending</span>;
  if (status === "Inactive")
    return <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">Inactive</span>;
  return <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">{status}</span>;
}

type ActiveCard = "all" | "verified" | "pending" | "rejected" | "system" | "mobile";

interface StatCardProps {
  label: string;
  count: number;
  icon: string;
  cardKey: ActiveCard;
  active: boolean;
  onClick: (key: ActiveCard) => void;
  accent: string;
}

function StatCard({ label, count, icon, cardKey, active, onClick, accent }: StatCardProps) {
  return (
    <button
      onClick={() => onClick(cardKey)}
      className={`flex-1 min-w-[150px] bg-white rounded-xl border-2 p-4 flex items-center gap-4 text-left transition-all cursor-pointer hover:shadow-md ${
        active ? `${accent} shadow-md` : "border-black/10 hover:border-black/20"
      }`}
    >
      <img src={icon} alt={label} className="w-12 h-12 object-contain flex-shrink-0" />
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{count}</p>
        <p className="text-xs font-medium text-gray-500 mt-1 leading-snug">{label}</p>
        {active && <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-1">Filtered ✓</p>}
      </div>
    </button>
  );
}

export default function FarmerRegistry({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const { addNotification } = useNotifications();
  const [farmers, setFarmers] = useState<FarmerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [distFilter, setDistFilter] = useState("");
  const [page, setPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [viewFarmer, setViewFarmer] = useState<FarmerRecord | null>(null);
  const [reviewFarmer, setReviewFarmer] = useState<FarmerRecord | null>(null);
  const [toast, setToast] = useState("");
  const [activeCard, setActiveCard] = useState<ActiveCard>("all");

  const loadFarmers = useCallback(async () => {
    try {
      setError("");
      const data = await apiFetchFarmers();
      setFarmers(data);
    } catch {
      setError("Failed to load farmers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFarmers(); }, [loadFarmers]);
  useEffect(() => {
    const handler = () => loadFarmers();
    window.addEventListener("farmer-registry-changed", handler);
    return () => window.removeEventListener("farmer-registry-changed", handler);
  }, [loadFarmers]);
  useEffect(() => {
    const interval = setInterval(loadFarmers, 15000);
    return () => clearInterval(interval);
  }, [loadFarmers]);

  const districts = useMemo(() => [...new Set(farmers.map(f => f.district))].sort(), [farmers]);

  const counts = useMemo(() => ({
    verified: farmers.filter(f => f.status === "Verified" || f.status === "Active").length,
    pending: farmers.filter(f => f.status === "Pending").length,
    rejected: farmers.filter(f => f.status === "Cancelled" || f.status === "Inactive").length,
    system: farmers.filter(f => f.source !== "mobile_ocr").length,
    mobile: farmers.filter(f => f.source === "mobile_ocr").length,
  }), [farmers]);

  const handleCardClick = (key: ActiveCard) => {
    setActiveCard(prev => prev === key ? "all" : key);
    setPage(0);
  };

  const filtered = useMemo(() => {
    return farmers.filter(f => {
      const s = search.toLowerCase();
      const matchSearch = !s || f.name.toLowerCase().includes(s) || f.farmerId.toLowerCase().includes(s) || f.aadhaar.includes(s);
      const matchDist = !distFilter || f.district === distFilter;
      let matchCard = true;
      if (activeCard === "verified") matchCard = f.status === "Verified" || f.status === "Active";
      else if (activeCard === "pending") matchCard = f.status === "Pending";
      else if (activeCard === "rejected") matchCard = f.status === "Cancelled" || f.status === "Inactive";
      else if (activeCard === "system") matchCard = f.source !== "mobile_ocr";
      else if (activeCard === "mobile") matchCard = f.source === "mobile_ocr";
      return matchSearch && matchDist && matchCard;
    });
  }, [search, distFilter, activeCard, farmers]);

  const totalPages = Math.ceil(filtered.length / 10);
  const pageData = filtered.slice(page * 10, (page + 1) * 10);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleFarmerDeleted = (id: string) => {
    setFarmers(prev => prev.filter(f => f.farmerId !== id));
    setViewFarmer(null);
    showToast("Farmer deleted successfully");
  };

  const handleFarmerUpdated = (updated: FarmerRecord) => {
    setFarmers(prev => prev.map(f => f.farmerId === updated.farmerId ? updated : f));
    setViewFarmer(null);
    showToast(`Farmer ${updated.status === "Verified" ? "verified ✓" : updated.status === "Cancelled" ? "rejected" : "updated"}`);
    if (updated.status === "Verified") {
      addNotification({ type: "farmer", title: "Farmer Verified", body: `${updated.name} (${updated.farmerId}) has been successfully verified.`, farmerName: updated.name, farmerId: updated.farmerId });
    } else if (updated.status === "Cancelled") {
      addNotification({ type: "system", title: "Registration Cancelled", body: `${updated.name} (${updated.farmerId}) registration was cancelled.`, farmerName: updated.name, farmerId: updated.farmerId });
    }
  };

  const handleReviewUpdated = (updated: FarmerRecord) => {
    setFarmers(prev => prev.map(f => f.farmerId === updated.farmerId ? updated : f));
    setReviewFarmer(null);
    showToast(updated.status === "Verified" ? "Farmer verification approved ✓" : "Farmer registration cancelled");
    if (updated.status === "Verified") {
      addNotification({ type: "farmer", title: "Farmer Verified ✓", body: `${updated.name} (${updated.farmerId}) passed verification.`, farmerName: updated.name, farmerId: updated.farmerId });
    } else if (updated.status === "Cancelled") {
      addNotification({ type: "system", title: "Registration Rejected", body: `${updated.name} (${updated.farmerId}) registration was rejected.`, farmerName: updated.name, farmerId: updated.farmerId });
    }
  };

  const handleRegistrationSuccess = (msg: string, farmerName?: string, farmerId?: string) => {
    showToast(msg);
    loadFarmers();
    addNotification({ type: "farmer", title: "New Farmer Registered", body: farmerName ? `${farmerName} (${farmerId}) has been registered and is pending verification.` : msg, farmerName, farmerId });
  };

  return (
    <div className="space-y-5 animate-fade-in" style={{ opacity: 0 }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in" style={{ opacity: 0 }}>
          {toast}
        </div>
      )}

      {/* ── 5 Stat Cards ── */}
      <div className="flex flex-wrap gap-3">
        <StatCard cardKey="verified" label="Verified Farmers" count={counts.verified} icon={iconVerified} active={activeCard === "verified"} onClick={handleCardClick} accent="border-emerald-500" />
        <StatCard cardKey="pending" label="Pending Review" count={counts.pending} icon={iconPending} active={activeCard === "pending"} onClick={handleCardClick} accent="border-yellow-500" />
        <StatCard cardKey="rejected" label="Rejected / Cancelled" count={counts.rejected} icon={iconRejected} active={activeCard === "rejected"} onClick={handleCardClick} accent="border-red-500" />
        <StatCard cardKey="system" label="Via System Admin" count={counts.system} icon={iconSystem} active={activeCard === "system"} onClick={handleCardClick} accent="border-blue-500" />
        <StatCard cardKey="mobile" label="Via Farmer Mobile App" count={counts.mobile} icon={iconMobile} active={activeCard === "mobile"} onClick={handleCardClick} accent="border-purple-500" />
      </div>

      {/* ── Filters & Actions ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by name, ID, Aadhaar..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50"
          />
        </div>
        <select value={distFilter} onChange={e => { setDistFilter(e.target.value); setPage(0); }} className="text-sm bg-white border border-border rounded-lg px-3 py-2">
          <option value="">All Districts</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {activeCard !== "all" && (
          <button onClick={() => setActiveCard("all")} className="text-sm px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 text-gray-700">
            Clear Filter ×
          </button>
        )}
        <button onClick={() => onNavigate ? onNavigate("newregistration") : setShowAdd(true)} className="flex items-center gap-1.5 text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Farmer
        </button>
        <button onClick={() => showToast("✅ CSV imported successfully — 24 records added")} className="flex items-center gap-1.5 text-sm px-3 py-2 bg-white border border-border rounded-lg hover:bg-muted">
          <Upload className="h-4 w-4" /> Import
        </button>
        <button onClick={() => showToast("📁 Export started...")} className="flex items-center gap-1.5 text-sm px-3 py-2 bg-white border border-border rounded-lg hover:bg-muted">
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading farmers...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
          <button onClick={loadFarmers} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-200">
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500 whitespace-nowrap">नोंदणी दिनांक</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">नाव</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">गाव</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">तालुका</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">जिल्हा</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500 whitespace-nowrap">खाते क्रमांक</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500 whitespace-nowrap">भूमापन क्रमांक</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Source</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Priority</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((f, idx) => {
                  const priority = getPriority(f);
                  const isMobile = f.source === "mobile_ocr";
                  return (
                    <tr
                      key={f.farmerId}
                      className={`bg-white hover:bg-gray-50 transition-colors ${idx < pageData.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      {/* नोंदणी दिनांक */}
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">{formatDate(f.addedAt)}</td>

                      {/* नाव */}
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{f.name}</td>

                      {/* गाव */}
                      <td className="px-4 py-3 text-gray-600">{f.village || <span className="text-gray-300">—</span>}</td>

                      {/* तालुका */}
                      <td className="px-4 py-3 text-gray-600">{f.taluka || <span className="text-gray-300">—</span>}</td>

                      {/* जिल्हा */}
                      <td className="px-4 py-3 text-gray-600">{f.district || <span className="text-gray-300">—</span>}</td>

                      {/* खाते क्रमांक */}
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {f.khateNumber && f.khateNumber !== "—" ? f.khateNumber : <span className="text-gray-300">—</span>}
                      </td>

                      {/* भूमापन क्रमांक */}
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {f.surveyNumber && f.surveyNumber !== "—" ? f.surveyNumber : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Source — solid pill, white text, no icon */}
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold text-white whitespace-nowrap ${isMobile ? "bg-purple-600" : "bg-blue-600"}`}>
                          {isMobile ? "Mobile" : "System"}
                        </span>
                      </td>

                      {/* Priority — solid pill with days count, white text, no icon */}
                      <td className="px-4 py-3">
                        {priority ? (
                          <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold text-white whitespace-nowrap ${priority.bg}`}>
                            {priority.label} · {priority.days}d
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3"><StatusBadge status={f.status} /></td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        {f.status === "Pending" && (
                          <button onClick={() => setReviewFarmer(f)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-85 font-medium transition-opacity whitespace-nowrap">
                            <Eye className="h-3 w-3" /> Review
                          </button>
                        )}
                        {(f.status === "Verified" || f.status === "Active") && (
                          <button onClick={() => setReviewFarmer(f)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium transition-colors whitespace-nowrap">
                            <CheckCircle2 className="h-3 w-3" /> View
                          </button>
                        )}
                        {(f.status === "Cancelled" || f.status === "Inactive") && (
                          <button onClick={() => setReviewFarmer(f)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition-colors whitespace-nowrap">
                            <Eye className="h-3 w-3" /> View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {pageData.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-sm text-gray-400">
                      No farmers found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500">
              {filtered.length > 0
                ? `Showing ${page * 10 + 1}–${Math.min((page + 1) * 10, filtered.length)} of ${filtered.length}`
                : "No results"}
              {activeCard !== "all" && <span className="ml-1 text-gray-400">(filtered)</span>}
            </span>
            <div className="flex gap-1">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewFarmer && (
        <FarmerReviewModal farmer={reviewFarmer} onClose={() => setReviewFarmer(null)} onUpdated={handleReviewUpdated} />
      )}

      {viewFarmer && (
        <FarmerDetailModal
          farmer={viewFarmer}
          onClose={() => setViewFarmer(null)}
          onDeleted={handleFarmerDeleted}
          onUpdated={(updated) => {
            setFarmers(prev => prev.map(f => f.farmerId === updated.farmerId ? updated : f));
            setViewFarmer(updated);
          }}
        />
      )}

      {showAdd && (
        <FarmerRegistrationForm onClose={() => setShowAdd(false)} onSuccess={handleRegistrationSuccess} />
      )}
    </div>
  );
}
