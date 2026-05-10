import { useState, useMemo, useEffect } from "react";
import { Search, Paperclip, Lock, ArrowLeft, X } from "lucide-react";
import { apiCreateGrievance } from "@/data/grievanceApi";
import { apiFetchFarmers, type FarmerRecord } from "@/data/farmerApi";

const CATEGORIES = [
  "Subsidy Delay", "Wrong Beneficiary", "Document Issue",
  "Officer Misconduct", "Technical Error", "Portal/App Issue", "Other",
];

const SUBJECT_MAP: Record<string, string> = {
  "Subsidy Delay": "Subsidy amount has not been credited to farmer's account",
  "Wrong Beneficiary": "Farmer has been incorrectly listed as wrong beneficiary",
  "Document Issue": "Issue with submitted or verified documents",
  "Officer Misconduct": "Complaint regarding officer misconduct",
  "Technical Error": "Technical error in the system or portal",
  "Portal/App Issue": "Issue with the portal or mobile application",
  "Other": "",
};

interface Props {
  onBack: () => void;
  onSuccess: (msg: string) => void;
  adminName: string;
}

export default function GrievanceFilingForm({ onBack, onSuccess, adminName }: Props) {
  const [allFarmers, setAllFarmers] = useState<FarmerRecord[]>([]);
  const [farmerSearch, setFarmerSearch] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerRecord | null>(null);
  const [useManual, setUseManual] = useState(false);
  const [manualMobile, setManualMobile] = useState("");
  const [manualName, setManualName] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [attachment, setAttachment] = useState<{ name: string; base64: string; mimeType: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetchFarmers().then(setAllFarmers).catch(() => {});
  }, []);

  const suggestions = useMemo(() => {
    if (!farmerSearch.trim()) return [];
    const q = farmerSearch.trim().toLowerCase();
    return allFarmers.filter(f =>
      f.name?.toLowerCase().includes(q) ||
      f.farmerId?.toLowerCase().includes(q) ||
      f.mobile?.includes(q)
    ).slice(0, 6);
  }, [allFarmers, farmerSearch]);

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    setSubject(SUBJECT_MAP[cat] ?? "");
    if (cat !== "Other") setCustomCategory("");
  }

  async function handleAttach() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setAttachment({ name: file.name, base64: dataUrl.split(",")[1] ?? "", mimeType: file.type });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  async function handleSubmit() {
    setError("");
    const mobile = useManual ? manualMobile.trim() : (selectedFarmer?.mobile ?? "");
    const farmerName = useManual ? (manualName.trim() || null) : (selectedFarmer?.name ?? null);
    const farmerId = useManual ? null : (selectedFarmer?.farmerId ?? null);

    if (!mobile) { setError("Please select a farmer or enter a mobile number."); return; }
    if (!category) { setError("Please select a category."); return; }
    if (!subject.trim()) { setError("Please enter a subject."); return; }
    if (!description.trim()) { setError("Please describe the grievance."); return; }

    setSubmitting(true);
    try {
      const gr = await apiCreateGrievance({
        mobile, farmerId, farmerName,
        category: category === "Other" && customCategory.trim() ? customCategory.trim() : category,
        subject: subject.trim(),
        description: (description.trim() + (internalNotes.trim() ? `\n\n[Internal] ${internalNotes.trim()}` : "")),
        priority,
        assignedTo: assignedTo.trim() || undefined,
        attachments: attachment ? [attachment] : [],
        source: "admin",
        raisedBy: adminName,
      });
      onSuccess(`✅ Grievance ${gr.grievanceId} filed successfully`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit grievance");
      setSubmitting(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50";
  const labelCls = "block text-sm font-medium mb-1.5";

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Grievances
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl max-w-2xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
          <h2 className="font-heading text-xl">📢 File Grievance</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Farmer selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">Farmer <span className="text-destructive">*</span></label>
              <button onClick={() => { setUseManual(m => !m); setSelectedFarmer(null); setFarmerSearch(""); }}
                className="text-xs text-primary underline">
                {useManual ? "← Search registered farmer" : "Enter manually (unregistered caller)"}
              </button>
            </div>

            {useManual ? (
              <div className="grid grid-cols-2 gap-3">
                <input value={manualMobile} onChange={e => setManualMobile(e.target.value)}
                  className={inputCls} placeholder="Mobile number *" maxLength={10} />
                <input value={manualName} onChange={e => setManualName(e.target.value)}
                  className={inputCls} placeholder="Farmer name (optional)" />
              </div>
            ) : selectedFarmer ? (
              <div className="flex items-center justify-between bg-agri-light border border-border rounded-lg px-4 py-3">
                <div>
                  <div className="font-medium text-sm">{selectedFarmer.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedFarmer.farmerId} · {selectedFarmer.mobile} · {selectedFarmer.district}
                  </div>
                </div>
                <button onClick={() => setSelectedFarmer(null)}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={farmerSearch} onChange={e => setFarmerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-background"
                  placeholder="Search by name, Farmer ID, or mobile…" />
                {suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                    {suggestions.map(f => (
                      <button key={f.farmerId} onClick={() => { setSelectedFarmer(f); setFarmerSearch(""); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted border-b border-border/40 last:border-0">
                        <div className="font-medium">{f.name}</div>
                        <div className="text-xs text-muted-foreground">{f.farmerId} · {f.mobile} · {f.district}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category <span className="text-destructive">*</span></label>
              <select value={category} onChange={e => handleCategoryChange(e.target.value)} className={inputCls}>
                <option value="">Select category…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {category === "Other" && (
                <input value={customCategory} onChange={e => setCustomCategory(e.target.value)}
                  className={`${inputCls} mt-2`} placeholder="Specify the category…" />
              )}
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <div className="flex gap-2 mt-1">
                {["High", "Medium", "Low"].map(p => (
                  <button key={p} onClick={() => setPriority(p)}
                    className={`flex-1 text-xs py-2 rounded-lg border font-medium transition-colors ${
                      priority === p
                        ? p === "High" ? "bg-destructive/10 text-destructive border-destructive/40"
                          : p === "Medium" ? "bg-warning/20 text-warning border-warning/40"
                          : "bg-success/10 text-success border-success/40"
                        : "bg-card border-border hover:bg-muted"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className={labelCls}>Subject <span className="text-destructive">*</span></label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              className={inputCls} placeholder="Brief subject of the grievance" />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description <span className="text-destructive">*</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className={`${inputCls} h-28 resize-none`}
              placeholder="Describe the grievance in detail — include relevant dates, amounts, or reference numbers…" />
          </div>

          {/* Assign to + Internal notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Assign To</label>
              <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
                className={inputCls} placeholder="Officer name (optional)" />
            </div>
            <div>
              <label className={`${labelCls} flex items-center gap-1`}><Lock className="h-3 w-3" /> Internal Notes</label>
              <input value={internalNotes} onChange={e => setInternalNotes(e.target.value)}
                className={inputCls} placeholder="Visible to officers only" />
            </div>
          </div>

          {/* Attachment */}
          <div>
            <label className={labelCls}>
              Attachment <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </label>
            {attachment ? (
              <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2 text-sm border border-border">
                <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate">{attachment.name}</span>
                <button onClick={() => setAttachment(null)}><X className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button>
              </div>
            ) : (
              <button onClick={handleAttach}
                className="w-full text-sm px-3 py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:bg-muted/30 transition-colors flex items-center justify-center gap-2">
                <Paperclip className="h-4 w-4" /> Attach document or image
              </button>
            )}
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSubmit}
              disabled={submitting || (!selectedFarmer && !manualMobile.trim()) || !category || !subject.trim() || !description.trim()}
              className="flex-1 text-sm px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 font-medium">
              {submitting ? "Filing…" : "📢 File Grievance"}
            </button>
            <button onClick={onBack} className="text-sm px-4 py-2.5 border border-border rounded-lg hover:bg-muted">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
