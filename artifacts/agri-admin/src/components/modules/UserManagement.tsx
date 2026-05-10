import { useState, useMemo } from "react";
import {
  Users, Plus, Search, Edit2, Trash2, Shield, CheckCircle2, XCircle,
  Eye, EyeOff, X, Save, AlertTriangle, BadgeCheck, Clock, Phone,
  MapPin, Mail, Lock, User, Camera, LayoutGrid, LayoutList,
  ChevronDown, ChevronUp, Key, Activity,
} from "lucide-react";
import {
  useAuth, SECTIONS, SECTION_LABELS, ROLE_LABELS, ROLE_PRESETS, AVATAR_COLORS,
  type AppUser, type UserRole, type SectionKey,
} from "@/contexts/AuthContext";

/* ── helpers ── */
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
function initials(name: string) {
  return name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}
function formatDate(ts?: number) {
  if (!ts) return "Never";
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const ROLE_OPTIONS: UserRole[] = ["admin", "district_officer", "taluka_officer", "viewer"];

/* ── Avatar ── */
function Avatar({ user, size = "md" }: { user: AppUser; size?: "sm" | "md" | "lg" | "xl" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : size === "md" ? "w-9 h-9 text-sm" : size === "lg" ? "w-14 h-14 text-lg" : "w-20 h-20 text-2xl";
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.name} className={`${sz} rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0`}/>;
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${user.avatarColor} flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0`}>
      {initials(user.name)}
    </div>
  );
}

/* ── Role badge ── */
function RoleBadge({ role }: { role: UserRole }) {
  const colors: Record<UserRole, string> = {
    admin:            "bg-emerald-100 text-emerald-800 border-emerald-200",
    district_officer: "bg-teal-100 text-teal-800 border-teal-200",
    taluka_officer:   "bg-green-100 text-green-800 border-green-200",
    viewer:           "bg-slate-100 text-slate-600 border-slate-200",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${colors[role]}`}>{ROLE_LABELS[role]}</span>;
}

