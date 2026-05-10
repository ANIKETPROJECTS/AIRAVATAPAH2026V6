import { useState, useMemo, useEffect, useCallback } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Search, Plus, Upload, Download, ChevronLeft, ChevronRight, Sparkles, Loader2, AlertCircle, Trash2, Eye, CheckCircle2 } from "lucide-react";
import { apiFetchFarmers, apiDeleteFarmer, apiUpdateFarmer, notifyFarmerChange, type FarmerRecord } from "@/data/farmerApi";
import FarmerRegistrationForm from "@/components/forms/FarmerRegistrationForm";
import FarmerDetailModal from "@/components/modules/FarmerDetailModal";
import FarmerReviewModal from "@/components/modules/FarmerReviewModal";

function formatLandHAR(val: number | string | undefined): string {
  if (val === undefined || val === null || val === "" || val === "0" || val === 0) return "—";
  const s = String(val).trim();
  const parts = s.split(".");
  if (parts.length === 3) {
    const [h, a, sm] = parts;
    return `${h} हे. ${a} आर. ${sm} चौ.मी.`;
  }
  if (parts.length === 2) {
    const [h, a] = parts;
    if (a === "0" || a === "00") return `${h} हे.`;
    return `${h} हे. ${a} आर.`;
  }
  return `${s} हे.`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Verified") return <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">Verified</span>;
  if (status === "Cancelled") return <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Cancelled</span>;
  if (status === "Pending") return <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">Pending</span>;
  if (status === "Active") return <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-success/10 text-success">Active</span>;
  return <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">{status}</span>;
}

