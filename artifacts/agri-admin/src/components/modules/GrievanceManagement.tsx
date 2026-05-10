import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Search, Paperclip, ArrowLeft, AlertTriangle } from "lucide-react";
import { apiFetchGrievances, apiUpdateGrievance, apiDeleteGrievance, type GrievanceRecord } from "@/data/grievanceApi";
import GrievanceFilingForm from "@/components/forms/GrievanceFilingForm";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES = ["Subsidy Delay", "Wrong Beneficiary", "Document Issue", "Officer Misconduct", "Technical Error", "Portal/App Issue", "Other"];
const STATUSES = ["Open", "In Progress", "Resolved", "Escalated", "Closed", "Rejected"] as const;
const PRIORITIES = ["High", "Medium", "Low"] as const;

function PriorityBadge({ p }: { p: string }) {
  const cls = p === "High" ? "bg-destructive/10 text-destructive" : p === "Medium" ? "bg-warning/20 text-warning" : "bg-success/10 text-success";
  const icon = p === "High" ? "🔴" : p === "Medium" ? "🟡" : "🟢";
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{icon} {p}</span>;
}

function StatusBadge({ s }: { s: string }) {
  const cls =
    s === "Resolved" ? "bg-success/10 text-success" :
    s === "In Progress" ? "bg-info/10 text-info" :
    s === "Escalated" ? "bg-destructive/10 text-destructive" :
    s === "Rejected" ? "bg-destructive/20 text-destructive" :
    s === "Closed" ? "bg-muted text-muted-foreground" :
    "bg-warning/20 text-warning";
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{s}</span>;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function avgResolutionDays(list: GrievanceRecord[]) {
  const resolved = list.filter(g => g.resolvedAt && g.createdAt);
  if (resolved.length === 0) return "—";
  const avg = resolved.reduce((sum, g) => {
    const diff = (new Date(g.resolvedAt!).getTime() - new Date(g.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return sum + diff;
  }, 0) / resolved.length;
  return `${avg.toFixed(1)} days`;
}

function GrievanceDetailPage({
  gr, onBack, onUpdated, adminName,
}: {
  gr: GrievanceRecord; onBack: () => void;
  onUpdated: (updated: GrievanceRecord) => void;
  adminName: string;
}) {
  const [reply, setReply] = useState(gr.adminReply ?? "");
  const [notes, setNotes] = useState(gr.adminNotes ?? "");
  const [assignedTo, setAssignedTo] = useState(gr.assignedTo ?? "");
  const [priority, setPriority] = useState(gr.priority);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSaving, setRejectSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentGr = gr;

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function handleSaveChanges() {
    setSaving(true);
    try {
      const updated = await apiUpdateGrievance(gr.grievanceId, {
        adminReply: reply,
        adminNotes: notes,
        priority,
        assignedTo: assignedTo || null,
      });
      onUpdated(updated);
      showToast("✅ Changes saved");
    } catch { showToast("❌ Failed to save"); }
    finally { setSaving(false); }
  }

  async function sendNotification(title: string, body: string) {
    if (!gr.mobile) return;
    try {
      await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: gr.mobile,
          farmerId: gr.farmerId ?? undefined,
          type: "grievance",
          title,
          body,
          data: { grievanceId: gr.grievanceId },
        }),
      });
    } catch { /* non-fatal */ }
  }

  async function handleStatusChange(newStatus: string, extra?: { resolvedAt?: string; rejectionReason?: string }) {
    setSaving(true);
    try {
      const updated = await apiUpdateGrievance(gr.grievanceId, { status: newStatus, ...extra });
      onUpdated(updated);
      showToast(`✅ Status updated to ${newStatus}`);
      if (newStatus === "Resolved") {
        await sendNotification(
          "Grievance Resolved ✅",
          `Your grievance ${gr.grievanceId} regarding ${gr.category} has been resolved.${reply.trim() ? ` Message: ${reply.trim()}` : ""}`
        );
      } else if (newStatus === "Escalated") {
        await sendNotification(
          "Grievance Escalated ⬆️",
          `Your grievance ${gr.grievanceId} regarding ${gr.category} has been escalated for priority handling.`
        );
      } else if (newStatus === "In Progress") {
        await sendNotification(
          "Grievance Update 🔄",
          `Your grievance ${gr.grievanceId} regarding ${gr.category} is now being actively processed.`
        );
      }
    } catch { showToast("❌ Failed to update status"); }
    finally { setSaving(false); }
  }

  async function handleResolve() {
    await handleStatusChange("Resolved", { resolvedAt: new Date().toISOString() });
  }

  async function handleEscalate() {
    await handleStatusChange("Escalated");
  }

  async function handleReopen() {
    await handleStatusChange("Open");
  }

  async function handleConfirmReject() {
    if (!rejectReason.trim()) { showToast("⚠️ Please enter a rejection reason"); return; }
    setRejectSaving(true);
    try {
      const updated = await apiUpdateGrievance(gr.grievanceId, {
        status: "Rejected",
        rejectionReason: rejectReason.trim(),
      });
      onUpdated(updated);
      setShowRejectInput(false);
      setRejectReason("");
      showToast("❌ Grievance rejected");
      await sendNotification(
        "Grievance Update ❌",
        `Your grievance ${gr.grievanceId} regarding ${gr.category} has been reviewed. Reason: ${rejectReason.trim()}`
      );
    } catch { showToast("❌ Failed to reject grievance"); }
    finally { setRejectSaving(false); }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await apiDeleteGrievance(gr.grievanceId);
      onBack();
      showToast("🗑️ Grievance deleted");
    } catch { showToast("❌ Failed to delete grievance"); setDeleting(false); }
  }

  const isSettled = currentGr.status === "Resolved" || currentGr.status === "Rejected" || currentGr.status === "Closed";
  const hasAttachments = gr.attachments && gr.attachments.length > 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in">
          {toast}
        </div>
      )}

      {/* Back button + header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Grievances
        </button>
      </div>

      {/* Title row */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-sm text-muted-foreground">{gr.grievanceId}</span>
              <StatusBadge s={currentGr.status} />
              <PriorityBadge p={priority} />
              {gr.source === "admin" && <span className="text-xs px-2 py-0.5 rounded-full bg-info/10 text-info">Admin Filed</span>}
            </div>
            <h2 className="font-heading text-xl">{gr.subject}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Filed {fmt(gr.createdAt)}
              {gr.resolvedAt ? ` · Resolved ${fmt(gr.resolvedAt)}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: details */}
        <div className="lg:col-span-3 space-y-4">
          {/* Farmer info */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="font-heading text-sm mb-3 text-muted-foreground uppercase tracking-wide">Farmer Information</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Farmer: </span><strong>{gr.farmerName ?? "—"}</strong></div>
              <div><span className="text-muted-foreground">Mobile: </span><strong>{gr.mobile}</strong></div>
              <div><span className="text-muted-foreground">Farmer ID: </span><strong>{gr.farmerId ?? "—"}</strong></div>
              <div><span className="text-muted-foreground">Category: </span><strong>{gr.category}</strong></div>
              {gr.assignedTo && <div><span className="text-muted-foreground">Assigned To: </span><strong>{gr.assignedTo}</strong></div>}
              {gr.raisedBy && <div><span className="text-muted-foreground">Raised By: </span><strong>{gr.raisedBy}</strong></div>}
            </div>
          </div>

          {/* Description */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="font-heading text-sm mb-3 text-muted-foreground uppercase tracking-wide">Grievance Description</h4>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{gr.description}</div>
          </div>

          {/* Rejection reason (if rejected) */}
          {currentGr.status === "Rejected" && currentGr.rejectionReason && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
              <h4 className="font-heading text-sm mb-2 text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Rejection Reason
              </h4>
              <p className="text-sm whitespace-pre-wrap">{currentGr.rejectionReason}</p>
            </div>
          )}

          {/* Admin reply to farmer */}
          {currentGr.adminReply && (
            <div className="bg-agri-light border border-border rounded-xl p-5">
              <h4 className="font-heading text-sm mb-2 text-muted-foreground uppercase tracking-wide">Reply to Farmer</h4>
              <p className="text-sm whitespace-pre-wrap">{currentGr.adminReply}</p>
            </div>
          )}

          {/* Attachments */}
          {hasAttachments && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="font-heading text-sm mb-3 text-muted-foreground uppercase tracking-wide">Attachments</h4>
              <div className="flex flex-wrap gap-2">
                {gr.attachments.map((att, i) => {
                  const isImg = att.mimeType.startsWith("image/");
                  return isImg ? (
                    <a key={i} href={`data:${att.mimeType};base64,${att.base64}`} download={att.name}>
                      <img src={`data:${att.mimeType};base64,${att.base64}`} alt={att.name} className="h-24 w-24 object-cover rounded border border-border cursor-pointer hover:opacity-80 transition-opacity" />
                    </a>
                  ) : (
                    <a key={i} href={`data:${att.mimeType};base64,${att.base64}`} download={att.name}
                      className="flex items-center gap-2 text-xs px-3 py-2 bg-muted rounded border border-border hover:bg-muted/70 transition-colors">
                      <Paperclip className="h-3.5 w-3.5" />{att.name}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: admin actions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status action buttons */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h4 className="font-heading text-sm text-muted-foreground uppercase tracking-wide">Status Actions</h4>
            <div className="flex flex-col gap-2">
              {isSettled ? (
                <button onClick={handleReopen} disabled={saving}
                  className="w-full text-sm px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 font-medium">
                  🔄 Reopen Grievance
                </button>
              ) : (
                <>
                  {currentGr.status !== "Resolved" && (
                    <button onClick={handleResolve} disabled={saving}
                      className="w-full text-sm px-4 py-2.5 rounded-lg bg-success text-white hover:opacity-90 disabled:opacity-50 font-medium">
                      ✅ Mark as Resolved
                    </button>
                  )}
                  {currentGr.status !== "Escalated" && (
                    <button onClick={handleEscalate} disabled={saving}
                      className="w-full text-sm px-4 py-2.5 rounded-lg border border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 disabled:opacity-50 font-medium">
                      ⬆️ Escalate
                    </button>
                  )}
                  {currentGr.status !== "In Progress" && currentGr.status !== "Resolved" && currentGr.status !== "Escalated" && (
                    <button onClick={() => handleStatusChange("In Progress")} disabled={saving}
                      className="w-full text-sm px-4 py-2.5 rounded-lg border border-info/40 bg-info/10 text-info hover:bg-info/20 disabled:opacity-50 font-medium">
                      🔄 Mark In Progress
                    </button>
                  )}
                  <button onClick={() => setShowRejectInput(v => !v)} disabled={saving}
                    className="w-full text-sm px-4 py-2.5 rounded-lg border border-destructive/40 bg-destructive/5 text-destructive hover:bg-destructive/10 disabled:opacity-50 font-medium">
                    ❌ Reject Grievance
                  </button>
                </>
              )}
            </div>

            {showRejectInput && (
              <div className="border-t border-border pt-3 space-y-2">
                <label className="text-xs text-muted-foreground font-medium block">Rejection Reason <span className="text-destructive">*</span></label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-background resize-none h-24 focus:outline-none focus:ring-2 focus:ring-destructive/30"
                  placeholder="Explain why this grievance is being rejected…"
                />
                <div className="flex gap-2">
                  <button onClick={handleConfirmReject} disabled={rejectSaving || !rejectReason.trim()}
                    className="flex-1 text-sm px-3 py-2 rounded-lg bg-destructive text-white hover:opacity-90 disabled:opacity-50 font-medium">
                    {rejectSaving ? "Rejecting…" : "Confirm Reject"}
                  </button>
                  <button onClick={() => { setShowRejectInput(false); setRejectReason(""); }}
                    className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-border pt-3">
              {showDeleteConfirm ? (
                <div className="space-y-2">
                  <p className="text-xs text-destructive font-medium">⚠️ This will permanently delete the grievance. This action cannot be undone.</p>
                  <div className="flex gap-2">
                    <button onClick={handleConfirmDelete} disabled={deleting}
                      className="flex-1 text-sm px-3 py-2 rounded-lg bg-destructive text-white hover:opacity-90 disabled:opacity-50 font-medium">
                      {deleting ? "Deleting…" : "Yes, Delete"}
                    </button>
                    <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                      className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setShowDeleteConfirm(true); setShowRejectInput(false); }} disabled={saving}
                  className="w-full text-sm px-4 py-2.5 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 disabled:opacity-50 font-medium">
                  🗑️ Delete Grievance
                </button>
              )}
            </div>
          </div>

          {/* Admin reply & notes */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h4 className="font-heading text-sm text-muted-foreground uppercase tracking-wide">Admin Response</h4>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button key={p} onClick={() => setPriority(p)}
                    className={`flex-1 text-xs py-2 rounded-lg border font-medium transition-colors ${
                      priority === p
                        ? p === "High" ? "bg-destructive/10 text-destructive border-destructive/40"
                          : p === "Medium" ? "bg-warning/20 text-warning border-warning/40"
                          : "bg-success/10 text-success border-success/40"
                        : "bg-card border-border hover:bg-muted"
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Assigned To</label>
              <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Officer name or leave blank" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Reply to Farmer</label>
              <textarea value={reply} onChange={e => setReply(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-background h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder={`Dear ${gr.farmerName ?? "Farmer"} ji, We have received your grievance regarding ${gr.category.toLowerCase()} and are working to resolve it at the earliest.`} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Internal Notes <span className="text-muted-foreground font-normal">(not visible to farmer)</span></label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-background h-20 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Internal notes, follow-up actions…" />
            </div>

            <button onClick={handleSaveChanges} disabled={saving}
              className="w-full text-sm px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 font-medium">
              {saving ? "Saving…" : "💾 Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type ViewState = "list" | "detail" | "new";

export default function GrievanceManagement() {
  const { currentUser } = useAuth();
  const [grievances, setGrievances] = useState<GrievanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [page, setPage] = useState(0);
  const [view, setView] = useState<ViewState>("list");
  const [selectedGr, setSelectedGr] = useState<GrievanceRecord | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    setLoading(true);
    setError("");
    apiFetchGrievances()
      .then(data => setGrievances(data))
      .catch(() => setError("Failed to load grievances. Please retry."))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = useMemo(() => {
    let list = grievances;
    if (statusFilter) list = list.filter(g => g.status === statusFilter);
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      list = list.filter(g =>
        g.farmerName?.toLowerCase().includes(q) ||
        g.grievanceId.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.subject.toLowerCase().includes(q) ||
        g.mobile.includes(q)
      );
    }
    return list;
  }, [grievances, statusFilter, searchQ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));
  const pageData = filtered.slice(page * 10, (page + 1) * 10);

  const kpis = [
    { label: "Total", value: grievances.length },
    { label: "Open", value: grievances.filter(g => g.status === "Open").length },
    { label: "In Progress", value: grievances.filter(g => g.status === "In Progress").length },
    { label: "Resolved", value: grievances.filter(g => g.status === "Resolved").length },
    { label: "Escalated", value: grievances.filter(g => g.status === "Escalated").length },
    { label: "Avg Resolution", value: avgResolutionDays(grievances) },
  ];

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    CATEGORIES.forEach(c => { m[c] = grievances.filter(g => g.category === c).length; });
    const other = grievances.filter(g => !CATEGORIES.slice(0, -1).includes(g.category)).length;
    m["Other"] = other;
    return m;
  }, [grievances]);

  function handleUpdated(updated: GrievanceRecord) {
    setGrievances(prev => prev.map(g => g.grievanceId === updated.grievanceId ? updated : g));
    setSelectedGr(updated);
  }

  function openDetail(g: GrievanceRecord) {
    setSelectedGr(g);
    setView("detail");
  }

  function goBack() {
    setView("list");
    setSelectedGr(null);
  }

  if (view === "new") {
    return (
      <div className="animate-fade-in">
        {toast && <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm">{toast}</div>}
        <GrievanceFilingForm
          onBack={() => setView("list")}
          onSuccess={(msg) => { showToast(msg); refresh(); setView("list"); }}
          adminName={currentUser?.name ?? "Admin"}
        />
      </div>
    );
  }

  if (view === "detail" && selectedGr) {
    return (
      <GrievanceDetailPage
        gr={selectedGr}
        onBack={goBack}
        onUpdated={handleUpdated}
        adminName={currentUser?.name ?? "Admin"}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm">{toast}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-card border border-border rounded-lg p-3 text-center card-hover">
            <div className="text-xl font-heading">{loading ? "…" : k.value}</div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      {/* AI Classifier + File button */}
      <div className="flex items-start gap-4">
        <div className="bg-agri-light border border-border rounded-lg p-5 flex-1">
          <h3 className="font-heading text-lg mb-3">🤖 AI Grievance Classifier</h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c}
                onClick={() => { setStatusFilter(""); setSearchQ(c === "Other" ? "" : c); setPage(0); }}
                className="text-xs px-3 py-1.5 rounded-full bg-card border border-border font-medium hover:bg-muted transition-colors">
                {c} ({catCounts[c] ?? 0})
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => setView("new")}
            className="flex items-center gap-1.5 text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 whitespace-nowrap">
            <Plus className="h-4 w-4" /> File Grievance
          </button>
          <button onClick={refresh}
            className="flex items-center gap-1.5 text-sm px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 whitespace-nowrap">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background"
            placeholder="Search by farmer name, GR ID, category…" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["", "Open", "In Progress", "Resolved", "Escalated", "Rejected"] as const).map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"}`}>
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="bg-card border border-destructive/30 rounded-lg p-8 text-center">
          <p className="text-destructive text-sm mb-3">{error}</p>
          <button onClick={refresh} className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg">Retry</button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-muted/40 rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-muted-foreground text-sm">No grievances found{statusFilter ? ` with status "${statusFilter}"` : ""}.</p>
          {grievances.length > 0 && <button onClick={() => { setStatusFilter(""); setSearchQ(""); }} className="mt-3 text-sm text-primary underline">Clear filters</button>}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">GR ID</th>
                  <th className="px-4 py-3 font-medium">Farmer</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Filed</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Assigned</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map(g => (
                  <tr key={g.grievanceId} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs">{g.grievanceId}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{g.farmerName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{g.mobile}</div>
                    </td>
                    <td className="px-4 py-2.5 text-xs">{g.category}</td>
                    <td className="px-4 py-2.5 max-w-[200px]">
                      <span className="block truncate text-xs" title={g.subject}>{g.subject}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap">{fmt(g.createdAt)}</td>
                    <td className="px-4 py-2.5"><PriorityBadge p={g.priority} /></td>
                    <td className="px-4 py-2.5 text-xs">{g.assignedTo ?? <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-2.5"><StatusBadge s={g.status} /></td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => openDetail(g)} className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">{filtered.length} grievance{filtered.length !== 1 ? "s" : ""}  ·  Page {page + 1} of {totalPages}</span>
            <div className="flex gap-1">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
