import { useState, useRef } from "react";
import { Eye, EyeOff, LogIn, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DEMO_ACCOUNTS = [
  { label: "Admin",          email: "admin@agri.mh.gov.in",   password: "Admin@123",   role: "Full Access" },
  { label: "District Officer", email: "officer@agri.mh.gov.in", password: "Officer@123", role: "Operations" },
  { label: "Taluka Officer", email: "taluka@agri.mh.gov.in",  password: "Taluka@123",  role: "Field Access" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const pwRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!password)     { setError("Please enter your password."); return; }
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // natural delay
    const err = login(email.trim(), password);
    if (err) { setError(err); setLoading(false); }
  };

  const fillDemo = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError("");
    setTimeout(() => pwRef.current?.focus(), 10);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#0D2B1E" }}>

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #4ade80, transparent)" }}/>
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #2dd4bf, transparent)" }}/>
        <div className="absolute top-1/2 right-0 w-px h-3/4 -translate-y-1/2 opacity-10" style={{ background: "linear-gradient(to bottom, transparent, #4ade80, transparent)" }}/>

        {/* Logo */}
        <div className="flex justify-center">
          <img src="/krishi-suvidha-logo.png" alt="Krishi Suvidha" className="w-72 object-contain" style={{ filter: "brightness(1.1)" }}/>
        </div>

        {/* Centre copy */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-3">
              कृषी सुविधा<br/>
              <span style={{ color: "#4ade80" }}>Admin Portal</span>
            </h1>
            <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
              Maharashtra's integrated agriculture administration platform for district and taluka officers. Manage farmer registrations, scheme applications, grievances, and more — all in one place.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {["AI-Powered OCR", "Multi-Language", "Real-time Alerts", "Role-based Access", "DBT Integration"].map(f => (
              <span key={f} className="text-xs px-3 py-1.5 rounded-full font-medium border"
                style={{ color: "#4ade80", borderColor: "rgba(74,222,128,0.3)", backgroundColor: "rgba(74,222,128,0.08)" }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom attribution */}
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          <div className="font-semibold mb-0.5">AIRAVATA TECHNOLOGIES</div>
          <div>Department of Agriculture, Maharashtra Government</div>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12"
        style={{ backgroundColor: "#f8faf8" }}>

        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/krishi-suvidha-logo.png" alt="Krishi Suvidha" className="h-16 object-contain"
              style={{ filter: "brightness(0.2) sepia(1) saturate(2) hue-rotate(80deg)" }}/>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
              <p className="text-sm text-slate-500">Sign in to your AgriAdmin account</p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 mb-5">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5"/>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                    placeholder="you@agri.mh.gov.in"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ "--tw-ring-color": "#059669" } as React.CSSProperties}
                    onFocus={e => e.target.style.boxShadow = "0 0 0 3px rgba(5,150,105,0.15)"}
                    onBlur={e => e.target.style.boxShadow = ""}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
                  <input
                    ref={pwRef} type={showPw ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none transition-all"
                    onFocus={e => e.target.style.boxShadow = "0 0 0 3px rgba(5,150,105,0.15)"}
                    onBlur={e => e.target.style.boxShadow = ""}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div
                    onClick={() => setRemember(v => !v)}
                    className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${remember ? "border-emerald-600" : "border-slate-300"}`}
                    style={remember ? { backgroundColor: "#059669", borderColor: "#059669" } : {}}
                  >
                    {remember && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span className="text-xs text-slate-600 select-none">Remember me</span>
                </label>
                <button type="button" className="text-xs font-semibold transition-colors" style={{ color: "#059669" }}>
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-70"
                style={{ backgroundColor: "#059669" }}
                onMouseEnter={e => !loading && ((e.target as HTMLElement).style.backgroundColor = "#047857")}
                onMouseLeave={e => ((e.target as HTMLElement).style.backgroundColor = "#059669")}
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin"/>Signing in…</> : <><LogIn className="h-4 w-4"/>Sign In to AgriAdmin</>}
              </button>
            </form>
          </div>

          {/* Demo credentials */}
          <div className="mt-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Demo Accounts — Click to fill</div>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(d => (
                <button key={d.email} onClick={() => fillDemo(d)}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/60 transition-all text-left group">
                  <div>
                    <div className="text-xs font-semibold text-slate-700 group-hover:text-emerald-800">{d.label}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{d.email}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{ backgroundColor: "rgba(5,150,105,0.1)", color: "#059669" }}>{d.role}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center mt-4 text-[11px] text-slate-400">
            Maharashtra Department of Agriculture · AgriAdmin v2.0
          </div>
        </div>
      </div>
    </div>
  );
}
