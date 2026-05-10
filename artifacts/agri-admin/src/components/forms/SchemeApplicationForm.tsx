import { useState } from "react";
import { X, Search, Check, AlertCircle, ArrowLeft } from "lucide-react";
import { farmers } from "@/data/dummyData";

const schemes = ["PM-KISAN", "PMFBY", "KCC", "Soil Health Card", "RKVY", "NFSM", "PMKSY", "eNAM Registration", "Others"];
const seasons = ["Kharif 2024", "Rabi 2024-25", "Annual 2024-25"];
const cropOptions = ["Cotton", "Soybean", "Sugarcane", "Wheat", "Rice", "Tur Dal", "Grapes", "Onion", "Jowar", "Bajra"];

const eligibilityInfo: Record<string, { criteria: string; checks: { label: string; pass: boolean }[] }> = {
  "PM-KISAN": {
    criteria: "Small/marginal farmer | Land < 2 hectares | Valid Aadhaar | Active bank account linked to NPCI",
    checks: [
      { label: "Land area qualifies (1.8 ha)", pass: true },
      { label: "Aadhaar valid", pass: true },
      { label: "Bank linked", pass: true },
      { label: "Already receiving PM-KISAN (2022)", pass: false },
    ]
  },
  "PMFBY": {
    criteria: "All farmers including sharecroppers | Valid crop sown certificate | Bank account linked",
    checks: [
      { label: "Farmer registration valid", pass: true },
      { label: "Land record verified", pass: true },
      { label: "Bank account active", pass: true },
    ]
  },
  "KCC": {
    criteria: "Small/marginal farmer | No outstanding loan default | Valid land records | Age 18-75",
    checks: [
      { label: "Age qualifies", pass: true },
      { label: "Land record valid", pass: true },
      { label: "No loan default", pass: true },
    ]
  },
};

interface Props {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function SchemeApplicationForm({ onClose, onSuccess }: Props) {
  const [farmerSearch, setFarmerSearch] = useState("");
  const [showFarmerSearch, setShowFarmerSearch] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<typeof farmers[0] | null>(null);
  const [confirmIdentity, setConfirmIdentity] = useState("");
  const [scheme, setScheme] = useState("");
  const [season, setSeason] = useState("");
  const [purpose, setPurpose] = useState("");
  const [cropInsured, setCropInsured] = useState("");
  const [sownArea, setSownArea] = useState("");
  const [expectedYield, setExpectedYield] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanAccountNo, setLoanAccountNo] = useState("");
  const [prevLoan, setPrevLoan] = useState(false);
  const [prevLoanAmt, setPrevLoanAmt] = useState("");
  const [selfDeclare, setSelfDeclare] = useState(false);
  const [captchaInput, setCaptchaInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(-1);
  const [showResult, setShowResult] = useState(false);

  const captchaCode = "A7K2";
  const showFinancial = ["PMFBY", "KCC", "RKVY"].includes(scheme);
  const premiumRate = 1200;
  const farmerShare = 0.3;

  const filteredFarmers = farmers.filter(f =>
    f.name.toLowerCase().includes(farmerSearch.toLowerCase()) || f.id.toLowerCase().includes(farmerSearch.toLowerCase())
  );

  const selectFarmer = (f: typeof farmers[0]) => {
    setSelectedFarmer(f);
    setShowFarmerSearch(false);
    setFarmerSearch("");
    setCropInsured(f.crop);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setSubmitStep(0);
    setTimeout(() => setSubmitStep(1), 1500);
    setTimeout(() => setSubmitStep(2), 3000);
    setTimeout(() => { setSubmitting(false); setShowResult(true); }, 4500);
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50";
  const labelCls = "block text-sm font-medium mb-1";

  if (showResult) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 md:p-10">
          <div className="text-center mb-4">
            <div className="w-20 h-20 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4 animate-scale-in">
              <Check className="h-10 w-10 text-success" />
            </div>
            <h2 className="font-heading text-2xl">Application Submitted</h2>
          </div>
          <div className="space-y-2 mb-4 text-sm">
            <div><strong>Application ID:</strong> APP-2024-{Math.floor(Math.random() * 9000) + 1000}</div>
            <div><strong>Scheme:</strong> {scheme}</div>
            <div><strong>AI Confidence:</strong> <span className="text-success font-medium">91%</span></div>
            <div><strong>Status:</strong> <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning">Under AI Review</span></div>
            <div><strong>Expected Processing:</strong> 3-5 working days</div>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 text-sm px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80">Close</button>
            <button onClick={() => { onClose(); onSuccess("✅ Application submitted successfully"); }} className="flex-1 text-sm px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90">Track Application</button>
          </div>
        </div>
      </div>
    );
  }

