import { useState, useRef } from "react";
import { Eye, EyeOff, LogIn, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DEMO_ACCOUNTS = [
  { label: "Admin",            email: "admin@agri.mh.gov.in",   password: "Admin@123",   role: "Full Access" },
  { label: "District Officer", email: "officer@agri.mh.gov.in", password: "Officer@123", role: "Operations" },
  { label: "Taluka Officer",   email: "taluka@agri.mh.gov.in",  password: "Taluka@123",  role: "Field Access" },
];

function LogoPlaceholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
        <span className="text-[10px] font-bold text-slate-400 text-center leading-tight px-1">{label}</span>
      </div>
    </div>
  );
}

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
    await new Promise(r => setTimeout(r, 600));
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
    <div className="h-screen flex flex-col bg-white relative overflow-hidden">

      {/* ── Header with 4 logos ── */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-3 px-8 shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex-1 flex items-center justify-center border-r border-slate-200 py-1">
            <img src="/logo-govt-india.svg" alt="Government of India" className="h-16 w-auto object-contain"/>
          </div>
          <div className="flex-1 flex items-center justify-center border-r border-slate-200 py-1">
            <img src="/logo-seal-maharashtra.svg" alt="Seal of Maharashtra" className="h-16 w-auto object-contain"/>
          </div>
          <div className="flex-1 flex items-center justify-center border-r border-slate-200 py-1">
            <img src="/logo-dept-agriculture.png" alt="Department of Agriculture Maharashtra" className="h-16 w-auto object-contain"/>
          </div>
          <div className="flex-1 flex items-center justify-center py-1">
            <img src="/logo-pune-agri-hackathon.png" alt="Pune Agri Hackathon" className="h-14 w-auto object-contain"/>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col lg:flex-row-reverse overflow-y-auto">

        {/* ── Right panel: Login form ── */}
        <div className="flex-1 flex flex-col items-center justify-start pt-8 p-8 bg-white lg:border-l lg:border-slate-200 relative overflow-visible">

          {/* Top-right badge placeholder */}
          <div className="absolute top-4 right-4 flex flex-col items-end text-right">
            <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-1">
              <span className="text-[9px] font-bold text-slate-400 text-center leading-tight">AWARD<br/>BADGE</span>
            </div>
            <span className="text-[11px] font-bold text-slate-500">AgriAdmin</span>
            <span className="text-[10px] font-bold text-black uppercase tracking-tight">v2.0</span>
          </div>

          <div className="w-full max-w-md">

            {/* Main logo */}
            <div className="flex flex-col items-center justify-center mb-6">
              <img
                src="/krishi-suvidha-logo.png"
                alt="Krushi Suvidha"
                className="h-44 w-auto object-contain"
              />
            </div>

            {/* Login card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
                <p className="text-sm text-slate-500">Sign in to your AgriAdmin account</p>
              </div>

              {error && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 mb-5">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5"/>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                      placeholder="you@agri.mh.gov.in"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none transition-all"
                      onFocus={e => e.target.style.boxShadow = "0 0 0 3px rgba(5,150,105,0.15)"}
                      onBlur={e => e.target.style.boxShadow = ""}
                    />
                  </div>
                </div>

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

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div
                      onClick={() => setRemember(v => !v)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${remember ? "border-emerald-600" : "border-slate-300"}`}
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

                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-70"
                  style={{ backgroundColor: "#059669" }}
                  onMouseEnter={e => !loading && ((e.currentTarget).style.backgroundColor = "#047857")}
                  onMouseLeave={e => ((e.currentTarget).style.backgroundColor = "#059669")}
                >
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin"/>Signing in…</>
                    : <><LogIn className="h-4 w-4"/>Sign In to AgriAdmin</>}
                </button>
              </form>
            </div>

            {/* Demo accounts */}
            <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
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

        {/* ── Left panel: Project info ── */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-white">
          <div className="max-w-lg text-slate-900 w-full">
            <div className="flex flex-col items-center text-center mb-10">

              {/* MoSPI / Dept logo placeholder */}
              <div className="w-28 h-28 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center mb-8">
                <span className="text-xs font-bold text-slate-400 text-center leading-tight px-2">DEPT.<br/>LOGO</span>
              </div>

              <div className="space-y-6 w-full">
                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="grid grid-cols-1 gap-5 text-left">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <span className="text-slate-500 font-medium uppercase tracking-wider text-xs">Platform</span>
                      <span className="text-xl font-bold text-slate-900">Krushi Suvidha</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <span className="text-slate-500 font-medium uppercase tracking-wider text-xs">Module</span>
                      <span className="text-xl font-bold text-slate-900">AgriAdmin Portal</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <span className="text-slate-500 font-medium uppercase tracking-wider text-xs">State</span>
                      <span className="text-xl font-bold text-slate-900">Maharashtra</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <span className="text-slate-500 font-medium uppercase tracking-wider text-xs">Version</span>
                      <span className="text-xl font-bold text-slate-900">v2.0</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-slate-500 font-medium uppercase tracking-wider text-xs block mb-3">About</span>
                      <p className="text-base font-medium leading-relaxed text-slate-700">
                        Maharashtra's integrated agriculture administration platform for district and taluka officers. Manage farmer registrations, scheme applications, grievances, and more — all in one place.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {["AI-Powered OCR", "Multi-Language", "Real-time Alerts", "Role-based Access", "DBT Integration"].map(f => (
                    <span key={f} className="text-xs px-3 py-1.5 rounded-full font-medium border border-emerald-200 bg-emerald-50 text-emerald-700">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="w-full py-2.5 text-center border-t border-slate-100 bg-white shrink-0 z-50">
        <div className="flex items-center justify-center space-x-2 text-xs text-black px-4 flex-wrap gap-y-1">
          <span className="font-medium whitespace-nowrap">
            Developed by{" "}
            <a href="https://www.airavatatechnologies.com/" target="_blank" rel="noopener noreferrer"
              className="text-emerald-700 font-bold hover:underline">
              AIRAVATA TECHNOLOGIES
            </a>
          </span>
          <span className="text-slate-400 font-bold">|</span>
          <a href="https://www.airavatatechnologies.com/" target="_blank" rel="noopener noreferrer"
            className="text-black hover:text-emerald-700 transition-colors underline underline-offset-4 whitespace-nowrap font-medium">
            www.airavatatechnologies.com
          </a>
          <span className="text-slate-400 font-bold">|</span>
          <a href="mailto:info@airavatatechnologies.com"
            className="text-black hover:text-emerald-700 transition-colors underline underline-offset-4 whitespace-nowrap font-medium">
            info@airavatatechnologies.com
          </a>
        </div>
      </footer>
    </div>
  );
}
