import { useState } from "react";
import { Home, FileText, Wallet, Megaphone, User, Bell, ChevronRight, Check, Sun, Cloud, CloudRain, Phone, Download, ArrowLeft, Camera, MapPin, LogOut, HelpCircle, Lock, Globe, Settings } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

// Translations
const translations: Record<string, Record<string, string>> = {
  en: {
    greeting: "Hello, Ramesh ji 🙏", appName: "Kisan Seva", tagline: "Your farm. Your rights. Your government.",
    home: "Home", applications: "Applications", payments: "Payments", grievances: "Grievances", profile: "Profile",
    getOtp: "Get OTP", verify: "Verify & Login", login: "Login", mobileNo: "Mobile Number", enterOtp: "Enter OTP",
    register: "Register as New Farmer", weatherAdvisory: "Advisory: Good conditions for cotton sowing this week",
    myFarm: "My Farm Summary", totalLand: "Total Land", crop: "Crop", season: "Season",
    soilHealth: "Soil Health Score", lastIrrigation: "Last Irrigation", daysAgo: "3 days ago",
    applyScheme: "Apply for Scheme", fileClaim: "File Claim", raiseGrievance: "Raise Grievance",
    checkSubsidy: "Check Subsidy", myDocs: "My Documents", helpline: "Helpline",
    recentActivity: "Recent Activity", availableSchemes: "Available Schemes for You",
    all: "All", pending: "Pending", approved: "Approved", rejected: "Rejected", subsidy: "Subsidy",
    insurance: "Insurance", credit: "Credit", equipment: "Equipment",
    applyNow: "Apply Now", trackStatus: "Track Status", viewCard: "View Card",
    eligible: "You are eligible", notApplied: "Not Applied", applied: "Applied — Under Review",
    received: "Received — Jun 2024",
    totalReceived: "Total Received (2024-25)", pendingAmount: "Pending",
    needHelp: "Need help? We're here.", submitGrievance: "Submit Grievance",
    subsDelayLabel: "Subsidy Delay", wrongBenef: "Wrong Beneficiary", docIssue: "Document Issue",
    officerIssue: "Officer Issue", techProblem: "Technical Problem", other: "Other",
    myProfile: "My Profile", kycVerified: "KYC Verified", personal: "Personal", contact: "Contact",
    land: "Land", bank: "Bank", settings: "Settings", language: "Language", notifications: "Notifications",
    changeMobile: "Change Mobile Number", helpFaq: "Help & FAQs", logout: "Logout",
    today: "TODAY", yesterday: "YESTERDAY", lastWeek: "LAST WEEK",
  },
  hi: {
    greeting: "नमस्ते, रमेश जी 🙏", appName: "किसान सेवा", tagline: "आपका खेत। आपके अधिकार। आपकी सरकार।",
    home: "होम", applications: "आवेदन", payments: "भुगतान", grievances: "शिकायत", profile: "प्रोफ़ाइल",
    getOtp: "OTP भेजें", verify: "सत्यापित करें", login: "लॉगिन", mobileNo: "मोबाइल नंबर", enterOtp: "OTP दर्ज करें",
    register: "नए किसान के रूप में पंजीकरण करें", weatherAdvisory: "सलाह: इस सप्ताह कपास की बुवाई के लिए अच्छी स्थिति",
    myFarm: "मेरे खेत का सारांश", totalLand: "कुल भूमि", crop: "फसल", season: "मौसम",
    soilHealth: "मृदा स्वास्थ्य स्कोर", lastIrrigation: "अंतिम सिंचाई", daysAgo: "3 दिन पहले",
    applyScheme: "योजना के लिए आवेदन", fileClaim: "दावा दर्ज करें", raiseGrievance: "शिकायत दर्ज करें",
    checkSubsidy: "सब्सिडी जांचें", myDocs: "मेरे दस्तावेज़", helpline: "हेल्पलाइन",
    recentActivity: "हालिया गतिविधि", availableSchemes: "आपके लिए उपलब्ध योजनाएं",
    all: "सभी", pending: "लंबित", approved: "स्वीकृत", rejected: "अस्वीकृत", subsidy: "सब्सिडी",
    insurance: "बीमा", credit: "ऋण", equipment: "उपकरण",
    applyNow: "अभी आवेदन करें", trackStatus: "स्थिति ट्रैक करें", viewCard: "कार्ड देखें",
    eligible: "आप पात्र हैं", notApplied: "आवेदन नहीं किया", applied: "आवेदन — समीक्षाधीन",
    received: "प्राप्त — जून 2024",
    totalReceived: "कुल प्राप्त (2024-25)", pendingAmount: "लंबित",
    needHelp: "मदद चाहिए? हम यहाँ हैं।", submitGrievance: "शिकायत दर्ज करें",
    subsDelayLabel: "सब्सिडी देरी", wrongBenef: "गलत लाभार्थी", docIssue: "दस्तावेज़ समस्या",
    officerIssue: "अधिकारी समस्या", techProblem: "तकनीकी समस्या", other: "अन्य",
    myProfile: "मेरी प्रोफ़ाइल", kycVerified: "KYC सत्यापित", personal: "व्यक्तिगत", contact: "संपर्क",
    land: "भूमि", bank: "बैंक", settings: "सेटिंग्स", language: "भाषा", notifications: "सूचनाएं",
    changeMobile: "मोबाइल नंबर बदलें", helpFaq: "सहायता और FAQ", logout: "लॉगआउट",
    today: "आज", yesterday: "कल", lastWeek: "पिछला सप्ताह",
  },
  mr: {
    greeting: "नमस्कार, रमेश जी 🙏", appName: "किसान सेवा", tagline: "तुमचं शेत. तुमचे हक्क. तुमचं सरकार.",
    home: "होम", applications: "अर्ज", payments: "पेमेंट", grievances: "तक्रार", profile: "प्रोफाइल",
    getOtp: "OTP पाठवा", verify: "सत्यापित करा", login: "लॉगिन", mobileNo: "मोबाइल नंबर", enterOtp: "OTP टाका",
    register: "नवीन शेतकरी म्हणून नोंदणी", weatherAdvisory: "सल्ला: या आठवड्यात कापूस पेरणीसाठी चांगली स्थिती",
    myFarm: "माझ्या शेताचा सारांश", totalLand: "एकूण जमीन", crop: "पीक", season: "हंगाम",
    soilHealth: "मृदा आरोग्य गुण", lastIrrigation: "शेवटचे सिंचन", daysAgo: "3 दिवसांपूर्वी",
    applyScheme: "योजनेसाठी अर्ज", fileClaim: "दावा नोंदवा", raiseGrievance: "तक्रार नोंदवा",
    checkSubsidy: "अनुदान तपासा", myDocs: "माझे कागदपत्रे", helpline: "हेल्पलाइन",
    recentActivity: "अलीकडील क्रिया", availableSchemes: "तुमच्यासाठी उपलब्ध योजना",
    all: "सर्व", pending: "प्रलंबित", approved: "मंजूर", rejected: "नाकारले", subsidy: "अनुदान",
    insurance: "विमा", credit: "कर्ज", equipment: "उपकरणे",
    applyNow: "आत्ता अर्ज करा", trackStatus: "स्थिती ट्रॅक करा", viewCard: "कार्ड पहा",
    eligible: "तुम्ही पात्र आहात", notApplied: "अर्ज केलेला नाही", applied: "अर्ज — पुनरावलोकनाधीन",
    received: "प्राप्त — जून 2024",
    totalReceived: "एकूण प्राप्त (2024-25)", pendingAmount: "प्रलंबित",
    needHelp: "मदत हवी आहे? आम्ही इथे आहोत.", submitGrievance: "तक्रार सादर करा",
    subsDelayLabel: "अनुदान विलंब", wrongBenef: "चुकीचा लाभार्थी", docIssue: "कागदपत्र समस्या",
    officerIssue: "अधिकारी समस्या", techProblem: "तांत्रिक समस्या", other: "इतर",
    myProfile: "माझे प्रोफाइल", kycVerified: "KYC सत्यापित", personal: "वैयक्तिक", contact: "संपर्क",
    land: "जमीन", bank: "बँक", settings: "सेटिंग्ज", language: "भाषा", notifications: "सूचना",
    changeMobile: "मोबाइल नंबर बदला", helpFaq: "मदत आणि FAQ", logout: "लॉगआउट",
    today: "आज", yesterday: "काल", lastWeek: "मागील आठवडा",
  },
};

