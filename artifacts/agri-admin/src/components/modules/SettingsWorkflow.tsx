import { useState } from "react";
import { workflowRules, officers } from "@/data/dummyData";
import { Plus, X, Check, Globe } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { t, type LangCode } from "@/i18n/translations";

type TabKey = "rules" | "users" | "integrations" | "language";

const INTEGRATIONS = [
  { id: "email",     nameKey: "intg_email",     statusKey: "intg_status_active",         enabled: true },
  { id: "sms",       nameKey: "intg_sms",       statusKey: "intg_status_active",         enabled: true },
  { id: "whatsapp",  nameKey: "intg_whatsapp",  statusKey: "intg_status_connect",        enabled: false },
  { id: "satellite", nameKey: "intg_satellite", statusKey: "intg_status_connected",      enabled: true },
  { id: "uidai",     nameKey: "intg_uidai",     statusKey: "intg_status_connected",      enabled: true },
  { id: "land",      nameKey: "intg_land",      statusKey: "intg_status_disconnected",   enabled: false },
  { id: "pfms",      nameKey: "intg_pfms",      statusKey: "intg_status_connected",      enabled: true },
];

const INTG_LABELS: Record<string, Record<LangCode, string>> = {
  intg_email:     { en: "Email Notifications",                  hi: "ईमेल सूचनाएं",                       mr: "ईमेल सूचना" },
  intg_sms:       { en: "SMS Alerts for Farmers",               hi: "किसानों के लिए SMS अलर्ट",            mr: "शेतकऱ्यांसाठी SMS सूचना" },
  intg_whatsapp:  { en: "WhatsApp Bot Integration",             hi: "WhatsApp बॉट एकीकरण",                 mr: "WhatsApp बॉट एकत्रीकरण" },
  intg_satellite: { en: "Satellite Data Feed (ISRO NRSC)",      hi: "सैटेलाइट डेटा फीड (ISRO NRSC)",       mr: "उपग्रह डेटा फीड (ISRO NRSC)" },
  intg_uidai:     { en: "UIDAI Aadhaar Verify API",             hi: "UIDAI आधार सत्यापन API",              mr: "UIDAI आधार पडताळणी API" },
  intg_land:      { en: "Land Records API (State Revenue)",     hi: "भूमि अभिलेख API (राज्य राजस्व)",      mr: "जमीन नोंदी API (राज्य महसूल)" },
  intg_pfms:      { en: "PFMS Payment Gateway",                 hi: "PFMS भुगतान गेटवे",                   mr: "PFMS देयक प्रवेशद्वार" },
  intg_status_active:       { en: "",                           hi: "",                                     mr: "" },
  intg_status_connect:      { en: "Connect",                    hi: "जोड़ें",                               mr: "जोडा" },
  intg_status_connected:    { en: "Connected 🟢",               hi: "जुड़ा हुआ 🟢",                         mr: "जोडलेले 🟢" },
  intg_status_disconnected: { en: "Disconnected 🔴",            hi: "डिस्कनेक्ट 🔴",                       mr: "डिस्कनेक्ट 🔴" },
};

function tIntg(key: string, lang: LangCode): string {
  return INTG_LABELS[key]?.[lang] ?? INTG_LABELS[key]?.["en"] ?? key;
}

const LANG_OPTIONS: { code: LangCode; native: string; english: string; script: string }[] = [
  { code: "mr", native: "मराठी",   english: "Marathi", script: "देवनागरी" },
  { code: "hi", native: "हिंदी",   english: "Hindi",   script: "देवनागरी" },
  { code: "en", native: "English", english: "English", script: "Latin" },
];

