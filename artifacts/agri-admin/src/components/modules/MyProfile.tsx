import { useState, useRef } from "react";
import {
  X, Camera, Save, Eye, EyeOff, User, Mail, Phone, MapPin,
  Key, Shield, CheckCircle2, XCircle, Edit2, Lock, AlertTriangle,
  BadgeCheck, Calendar, Clock,
} from "lucide-react";
import {
  useAuth, SECTIONS, SECTION_LABELS, ROLE_LABELS, AVATAR_COLORS, type SectionKey,
} from "@/contexts/AuthContext";

function initials(name: string) {
  return name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}
function formatDate(ts?: number) {
  if (!ts) return "Never";
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function timeAgo(ts?: number): string {
  if (!ts) return "Never";
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props { onClose: () => void; }

export default function MyProfile({ onClose }: Props) {
  const { currentUser, updateUser } = useAuth();
  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "access">("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* profile fields */
  const [form, setForm] = useState({
    name:        currentUser.name,
    email:       currentUser.email,
    designation: currentUser.designation,
    district:    currentUser.district,
    phone:       currentUser.phone,
    avatarColor: currentUser.avatarColor,
    avatarUrl:   currentUser.avatarUrl ?? "",
  });

  /* password fields */
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); setSaved(false); };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { set("avatarUrl", ev.target?.result as string); };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (!form.designation.trim()) e.designation = "Designation is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    updateUser(currentUser.id, {
      name: form.name.trim(),
      email: form.email.trim(),
      designation: form.designation.trim(),
      district: form.district.trim(),
      phone: form.phone.trim(),
      avatarColor: form.avatarColor,
      avatarUrl: form.avatarUrl || undefined,
    });
    setSaving(false);
    setSaved(true);
  };

  const handlePasswordSave = async () => {
    setPwError("");
    if (!pwForm.current) { setPwError("Enter your current password."); return; }
    if (!pwForm.next || pwForm.next.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("New passwords do not match."); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    updateUser(currentUser.id, { password: pwForm.next });
    setSaving(false);
    setPwSaved(true);
    setPwForm({ current: "", next: "", confirm: "" });
  };

  const enabledSections = SECTIONS.filter(s => currentUser.permissions[s]);
  const disabledSections = SECTIONS.filter(s => !currentUser.permissions[s]);

  const inputCls = "w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all";
  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
  const PwField = ({ label, field }: { label: string; field: "current" | "next" | "confirm" }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
        <input
          type={showPw[field] ? "text" : "password"}
          value={pwForm[field]}
          onChange={e => { setPwForm(p => ({ ...p, [field]: e.target.value })); setPwError(""); setPwSaved(false); }}
          className={inputCls + " pl-9 pr-10"}
          placeholder={field === "current" ? "Your current password" : "Min 8 characters"}
        />
        <button type="button" onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {showPw[field] ? <EyeOff className="h-3.5 w-3.5"/> : <Eye className="h-3.5 w-3.5"/>}
        </button>
      </div>
    </div>
  );

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Key },
    { id: "access", label: "Access & Permissions", icon: Shield },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onClick={onClose}/>
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex-shrink-0 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0D2B1E 0%, #1a4a30 60%, #0f3d25 100%)" }}>
          {/* Decorative blobs */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #4ade80, transparent)" }}/>
          <div className="absolute -bottom-12 left-12 w-40 h-40 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #2dd4bf, transparent)" }}/>

          <div className="relative px-8 pt-6 pb-0">
            <button onClick={onClose} className="absolute top-4 right-5 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X className="h-4 w-4 text-white/70"/>
            </button>

            <div className="flex items-end gap-6 pb-0">
              {/* Avatar */}
              <div className="relative flex-shrink-0 pb-4">
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${form.avatarColor} flex items-center justify-center font-bold text-white text-3xl shadow-xl overflow-hidden border-3 border-white/20 cursor-pointer group relative`}
                >
                  {form.avatarUrl
                    ? <img src={form.avatarUrl} alt="" className="w-full h-full object-cover"/>
                    : initials(form.name || "?")}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                    <Camera className="h-6 w-6 text-white"/>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto}/>
                <button onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-md hover:bg-emerald-600 transition-colors border-2 border-white">
                  <Camera className="h-3.5 w-3.5 text-white"/>
                </button>
              </div>

              {/* Name & info */}
              <div className="pb-5 flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-xl text-white leading-tight">{currentUser.name}</h2>
                  <BadgeCheck className="h-5 w-5 text-emerald-400 flex-shrink-0"/>
                </div>
                <div className="text-white/60 text-sm">{currentUser.designation}</div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold border border-white/20" style={{ backgroundColor: "rgba(74,222,128,0.15)", color: "#4ade80" }}>
                    {ROLE_LABELS[currentUser.role]}
                  </span>
                  {currentUser.district && <span className="text-[11px] text-white/50 flex items-center gap-1"><MapPin className="h-3 w-3"/>{currentUser.district}</span>}
                  {currentUser.lastLogin && <span className="text-[11px] text-white/50 flex items-center gap-1"><Clock className="h-3 w-3"/>Last login {timeAgo(currentUser.lastLogin)}</span>}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-2">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === tab.id ? "bg-white text-emerald-800" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
                  <tab.icon className="h-3.5 w-3.5"/>{tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {/* ── Profile Tab ── */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Avatar colour picker */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Avatar Colour</div>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map(c => (
                    <button key={c} onClick={() => { setForm(p => ({ ...p, avatarColor: c, avatarUrl: "" })); setSaved(false); }}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${c} transition-all ${form.avatarColor === c && !form.avatarUrl ? "ring-2 ring-offset-2 ring-emerald-500 scale-110" : "hover:scale-105 opacity-80"}`}/>
                  ))}
                  {form.avatarUrl && (
                    <button onClick={() => setForm(p => ({ ...p, avatarUrl: "" }))}
                      className="h-8 px-3 rounded-full text-xs text-slate-500 border border-slate-200 hover:bg-slate-50 flex items-center gap-1">
                      <X className="h-3 w-3"/> Remove photo
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name *" error={errors.name}>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
                    <input value={form.name} onChange={e => set("name", e.target.value)} className={inputCls + " pl-9"} placeholder="Your full name"/>
                  </div>
                </Field>
                <Field label="Email Address *" error={errors.email}>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
                    <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputCls + " pl-9"} placeholder="name@agri.mh.gov.in"/>
                  </div>
                </Field>
                <Field label="Designation *" error={errors.designation}>
                  <input value={form.designation} onChange={e => set("designation", e.target.value)} className={inputCls} placeholder="e.g. District Agricultural Officer"/>
                </Field>
                <Field label="District / Office">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
                    <input value={form.district} onChange={e => set("district", e.target.value)} className={inputCls + " pl-9"} placeholder="e.g. Pune"/>
                  </div>
                </Field>
                <Field label="Phone Number">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
                    <input value={form.phone} onChange={e => set("phone", e.target.value)} className={inputCls + " pl-9"} placeholder="+91 98765 43210"/>
                  </div>
                </Field>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Member Since</div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-3.5 w-3.5 text-slate-400"/>
                    {formatDate(currentUser.createdAt)}
                  </div>
                </div>
              </div>

              {saved && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0"/>Profile updated successfully.
                </div>
              )}
            </div>
          )}

          {/* ── Security Tab ── */}
          {activeTab === "security" && (
            <div className="space-y-6 max-w-md">
              <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-500 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5"/>
                For security, enter your current password before setting a new one. Use at least 8 characters.
              </div>
              <PwField label="Current Password" field="current"/>
              <PwField label="New Password" field="next"/>
              <PwField label="Confirm New Password" field="confirm"/>
              {pwError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0"/>{pwError}
                </div>
              )}
              {pwSaved && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0"/>Password changed successfully.
                </div>
              )}
              <button onClick={handlePasswordSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60">
                <Key className="h-4 w-4"/>{saving ? "Saving…" : "Update Password"}
              </button>
            </div>
          )}

          {/* ── Access Tab ── */}
          {activeTab === "access" && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                <Lock className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-slate-400"/>
                Your section permissions are set by your administrator and cannot be changed here. Contact an Admin to update your access.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500"/>
                    <span className="text-sm font-semibold text-slate-700">Sections you can access ({enabledSections.length})</span>
                  </div>
                  <div className="space-y-2">
                    {enabledSections.map(s => (
                      <div key={s} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0"/>
                        <span className="text-xs font-medium text-emerald-800">{SECTION_LABELS[s]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="h-4 w-4 text-slate-300"/>
                    <span className="text-sm font-semibold text-slate-400">Restricted sections ({disabledSections.length})</span>
                  </div>
                  <div className="space-y-2">
                    {disabledSections.map(s => (
                      <div key={s} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 opacity-60">
                        <XCircle className="h-3.5 w-3.5 text-slate-300 flex-shrink-0"/>
                        <span className="text-xs text-slate-400">{SECTION_LABELS[s]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-8 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="h-3 w-3"/>
            {currentUser.lastLogin ? `Last login: ${formatDate(currentUser.lastLogin)}` : "No previous login recorded"}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Close
            </button>
            {activeTab === "profile" && (
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60">
                {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Saving…</span></> : <><Save className="h-4 w-4"/><span>Save Changes</span></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