const screens = [
  "Splash & Login", "Home / Dashboard", "Apply for Scheme", "My Applications",
  "Check Subsidy", "File Claim", "Raise Grievance", "My Profile", "Notifications"
];

export default function FarmerAppPreview() {
  const { lang } = useLang();
  const [activeScreen, setActiveScreen] = useState("Home / Dashboard");
  const [bottomTab, setBottomTab] = useState("home");
  const [loginState, setLoginState] = useState<"splash" | "login" | "otp" | "done">("done");
  const [grCategory, setGrCategory] = useState("");
  const [grSubmitted, setGrSubmitted] = useState(false);

  const t = (key: string) => translations[lang]?.[key] || translations["en"][key] || key;

  const switchScreen = (screen: string) => {
    setActiveScreen(screen);
    if (screen === "Splash & Login") setLoginState("splash");
    if (screen === "Home / Dashboard") setBottomTab("home");
    if (screen === "My Applications") setBottomTab("applications");
    if (screen === "Check Subsidy") setBottomTab("payments");
    if (screen === "Raise Grievance") setBottomTab("grievances");
    if (screen === "My Profile") setBottomTab("profile");
    setGrCategory("");
    setGrSubmitted(false);
  };

  const renderScreen = () => {
    if (activeScreen === "Splash & Login") return <SplashLogin t={t} loginState={loginState} setLoginState={setLoginState} onDone={() => switchScreen("Home / Dashboard")} />;
    if (activeScreen === "Home / Dashboard") return <HomeScreen t={t} onNavigate={switchScreen} />;
    if (activeScreen === "Apply for Scheme") return <ApplySchemeScreen t={t} />;
    if (activeScreen === "My Applications") return <MyApplicationsScreen t={t} />;
    if (activeScreen === "Check Subsidy") return <CheckSubsidyScreen t={t} />;
    if (activeScreen === "File Claim") return <FileClaimScreen t={t} />;
    if (activeScreen === "Raise Grievance") return <RaiseGrievanceScreen t={t} grCategory={grCategory} setGrCategory={setGrCategory} grSubmitted={grSubmitted} setGrSubmitted={setGrSubmitted} />;
    if (activeScreen === "My Profile") return <MyProfileScreen t={t} lang={lang} />;
    if (activeScreen === "Notifications") return <NotificationsScreen t={t} />;
    return <HomeScreen t={t} onNavigate={switchScreen} />;
  };

  const showBottomNav = !["Splash & Login"].includes(activeScreen);

  return (
    <div className="animate-fade-in" style={{ opacity: 0 }}>
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
        {/* Controls */}
        <div className="space-y-4 lg:w-64">
          <div>
            <label className="block text-sm font-medium mb-1">Screen</label>
            <select value={activeScreen} onChange={e => switchScreen(e.target.value)}
              className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2">
              {screens.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Phone Frame */}
        <div className="relative" style={{ width: 375, height: 812 }}>
          <div className="absolute inset-0 rounded-[40px] bg-foreground shadow-2xl overflow-hidden border-4 border-foreground">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-foreground rounded-b-2xl z-30" />
            {/* Status bar */}
            <div className="absolute top-0 left-0 right-0 h-11 z-20 flex items-end justify-between px-6 pb-1 text-[10px] font-medium" style={{ color: activeScreen === "Splash & Login" ? "#fff" : "#1B7A3E" }}>
              <span>9:41</span>
              <span className="flex gap-1">📶 🔋</span>
            </div>
            {/* Content */}
            <div className="absolute top-11 left-0 right-0 overflow-y-auto" style={{ bottom: showBottomNav ? 64 : 0, scrollbarWidth: "none" }}>
              {renderScreen()}
            </div>
            {/* Bottom Nav */}
            {showBottomNav && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around px-2 z-20">
                {[
                  { key: "home", icon: Home, label: t("home"), screen: "Home / Dashboard" },
                  { key: "applications", icon: FileText, label: t("applications"), screen: "My Applications" },
                  { key: "payments", icon: Wallet, label: t("payments"), screen: "Check Subsidy" },
                  { key: "grievances", icon: Megaphone, label: t("grievances"), screen: "Raise Grievance" },
                  { key: "profile", icon: User, label: t("profile"), screen: "My Profile" },
                ].map(tab => (
                  <button key={tab.key} onClick={() => { setBottomTab(tab.key); switchScreen(tab.screen); }}
                    className={`flex flex-col items-center gap-0.5 min-w-[48px] min-h-[48px] justify-center ${bottomTab === tab.key ? "text-[#1B7A3E]" : "text-gray-400"}`}>
                    <tab.icon className="h-5 w-5" />
                    <span className="text-[10px]">{tab.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-screens ──

function SplashLogin({ t, loginState, setLoginState, onDone }: { t: (k: string) => string; loginState: string; setLoginState: (s: any) => void; onDone: () => void }) {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);

  if (loginState === "splash") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8" style={{ background: "linear-gradient(180deg, #1B7A3E 0%, #0D5C2E 100%)" }}>
        <div className="text-6xl mb-4">🌾</div>
        <h1 className="text-2xl font-bold text-white mb-2">{t("appName")}</h1>
        <div className="w-40 h-1.5 bg-white/20 rounded-full overflow-hidden mt-6">
          <div className="h-full bg-white rounded-full animate-pulse" style={{ width: "70%" }} />
        </div>
        <button onClick={() => setLoginState("login")} className="mt-8 text-white/70 text-xs">Tap to continue →</button>
      </div>
    );
  }

  if (loginState === "login") {
    return (
      <div className="p-6 bg-white h-full">
        <div className="text-center mb-8 pt-4">
          <div className="text-4xl mb-2">🌾</div>
          <h2 className="text-lg font-bold text-[#1B7A3E]">{t("appName")}</h2>
          <p className="text-xs text-gray-500 mt-1">{t("tagline")}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">{t("mobileNo")}</label>
            <input value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-[#FF9933] focus:outline-none" placeholder="98XXXXXXXX" />
          </div>
          <button onClick={() => setLoginState("otp")}
            className="w-full py-3 rounded-xl text-white font-medium text-sm min-h-[48px]" style={{ backgroundColor: "#FF9933" }}>
            {t("getOtp")}
          </button>
          <p className="text-center text-xs text-[#1B7A3E] mt-4">{t("register")}</p>
        </div>
        <div className="flex justify-center gap-4 mt-8">
          {["EN", "हिंदी", "मराठी"].map(l => (
            <span key={l} className="text-xs text-gray-400">{l}</span>
          ))}
        </div>
      </div>
    );
  }

  if (loginState === "otp") {
    return (
      <div className="p-6 bg-white h-full">
        <div className="text-center mb-8 pt-4">
          <div className="text-4xl mb-2">🌾</div>
          <h2 className="text-lg font-bold text-[#1B7A3E]">{t("enterOtp")}</h2>
          <p className="text-xs text-gray-500 mt-1">OTP sent to 98XXXXXXXX</p>
        </div>
        <div className="flex justify-center gap-3 mb-6">
          {otp.map((v, i) => (
            <input key={i} value={v} onChange={e => {
              const newOtp = [...otp];
              newOtp[i] = e.target.value.slice(-1);
              setOtp(newOtp);
            }} maxLength={1}
              className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#FF9933] focus:outline-none" />
          ))}
        </div>
        <button onClick={onDone}
          className="w-full py-3 rounded-xl text-white font-medium text-sm min-h-[48px]" style={{ backgroundColor: "#FF9933" }}>
          {t("verify")}
        </button>
        <p className="text-center text-xs text-gray-400 mt-4">Resend OTP in 45s</p>
      </div>
    );
  }

  return null;
}

function HomeScreen({ t, onNavigate }: { t: (k: string) => string; onNavigate: (s: string) => void }) {
  return (
    <div className="bg-[#F4F4F4] min-h-full">
      {/* Header */}
      <div className="p-4 pb-3" style={{ backgroundColor: "#1B7A3E" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌾</span>
            <span className="text-white font-bold text-sm">{t("appName")}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate("Notifications")} className="relative text-white min-w-[48px] min-h-[48px] flex items-center justify-center">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">2</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">RP</div>
          </div>
        </div>
        <p className="text-white/90 text-sm mt-2">{t("greeting")}</p>
      </div>

      {/* Weather */}
      <div className="mx-4 -mt-1 rounded-xl p-3 text-white" style={{ background: "linear-gradient(135deg, #4BA3C3, #87CEEB)" }}>
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs opacity-80">Wardha, Maharashtra</div>
            <div className="flex items-center gap-1 mt-1">
              <Sun className="h-6 w-6" /><span className="text-2xl font-bold">34°C</span>
            </div>
            <div className="text-xs mt-1 opacity-80">Humidity: 58% | Wind: 12 km/h</div>
          </div>
          <div className="flex gap-2">
            {[
              { d: "Mon", icon: Cloud, temp: "32°" },
              { d: "Tue", icon: CloudRain, temp: "28°" },
              { d: "Wed", icon: Sun, temp: "36°" },
            ].map(f => (
              <div key={f.d} className="text-center text-[10px]">
                <div>{f.d}</div>
                <f.icon className="h-3.5 w-3.5 mx-auto my-0.5" />
                <div>{f.temp}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs mt-2 bg-white/20 rounded-lg px-2 py-1">{t("weatherAdvisory")}</div>
      </div>

      {/* Farm Summary */}
      <div className="mx-4 mt-3 bg-white rounded-xl p-3 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-2">{t("myFarm")}</h3>
        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
          <div><div className="text-gray-500">{t("totalLand")}</div><div className="font-bold">4.5 ac</div></div>
          <div><div className="text-gray-500">{t("crop")}</div><div className="font-bold">Cotton</div></div>
          <div><div className="text-gray-500">{t("season")}</div><div className="font-bold">Kharif 2024</div></div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">{t("soilHealth")}:</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: "72%" }} /></div>
          <span className="font-bold">72</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">{t("lastIrrigation")}: {t("daysAgo")}</div>
      </div>

      {/* Quick Actions */}
      <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
        {[
          { icon: "📋", label: t("applyScheme"), screen: "Apply for Scheme" },
          { icon: "🛡️", label: t("fileClaim"), screen: "File Claim" },
          { icon: "📣", label: t("raiseGrievance"), screen: "Raise Grievance" },
          { icon: "💰", label: t("checkSubsidy"), screen: "Check Subsidy" },
          { icon: "📄", label: t("myDocs"), screen: "My Profile" },
          { icon: "📞", label: t("helpline"), screen: "" },
        ].map((a, i) => (
          <button key={i} onClick={() => a.screen && onNavigate(a.screen)}
            className="bg-white rounded-xl p-3 text-center shadow-sm min-h-[48px]">
            <div className="text-xl mb-1">{a.icon}</div>
            <div className="text-[10px] text-gray-600 leading-tight">{a.label}</div>
          </button>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mx-4 mt-3 mb-4">
        <h3 className="text-sm font-bold text-gray-800 mb-2">{t("recentActivity")}</h3>
        {[
          { icon: "✅", text: "PM-KISAN ₹2,000 credited — 10 Jun", color: "bg-green-50" },
          { icon: "📋", text: "APP-1901 — Under Review", color: "bg-blue-50" },
          { icon: "🔔", text: "Soil Health Card ready", color: "bg-yellow-50" },
          { icon: "⚠️", text: "Insurance premium due: ₹720 by Jun 30", color: "bg-red-50" },
        ].map((a, i) => (
          <div key={i} className={`${a.color} rounded-lg p-2.5 mb-1.5 flex items-center gap-2`}>
            <span>{a.icon}</span>
            <span className="text-xs text-gray-700">{a.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplySchemeScreen({ t }: { t: (k: string) => string }) {
  const [filter, setFilter] = useState("all");
  const schemes = [
    { icon: "🌱", name: "PM Kisan Samman Nidhi", desc: "₹2,000 per installment | 3/year", status: t("notApplied"), statusColor: "bg-blue-100 text-blue-700", btn: t("applyNow"), eligible: true },
    { icon: "🛡️", name: "PMFBY (Crop Insurance)", desc: "Crop insurance for Kharif 2024", status: t("applied"), statusColor: "bg-amber-100 text-amber-700", btn: t("trackStatus"), eligible: true },
    { icon: "💳", name: "Kisan Credit Card", desc: "Credit up to ₹3,00,000 at 4%", status: t("notApplied"), statusColor: "bg-blue-100 text-blue-700", btn: t("applyNow"), eligible: true },
    { icon: "🌍", name: "Soil Health Card", desc: "Free soil testing + advisory", status: t("received"), statusColor: "bg-green-100 text-green-700", btn: t("viewCard"), eligible: true },
  ];
  return (
    <div className="bg-[#F4F4F4] min-h-full">
      <div className="p-4 pb-3" style={{ backgroundColor: "#1B7A3E" }}>
        <h2 className="text-white font-bold text-sm">{t("availableSchemes")}</h2>
      </div>
      <div className="flex gap-1.5 px-4 py-2 overflow-x-auto">
        {[["all", t("all")], ["subsidy", t("subsidy")], ["insurance", t("insurance")], ["credit", t("credit")]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`text-[11px] px-3 py-1 rounded-full whitespace-nowrap ${filter === k ? "bg-[#1B7A3E] text-white" : "bg-white text-gray-600"}`}>{l}</button>
        ))}
      </div>
      <div className="px-4 space-y-2 pb-4">
        {schemes.map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <span className="text-2xl">{s.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-sm text-gray-800">{s.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
                <div className="flex items-center gap-2 mt-2">
                  {s.eligible && <span className="text-[10px] text-green-600">✅ {t("eligible")}</span>}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.statusColor}`}>{s.status}</span>
                </div>
              </div>
            </div>
            <button className="w-full mt-2 py-2 rounded-lg text-white text-xs font-medium min-h-[48px]" style={{ backgroundColor: "#FF9933" }}>{s.btn}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyApplicationsScreen({ t }: { t: (k: string) => string }) {
  const [tab, setTab] = useState("all");
  const apps = [
    { scheme: "PM-KISAN", id: "APP-1901", date: "12 Jun", status: "Under Review", statusColor: "bg-amber-100 text-amber-700", progress: 87, icon: "🌱" },
    { scheme: "PMFBY", id: "APP-1856", date: "02 Jun", status: "Approved", statusColor: "bg-green-100 text-green-700", progress: 100, icon: "🛡️" },
    { scheme: "KCC", id: "APP-1743", date: "15 May", status: "Rejected", statusColor: "bg-red-100 text-red-700", progress: 100, icon: "💳" },
    { scheme: "Soil Health", id: "APP-1621", date: "10 Apr", status: "Approved", statusColor: "bg-green-100 text-green-700", progress: 100, icon: "🌍" },
  ];
  return (
    <div className="bg-[#F4F4F4] min-h-full">
      <div className="p-4 pb-3" style={{ backgroundColor: "#1B7A3E" }}>
        <h2 className="text-white font-bold text-sm">{t("applications")}</h2>
      </div>
      <div className="flex gap-1.5 px-4 py-2">
        {[["all", t("all")], ["pending", t("pending")], ["approved", t("approved")], ["rejected", t("rejected")]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`text-[11px] px-3 py-1 rounded-full ${tab === k ? "bg-[#1B7A3E] text-white" : "bg-white text-gray-600"}`}>{l}</button>
        ))}
      </div>
      <div className="px-4 space-y-2 pb-4">
        {apps.map((a, i) => (
          <div key={i} className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{a.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-sm">{a.scheme}</div>
                <div className="text-xs text-gray-500">{a.id} · {a.date}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.statusColor}`}>{a.status}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>AI Verification:</span>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full"><div className="h-full bg-[#1B7A3E] rounded-full" style={{ width: `${a.progress}%` }} /></div>
              <span>{a.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckSubsidyScreen({ t }: { t: (k: string) => string }) {
  return (
    <div className="bg-[#F4F4F4] min-h-full">
      <div className="p-4 pb-3" style={{ backgroundColor: "#1B7A3E" }}>
        <h2 className="text-white font-bold text-sm">{t("payments")}</h2>
      </div>
      <div className="mx-4 mt-3 rounded-xl p-4 text-white" style={{ background: "linear-gradient(135deg, #1B7A3E, #2D8B4E)" }}>
        <div className="text-xs opacity-80">{t("totalReceived")}</div>
        <div className="text-2xl font-bold mt-1">₹6,500</div>
        <div className="text-xs mt-1 opacity-80">{t("pendingAmount")}: ₹2,000 (PM-KISAN Q1)</div>
      </div>
      <div className="px-4 mt-4">
        {[
          { month: "JUNE 2024", items: [
            { icon: "✅", scheme: "PM-KISAN Installment 3", amt: "₹2,000", bank: "SBI ****1234", date: "Jun 10" },
            { icon: "✅", scheme: "PMFBY Premium Refund", amt: "₹720", bank: "SBI ****1234", date: "Jun 8" },
          ]},
          { month: "APRIL 2024", items: [
            { icon: "✅", scheme: "PM-KISAN Installment 2", amt: "₹2,000", bank: "SBI ****1234", date: "Apr 15" },
          ]},
          { month: "JANUARY 2024", items: [
            { icon: "✅", scheme: "PM-KISAN Installment 1", amt: "₹2,000", bank: "SBI ****1234", date: "Jan 12" },
          ]},
        ].map((g, gi) => (
          <div key={gi} className="mb-3">
            <div className="text-[10px] font-bold text-gray-400 mb-1">{g.month}</div>
            {g.items.map((item, ii) => (
              <div key={ii} className="bg-white rounded-lg p-2.5 mb-1 flex items-center gap-2">
                <span>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{item.scheme}</div>
                  <div className="text-[10px] text-gray-500">{item.bank} · {item.date}</div>
                </div>
                <div className="text-sm font-bold text-[#1B7A3E]">{item.amt}</div>
              </div>
            ))}
          </div>
        ))}
        <div className="bg-white rounded-xl p-3 mt-2 mb-4">
          <div className="text-xs font-bold text-gray-800 mb-1">Bank Account Linked</div>
          <div className="text-xs text-gray-600">SBI — Account ending ****1234</div>
          <div className="text-[10px] text-green-600 mt-1">✅ NPCI: Aadhaar Mapped</div>
        </div>
      </div>
    </div>
  );
}

function FileClaimScreen({ t }: { t: (k: string) => string }) {
  const [lossPercent, setLossPercent] = useState(65);
  return (
    <div className="bg-[#F4F4F4] min-h-full">
      <div className="p-4 pb-3" style={{ backgroundColor: "#1B7A3E" }}>
        <h2 className="text-white font-bold text-sm">{t("fileClaim")}</h2>
      </div>
      <div className="px-4 mt-3">
        {/* Active policy */}
        <div className="bg-white rounded-xl p-3 shadow-sm mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span>🛡️</span><span className="font-bold text-sm">PMFBY Cotton Kharif 2024</span>
          </div>
          <div className="text-xs text-gray-500">Sum Insured: ₹45,000 | Status: <span className="text-green-600 font-medium">Active</span></div>
        </div>
        {/* Loss slider */}
        <div className="bg-white rounded-xl p-3 shadow-sm mb-3">
          <div className="text-xs font-medium text-gray-700 mb-2">Estimated Loss: <strong>{lossPercent}%</strong></div>
          <input type="range" min={0} max={100} value={lossPercent} onChange={e => setLossPercent(parseInt(e.target.value))}
            className="w-full h-2 accent-[#FF9933]" />
          <div className="mt-2 text-xs text-gray-500 space-y-0.5">
            <div>Estimated: ₹{Math.round(4.5 * 6620 * lossPercent / 100).toLocaleString()}</div>
            <div>Policy Coverage: ₹45,000</div>
          </div>
        </div>
        {/* Photo + GPS */}
        <div className="bg-white rounded-xl p-3 shadow-sm mb-3 space-y-2">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-600 min-h-[48px]">
            <Camera className="h-4 w-4" /> Upload Crop Photos
          </button>
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1B7A3E] text-white text-xs min-h-[48px]">
            <MapPin className="h-4 w-4" /> Capture GPS Location
          </button>
        </div>
        {/* Active claims */}
        <div className="text-xs font-bold text-gray-800 mb-2">Active Claims</div>
        <div className="bg-white rounded-xl p-3 shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-sm">CLM-001</span>
            <span className="text-xs text-gray-500">Cotton</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Under Processing</span>
          </div>
          <div className="text-xs text-gray-500 mb-2">Loss: 68% | Claimed: ₹42,000</div>
          <div className="flex items-center gap-1 text-[10px]">
            {["Filed", "AI Review", "Survey", "Approval", "Settlement"].map((step, i) => (
              <div key={step} className="flex items-center gap-1">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${i <= 1 ? "bg-[#1B7A3E] text-white" : "bg-gray-200 text-gray-500"}`}>
                  {i <= 1 ? "✓" : i + 1}
                </div>
                {i < 4 && <div className={`w-4 h-0.5 ${i < 1 ? "bg-[#1B7A3E]" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>
        <button className="w-full py-3 rounded-xl text-white font-medium text-sm min-h-[48px] mb-4" style={{ backgroundColor: "#FF9933" }}>
          File New Claim
        </button>
      </div>
    </div>
  );
}

function RaiseGrievanceScreen({ t, grCategory, setGrCategory, grSubmitted, setGrSubmitted }: { t: (k: string) => string; grCategory: string; setGrCategory: (s: string) => void; grSubmitted: boolean; setGrSubmitted: (b: boolean) => void }) {
  if (grSubmitted) {
    return (
      <div className="bg-[#F4F4F4] min-h-full flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-800">Grievance Registered!</h2>
        <div className="text-sm text-gray-600 mt-2 text-center space-y-1">
          <div>GR-0172 | Submitted: Jun 13, 2024</div>
          <div>Expected Resolution: Jun 16, 2024</div>
          <div className="text-xs text-gray-400 mt-2">You will receive an SMS update</div>
        </div>
        <button onClick={() => setGrSubmitted(false)} className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm min-h-[48px]" style={{ backgroundColor: "#FF9933" }}>
          Back to Home
        </button>
      </div>
    );
  }

  const catIcons: Record<string, string> = { [t("subsDelayLabel")]: "⏳", [t("wrongBenef")]: "👤", [t("docIssue")]: "📄", [t("officerIssue")]: "👮", [t("techProblem")]: "🔧", [t("other")]: "❓" };

  return (
    <div className="bg-[#F4F4F4] min-h-full">
      <div className="p-4 pb-3" style={{ backgroundColor: "#1B7A3E" }}>
        <h2 className="text-white font-bold text-sm">{t("grievances")}</h2>
      </div>
      <div className="px-4 mt-3">
        <div className="text-center mb-3">
          <div className="text-3xl mb-1">🤝</div>
          <p className="text-sm text-gray-600">{t("needHelp")}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[t("subsDelayLabel"), t("wrongBenef"), t("docIssue"), t("officerIssue"), t("techProblem"), t("other")].map(c => (
            <button key={c} onClick={() => setGrCategory(c)}
              className={`bg-white rounded-xl p-3 text-center shadow-sm min-h-[48px] ${grCategory === c ? "ring-2 ring-[#FF9933]" : ""}`}>
              <div className="text-xl mb-1">{catIcons[c]}</div>
              <div className="text-[10px] text-gray-600 leading-tight">{c}</div>
            </button>
          ))}
        </div>
        {grCategory && (
          <div className="space-y-3 mb-4">
            <input className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl" placeholder="Subject" />
            <textarea className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl h-24 resize-none" placeholder="Tell us what happened..." />
            <div className="flex gap-2">
              {["Call Me Back", "WhatsApp", "Portal"].map(m => (
                <button key={m} className="flex-1 py-2 rounded-lg border border-gray-200 text-[10px] bg-white min-h-[48px]">{m}</button>
              ))}
            </div>
            <button onClick={() => setGrSubmitted(true)}
              className="w-full py-3 rounded-xl text-white font-medium text-sm min-h-[48px]" style={{ backgroundColor: "#FF9933" }}>
              {t("submitGrievance")}
            </button>
          </div>
        )}
        {/* Past grievances */}
        <div className="text-xs font-bold text-gray-800 mb-2">{t("grievances")}</div>
        <div className="space-y-1.5 mb-4">
          <div className="bg-white rounded-lg p-2.5">
            <div className="text-xs font-medium">GR-0041 | Subsidy Delay</div>
            <div className="text-[10px] text-gray-500">Jun 10 | 🟡 In Progress</div>
          </div>
          <div className="bg-white rounded-lg p-2.5">
            <div className="text-xs font-medium">GR-0038 | Document Issue</div>
            <div className="text-[10px] text-gray-500">May 28 | ✅ Resolved in 2 days</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyProfileScreen({ t, lang }: { t: (k: string) => string; lang: string }) {
  return (
    <div className="bg-[#F4F4F4] min-h-full">
      <div className="p-4 pb-6" style={{ backgroundColor: "#1B7A3E" }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center text-2xl text-white font-bold">RP</div>
          <h2 className="text-white font-bold text-sm mt-2">Ramesh Patel</h2>
          <div className="text-white/70 text-xs">F-001</div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-200 mt-1 inline-block">✅ {t("kycVerified")}</span>
        </div>
      </div>
      <div className="px-4 -mt-3 space-y-3">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-xs font-bold text-gray-800 mb-2">{t("personal")}</div>
          {[["DOB", "15 Mar 1985"], ["Gender", "Male"], ["Category", "OBC"], ["Aadhaar", "XXXX-XXXX-1234"]].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs py-1 border-b border-gray-100 last:border-0">
              <span className="text-gray-500">{k}</span><span className="font-medium">{v}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="text-xs font-bold text-gray-800 mb-2">{t("myDocs")}</div>
          {[["📄 Aadhaar Card", "Jun 2024"], ["📄 7/12 Extract", "Jun 2024"], ["📄 Bank Passbook", "Jun 2024"], ["📄 Soil Health Card", "Jun 2024"]].map(([d, date]) => (
            <div key={d} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-0">
              <span>{d}</span>
              <div className="flex items-center gap-2"><span className="text-gray-400">{date}</span><Download className="h-3 w-3 text-[#1B7A3E]" /></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm mb-4">
          <div className="text-xs font-bold text-gray-800 mb-2">{t("settings")}</div>
          {[
            { icon: Globe, label: `${t("language")}: ${lang === "mr" ? "मराठी" : lang === "hi" ? "हिंदी" : "English"}` },
            { icon: Bell, label: `${t("notifications")}: On` },
            { icon: Phone, label: "1800-180-1551" },
            { icon: Lock, label: t("changeMobile") },
            { icon: HelpCircle, label: t("helpFaq") },
            { icon: LogOut, label: t("logout") },
          ].map((item, i) => (
            <button key={i} className="w-full flex items-center gap-2 text-xs py-2 border-b border-gray-100 last:border-0 min-h-[44px]">
              <item.icon className="h-3.5 w-3.5 text-gray-400" />
              <span>{item.label}</span>
              <ChevronRight className="h-3 w-3 text-gray-300 ml-auto" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationsScreen({ t }: { t: (k: string) => string }) {
  const groups = [
    { label: t("today"), items: [
      { color: "bg-green-500", text: "PM-KISAN ₹2,000 credited to your SBI account", time: "10:14 AM", unread: true },
      { color: "bg-blue-500", text: "Your application APP-1901 is under officer review", time: "09:32 AM", unread: true },
    ]},
    { label: t("yesterday"), items: [
      { color: "bg-amber-500", text: "Insurance premium of ₹720 due by Jun 30", time: "", unread: false },
      { color: "bg-blue-500", text: "Soil Health Card is ready. Download from My Documents.", time: "", unread: false },
    ]},
    { label: t("lastWeek"), items: [
      { color: "bg-green-500", text: "Grievance GR-0038 has been resolved.", time: "", unread: false },
      { color: "bg-red-500", text: "KCC application APP-1743 rejected. Land ownership proof mismatch.", time: "", unread: false },
    ]},
  ];
  return (
    <div className="bg-[#F4F4F4] min-h-full">
      <div className="p-4 pb-3" style={{ backgroundColor: "#1B7A3E" }}>
        <h2 className="text-white font-bold text-sm">{t("notifications")}</h2>
      </div>
      <div className="px-4 mt-3 space-y-3 pb-4">
        {groups.map((g, gi) => (
          <div key={gi}>
            <div className="text-[10px] font-bold text-gray-400 mb-1">{g.label}</div>
            {g.items.map((n, ni) => (
              <div key={ni} className={`bg-white rounded-lg p-3 mb-1.5 flex items-start gap-2 ${n.unread ? "border-l-2 border-blue-500" : ""}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.color}`} />
                <div className="flex-1">
                  <p className="text-xs text-gray-700">{n.text}</p>
                  {n.time && <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