/* ── Status badge ── */
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`}/>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* ═══════════════ User Detail Slide-out ═══════════════ */
function UserDetailPanel({ user, currentUserId, onClose, onEdit }: { user: AppUser; currentUserId: string; onClose: () => void; onEdit: () => void }) {
  const { updateUser } = useAuth();
  const enabledSections = SECTIONS.filter(s => user.permissions[s]);
  const disabledSections = SECTIONS.filter(s => !user.permissions[s]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose}/>
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0" style={{ background: "linear-gradient(135deg, #0D2B1E 0%, #1a4a30 100%)" }}>
          <div className="flex items-center justify-between px-5 pt-4 pb-0">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">User Profile</span>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X className="h-4 w-4 text-white/70"/></button>
          </div>
          <div className="px-5 pb-5 pt-3 flex items-end gap-4">
            <div className="relative flex-shrink-0">
              <Avatar user={user} size="xl"/>
              {user.id === currentUserId && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                  <BadgeCheck className="h-3 w-3 text-white"/>
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="font-bold text-white text-lg leading-tight">{user.name}</div>
              <div className="text-white/60 text-xs mt-0.5">{user.designation}</div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <RoleBadge role={user.role}/>
                <StatusBadge active={user.active}/>
                {user.id === currentUserId && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border border-white/20 text-white/70">You</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Contact info */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Contact Information</div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-3.5 w-3.5 text-slate-500"/>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Email</div>
                  <div className="text-xs font-medium text-slate-700">{user.email}</div>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-3.5 w-3.5 text-slate-500"/>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Phone</div>
                    <div className="text-xs font-medium text-slate-700">{user.phone}</div>
                  </div>
                </div>
              )}
              {user.district && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-slate-500"/>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">District / Office</div>
                    <div className="text-xs font-medium text-slate-700">{user.district}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Activity</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                <div className="text-[10px] text-slate-400 mb-0.5">Last Login</div>
                <div className="text-xs font-semibold text-slate-700">{timeAgo(user.lastLogin)}</div>
                {user.lastLogin && <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(user.lastLogin)}</div>}
              </div>
              <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                <div className="text-[10px] text-slate-400 mb-0.5">Member Since</div>
                <div className="text-xs font-semibold text-slate-700">{formatDate(user.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Section Access · {enabledSections.length}/{SECTIONS.length}
            </div>
            <div className="space-y-1.5">
              {enabledSections.map(s => (
                <div key={s} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0"/>
                  <span className="text-xs text-slate-700">{SECTION_LABELS[s]}</span>
                </div>
              ))}
              {disabledSections.map(s => (
                <div key={s} className="flex items-center gap-2 opacity-40">
                  <XCircle className="h-3.5 w-3.5 text-slate-400 flex-shrink-0"/>
                  <span className="text-xs text-slate-500">{SECTION_LABELS[s]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-slate-100 bg-slate-50 flex gap-2">
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors">
            <Edit2 className="h-4 w-4"/> Edit User
          </button>
          <button
            onClick={() => updateUser(user.id, { active: !user.active })}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${user.active ? "border-slate-200 text-slate-600 hover:bg-slate-100" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}>
            {user.active ? <XCircle className="h-4 w-4"/> : <CheckCircle2 className="h-4 w-4"/>}
            {user.active ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ User Form Modal ═══════════════ */
type FormMode = "add" | "edit";
interface UserFormProps { mode: FormMode; user?: AppUser; currentUserId: string; onClose: () => void; }

function UserFormModal({ mode, user, currentUserId, onClose }: UserFormProps) {
  const { addUser, updateUser } = useAuth();
  const [form, setForm] = useState({
    name:        user?.name ?? "",
    email:       user?.email ?? "",
    password:    "",
    designation: user?.designation ?? "",
    district:    user?.district ?? "",
    phone:       user?.phone ?? "",
    role:        (user?.role ?? "district_officer") as UserRole,
    avatarColor: user?.avatarColor ?? AVATAR_COLORS[0],
    avatarUrl:   user?.avatarUrl ?? "",
    active:      user?.active ?? true,
    permissions: user?.permissions
      ? { ...user.permissions }
      : Object.fromEntries(SECTIONS.map(s => [s, ROLE_PRESETS["district_officer"][s] ?? false])) as Record<SectionKey, boolean>,
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"info" | "role">("info");

  const set = (k: string, v: unknown) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const applyRolePreset = (role: UserRole) => {
    const preset = ROLE_PRESETS[role];
    const perms = Object.fromEntries(SECTIONS.map(s => [s, preset[s] ?? false])) as Record<SectionKey, boolean>;
    setForm(p => ({ ...p, role, permissions: perms }));
  };

  const togglePerm = (s: SectionKey) => {
    if (form.role === "admin") return;
    setForm(p => ({ ...p, permissions: { ...p.permissions, [s]: !p.permissions[s] } }));
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set("avatarUrl", ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (mode === "add" && !form.password) e.password = "Password is required";
    if (form.password && form.password.length < 8) e.password = "Min 8 characters";
    if (!form.designation.trim()) e.designation = "Designation is required";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (mode === "add") {
      addUser({ name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role,
        designation: form.designation.trim(), district: form.district.trim(), phone: form.phone.trim(),
        avatarColor: form.avatarColor, avatarUrl: form.avatarUrl || undefined, permissions: form.permissions, active: form.active });
    } else if (user) {
      const patch: Partial<AppUser> & { password?: string } = {
        name: form.name.trim(), email: form.email.trim(), role: form.role, designation: form.designation.trim(),
        district: form.district.trim(), phone: form.phone.trim(), avatarColor: form.avatarColor,
        avatarUrl: form.avatarUrl || undefined, permissions: form.permissions, active: form.active,
      };
      if (form.password) patch.password = form.password;
      updateUser(user.id, patch);
    }
    onClose();
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all";
  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );

  const tabs = [{ id: "info", label: "Personal Info", icon: User }, { id: "role", label: "Role & Access", icon: Shield }] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0" style={{ background: "linear-gradient(135deg, #0D2B1E, #1a4a30)" }}>
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${form.avatarColor} flex items-center justify-center font-bold text-white text-xl shadow-lg overflow-hidden border-2 border-white/20`}>
                {form.avatarUrl ? <img src={form.avatarUrl} alt="" className="w-full h-full object-cover"/> : initials(form.name || "?")}
              </div>
              <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center cursor-pointer shadow-md hover:bg-emerald-600 transition-colors">
                <Camera className="h-3 w-3 text-white"/>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto}/>
              </label>
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{mode === "add" ? "Add New User" : `Edit — ${user?.name}`}</h3>
              <p className="text-[11px] text-white/50 mt-0.5">{mode === "add" ? "Create a new admin account" : "Update user details and permissions"}</p>
              {mode === "add" && (
                <div className="flex gap-1.5 mt-2">
                  {AVATAR_COLORS.map(c => (
                    <button key={c} onClick={() => set("avatarColor", c)}
                      className={`w-5 h-5 rounded-full bg-gradient-to-br ${c} transition-all ${form.avatarColor === c ? "ring-2 ring-offset-1 ring-white scale-110" : "hover:scale-105 opacity-70"}`}/>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors self-start"><X className="h-4 w-4 text-white/70"/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 flex-shrink-0">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab.id ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              <tab.icon className="h-3.5 w-3.5"/>{tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {activeTab === "info" && (
            <div className="space-y-4">
              {mode === "edit" && (
                <div className="flex gap-1.5 flex-wrap">
                  <div className="text-xs font-semibold text-slate-500 w-full mb-1">Avatar Colour</div>
                  {AVATAR_COLORS.map(c => (
                    <button key={c} onClick={() => set("avatarColor", c)}
                      className={`w-7 h-7 rounded-full bg-gradient-to-br ${c} transition-all ${form.avatarColor === c ? "ring-2 ring-offset-2 ring-emerald-500 scale-110" : "hover:scale-105"}`}/>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name *" error={errors.name}>
                  <input value={form.name} onChange={e => set("name", e.target.value)} className={inputCls} placeholder="e.g. Rajesh Kumar"/>
                </Field>
                <Field label="Email Address *" error={errors.email}>
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputCls} placeholder="name@agri.mh.gov.in"/>
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
                <Field label={mode === "add" ? "Password *" : "New Password"} error={errors.password}>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
                    <input type={showPw ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} className={inputCls + " pl-9 pr-10"} placeholder={mode === "add" ? "Min 8 characters" : "Leave blank to keep"}/>
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff className="h-3.5 w-3.5"/> : <Eye className="h-3.5 w-3.5"/>}
                    </button>
                  </div>
                </Field>
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 mt-2">
                <div>
                  <div className="text-sm font-semibold text-slate-700">Account Active</div>
                  <div className="text-xs text-slate-400">Inactive users cannot log in</div>
                </div>
                <button onClick={() => set("active", !form.active)}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.active ? "bg-emerald-500" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.active ? "left-6" : "left-0.5"}`}/>
                </button>
              </div>
              {mode === "edit" && user?.id === currentUserId && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5"/>
                  You are editing your own account. Permission changes take effect immediately.
                </div>
              )}
            </div>
          )}

          {activeTab === "role" && (
            <div className="space-y-5">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Role Preset</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ROLE_OPTIONS.map(r => (
                    <button key={r} onClick={() => applyRolePreset(r)}
                      className={`px-3 py-3 rounded-xl border text-xs font-semibold transition-all text-left ${form.role === r ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40"}`}>
                      <Shield className={`h-4 w-4 mb-1.5 ${form.role === r ? "text-emerald-600" : "text-slate-400"}`}/>
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Section Access</div>
                  <span className="text-[10px] text-slate-400">{Object.values(form.permissions).filter(Boolean).length}/{SECTIONS.length} enabled</span>
                </div>
                {form.role === "admin" && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 mb-3">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0"/>Administrators have full access to all sections.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {SECTIONS.map(s => {
                    const on = form.permissions[s];
                    const locked = form.role === "admin";
                    return (
                      <button key={s} onClick={() => togglePerm(s)} disabled={locked}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs transition-all ${on ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-500"} ${locked ? "opacity-60 cursor-not-allowed" : "hover:border-emerald-200 cursor-pointer"}`}>
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${on ? "bg-emerald-500" : "border-2 border-slate-300"}`}>
                          {on && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        {SECTION_LABELS[s]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors">
            <Save className="h-4 w-4"/>{mode === "add" ? "Create User" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Delete confirm ═══════════════ */
function DeleteConfirm({ user, onClose, onConfirm }: { user: AppUser; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 className="h-7 w-7 text-red-500"/>
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800 mb-1">Delete User Account?</h3>
            <p className="text-sm text-slate-500"><span className="font-semibold text-slate-700">{user.name}</span> ({user.email}) will be permanently removed.</p>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Table Row ═══════════════ */
function TableRow({ user, currentUserId, onView, onEdit, onDelete, onToggle }:
  { user: AppUser; currentUserId: string; onView: () => void; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const enabledCount = Object.values(user.permissions).filter(Boolean).length;

  return (
    <>
      <tr className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${!user.active ? "opacity-60" : ""} ${user.id === currentUserId ? "bg-emerald-50/30" : ""}`}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar user={user} size="sm"/>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-800 truncate">{user.name}</span>
                {user.id === currentUserId && <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0"/>}
              </div>
              <div className="text-[11px] text-slate-400 truncate">{user.designation}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3"><RoleBadge role={user.role}/></td>
        <td className="px-4 py-3 text-xs text-slate-600">{user.district || "—"}</td>
        <td className="px-4 py-3">
          <div className="text-xs text-slate-600">{user.email}</div>
          {user.phone && <div className="text-[11px] text-slate-400">{user.phone}</div>}
        </td>
        <td className="px-4 py-3">
          <div className="text-xs font-medium text-slate-700">{timeAgo(user.lastLogin)}</div>
          <div className="text-[11px] text-slate-400">{enabledCount}/{SECTIONS.length} sections</div>
        </td>
        <td className="px-4 py-3"><StatusBadge active={user.active}/></td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button onClick={onView} title="View Details"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"><Eye className="h-3.5 w-3.5"/></button>
            <button onClick={onEdit} title="Edit"
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-700 transition-colors"><Edit2 className="h-3.5 w-3.5"/></button>
            <button onClick={onToggle} title={user.active ? "Deactivate" : "Activate"}
              className={`p-1.5 rounded-lg transition-colors ${user.active ? "hover:bg-orange-50 text-slate-400 hover:text-orange-600" : "hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"}`}>
              {user.active ? <XCircle className="h-3.5 w-3.5"/> : <CheckCircle2 className="h-3.5 w-3.5"/>}
            </button>
            {user.id !== currentUserId && (
              <button onClick={onDelete} title="Delete"
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5"/></button>
            )}
            <button onClick={() => setExpanded(v => !v)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
              {expanded ? <ChevronUp className="h-3.5 w-3.5"/> : <ChevronDown className="h-3.5 w-3.5"/>}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-slate-100 bg-slate-50/60">
          <td colSpan={7} className="px-6 py-3">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] mb-1.5">Enabled Sections</div>
                <div className="flex flex-wrap gap-1">
                  {SECTIONS.filter(s => user.permissions[s]).map(s => (
                    <span key={s} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-medium">{SECTION_LABELS[s]}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] mb-1.5">Account Created</div>
                <div className="text-slate-600">{formatDate(user.createdAt)}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] mb-1.5">Last Login</div>
                <div className="text-slate-600">{formatDate(user.lastLogin)}</div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ═══════════════ Main page ═══════════════ */
export default function UserManagement() {
  const { users, currentUser, deleteUser, updateUser } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [formMode, setFormMode] = useState<{ mode: FormMode; user?: AppUser } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [detailUser, setDetailUser] = useState<AppUser | null>(null);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return users.filter(u =>
      (!s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.district.toLowerCase().includes(s) || u.designation.toLowerCase().includes(s)) &&
      (!roleFilter || u.role === roleFilter) &&
      (statusFilter === "" || (statusFilter === "active" ? u.active : !u.active))
    );
  }, [users, search, roleFilter, statusFilter]);

  const stats = [
    { label: "Total Users",   val: users.length,                              color: "border-teal-200 bg-teal-50",    text: "text-teal-700" },
    { label: "Active",        val: users.filter(u => u.active).length,        color: "border-emerald-200 bg-emerald-50", text: "text-emerald-700" },
    { label: "Admins",        val: users.filter(u => u.role === "admin").length, color: "border-green-200 bg-green-50", text: "text-green-700" },
    { label: "Inactive",      val: users.filter(u => !u.active).length,       color: "border-slate-200 bg-slate-50",  text: "text-slate-600" },
  ];

  return (
    <div className="space-y-5">
      {formMode && <UserFormModal mode={formMode.mode} user={formMode.user} currentUserId={currentUser?.id ?? ""} onClose={() => setFormMode(null)}/>}
      {deleteTarget && <DeleteConfirm user={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { deleteUser(deleteTarget.id); setDeleteTarget(null); }}/>}
      {detailUser && (
        <UserDetailPanel
          user={detailUser}
          currentUserId={currentUser?.id ?? ""}
          onClose={() => setDetailUser(null)}
          onEdit={() => { setFormMode({ mode: "edit", user: detailUser }); setDetailUser(null); }}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`border rounded-xl px-4 py-3 ${s.color}`}>
            <div className={`text-3xl font-bold ${s.text}`}>{s.val}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={() => setFormMode({ mode: "add" })}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex-shrink-0">
          <Plus className="h-4 w-4"/> Add User
        </button>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, district, designation…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"/>
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="text-sm bg-white border border-border rounded-lg px-3 py-2">
          <option value="">All Roles</option>
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm bg-white border border-border rounded-lg px-3 py-2">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="flex gap-1 bg-muted/30 rounded-lg p-1 ml-auto">
          <button onClick={() => setViewMode("table")} title="Table view"
            className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-white shadow-sm text-emerald-700" : "text-muted-foreground hover:text-foreground"}`}>
            <LayoutList className="h-4 w-4"/>
          </button>
          <button onClick={() => setViewMode("cards")} title="Card view"
            className={`p-1.5 rounded-md transition-colors ${viewMode === "cards" ? "bg-white shadow-sm text-emerald-700" : "text-muted-foreground hover:text-foreground"}`}>
            <LayoutGrid className="h-4 w-4"/>
          </button>
        </div>
        <span className="text-xs text-muted-foreground">Showing {filtered.length} of {users.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30"/>
          <p className="text-sm text-muted-foreground">No users match your filters.</p>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">User</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">District</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Activity</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <TableRow key={u.id} user={u} currentUserId={currentUser?.id ?? ""}
                    onView={() => setDetailUser(u)}
                    onEdit={() => setFormMode({ mode: "edit", user: u })}
                    onDelete={() => { if (u.id !== currentUser?.id) setDeleteTarget(u); }}
                    onToggle={() => updateUser(u.id, { active: !u.active })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(u => (
            <div key={u.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md ${!u.active ? "opacity-60" : ""} ${u.id === currentUser?.id ? "border-emerald-300 ring-1 ring-emerald-200" : "border-border"}`}>
              <div className={`h-1.5 w-full bg-gradient-to-r ${u.avatarColor}`}/>
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar user={u} size="md"/>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-800 truncate flex items-center gap-1.5">
                        {u.name}
                        {u.id === currentUser?.id && <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0"/>}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{u.designation}</div>
                    </div>
                  </div>
                  <StatusBadge active={u.active}/>
                </div>
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500"><Mail className="h-3 w-3 flex-shrink-0"/><span className="truncate">{u.email}</span></div>
                  {u.phone && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone className="h-3 w-3 flex-shrink-0"/><span>{u.phone}</span></div>}
                  {u.district && <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin className="h-3 w-3 flex-shrink-0"/><span>{u.district}</span></div>}
                  <div className="flex items-center gap-2 text-xs text-slate-500"><Activity className="h-3 w-3 flex-shrink-0"/>Last login: {timeAgo(u.lastLogin)}</div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <RoleBadge role={u.role}/>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                    {Object.values(u.permissions).filter(Boolean).length}/{SECTIONS.length} sections
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <button onClick={() => setDetailUser(u)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                    <Eye className="h-3.5 w-3.5"/> View
                  </button>
                  <button onClick={() => setFormMode({ mode: "edit", user: u })} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200">
                    <Edit2 className="h-3.5 w-3.5"/> Edit
                  </button>
                  <button onClick={() => updateUser(u.id, { active: !u.active })}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${u.active ? "text-slate-500 bg-slate-50 hover:bg-slate-100 border-slate-200" : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"}`}>
                    {u.active ? <XCircle className="h-3.5 w-3.5"/> : <CheckCircle2 className="h-3.5 w-3.5"/>}
                  </button>
                  {u.id !== currentUser?.id && (
                    <button onClick={() => setDeleteTarget(u)} className="px-3 py-2 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors">
                      <Trash2 className="h-3.5 w-3.5"/>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
