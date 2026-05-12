import { useState, useRef } from "react";
import { Eye, EyeOff, LogIn, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DEMO_ACCOUNTS = [
  { label: "Admin",            email: "admin@agri.mh.gov.in",   password: "Admin@123",   role: "Full Access" },
  { label: "District Officer", email: "officer@agri.mh.gov.in", password: "Officer@123", role: "Operations" },
  { label: "Taluka Officer",   email: "taluka@agri.mh.gov.in",  password: "Taluka@123",  role: "Field Access" },
];

const STEPS = [
  {
    number: "01",
    en: "Document Upload",
    mr: "कागदपत्र अपलोड",
    desc: "Officer or farmer uploads Aadhaar, land record, or bank passbook via portal or mobile app. No physical copies needed.",
    tag: "Portal or mobile app",
    icon: "📄",
  },
  {
    number: "02",
    en: "AI Reads Documents Automatically",
    mr: "AI कागदपत्र स्वयंचलित वाचन",
    desc: "OCR engine instantly extracts name, Aadhaar, DOB, survey number, bank account, IFSC — fills the entire farmer profile. Zero typing.",
    tag: "No form filling required",
    icon: "🤖",
  },
  {
    number: "03",
    en: "Farmer Data Digitalized & Stored",
    mr: "शेतकरी डेटा डिजिटल व संग्रहित",
    desc: "Complete digital profile created with unique Farmer ID — personal, land, crop, KYC, and bank details stored securely. No paper files.",
    tag: "Permanent digital record",
    icon: "🗄️",
  },
  {
    number: "04",
    en: "Admin Verification",
    mr: "अधिकारी पडताळणी",
    desc: "Officer reviews the AI-extracted profile and verifies in one click. Status updates from Pending → Verified. Farmer is notified instantly.",
    tag: "One-click verification",
    icon: "✅",
  },
  {
    number: "05",
    en: "AI Recommends Schemes & Subsidies",
    mr: "AI योजना, विमा व अनुदान शिफारस",
    desc: "AI matches farmer to eligible government schemes, crop insurance, and subsidies based on crop, land, and district — no re-entry needed.",
    tag: "Auto-matched — no re-entry",
    icon: "🎯",
  },
  {
    number: "06",
    en: "Farmer Applies & Gets Real-Time Updates",
    mr: "शेतकरी अर्ज व तात्काळ अपडेट",
    desc: "Farmer taps Apply Now — crop and land pre-filled. Officer approves or rejects. Instant push notification sent the moment a decision is made.",
    tag: "Instant notification on phone",
    icon: "📲",
  },
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
    <div className="h-screen flex flex-col bg-white overflow-hidden">

      {/* ── Header ── */}
      <header className="relative z-50 w-full bg-white border-b border-slate-200 py-1 px-8 shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex-1 flex items-center justify-center border-r border-slate-200 py-1">
            <img src="/logo-govt-india.svg" alt="Government of India" className="h-16 w-auto object-contain"/>
          </div>
          <div className="flex-1 flex items-center justify-center border-r border-slate-200 py-1">
            <img src="/logo-seal-maharashtra.svg" alt="Seal of Maharashtra" className="h-20 w-auto object-contain"/>
          </div>
          <div className="flex-1 flex items-center justify-center border-r border-slate-200 py-1">
            <img src="/logo-dept-agriculture.png" alt="Department of Agriculture Maharashtra" className="h-20 w-auto object-contain"/>
          </div>
          <div className="flex-1 flex items-center justify-center py-1">
            <img src="/logo-pune-agri-hackathon.png" alt="Pune Agri Hackathon" className="h-14 w-auto object-contain"/>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-row-reverse overflow-hidden min-h-0">

        {/* ── Right panel: Login form ── */}
        <div className="w-full lg:w-[420px] xl:w-[460px] flex-shrink-0 flex flex-col items-center justify-start pt-0 px-8 pb-6 bg-white lg:border-l lg:border-slate-200 overflow-y-auto">
          <div className="w-full max-w-sm">
            <div className="flex flex-col items-center justify-center -mt-12 mb-0">
              <img
                src="/logo-krushi-suvidha-new.png"
                alt="Krushi Suvidha"
                className="w-full h-72 object-contain mix-blend-multiply"
              />
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-7">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
                <p className="text-sm text-slate-500">Sign in to your AgriAdmin account</p>
              </div>

              {error && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 mb-4">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5"/>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
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

            <div className="mt-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Demo Accounts — Click to fill</div>
              <div className="space-y-1.5">
                {DEMO_ACCOUNTS.map(d => (
                  <button key={d.email} onClick={() => fillDemo(d)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/60 transition-all text-left group">
                    <div>
                      <div className="text-xs font-semibold text-slate-700 group-hover:text-emerald-800">{d.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{d.email}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style={{ backgroundColor: "rgba(5,150,105,0.1)", color: "#059669" }}>{d.role}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center mt-3 text-[11px] text-slate-400">
              Maharashtra Department of Agriculture · AgriAdmin v2.0
            </div>
          </div>
        </div>

        {/* ── Left panel: Steps on green bg ── */}
        <div
          className="hidden lg:flex flex-1 flex-col overflow-hidden"
          style={{ background: "linear-gradient(145deg, #0D2B1E 0%, #14532D 45%, #166534 100%)" }}
        >
          {/* Decorative circles */}
          <div className="absolute pointer-events-none" style={{ top: 90, left: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }}/>
          <div className="absolute pointer-events-none" style={{ bottom: 40, left: 100, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }}/>

          <div className="relative flex flex-col h-full px-8 py-6 gap-5">

            {/* Header text */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: "#D97706" }}/>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">
                    Maharashtra's AI-Powered Agriculture Administration Platform
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "#86efac" }}>
                    महाराष्ट्राचे AI-आधारित कृषी प्रशासन व्यासपीठ
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#D97706" }}>How it works</span>
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}/>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>6 steps</span>
              </div>
            </div>

            {/* 3×2 Step cards grid */}
            <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-3 min-h-0">
              {STEPS.map((step, i) => (
                <div
                  key={step.number}
                  className="flex flex-col rounded-2xl p-4 overflow-hidden relative"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {/* Faint number watermark */}
                  <span
                    className="absolute right-3 top-2 font-black select-none pointer-events-none"
                    style={{ fontSize: 48, lineHeight: 1, color: "rgba(255,255,255,0.05)" }}
                  >
                    {step.number}
                  </span>

                  {/* Step badge + icon */}
                  <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                    <div
                      className="flex items-center justify-center rounded-lg text-xs font-black text-white flex-shrink-0"
                      style={{
                        width: 26, height: 26,
                        backgroundColor: i < 4 ? "rgba(255,255,255,0.18)" : "#D97706",
                      }}
                    >
                      {step.number}
                    </div>
                    <span className="text-lg">{step.icon}</span>
                  </div>

                  {/* Title */}
                  <p className="text-white font-bold text-xs leading-snug mb-1 flex-shrink-0">
                    {step.en}
                  </p>
                  <p className="text-xs mb-2 flex-shrink-0" style={{ color: "#86efac", fontFamily: "sans-serif" }}>
                    {step.mr}
                  </p>

                  {/* Description */}
                  <p className="text-xs leading-relaxed flex-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                    {step.desc}
                  </p>

                  {/* Tag */}
                  <div className="mt-2 flex-shrink-0">
                    <span
                      className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}
                    >
                      {step.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom brand strip */}
            <div className="flex-shrink-0 flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e" }}/>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  All farmer data is encrypted & stored on secure Maharashtra government servers
                </span>
              </div>
              <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>v2.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="w-full py-2 text-center border-t border-slate-100 bg-white shrink-0 z-50">
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
