import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Search, RefreshCw, IndianRupee, ArrowLeft, AlertTriangle, Trash2, Pencil, ChevronDown, X } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";

const DOC_LABEL: Record<string, string> = {
  aadhar: "Aadhaar Card", bank_passbook: "Bank Passbook",
  form7: "Form 7 (7/12)", form12: "Form 12 (Pik Pahani)", form8a: "Form 8A",
};

interface Application {
  applicationId: string; type: string; farmerId: string; farmerName: string | null;
  mobile: string; district: string | null; village: string | null;
  schemeId: string; schemeName: string; schemeType: string | null;
  status: string; adminReply: string | null; adminNotes: string | null;
  source: string; appliedAt: string; updatedAt: string;
  documentRefs?: string[];
}

interface FarmerDetail {
  name?: string; farmerId?: string; mobile?: string; district?: string;
  village?: string; taluka?: string; crop?: string; land?: string;
  aadhaar?: string; bankAccount?: string; bankName?: string; status?: string;
  surveyNumber?: string;
}

function getPriority(iso: string): { label: string; days: number; color: string } {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days >= 15) return { label: "Critical", days, color: "bg-red-600 text-white" };
  if (days >= 8)  return { label: "High",     days, color: "bg-orange-500 text-white" };
  if (days >= 4)  return { label: "Medium",   days, color: "bg-amber-500 text-white" };
  return            { label: "Normal",   days, color: "bg-emerald-600 text-white" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: "bg-amber-500 text-white",
    "Under Review": "bg-blue-600 text-white",
    Approved: "bg-emerald-600 text-white",
    Rejected: "bg-red-600 text-white",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${map[status] ?? "bg-slate-600 text-white"}`}>
      {status}
    </span>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);
  if (h > 0) return `${h}h ago`;
  return "just now";
}

const SEARCH_PLACEHOLDERS = [
  "Search by Application ID…",
  "Search by Farmer Name…",
  "Search by Subsidy Name…",
  "Search by District…",
  "Search by Mobile Number…",
  "Search by Farmer ID…",
];

function useTypingPlaceholder(phrases: string[], speed = 60, pause = 1800) {
  const [placeholder, setPlaceholder] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx(i => i + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(i => i - 1), speed / 2);
    } else {
      setDeleting(false);
      setPhraseIdx(i => (i + 1) % phrases.length);
    }
    setPlaceholder(current.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause]);

  return placeholder;
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm border border-black/15 rounded-full bg-white text-black focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer font-medium"
      >
        <option value="">{label}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/40 pointer-events-none" />
    </div>
  );
}

export default function SubsidyManagement() {
  const [apps, setApps]       = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("all");
  const [search, setSearch]   = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [page, setPage]       = useState(0);
  const [review, setReview]   = useState<Application | null>(null);
  const [farmerDetail, setFarmerDetail] = useState<FarmerDetail | null>(null);
  const [farmerLoading, setFarmerLoading] = useState(false);
  const [notes, setNotes]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState("");
  const [rejectModal, setRejectModal]   = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteModal, setDeleteModal]   = useState<{ id: string; name: string } | null>(null);
  const [editModal, setEditModal]       = useState<Application | null>(null);
  const [editReply, setEditReply]       = useState("");
  const [editNotes, setEditNotes]       = useState("");
  const prevCount             = useRef(0);
  const { addNotification }   = useNotifications();
  const PAGE_SIZE = 10;
  const placeholder = useTypingPlaceholder(SEARCH_PLACEHOLDERS);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/applications?type=subsidy");
      if (!res.ok) throw new Error("Failed");
      const data: Application[] = await res.json();
      if (data.length > prevCount.current && prevCount.current > 0) {
        addNotification({ type: "scheme", title: "New Subsidy Application", body: `${data.length - prevCount.current} new subsidy application(s) received.` });
      }
      prevCount.current = data.length;
      setApps(data);
    } catch { showToast("⚠️ Failed to load applications"); }
    finally { setLoading(false); }
  }

  async function loadFarmerDetail(farmerId: string) {
    setFarmerLoading(true);
    try {
      const res = await fetch(`/api/farmers/${farmerId}`);
      if (res.ok) { const d = await res.json(); setFarmerDetail(d); }
    } catch { /* silent */ }
    finally { setFarmerLoading(false); }
  }

  useEffect(() => { load(); const iv = setInterval(() => load(true), 30000); return () => clearInterval(iv); }, []);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3500); }

  const districtOptions = useMemo(() => {
    const dists = [...new Set(apps.map(a => a.district).filter(Boolean))] as string[];
    return dists.map(d => ({ label: d, value: d }));
  }, [apps]);

  const filtered = useMemo(() => {
    let list = tab === "all" ? apps : apps.filter(a => a.status === tab);
    if (filterType) list = list.filter(a => (a.schemeType ?? "").toLowerCase() === filterType.toLowerCase());
    if (filterPriority) list = list.filter(a => getPriority(a.appliedAt).label === filterPriority);
    if (filterDistrict) list = list.filter(a => a.district === filterDistrict);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.applicationId.toLowerCase().includes(q) ||
        (a.farmerName ?? "").toLowerCase().includes(q) ||
        a.schemeName.toLowerCase().includes(q) ||
        (a.district ?? "").toLowerCase().includes(q) ||
        a.mobile.includes(q) ||
        a.farmerId.toLowerCase().includes(q)
      );
    }
    return list;
  }, [apps, tab, search, filterType, filterPriority, filterDistrict]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const counts = useMemo(() => ({
    total:    apps.length,
    pending:  apps.filter(a => a.status === "Pending").length,
    review:   apps.filter(a => a.status === "Under Review").length,
    approved: apps.filter(a => a.status === "Approved").length,
    rejected: apps.filter(a => a.status === "Rejected").length,
  }), [apps]);

  const activeFilterCount = [filterType, filterPriority, filterDistrict].filter(Boolean).length;

  async function updateStatus(id: string, status: string, adminNotes?: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated: Application = await res.json();
      setApps(prev => prev.map(a => a.applicationId === id ? updated : a));
      setReview(prev => prev?.applicationId === id ? updated : prev);
      showToast(status === "Approved" ? `Application ${id} approved` : status === "Rejected" ? `Application ${id} rejected` : `${id} under review`);
      if (status === "Approved") addNotification({ type: "scheme", title: "Subsidy Application Approved", body: `Subsidy application ${id} has been approved.`, farmerId: updated.farmerId, farmerName: updated.farmerName ?? undefined });
    } catch { showToast("⚠️ Update failed"); }
    finally { setSaving(false); }
  }

  function openRejectModal(id: string) { setRejectReason(""); setRejectModal({ id }); }
  function confirmReject() {
    if (!rejectModal) return;
    updateStatus(rejectModal.id, "Rejected", rejectReason.trim() || notes);
    setRejectModal(null);
  }

  async function deleteApp(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setApps(prev => prev.filter(a => a.applicationId !== id));
      if (review?.applicationId === id) setReview(null);
      showToast(`Application ${id} deleted`);
    } catch { showToast("⚠️ Delete failed"); }
    finally { setSaving(false); setDeleteModal(null); }
  }

  async function saveEdit() {
    if (!editModal) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${editModal.applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: editReply, adminNotes: editNotes }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated: Application = await res.json();
      setApps(prev => prev.map(a => a.applicationId === updated.applicationId ? updated : a));
      setReview(prev => prev?.applicationId === updated.applicationId ? updated : prev);
      showToast("Application updated");
    } catch { showToast("⚠️ Update failed"); }
    finally { setSaving(false); setEditModal(null); }
  }

  if (review) {
    return (
      <div className="space-y-4" style={{ fontFamily: "Poppins, sans-serif" }}>
        {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-full shadow-lg text-sm font-medium">{toast}</div>}

        {rejectModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-red-600"/></div>
                <div><h3 className="font-semibold text-base">Reject Application</h3><p className="text-xs text-gray-500">{rejectModal.id}</p></div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Reason for Rejection <span className="text-red-500">*</span></label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                  placeholder="Enter the reason for rejecting this application…" autoFocus/>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setRejectModal(null)} className="px-5 py-2 text-sm rounded-full bg-gray-100 hover:bg-gray-200 font-medium">Cancel</button>
                <button disabled={saving || !rejectReason.trim()} onClick={confirmReject}
                  className="px-5 py-2 text-sm rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 font-medium">
                  {saving ? "Rejecting…" : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        )}

        <button onClick={() => { setReview(null); setFarmerDetail(null); }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium">
          <ArrowLeft className="h-4 w-4"/> Back to Applications
        </button>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-800 px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-amber-200 text-xs font-medium uppercase tracking-wider mb-1">Subsidy Application Review</p>
                <h2 className="text-white font-bold text-xl">{review.schemeName}</h2>
                <p className="text-amber-300 text-xs font-mono mt-1">{review.applicationId}</p>
              </div>
              <StatusBadge status={review.status}/>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Farmer Details */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Farmer Details</h3>
              </div>
              <div className="p-4">
                {farmerLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse"/>)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Full Name</p><p className="font-semibold text-gray-800 mt-0.5 text-sm">{farmerDetail?.name ?? review.farmerName ?? "—"}</p></div>
                    <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Farmer ID</p><p className="font-mono text-gray-700 mt-0.5 text-sm">{review.farmerId}</p></div>
                    <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Mobile</p><p className="text-gray-700 mt-0.5 text-sm">{review.mobile}</p></div>
                    <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">District</p><p className="text-gray-700 mt-0.5 text-sm">{farmerDetail?.district ?? review.district ?? "—"}</p></div>
                    <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Village</p><p className="text-gray-700 mt-0.5 text-sm">{farmerDetail?.village ?? review.village ?? "—"}</p></div>
                    <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Taluka</p><p className="text-gray-700 mt-0.5 text-sm">{farmerDetail?.taluka ?? "—"}</p></div>
                    <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Crop</p><p className="text-gray-700 mt-0.5 text-sm">{farmerDetail?.crop ?? "—"}</p></div>
                    <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Land (Acres)</p><p className="text-gray-700 mt-0.5 text-sm">{farmerDetail?.land ?? "—"}</p></div>
                    <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Survey No.</p><p className="text-gray-700 mt-0.5 text-sm">{farmerDetail?.surveyNumber ?? "—"}</p></div>
                    <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Bank</p><p className="text-gray-700 mt-0.5 text-sm truncate">{farmerDetail?.bankName ?? "—"}</p></div>
                    <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Account No.</p><p className="text-gray-700 mt-0.5 text-sm font-mono">{farmerDetail?.bankAccount ?? "—"}</p></div>
                    <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">KYC Status</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 inline-block ${farmerDetail?.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {farmerDetail?.status ?? "—"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subsidy Details */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Subsidy Details</h3>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-2"><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Subsidy Name</p><p className="font-semibold text-gray-800 mt-0.5">{review.schemeName}</p></div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Type</p>
                  {review.schemeType ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-medium mt-0.5 inline-block">{review.schemeType}</span>
                  ) : <p className="text-gray-700 mt-0.5">—</p>}
                </div>
                <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Applied</p><p className="text-gray-700 mt-0.5">{formatDate(review.appliedAt)}</p></div>
                <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Last Updated</p><p className="text-gray-700 mt-0.5">{timeAgo(review.updatedAt)}</p></div>
                <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Source</p><p className="text-gray-700 mt-0.5 capitalize">{review.source?.replace("_", " ") ?? "—"}</p></div>
                <div><p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Priority</p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium mt-0.5 inline-block ${getPriority(review.appliedAt).color}`}>
                    {getPriority(review.appliedAt).label}
                  </span>
                </div>
              </div>
            </div>

            {/* Documents */}
            {review.documentRefs && review.documentRefs.length > 0 && (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Documents Submitted</h3>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {review.documentRefs.map(ref => (
                    <span key={ref} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                      {DOC_LABEL[ref] ?? ref}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {review.adminReply && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs font-bold text-emerald-700 mb-1 uppercase tracking-wide">Previous Admin Reply</p>
                <p className="text-sm text-emerald-900">{review.adminReply}</p>
              </div>
            )}

            {/* Officer notes */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Officer Notes</h3>
              </div>
              <div className="p-4">
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl h-28 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="Add notes or comments about this application…"/>
              </div>
            </div>

            {/* Action buttons — pill shaped, solid bg, white text, no icons */}
            <div className="flex gap-3 flex-wrap pt-1 border-t border-gray-100">
              {review.status !== "Approved" && (
                <button disabled={saving} onClick={() => updateStatus(review.applicationId, "Approved", notes)}
                  className="text-sm px-6 py-2.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 font-semibold transition-colors">
                  Approve Application
                </button>
              )}
              {review.status === "Pending" && (
                <button disabled={saving} onClick={() => updateStatus(review.applicationId, "Under Review", notes)}
                  className="text-sm px-6 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 font-semibold transition-colors">
                  Mark Under Review
                </button>
              )}
              {review.status !== "Rejected" && (
                <button disabled={saving} onClick={() => openRejectModal(review.applicationId)}
                  className="text-sm px-6 py-2.5 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 font-semibold transition-colors">
                  Reject Application
                </button>
              )}
              <button onClick={() => { setReview(null); setFarmerDetail(null); }}
                className="text-sm px-6 py-2.5 rounded-full bg-gray-700 text-white hover:bg-gray-800 font-semibold ml-auto transition-colors">
                Back to List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" style={{ fontFamily: "Poppins, sans-serif" }}>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-full shadow-lg text-sm font-medium">{toast}</div>}

      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><Trash2 className="h-5 w-5 text-red-600"/></div>
              <div><h3 className="font-semibold text-base">Delete Application</h3><p className="text-xs text-gray-500 font-mono">{deleteModal.id}</p></div>
            </div>
            <p className="text-sm text-gray-500">Permanently delete the application for <span className="font-semibold text-gray-800">"{deleteModal.name}"</span>? This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteModal(null)} className="px-5 py-2 text-sm rounded-full bg-gray-100 hover:bg-gray-200 font-medium">Cancel</button>
              <button disabled={saving} onClick={() => deleteApp(deleteModal.id)} className="px-5 py-2 text-sm rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 font-medium">
                {saving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Pencil className="h-5 w-5 text-blue-600"/></div>
              <div><h3 className="font-semibold text-base">Edit Application</h3><p className="text-xs text-gray-500 font-mono">{editModal.applicationId}</p></div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold mb-1 block">Reply to Farmer</label>
                <textarea value={editReply} onChange={e => setEditReply(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl h-20 resize-none focus:outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder="Message visible to the farmer…"/>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Internal Notes</label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl h-20 resize-none focus:outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder="Internal officer notes (not visible to farmer)…"/>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditModal(null)} className="px-5 py-2 text-sm rounded-full bg-gray-100 hover:bg-gray-200 font-medium">Cancel</button>
              <button disabled={saving} onClick={saveEdit} className="px-5 py-2 text-sm rounded-full bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 font-medium">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total",        value: counts.total,    bg: "bg-slate-700",   key: "all" },
          { label: "Pending",      value: counts.pending,  bg: "bg-amber-500",   key: "Pending" },
          { label: "Under Review", value: counts.review,   bg: "bg-blue-600",    key: "Under Review" },
          { label: "Approved",     value: counts.approved, bg: "bg-emerald-600", key: "Approved" },
          { label: "Rejected",     value: counts.rejected, bg: "bg-red-600",     key: "Rejected" },
        ].map(s => (
          <div key={s.label} onClick={() => { setTab(tab === s.key ? "all" : s.key); setPage(0); }}
            className={`rounded-xl p-4 ${s.bg} cursor-pointer transition-all select-none ${tab === s.key ? "ring-4 ring-white/60 scale-[1.03] shadow-lg" : "hover:opacity-90 hover:scale-[1.01]"}`}>
            <div className="text-3xl font-semibold text-white mb-1">{s.value}</div>
            <div className="text-sm font-medium text-white/80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Pill search bar — LEFT */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"/>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder={placeholder}
            className="pl-9 pr-4 py-2 text-sm border border-black/15 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white text-black"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-3.5 w-3.5"/>
            </button>
          )}
        </div>

        {/* Filters */}
        <FilterSelect
          label="Subsidy Type"
          value={filterType}
          onChange={v => { setFilterType(v); setPage(0); }}
          options={[
            { label: "Central", value: "CENTRAL" },
            { label: "State", value: "STATE" },
            { label: "District", value: "DISTRICT" },
            { label: "Other", value: "OTHER" },
          ]}
        />
        <FilterSelect
          label="Priority"
          value={filterPriority}
          onChange={v => { setFilterPriority(v); setPage(0); }}
          options={[
            { label: "Normal", value: "Normal" },
            { label: "Medium", value: "Medium" },
            { label: "High", value: "High" },
            { label: "Critical", value: "Critical" },
          ]}
        />
        <FilterSelect
          label="District"
          value={filterDistrict}
          onChange={v => { setFilterDistrict(v); setPage(0); }}
          options={districtOptions}
        />

        {/* Active filter chips */}
        {tab !== "all" && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-white bg-slate-700 rounded-full px-3 py-1.5">
            Status: {tab}
            <button onClick={() => { setTab("all"); setPage(0); }} className="hover:text-white/70"><X className="h-3 w-3"/></button>
          </span>
        )}
        {filterType && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-white bg-amber-600 rounded-full px-3 py-1.5">
            Type: {filterType}
            <button onClick={() => setFilterType("")} className="hover:text-white/70"><X className="h-3 w-3"/></button>
          </span>
        )}
        {filterPriority && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-white bg-orange-500 rounded-full px-3 py-1.5">
            Priority: {filterPriority}
            <button onClick={() => setFilterPriority("")} className="hover:text-white/70"><X className="h-3 w-3"/></button>
          </span>
        )}
        {filterDistrict && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 rounded-full px-3 py-1.5">
            District: {filterDistrict}
            <button onClick={() => setFilterDistrict("")} className="hover:text-white/70"><X className="h-3 w-3"/></button>
          </span>
        )}
        {activeFilterCount > 0 && (
          <button onClick={() => { setFilterType(""); setFilterPriority(""); setFilterDistrict(""); setPage(0); }}
            className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1">
            Clear filters
          </button>
        )}

        <div className="flex-1"/>
        <button onClick={() => load()} title="Refresh" className="p-2 rounded-full border border-black/15 hover:bg-black/5 transition-colors">
          <RefreshCw className={`h-4 w-4 text-black/50 ${loading ? "animate-spin" : ""}`}/>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="space-y-2 p-4">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-black/5 rounded-lg animate-pulse"/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <IndianRupee className="h-10 w-10 text-black/20"/>
            <p className="text-sm text-black/50">No subsidy applications found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-white border-b border-black/8 text-left">
                  <th className="px-4 py-3 text-sm font-semibold text-black">Application ID</th>
                  <th className="px-4 py-3 text-sm font-semibold text-black">Farmer</th>
                  <th className="px-4 py-3 text-sm font-semibold text-black">Subsidy</th>
                  <th className="px-4 py-3 text-sm font-semibold text-black">Date Applied</th>
                  <th className="px-4 py-3 text-sm font-semibold text-black">Priority</th>
                  <th className="px-4 py-3 text-sm font-semibold text-black">Status</th>
                  <th className="px-4 py-3 text-sm font-semibold text-black">Actions</th>
                </tr></thead>
                <tbody>{pageData.map(a => {
                  const p = getPriority(a.appliedAt);
                  return (
                    <tr key={a.applicationId} className="border-t border-black/6 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm text-black font-medium">{a.applicationId}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-black text-sm">{a.farmerName ?? "—"}</div>
                        <div className="text-xs text-black/50 font-mono mt-0.5">{a.farmerId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-black">{a.schemeName}</div>
                        {a.schemeType && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-medium mt-0.5 inline-block">{a.schemeType}</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-black whitespace-nowrap">{formatDate(a.appliedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium w-fit ${p.color}`}>{p.label}</span>
                          <span className="text-xs text-black/50">{p.days}d elapsed</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={a.status}/></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setReview(a); setNotes(a.adminNotes ?? ""); setFarmerDetail(null); loadFarmerDetail(a.farmerId); }}
                            className="px-3 py-1.5 rounded-full bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors">
                            Review
                          </button>
                          <button
                            onClick={() => { setEditModal(a); setEditReply(a.adminReply ?? ""); setEditNotes(a.adminNotes ?? ""); }}
                            className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteModal({ id: a.applicationId, name: a.schemeName })}
                            className="px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-black/8 bg-white">
              <span className="text-sm text-black/50">Showing {filtered.length} applications</span>
              <div className="flex gap-1 items-center">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-full border border-black/10 hover:bg-black/5 disabled:opacity-30"><ChevronLeft className="h-4 w-4 text-black"/></button>
                <span className="px-3 py-1 text-sm text-black">{page + 1} / {Math.max(1, totalPages)}</span>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-full border border-black/10 hover:bg-black/5 disabled:opacity-30"><ChevronRight className="h-4 w-4 text-black"/></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
