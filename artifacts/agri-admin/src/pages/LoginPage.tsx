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
        <div className="w-full lg:w-[420px] xl:w-[460px] flex-shrink-0 flex flex-col h-full bg-white lg:border-l lg:border-slate-200 overflow-hidden">

          {/* Krushi Suvidha logo — cropped tightly, no wasted space */}
          <div style={{ overflow: "hidden", height: 155, flexShrink: 0 }}>
            <img
              src="/logo-krushi-suvidha-new.png"
              alt="Krushi Suvidha"
              className="w-full mix-blend-multiply"
              style={{ height: 460, marginTop: -95, display: "block" }}
            />
          </div>

          {/* Datalist for email suggestions */}
          <datalist id="demo-emails">
            {DEMO_ACCOUNTS.map(d => (
              <option key={d.email} value={d.email} label={`${d.label} — ${d.role}`} />
            ))}
          </datalist>

          {/* Form — small breathing gap below logo */}
          <div className="px-8 shrink-0" style={{ paddingTop: 14 }}>
            <div className="mb-2">
              <h2 style={{ fontFamily: "Poppins, sans-serif", fontSize: 26, fontWeight: 500, color: "#0f172a", lineHeight: 1.2, marginBottom: 2 }}>
                Welcome back
              </h2>
              <p style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, fontWeight: 300, color: "#94a3b8" }}>
                Sign in to your Krushi Suvidha account
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 mb-3">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5"/>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-2">
              <div>
                <label style={{ fontFamily: "Poppins, sans-serif", fontSize: 10, fontWeight: 500, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
                  <input
                    type="email"
                    list="demo-emails"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      const match = DEMO_ACCOUNTS.find(d => d.email === e.target.value);
                      if (match) { setPassword(match.password); setError(""); }
                    }}
                    autoComplete="email"
                    placeholder="you@agri.mh.gov.in"
                    className="w-full pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none transition-all"
                    style={{ fontFamily: "Poppins, sans-serif", fontSize: 13, fontWeight: 300, padding: "8px 16px 8px 36px" }}
                    onFocus={e => e.target.style.boxShadow = "0 0 0 3px rgba(5,150,105,0.15)"}
                    onBlur={e => e.target.style.boxShadow = ""}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontFamily: "Poppins, sans-serif", fontSize: 10, fontWeight: 500, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 3 }}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/>
                  <input
                    ref={pwRef} type={showPw ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:outline-none transition-all"
                    style={{ fontFamily: "Poppins, sans-serif", fontSize: 13, fontWeight: 300, padding: "8px 44px 8px 36px" }}
                    onFocus={e => e.target.style.boxShadow = "0 0 0 3px rgba(5,150,105,0.15)"}
                    onBlur={e => e.target.style.boxShadow = ""}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPw ? <EyeOff className="h-3.5 w-3.5"/> : <Eye className="h-3.5 w-3.5"/>}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between" style={{ paddingTop: 2 }}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setRemember(v => !v)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${remember ? "border-emerald-600" : "border-slate-300"}`}
                    style={remember ? { backgroundColor: "#059669", borderColor: "#059669" } : {}}
                  >
                    {remember && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, fontWeight: 300, color: "#475569" }}>Remember me</span>
                </label>
                <button type="button" style={{ fontFamily: "Poppins, sans-serif", fontSize: 12, fontWeight: 400, color: "#059669" }}>
                  Forgot password?
                </button>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl text-white transition-all disabled:opacity-70"
                style={{ backgroundColor: "#059669", fontFamily: "Poppins, sans-serif", fontSize: 14, fontWeight: 500, padding: "10px 0" }}
                onMouseEnter={e => !loading && ((e.currentTarget).style.backgroundColor = "#047857")}
                onMouseLeave={e => ((e.currentTarget).style.backgroundColor = "#059669")}
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin"/>Signing in…</>
                  : <><LogIn className="h-4 w-4"/>Sign In to Krushi Suvidha</>}
              </button>
            </form>
          </div>

          {/* Airavata Technologies logo — flex-1 fills ALL remaining bottom space */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img
              src="/ATSVGNOBG.svg"
              alt="Airavata Technologies"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
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
              <div className="flex items-center gap-2">
                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: "#D97706" }}/>
                <div>
                  <p className="text-white text-lg leading-tight" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400 }}>
                    Maharashtra's AI-Powered Agriculture Administration Platform
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "#86efac", fontFamily: "Poppins, sans-serif", fontWeight: 300 }}>
                    महाराष्ट्राचे AI-आधारित कृषी प्रशासन व्यासपीठ
                  </p>
                </div>
              </div>
            </div>

            {/* 3×2 Step cards grid */}
            <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-3 min-h-0">
              {STEPS.map((step) => (
                <div
                  key={step.number}
                  className="flex flex-col rounded-2xl p-4 overflow-hidden relative"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(4px)",
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  {/* Step number — bottom right watermark */}
                  <span
                    className="absolute bottom-1 right-3 select-none pointer-events-none"
                    style={{
                      fontSize: 52,
                      lineHeight: 1,
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.11)",
                      fontFamily: "Poppins, sans-serif",
                    }}
                  >
                    {step.number}
                  </span>

                  {/* Title block with yellow accent line */}
                  <div className="flex gap-2 mb-2">
                    <div className="w-[3px] rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: "#D97706", minHeight: 36 }} />
                    <div>
                      <p className="leading-snug" style={{ color: "#ffffff", fontSize: 17, fontWeight: 500 }}>
                        {step.en}
                      </p>
                      <p className="mt-0.5" style={{ color: "#86efac", fontSize: 13, fontWeight: 300 }}>
                        {step.mr}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="leading-relaxed" style={{ color: "rgba(255,255,255,0.80)", fontSize: 13.5, fontWeight: 300 }}>
                    {step.desc}
                  </p>

                  {/* Spacer pushes tag to bottom */}
                  <div className="flex-1" />

                  {/* Tag */}
                  <div className="mt-2">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.13)", color: "rgba(255,255,255,0.92)", fontSize: 11.5, fontWeight: 400 }}
                    >
                      {step.tag}
                    </span>
                  </div>
                </div>
              ))}
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