  if (submitting) {
    const steps = ["Validating farmer eligibility...", "Cross-checking documents...", "AI Confidence Assessment..."];
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="max-w-sm w-full p-8 text-center">
          <div className="w-12 h-12 mx-auto border-4 border-secondary border-t-transparent rounded-full animate-spin mb-6" />
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${i <= submitStep ? "text-foreground" : "text-muted-foreground"}`}>
                {i < submitStep ? <Check className="h-4 w-4 text-success flex-shrink-0" /> :
                  i === submitStep ? <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin flex-shrink-0" /> :
                    <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />}
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="font-heading text-2xl">New Scheme Application</h2>
        </div>

        <div className="space-y-6">
          {/* Section 1: Farmer Identification */}
          <div className="border border-border rounded-lg p-4 space-y-4">
            <h4 className="font-heading text-sm">Section 1 — Applicant Identification</h4>
            <div>
              <label className={labelCls}>Farmer ID <span className="text-destructive">*</span></label>
              <div className="flex gap-2">
                <input value={selectedFarmer?.id || ""} readOnly className={`${inputCls} flex-1`} placeholder="Search farmer..." />
                <button onClick={() => setShowFarmerSearch(true)} className="text-sm px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
            {selectedFarmer && (
              <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Name:</span> <strong>{selectedFarmer.name}</strong></div>
                  <div><span className="text-muted-foreground">District:</span> {selectedFarmer.district}</div>
                  <div><span className="text-muted-foreground">Land:</span> {selectedFarmer.land} acres</div>
                  <div><span className="text-muted-foreground">Crop:</span> {selectedFarmer.crop}</div>
                  <div><span className="text-muted-foreground">Aadhaar:</span> <span className="font-mono">{selectedFarmer.aadhaar}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> {selectedFarmer.status}</div>
                </div>
                <div className="pt-2">
                  <label className="text-sm font-medium">Is this the correct farmer?</label>
                  <div className="flex gap-4 mt-1">
                    {["Yes", "No"].map(v => (
                      <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input type="radio" name="confirmId" checked={confirmIdentity === v} onChange={() => setConfirmIdentity(v)} className="accent-secondary" />{v}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Scheme Selection */}
          <div className="border border-border rounded-lg p-4 space-y-4">
            <h4 className="font-heading text-sm">Section 2 — Scheme Selection</h4>
            <div>
              <label className={labelCls}>Scheme Name <span className="text-destructive">*</span></label>
              <select value={scheme} onChange={e => setScheme(e.target.value)} className={inputCls}>
                <option value="">Select Scheme</option>
                {schemes.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {scheme && eligibilityInfo[scheme] && (
              <div className="bg-agri-light border border-border rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-2"><strong>Eligibility:</strong> {eligibilityInfo[scheme].criteria}</div>
                <div className="space-y-1">
                  {eligibilityInfo[scheme].checks.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span>{c.pass ? "✅" : "⚠️"}</span>
                      <span className={c.pass ? "text-success" : "text-warning"}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className={labelCls}>Application Season</label>
              <select value={season} onChange={e => setSeason(e.target.value)} className={inputCls}>
                <option value="">Select Season</option>
                {seasons.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Purpose of Application</label>
              <textarea value={purpose} onChange={e => setPurpose(e.target.value.slice(0, 200))} className={`${inputCls} h-20 resize-none`} placeholder="Describe purpose..." />
              <p className="text-xs text-muted-foreground text-right">{purpose.length}/200</p>
            </div>
          </div>

          {/* Section 3: Financial */}
          {showFinancial && (
            <div className="border border-border rounded-lg p-4 space-y-4">
              <h4 className="font-heading text-sm">Section 3 — Crop & Financial Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Crop Insured / Financed</label>
                  <select value={cropInsured} onChange={e => setCropInsured(e.target.value)} className={inputCls}>
                    <option value="">Select Crop</option>
                    {cropOptions.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Sown Area (acres)</label>
                  <input type="number" value={sownArea} onChange={e => setSownArea(e.target.value)} className={inputCls} placeholder={`Max: ${selectedFarmer?.land || "N/A"}`} />
                </div>
                <div>
                  <label className={labelCls}>Expected Yield (kg/acre)</label>
                  <input type="number" value={expectedYield} onChange={e => setExpectedYield(e.target.value)} className={inputCls} placeholder="e.g. 500" />
                </div>
                <div>
                  <label className={labelCls}>Market Price</label>
                  <div className="bg-muted/30 rounded-lg px-3 py-2.5 text-sm">Current MSP: ₹6,620/quintal — as of Jun 2024</div>
                </div>
              </div>
              {scheme === "KCC" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Loan Amount Requested</label>
                    <input type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} max={300000} className={inputCls} placeholder="Max ₹3,00,000" />
                  </div>
                  <div>
                    <label className={labelCls}>Bank Loan Account No.</label>
                    <input value={loanAccountNo} onChange={e => setLoanAccountNo(e.target.value)} className={inputCls} />
                  </div>
                </div>
              )}
              {scheme === "PMFBY" && sownArea && (
                <div className="bg-agri-light border border-border rounded-lg p-3 text-sm">
                  <strong>Premium Calculation:</strong><br />
                  {sownArea} ha × ₹{premiumRate}/ha = ₹{(parseFloat(sownArea) * premiumRate).toLocaleString()} (Farmer share: ₹{(parseFloat(sownArea) * premiumRate * farmerShare).toLocaleString()})
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Previous Loan Outstanding?</label>
                <button onClick={() => setPrevLoan(!prevLoan)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${prevLoan ? "bg-secondary" : "bg-muted"}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${prevLoan ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                {prevLoan && <input type="number" value={prevLoanAmt} onChange={e => setPrevLoanAmt(e.target.value)} className="text-sm bg-background border border-border rounded-lg px-3 py-1.5 w-32" placeholder="Amount" />}
              </div>
            </div>
          )}

          {/* Section 4: Declaration */}
          <div className="border border-border rounded-lg p-4 space-y-4">
            <h4 className="font-heading text-sm">Section 4 — Declaration & Documents</h4>
            {selectedFarmer && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-medium mb-1">Documents from Farmer Vault:</div>
                {["Aadhaar Card", "Land Record", "Bank Passbook", "Photo ID"].map(d => (
                  <div key={d} className="flex items-center gap-2 text-sm"><span className="text-success">✅</span>{d}</div>
                ))}
                {scheme === "PMFBY" && <div className="flex items-center gap-2 text-sm"><span className="text-destructive">❌</span>Sowing Certificate (required)</div>}
              </div>
            )}
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={selfDeclare} onChange={e => setSelfDeclare(e.target.checked)} className="accent-secondary mt-1" />
              <span className="text-xs">I declare all information is true and correct. I consent to verification and data sharing.</span>
            </label>
            <div>
              <label className={labelCls}>Captcha: <span className="font-mono bg-muted px-2 py-0.5 rounded">{captchaCode}</span></label>
              <input value={captchaInput} onChange={e => setCaptchaInput(e.target.value)} className={`${inputCls} w-32`} placeholder="Enter code" />
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8 pt-4 border-t border-border">
          <button onClick={onClose} className="text-sm px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80">Cancel</button>
          <button onClick={handleSubmit}
            disabled={!selectedFarmer || !scheme || !selfDeclare || !captchaInput}
            className="text-sm px-6 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 disabled:opacity-50">Submit Application</button>
        </div>

        {/* Farmer Search Modal */}
        {showFarmerSearch && (
          <div className="fixed inset-0 bg-foreground/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowFarmerSearch(false)}>
            <div className="bg-card border border-border rounded-xl max-w-md w-full p-4 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-heading text-sm">Search Farmer</h3>
                <button onClick={() => setShowFarmerSearch(false)}><X className="h-4 w-4" /></button>
              </div>
              <input value={farmerSearch} onChange={e => setFarmerSearch(e.target.value)} className={inputCls} placeholder="Search by name or ID..." autoFocus />
              <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
                {filteredFarmers.map(f => (
                  <button key={f.id} onClick={() => selectFarmer(f)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-muted text-sm flex justify-between items-center">
                    <div><strong>{f.name}</strong> <span className="text-muted-foreground">({f.id})</span></div>
                    <span className="text-xs text-muted-foreground">{f.district}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
