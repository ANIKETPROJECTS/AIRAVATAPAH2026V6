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
    desc: "Officer uploads a photo of Aadhaar, land record, or bank passbook via the admin portal — OR — farmer photographs their own documents directly from the mobile app. Either path works. No physical copies needed.",
    tag: "From portal or mobile app",
    icon: "📄",
    color: "#14532D",
  },
  {
    number: "02",
    en: "AI Reads Every Document Automatically",
    mr: "AI कागदपत्र स्वयंचलित वाचन",
    desc: "The AI (OCR engine) instantly extracts all data — name, Aadhaar number, date of birth, land survey number, crop type, bank account, IFSC — and fills the entire farmer profile. Zero typing. Zero manual entry.",
    tag: "No form filling required",
    icon: "🤖",
    color: "#166534",
  },
  {
    number: "03",
    en: "Farmer Data Digitalized & Stored",
    mr: "शेतकरी डेटा डिजिटल व संग्रहित",
    desc: "A complete digital farmer profile is created — personal details, land records, crop info, KYC documents, and bank details — all stored securely with a unique Farmer ID. Searchable, editable, and accessible to authorised officers anytime.",
    tag: "Permanent digital record",
    icon: "🗄️",
    color: "#15803D",
  },
  {
    number: "04",
    en: "Admin Verification",
    mr: "अधिकारी पडताळणी",
    desc: "The officer reviews the AI-extracted profile, confirms accuracy, and verifies the farmer. The status updates from Pending → Verified in one click. The farmer is notified instantly on their phone — no need to visit the office to check.",
    tag: "One-click verification",
    icon: "✅",
    color: "#16A34A",
  },
  {
    number: "05",
    en: "AI Recommends Schemes, Insurance & Subsidies",
    mr: "AI योजना, विमा व अनुदान शिफारस",
    desc: "Based on the digitalized profile — crop type, land size, district, category — AI automatically matches the farmer to eligible government schemes, crop insurance, and subsidies. No form filling needed again. The farmer's existing data is used directly.",
    tag: "Auto-matched — no re-entry",
    icon: "🎯",
    color: "#D97706",
  },
  {
    number: "06",
    en: "Farmer Applies & Gets Updated in Real Time",
    mr: "शेतकरी अर्ज व तात्काळ अपडेट",
    desc: "Farmer taps Apply Now on a recommended scheme in the mobile app — crop type and land area are pre-filled from their profile. Officer approves or rejects. The farmer gets an instant push notification the moment a decision is made.",
    tag: "Instant notification on phone",
    icon: "📲",
    color: "#B45309",
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
    <div className="h-screen flex flex-col bg-white relative overflow-hidden">

      {/* ── Header with 4 logos ── */}
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
      <div className="flex-1 flex flex-col lg:flex-row-reverse overflow-hidden">

        {/* ── Right panel: Login form ── */}
        <div className="w-full lg:w-[420px] xl:w-[460px] flex-shrink-0 flex flex-col items-center justify-start pt-0 px-8 pb-8 bg-white lg:border-l lg:border-slate-200 overflow-y-auto">
          <div className="w-full max-w-sm">

            {/* Main logo */}
            <div className="flex flex-col items-center justify-center -mt-16 mb-0">
              <img
                src="/logo-krushi-suvidha-new.png"
                alt="Krushi Suvidha"
                className="w-full h-80 object-contain mix-blend-multiply"
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

        {/* ── Left panel: 6 Step Cards ── */}
        <div className="hidden lg:flex flex-1 flex-col justify-center overflow-y-auto bg-[#F8FAFC] px-10 py-8">

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#14532D]">How Krushi Suvidha Works</h2>
            <p className="text-sm text-slate-500 mt-1">End-to-end farmer digitisation — from document upload to scheme approval.</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                {/* Step header */}
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 leading-snug">{step.en}</div>
                    <div className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "sans-serif" }}>{step.mr}</div>
                  </div>
                  <span className="text-xl flex-shrink-0">{step.icon}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>

                {/* Tag pill */}
                <div className="mt-auto pt-1">
                  <span
                    className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: step.color + "15", color: step.color }}
                  >
                    {step.tag}
                  </span>
                </div>
              </div>
            ))}
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
