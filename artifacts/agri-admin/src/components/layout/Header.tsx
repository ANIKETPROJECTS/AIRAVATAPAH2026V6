import { useState, useEffect, useRef } from "react";
import Lottie from "lottie-react";
import {
  Bell, Shield, AlertTriangle, Ticket,
  CheckCircle2, Info, X, BellOff, CheckCheck,
} from "lucide-react";
import { useNotifications, type AppNotification, type NotificationType } from "@/contexts/NotificationContext";
import { useLang, type LangCode } from "@/contexts/LanguageContext";

/* ── time-ago helper ── */
function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── Notif icon ── */
function NotifIcon({ type }: { type: NotificationType }) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0";
  if (type === "scheme")    return <div className={`${base} bg-teal-100`}><Shield className="h-4 w-4 text-teal-600"/></div>;
  if (type === "grievance") return <div className={`${base} bg-lime-100`}><AlertTriangle className="h-4 w-4 text-lime-700"/></div>;
  if (type === "ticket")    return <div className={`${base} bg-green-100`}><Ticket className="h-4 w-4 text-green-700"/></div>;
  if (type === "farmer")    return <div className={`${base} bg-emerald-100`}><CheckCircle2 className="h-4 w-4 text-emerald-600"/></div>;
  return <div className={`${base} bg-slate-100`}><Info className="h-4 w-4 text-slate-500"/></div>;
}

/* ── Type → page mapping ── */
const TYPE_TO_PAGE: Record<NotificationType, string> = {
  farmer:    "farmers",
  grievance: "grievances",
  scheme:    "applications",
  ticket:    "applications",
  system:    "dashboard",
};

/* ── Notif row ── */
function NotifRow({ n, onRead, onNavigate, onClose }: {
  n: AppNotification;
  onRead: () => void;
  onNavigate?: (key: string) => void;
  onClose: () => void;
}) {
  function handleClick() {
    onRead();
    if (onNavigate) {
      onNavigate(TYPE_TO_PAGE[n.type] ?? "dashboard");
      onClose();
    }
  }
  return (
    <button onClick={handleClick}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-border/50 last:border-0 ${!n.read ? "bg-emerald-50/40" : ""}`}>
      <NotifIcon type={n.type}/>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className={`text-xs font-semibold leading-tight ${!n.read ? "text-slate-900" : "text-slate-600"}`}>{n.title}</span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">{timeAgo(n.timestamp)}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{n.body}</p>
        {n.farmerId && <span className="text-[10px] font-mono text-secondary mt-1 block">{n.farmerId}</span>}
      </div>
      {!n.read && <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5"/>}
    </button>
  );
}

/* ── Notification panel ── */
function NotifPanel({ onClose, onNavigate }: { onClose: () => void; onNavigate?: (key: string) => void }) {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  return (
    <div className="absolute right-0 top-full mt-2 w-[360px] bg-white border border-border rounded-2xl shadow-2xl shadow-black/10 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-slate-50">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-secondary"/>
          <span className="font-bold text-sm text-foreground">Notifications</span>
          {unreadCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">{unreadCount} new</span>}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] text-secondary hover:text-secondary/80 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors font-semibold">
              <CheckCheck className="h-3.5 w-3.5"/>Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="h-3 w-3"/>Clear
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors ml-1"><X className="h-3.5 w-3.5 text-muted-foreground"/></button>
        </div>
      </div>
      <div className="max-h-[380px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center"><BellOff className="h-6 w-6 text-slate-400"/></div>
            <div>
              <div className="text-sm font-semibold text-slate-600 mb-1">All caught up!</div>
              <p className="text-xs text-muted-foreground">No notifications yet. Actions like scheme applications, grievances, and ticket submissions will appear here.</p>
            </div>
          </div>
        ) : notifications.map(n => (
          <NotifRow key={n.id} n={n} onRead={() => markRead(n.id)} onNavigate={onNavigate} onClose={onClose}/>
        ))}
      </div>
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{notifications.length} total · {unreadCount} unread</span>
          <button
            onClick={() => { onNavigate?.("notifications"); onClose(); }}
            className="text-[11px] text-secondary hover:text-secondary/80 font-semibold hover:underline"
          >
            Manage all →
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Language selector ── */
function HeaderLangSelector() {
  const { lang, setLang } = useLang();
  const opts: { code: LangCode; label: string }[] = [
    { code: "mr", label: "मराठी" },
    { code: "hi", label: "हिंदी" },
    { code: "en", label: "EN" },
  ];
  return (
    <div className="flex items-center gap-1 bg-white rounded-full p-1 border border-border shadow-sm">
      {opts.map(o => (
        <button
          key={o.code}
          onClick={() => setLang(o.code)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            lang === o.code
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-black hover:bg-muted/10"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Main header ── */
export default function Header({ onAIOpen, onNavigate }: { onAIOpen: () => void; onNavigate?: (key: string) => void }) {
  const [time, setTime] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [airavataAnim, setAiravataAnim] = useState<object | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/animations/airavata-sidebar.json").then(r => r.json()).then(setAiravataAnim).catch(() => {});
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  return (
    <>
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card">
      <div className="text-sm font-medium text-black">
        {time.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        {" · "}
        {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>

      <div className="flex items-center gap-5">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => { setNotifOpen(o => !o); }}
            className={`relative p-2 rounded-lg transition-colors ${notifOpen ? "bg-emerald-50 text-secondary" : "hover:bg-muted"}`}>
            <Bell className={`h-5 w-5 ${notifOpen ? "text-secondary" : "text-foreground"}`}/>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)} onNavigate={onNavigate}/>}
        </div>

        <div className="w-px h-6 bg-border flex-shrink-0" />

        <div className="flex items-center gap-2 cursor-pointer" onClick={onAIOpen}>
          {airavataAnim && (
            <Lottie animationData={airavataAnim} loop style={{ width: 58, height: 58, flexShrink: 0 }} />
          )}
          <div className="hidden sm:block">
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: "13px", fontWeight: 500, letterSpacing: "0.13em", color: "#D97706" }} className="uppercase leading-tight">AIRAVATA INTELLIGENCE</p>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: "11px", fontWeight: 500, color: "#000000" }} className="leading-tight">AI Assistant</p>
          </div>
        </div>

        <div className="w-px h-6 bg-border flex-shrink-0" />

        {/* Language selector */}
        <HeaderLangSelector />
      </div>
    </header>
  </>
  );
}