export default function SettingsWorkflow() {
  const { lang, setLang } = useLang();
  const [tab, setTab] = useState<TabKey>("rules");
  const [rules, setRules] = useState(workflowRules.map((r, i) => ({ ...r, id: i })));
  const [users, setUsers] = useState(officers.map((o, i) => ({ ...o, id: i, active: true })));
  const [toast, setToast] = useState("");
  const [showAddRule, setShowAddRule] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newRule, setNewRule] = useState({ rule: "", trigger: "", action: "" });
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "", district: "" });
  const [integrationState, setIntegrationState] = useState(INTEGRATIONS.map(i => i.enabled));

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleSaveRule = () => {
    if (!newRule.rule.trim()) return;
    setRules(prev => [...prev, { ...newRule, id: prev.length, enabled: true }]);
    setNewRule({ rule: "", trigger: "", action: "" });
    setShowAddRule(false);
    showToast("✅ " + t("toast_rule_added", lang));
  };

  const handleCreateUser = () => {
    if (!newUser.name.trim()) return;
    setUsers(prev => [...prev, { ...newUser, id: prev.length, lastLogin: "—", status: "Active", active: true }]);
    setNewUser({ name: "", email: "", role: "", district: "" });
    setShowAddUser(false);
    showToast("✅ " + t("toast_user_created", lang));
  };

  const handleDeactivate = (name: string) => {
    setUsers(prev => prev.map(u => u.name === name ? { ...u, active: !u.active } : u));
    showToast(`⚠️ ${name} ${t("toast_deactivated", lang)}`);
  };

  const handleLangSelect = (code: LangCode) => {
    setLang(code);
    showToast("✅ " + t("toast_lang_saved", lang));
  };

  const tabs: { key: TabKey; labelKey: string }[] = [
    { key: "rules",        labelKey: "tab_rules" },
    { key: "users",        labelKey: "tab_users" },
    { key: "integrations", labelKey: "tab_integrations" },
    { key: "language",     labelKey: "tab_language" },
  ];

  return (
    <div className="space-y-6 animate-fade-in" style={{ opacity: 0 }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in" style={{ opacity: 0 }}>
          {toast}
        </div>
      )}

      <div className="flex gap-1 bg-muted/30 rounded-lg p-1 flex-wrap">
        {tabs.map(({ key, labelKey }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`text-sm px-4 py-2 rounded-md transition-colors ${tab === key ? "bg-card shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
            {t(labelKey, lang)}
          </button>
        ))}
      </div>

      {tab === "rules" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddRule(true)}
              className="text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-lg flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> {t("add_rule", lang)}
            </button>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t("col_rule", lang)}</th>
                  <th className="px-4 py-3 font-medium">{t("col_trigger", lang)}</th>
                  <th className="px-4 py-3 font-medium">{t("col_action", lang)}</th>
                  <th className="px-4 py-3 font-medium">{t("col_status", lang)}</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-t border-border/50 table-row-alt">
                    <td className="px-4 py-3">{r.rule}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.trigger}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.action}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setRules(prev => prev.map(x => x.id === r.id ? { ...x, enabled: !x.enabled } : x))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${r.enabled ? "bg-success" : "bg-muted"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-transform ${r.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddUser(true)}
              className="text-sm px-4 py-2 bg-secondary text-secondary-foreground rounded-lg flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> {t("add_user", lang)}
            </button>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t("col_name", lang)}</th>
                  <th className="px-4 py-3 font-medium">{t("col_role", lang)}</th>
                  <th className="px-4 py-3 font-medium">{t("col_district", lang)}</th>
                  <th className="px-4 py-3 font-medium">{t("col_lastlogin", lang)}</th>
                  <th className="px-4 py-3 font-medium">{t("col_status", lang)}</th>
                  <th className="px-4 py-3 font-medium">{t("col_actions", lang)}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(o => (
                  <tr key={o.id} className="border-t border-border/50 table-row-alt">
                    <td className="px-4 py-3 font-medium">{o.name}</td>
                    <td className="px-4 py-3">{o.role}</td>
                    <td className="px-4 py-3">{o.district}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.lastLogin}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${o.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {o.active ? o.status : t("btn_deactivate", lang)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="text-xs px-2 py-1 rounded bg-muted">{t("btn_edit", lang)}</button>
                        <button onClick={() => handleDeactivate(o.name)}
                          className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
                          {t("btn_deactivate", lang)}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "integrations" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INTEGRATIONS.map((intg, i) => {
            const statusText = tIntg(intg.statusKey, lang);
            const isDisconnected = intg.statusKey === "intg_status_disconnected";
            const isConnect = intg.statusKey === "intg_status_connect";
            return (
              <div key={intg.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between card-hover">
                <div>
                  <div className="font-medium text-sm">{tIntg(intg.nameKey, lang)}</div>
                  {statusText && <div className="text-xs text-muted-foreground mt-0.5">{statusText}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {!integrationState[i] && isDisconnected && (
                    <button onClick={() => showToast("🔗 " + t("toast_reconnecting", lang))}
                      className="text-xs px-3 py-1 rounded bg-secondary text-secondary-foreground">
                      {t("btn_reconnect", lang)}
                    </button>
                  )}
                  {!integrationState[i] && isConnect && (
                    <button onClick={() => {
                      setIntegrationState(prev => { const n = [...prev]; n[i] = true; return n; });
                      showToast("✅ " + t("toast_connected", lang));
                    }} className="text-xs px-3 py-1 rounded bg-secondary text-secondary-foreground">
                      {t("btn_connect", lang)}
                    </button>
                  )}
                  <button onClick={() => setIntegrationState(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${integrationState[i] ? "bg-success" : "bg-muted"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-transform ${integrationState[i] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "language" && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-base">{t("lang_heading", lang)}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t("lang_subheading", lang)}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LANG_OPTIONS.map(opt => {
                const isActive = lang === opt.code;
                return (
                  <button
                    key={opt.code}
                    onClick={() => handleLangSelect(opt.code)}
                    className={`relative flex flex-col items-start gap-1 p-4 rounded-xl border-2 transition-all text-left ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </span>
                    )}
                    <span className="text-2xl font-bold leading-none text-foreground">{opt.native}</span>
                    <span className="text-sm text-muted-foreground">{opt.english}</span>
                    <span className="text-xs text-muted-foreground/60">{opt.script}</span>
                    {isActive && (
                      <span className="mt-1 text-xs font-medium text-primary">{t("lang_active", lang)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showAddRule && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddRule(false)}>
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 animate-fade-in" style={{ opacity: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h2 className="font-heading text-lg">{t("modal_add_rule", lang)}</h2>
              <button onClick={() => setShowAddRule(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={newRule.rule} onChange={e => setNewRule(p => ({ ...p, rule: e.target.value }))}
                placeholder={t("ph_rule_desc", lang)} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg" />
              <input value={newRule.trigger} onChange={e => setNewRule(p => ({ ...p, trigger: e.target.value }))}
                placeholder={t("ph_trigger", lang)} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg" />
              <input value={newRule.action} onChange={e => setNewRule(p => ({ ...p, action: e.target.value }))}
                placeholder={t("ph_action", lang)} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg" />
            </div>
            <button onClick={handleSaveRule}
              className="w-full mt-4 text-sm py-2.5 bg-secondary text-secondary-foreground rounded-lg">
              {t("btn_save_rule", lang)}
            </button>
          </div>
        </div>
      )}

      {showAddUser && (
        <div className="fixed inset-0 bg-foreground/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAddUser(false)}>
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 animate-fade-in" style={{ opacity: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h2 className="font-heading text-lg">{t("modal_add_user", lang)}</h2>
              <button onClick={() => setShowAddUser(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                placeholder={t("ph_full_name", lang)} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg" />
              <input value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                placeholder={t("ph_email", lang)} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg" />
              <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg">
                <option value="">{t("ph_select_role", lang)}</option>
                <option value="District Officer">{t("role_officer", lang)}</option>
                <option value="Field Inspector">{t("role_inspector", lang)}</option>
                <option value="Data Entry">{t("role_data_entry", lang)}</option>
                <option value="Grievance Officer">{t("role_grievance", lang)}</option>
              </select>
              <select value={newUser.district} onChange={e => setNewUser(p => ({ ...p, district: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg">
                <option value="">{t("ph_select_district", lang)}</option>
                <option>Nagpur</option><option>Pune</option><option>Amravati</option><option>Nashik</option><option>Latur</option>
              </select>
            </div>
            <button onClick={handleCreateUser}
              className="w-full mt-4 text-sm py-2.5 bg-secondary text-secondary-foreground rounded-lg">
              {t("btn_create_user", lang)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