export default function FarmerRegistry({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const { addNotification } = useNotifications();
  const [farmers, setFarmers] = useState<FarmerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [distFilter, setDistFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [viewFarmer, setViewFarmer] = useState<FarmerRecord | null>(null);
  const [reviewFarmer, setReviewFarmer] = useState<FarmerRecord | null>(null);
  const [toast, setToast] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
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
    const interval = setInterval(() => { loadFarmers(); }, 15000);
    return () => clearInterval(interval);
  }, [loadFarmers]);

  const districts = useMemo(() => [...new Set(farmers.map(f => f.district))].sort(), [farmers]);

  const filtered = useMemo(() => {
    return farmers.filter(f => {
      const s = search.toLowerCase();
      const matchSearch = !s || f.name.toLowerCase().includes(s) || f.farmerId.toLowerCase().includes(s) || f.aadhaar.includes(s);
      const matchDist = !distFilter || f.district === distFilter;
      const matchStatus = !statusFilter || f.status === statusFilter;
      return matchSearch && matchDist && matchStatus;
    });
  }, [search, distFilter, statusFilter, farmers]);

  const totalPages = Math.ceil(filtered.length / 10);
  const pageData = filtered.slice(page * 10, (page + 1) * 10);
  const pendingCount = farmers.filter(f => f.status === "Pending").length;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleFarmerDeleted = (id: string) => {
    setFarmers(prev => prev.filter(f => f.farmerId !== id));
    setViewFarmer(null);
    showToast("Farmer deleted successfully");
  };

  const handleRowDelete = async (farmerId: string) => {
    if (pendingDelete !== farmerId) {
      setPendingDelete(farmerId);
      setTimeout(() => setPendingDelete(prev => prev === farmerId ? null : prev), 3000);
      return;
    }
    setPendingDelete(null);
    setDeleting(farmerId);
    try {
      await apiDeleteFarmer(farmerId);
      setFarmers(prev => prev.filter(f => f.farmerId !== farmerId));
      showToast("Farmer deleted");
    } catch {
      showToast("Delete failed — please try again");
    } finally {
      setDeleting(null);
    }
  };

  const handleFarmerUpdated = (updated: FarmerRecord) => {
    setFarmers(prev => prev.map(f => f.farmerId === updated.farmerId ? updated : f));
    setViewFarmer(null);
    showToast(`Farmer ${updated.status === "Verified" ? "verified ✓" : updated.status === "Cancelled" ? "rejected" : "updated"}`);
    if (updated.status === "Verified") {
      addNotification({ type:"farmer", title:"Farmer Verified", body:`${updated.name} (${updated.farmerId}) has been successfully verified and added to the Farmers list.`, farmerName:updated.name, farmerId:updated.farmerId });
    } else if (updated.status === "Cancelled") {
      addNotification({ type:"system", title:"Registration Cancelled", body:`${updated.name} (${updated.farmerId}) registration was cancelled.`, farmerName:updated.name, farmerId:updated.farmerId });
    }
  };

  const handleReviewUpdated = (updated: FarmerRecord) => {
    setFarmers(prev => prev.map(f => f.farmerId === updated.farmerId ? updated : f));
    setReviewFarmer(null);
    showToast(updated.status === "Verified" ? "Farmer verification approved ✓" : "Farmer registration cancelled");
    if (updated.status === "Verified") {
      addNotification({ type:"farmer", title:"Farmer Verified ✓", body:`${updated.name} (${updated.farmerId}) passed verification — now visible in Verified Farmers.`, farmerName:updated.name, farmerId:updated.farmerId });
    } else if (updated.status === "Cancelled") {
      addNotification({ type:"system", title:"Registration Rejected", body:`${updated.name} (${updated.farmerId}) registration was rejected during review.`, farmerName:updated.name, farmerId:updated.farmerId });
    }
  };

  const handleRegistrationSuccess = (msg: string, farmerName?: string, farmerId?: string) => {
    showToast(msg);
    loadFarmers();
    addNotification({ type:"farmer", title:"New Farmer Registered", body: farmerName ? `${farmerName} (${farmerId}) has been registered and is pending verification.` : msg, farmerName, farmerId });
  };

  return (
    <div className="space-y-4 animate-fade-in" style={{ opacity: 0 }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in" style={{ opacity: 0 }}>
          {toast}
        </div>
      )}

      {pendingCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
          <Sparkles className="h-4 w-4 flex-shrink-0 text-yellow-600" />
          <span><strong>{pendingCount}</strong> farmer{pendingCount > 1 ? "s" : ""} pending review and verification.</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by name, ID, Aadhaar..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50" />
        </div>
        <select value={distFilter} onChange={e => { setDistFilter(e.target.value); setPage(0); }}
          className="text-sm bg-card border border-border rounded-lg px-3 py-2">
          <option value="">All Districts</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          className="text-sm bg-card border border-border rounded-lg px-3 py-2">
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Verified">Verified</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <button onClick={() => onNavigate ? onNavigate("newregistration") : setShowAdd(true)} className="flex items-center gap-1.5 text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Farmer
        </button>
        <button onClick={() => showToast("✅ CSV imported successfully — 24 records added")} className="flex items-center gap-1.5 text-sm px-3 py-2 bg-card border border-border rounded-lg hover:bg-muted">
          <Upload className="h-4 w-4" /> Import
        </button>
        <button onClick={() => showToast("📁 Export started...")} className="flex items-center gap-1.5 text-sm px-3 py-2 bg-card border border-border rounded-lg hover:bg-muted">
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
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Farmer ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Village</th>
                  <th className="px-4 py-3 font-medium">District</th>
                  <th className="px-4 py-3 font-medium">क्षेत्रफळ <span className="text-muted-foreground font-normal">(हे.आर.चौ.मी.)</span></th>
                  <th className="px-4 py-3 font-medium">Khate No.</th>
                  <th className="px-4 py-3 font-medium">Aadhaar</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map(f => (
                  <tr
                    key={f.farmerId}
                    className={`border-t border-border/50 hover:bg-muted/30 transition-colors ${
                      f.status === "Pending" ? "bg-yellow-50/40" :
                      f.source === "ocr" ? "bg-emerald-50/40" :
                      f.source === "manual" ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs">
                      <span className="flex items-center gap-1">
                        {f.farmerId}
                        {f.source === "ocr" && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                            <Sparkles className="h-2.5 w-2.5" />OCR
                          </span>
                        )}
                        {f.source === "manual" && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                            Manual
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium">{f.name}</td>
                    <td className="px-4 py-2.5">{f.village}</td>
                    <td className="px-4 py-2.5">{f.district}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{formatLandHAR(f.land)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{f.khateNumber && f.khateNumber !== "—" ? f.khateNumber : <span className="text-muted-foreground/50">—</span>}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{f.aadhaar}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={f.status} /></td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 items-center flex-wrap">
                        {/* Pending farmers: Review only (Reject is inside the review modal) */}
                        {f.status === "Pending" && (
                          <button
                            onClick={() => setReviewFarmer(f)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-85 font-medium transition-opacity"
                          >
                            <Eye className="h-3 w-3" />
                            Review
                          </button>
                        )}

                        {/* Verified farmers: View (read-only) */}
                        {f.status === "Verified" && (
                          <button
                            onClick={() => setReviewFarmer(f)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium transition-colors"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            View
                          </button>
                        )}

                        {/* Cancelled farmers: View */}
                        {f.status === "Cancelled" && (
                          <button
                            onClick={() => setReviewFarmer(f)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 font-medium transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </button>
                        )}

                        {/* Active/Inactive (seed data): View + Edit */}
                        {(f.status === "Active" || f.status === "Inactive") && (
                          <>
                            <button
                              onClick={() => setViewFarmer(f)}
                              className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-80"
                            >
                              View
                            </button>
                            <button
                              onClick={() => setViewFarmer(f)}
                              className="text-xs px-2 py-1 rounded bg-muted text-foreground hover:bg-muted/80"
                            >
                              Edit
                            </button>
                          </>
                        )}

                        {/* Delete for all */}
                        <button
                          onClick={() => handleRowDelete(f.farmerId)}
                          disabled={deleting === f.farmerId}
                          className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                            pendingDelete === f.farmerId
                              ? "bg-destructive text-destructive-foreground animate-pulse"
                              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                          }`}
                        >
                          {deleting === f.farmerId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          {pendingDelete === f.farmerId ? "Confirm?" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageData.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No farmers found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {filtered.length > 0
                ? `Showing ${page * 10 + 1}–${Math.min((page + 1) * 10, filtered.length)} of ${filtered.length}`
                : "No results"}
            </span>
            <div className="flex gap-1">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* Full review modal for OCR/Pending/Verified/Cancelled farmers */}
      {reviewFarmer && (
        <FarmerReviewModal
          farmer={reviewFarmer}
          onClose={() => setReviewFarmer(null)}
          onUpdated={handleReviewUpdated}
        />
      )}

      {/* Legacy detail modal for Active/Inactive seed farmers */}
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
        <FarmerRegistrationForm
          onClose={() => setShowAdd(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  );
}
