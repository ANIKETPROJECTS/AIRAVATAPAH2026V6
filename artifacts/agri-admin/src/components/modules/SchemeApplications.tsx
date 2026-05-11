import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Search, RefreshCw, FileText, ArrowLeft, AlertTriangle, Trash2, Pencil } from "lucide-react";
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
    Pending:        "bg-amber-500 text-white",
    "Under Review": "bg-blue-600 text-white",
    Approved:       "bg-emerald-600 text-white",
    Rejected:       "bg-red-600 text-white",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${map[status] ?? "bg-slate-600 text-white"}`} style={{ fontFamily: "Poppins, sans-serif" }}>
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

export default function SchemeApplications() {
  const [apps, setApps]         = useState<Application[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("all");
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(0);
  const [review, setReview]     = useState<Application | null>(null);
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState("");
  const [rejectModal, setRejectModal]   = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteModal, setDeleteModal]   = useState<{ id: string; name: string } | null>(null);
  const [editModal, setEditModal]       = useState<Application | null>(null);
  const [editReply, setEditReply]       = useState("");
  const [editNotes, setEditNotes]       = useState("");
  const prevCount               = useRef(0);
  const { addNotification }     = useNotifications();
  const PAGE_SIZE = 10;

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/applications?type=scheme");
      if (!res.ok) throw new Error("Failed");
      const data: Application[] = await res.json();
      if (data.length > prevCount.current && prevCount.current > 0) {
        addNotification({ type: "scheme", title: "New Scheme Application", body: `${data.length - prevCount.current} new scheme application(s) received.` });
      }
      prevCount.current = data.length;
      setApps(data);
    } catch { showToast("⚠️ Failed to load applications"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); const iv = setInterval(() => load(true), 30000); return () => clearInterval(iv); }, []);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3500); }

  const filtered = useMemo(() => {
    let list = tab === "all" ? apps : apps.filter(a => a.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.applicationId.toLowerCase().includes(q) ||
        (a.farmerName ?? "").toLowerCase().includes(q) ||
        a.schemeName.toLowerCase().includes(q) ||
        a.mobile.includes(q) ||
        a.farmerId.toLowerCase().includes(q)
      );
    }
    return list;
  }, [apps, tab, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const counts = useMemo(() => ({
    total:    apps.length,
    pending:  apps.filter(a => a.status === "Pending").length,
    review:   apps.filter(a => a.status === "Under Review").length,
    approved: apps.filter(a => a.status === "Approved").length,
    rejected: apps.filter(a => a.status === "Rejected").length,
  }), [apps]);

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
      showToast(status === "Approved" ? `✅ ${id} approved` : status === "Rejected" ? `❌ ${id} rejected` : `🔍 ${id} moved to Under Review`);
      if (status === "Approved") addNotification({ type: "scheme", title: "Application Approved", body: `Scheme application ${id} has been approved.`, farmerId: updated.farmerId, farmerName: updated.farmerName ?? undefined });
    } catch { showToast("⚠️ Update failed"); }
    finally { setSaving(false); }
  }

  function openRejectModal(id: string) {
    setRejectReason("");
    setRejectModal({ id });
  }

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
      showToast(`🗑️ Application ${id} deleted`);
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
      showToast("✏️ Application updated");
    } catch { showToast("⚠️ Update failed"); }
    finally { setSaving(false); setEditModal(null); }
  }

  if (review) {
    return (
      <div className="space-y-4">
        {toast && <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm">{toast}</div>}

        {/* Reject reason modal */}
        {rejectModal && (
          <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600"/>
                </div>
                <div>
                  <h3 className="font-semibold text-base">Reject Application</h3>
                  <p className="text-xs text-muted-foreground">{rejectModal.id}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Reason for Rejection <span className="text-red-500">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                  placeholder="Enter the reason for rejecting this application…"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80">Cancel</button>
                <button
                  disabled={saving || !rejectReason.trim()}
                  onClick={confirmReject}
                  className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? "Rejecting…" : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setReview(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4"/>
            Back to Applications
          </button>
        </div>

        {/* Full review page */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-heading text-2xl">Application Review</h2>
                <p className="text-xs font-mono text-secondary mt-1">{review.applicationId}</p>
              </div>
              <StatusBadge status={review.status}/>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Farmer info */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Farmer Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/30 rounded-xl p-4">
                <div><p className="text-xs text-muted-foreground">Farmer Name</p><p className="font-semibold mt-0.5">{review.farmerName ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Farmer ID</p><p className="font-mono mt-0.5">{review.farmerId}</p></div>
                <div><p className="text-xs text-muted-foreground">Mobile</p><p className="mt-0.5">{review.mobile}</p></div>
                <div><p className="text-xs text-muted-foreground">District</p><p className="mt-0.5">{review.district ?? "—"}</p></div>
              </div>
            </div>

            {/* Scheme info */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Scheme Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/30 rounded-xl p-4">
                <div className="col-span-2"><p className="text-xs text-muted-foreground">Scheme Name</p><p className="font-semibold mt-0.5">{review.schemeName}</p></div>
                <div><p className="text-xs text-muted-foreground">Type</p><p className="mt-0.5">{review.schemeType ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Applied</p><p className="mt-0.5">{new Date(review.appliedAt).toLocaleDateString("en-IN")}</p></div>
              </div>
            </div>

            {/* Documents */}
            {review.documentRefs && review.documentRefs.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Documents Submitted</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap gap-2">
                  {review.documentRefs.map(ref => (
                    <span key={ref} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                      ✅ {DOC_LABEL[ref] ?? ref}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Previous admin reply */}
            {review.adminReply && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-emerald-700 mb-1">Previous Admin Reply</p>
                <p className="text-sm">{review.adminReply}</p>
              </div>
            )}

            {/* Officer notes */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Officer Notes</h3>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-background border border-border rounded-xl h-28 resize-none focus:outline-none focus:ring-2 focus:ring-secondary/30"
                placeholder="Add notes or comments about this application…"/>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap pt-2 border-t border-border">
              {review.status !== "Approved" && (
                <button disabled={saving} onClick={() => updateStatus(review.applicationId, "Approved", notes)}
                  className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 font-semibold">
                  ✅ Approve Application
                </button>
              )}
              {review.status === "Pending" && (
                <button disabled={saving} onClick={() => updateStatus(review.applicationId, "Under Review", notes)}
                  className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 font-semibold">
                  🔍 Mark Under Review
                </button>
              )}
              {review.status !== "Rejected" && (
                <button disabled={saving} onClick={() => openRejectModal(review.applicationId)}
                  className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 font-semibold">
                  ❌ Reject Application
                </button>
              )}
              <button onClick={() => setReview(null)} className="text-sm px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 font-semibold ml-auto">
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
      {toast && <div className="fixed top-4 right-4 z-50 bg-black text-white px-4 py-3 rounded-lg shadow-lg text-sm" style={{ fontFamily: "Poppins, sans-serif" }}>{toast}</div>}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600"/>
              </div>
              <div>
                <h3 className="font-semibold text-base">Delete Application</h3>
                <p className="text-xs text-muted-foreground font-mono">{deleteModal.id}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Are you sure you want to permanently delete the application for <span className="font-semibold text-foreground">"{deleteModal.name}"</span>? This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteModal(null)} className="px-4 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80">Cancel</button>
              <button disabled={saving} onClick={() => deleteApp(deleteModal.id)} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                {saving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 bg-foreground/40 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Pencil className="h-5 w-5 text-blue-600"/>
              </div>
              <div>
                <h3 className="font-semibold text-base">Edit Application</h3>
                <p className="text-xs text-muted-foreground font-mono">{editModal.applicationId}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold mb-1 block">Reply to Farmer</label>
                <textarea value={editReply} onChange={e => setEditReply(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl h-20 resize-none focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  placeholder="Message visible to the farmer…"/>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Internal Notes</label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl h-20 resize-none focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  placeholder="Internal officer notes (not visible to farmer)…"/>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditModal(null)} className="px-4 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80">Cancel</button>
              <button disabled={saving} onClick={saveEdit} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats — clickable filter cards */}
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
      <div className="flex items-center gap-3 flex-wrap">
        {tab !== "all" && (
          <div className="flex items-center gap-2 text-sm font-medium text-black bg-black/6 rounded-full px-3 py-1.5">
            <span>Filtered: {tab}</span>
            <button onClick={() => { setTab("all"); setPage(0); }} className="text-black/40 hover:text-black leading-none">✕</button>
          </div>
        )}
        <div className="flex-1"/>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/40"/>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search…" className="pl-8 pr-3 py-2 text-sm border border-black/15 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-black/20 text-black"/>
        </div>
        <button onClick={() => load()} title="Refresh" className="p-2 rounded-lg border border-black/15 hover:bg-black/5 transition-colors">
          <RefreshCw className={`h-4 w-4 text-black/50 ${loading ? "animate-spin" : ""}`}/>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="space-y-2 p-4">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-black/5 rounded-lg animate-pulse"/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <FileText className="h-10 w-10 text-black/20"/>
            <p className="text-sm text-black/50">No scheme applications yet. Farmers can apply from the mobile app.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-white border-b border-black/8 text-left">
                  <th className="px-4 py-3 text-sm font-medium text-black">Application ID</th>
                  <th className="px-4 py-3 text-sm font-medium text-black">Farmer</th>
                  <th className="px-4 py-3 text-sm font-medium text-black">Date Applied</th>
                  <th className="px-4 py-3 text-sm font-medium text-black">Scheme</th>
                  <th className="px-4 py-3 text-sm font-medium text-black">Priority</th>
                  <th className="px-4 py-3 text-sm font-medium text-black">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-black">Actions</th>
                </tr></thead>
                <tbody>{pageData.map(a => {
                  const p = getPriority(a.appliedAt);
                  return (
                  <tr key={a.applicationId} className="border-t border-black/6 hover:bg-black/2 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm text-black font-medium">{a.applicationId}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-black text-sm">{a.farmerName ?? "—"}</div>
                      <div className="text-xs text-black font-mono mt-0.5">{a.farmerId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-black whitespace-nowrap">{formatDate(a.appliedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-black">{a.schemeName}</div>
                      {a.schemeType && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-medium mt-0.5 inline-block">{a.schemeType}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium w-fit ${p.color}`}>{p.label}</span>
                        <span className="text-xs text-black/50">{p.days}d elapsed</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={a.status}/></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setReview(a); setNotes(a.adminNotes ?? ""); }}
                          className="p-2 rounded-lg hover:bg-black/8 transition-colors" title="View / Review">
                          <img src="/icons/view.png" className="h-4 w-4" alt="view"/>
                        </button>
                        <button onClick={() => { setEditModal(a); setEditReply(a.adminReply ?? ""); setEditNotes(a.adminNotes ?? ""); }}
                          className="p-2 rounded-lg hover:bg-black/8 transition-colors" title="Edit reply & notes">
                          <img src="/icons/edit.png" className="h-4 w-4" alt="edit"/>
                        </button>
                        <button onClick={() => setDeleteModal({ id: a.applicationId, name: a.schemeName })}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                          <img src="/icons/bin.png" className="h-4 w-4" alt="delete"/>
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
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-black/10 hover:bg-black/5 disabled:opacity-30"><ChevronLeft className="h-4 w-4 text-black"/></button>
                <span className="px-3 py-1 text-sm text-black">{page + 1} / {Math.max(1, totalPages)}</span>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-black/10 hover:bg-black/5 disabled:opacity-30"><ChevronRight className="h-4 w-4 text-black"/></button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
