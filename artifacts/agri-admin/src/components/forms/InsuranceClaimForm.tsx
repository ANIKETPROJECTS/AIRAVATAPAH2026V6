import { useState } from "react";
import { X, Check, MapPin, Camera, ArrowLeft } from "lucide-react";
import { farmers } from "@/data/dummyData";

const claimTypes = ["Crop Loss", "Post-harvest Loss", "Prevented Sowing", "Localized Calamity", "Mid-season Adversity"];
const causesOfLoss = ["Drought", "Flood", "Hailstorm", "Pest Attack", "Disease", "Cyclone", "Lightning", "Fire", "Other"];
const weatherStations = ["Wardha AWS", "Nagpur IMD", "Amravati AWS"];

interface Props {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function InsuranceClaimForm({ onClose, onSuccess }: Props) {
  const [selectedFarmer, setSelectedFarmer] = useState<typeof farmers[0] | null>(null);
  const [showFarmerSearch, setShowFarmerSearch] = useState(false);
  const [farmerSearch, setFarmerSearch] = useState("");
  const [policyNo, setPolicyNo] = useState("");
  const [claimType, setClaimType] = useState("");
  const [cause, setCause] = useState("");
  const [lossDate, setLossDate] = useState("");
  const [affectedSurvey, setAffectedSurvey] = useState<string[]>(["142/A"]);
  const [affectedArea, setAffectedArea] = useState("");
  const [lossPercent, setLossPercent] = useState(50);
  const [weatherStation, setWeatherStation] = useState("");
  const [witnessName, setWitnessName] = useState("");
  const [witnessMobile, setWitnessMobile] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [firUploaded, setFirUploaded] = useState(false);
  const [sowingCertUploaded, setSowingCertUploaded] = useState(false);
  const [gpsCapturing, setGpsCapturing] = useState(false);
  const [gpsLocation, setGpsLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(-1);
  const [showResult, setShowResult] = useState(false);

  const msp = 6620;
  const insuredArea = selectedFarmer ? selectedFarmer.land : 0;
  const estimatedLoss = affectedArea ? Math.round(parseFloat(affectedArea) * msp * (lossPercent / 100)) : 0;
  const policyCoverage = 45000;

  const filteredFarmers = farmers.filter(f =>
    f.name.toLowerCase().includes(farmerSearch.toLowerCase()) || f.id.toLowerCase().includes(farmerSearch.toLowerCase())
  );

  const captureGps = () => {
    setGpsCapturing(true);
    setTimeout(() => { setGpsLocation("20.7002° N, 78.4983° E"); setGpsCapturing(false); }, 1500);
  };

  const addPhoto = () => {
    if (photos.length >= 5) return;
    setPhotos(prev => [...prev, `crop_loss_photo_${prev.length + 1}.jpg`]);
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
  const allFilled = selectedFarmer && claimType && cause && lossDate && affectedArea;

  if (showResult) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 md:p-10">
          <div className="text-center mb-4">
            <div className="w-20 h-20 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4 animate-scale-in"><Check className="h-10 w-10 text-success" /></div>
            <h2 className="font-heading text-2xl">Claim Filed Successfully</h2>
          </div>
          <div className="space-y-2 text-sm mb-4">
            <div><strong>Claim ID:</strong> CLM-{Math.floor(Math.random() * 900) + 100}</div>
            <div><strong>Status:</strong> <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning">Under AI Review</span></div>
            <div><strong>Estimated Processing:</strong> 5-7 working days</div>
          </div>
          <button onClick={() => { onClose(); onSuccess("✅ Insurance claim filed"); }} className="w-full text-sm py-2.5 rounded-lg bg-secondary text-secondary-foreground">Close</button>
        </div>
      </div>
    );
  }

  if (submitting) {
    const steps = ["Validating policy details...", "Checking satellite & weather data...", "AI Loss Assessment..."];
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
          <h2 className="font-heading text-2xl">File Insurance Claim</h2>
        </div>

        <div className="space-y-4">
          {/* Farmer lookup */}
          <div>
            <label className={labelCls}>Farmer ID <span className="text-destructive">*</span></label>
            <div className="flex gap-2">
              <input value={selectedFarmer ? `${selectedFarmer.id} — ${selectedFarmer.name}` : ""} readOnly className={`${inputCls} flex-1`} placeholder="Select farmer..." />
              <button onClick={() => setShowFarmerSearch(true)} className="text-sm px-4 py-2 rounded-lg bg-secondary text-secondary-foreground">Lookup</button>
            </div>
          </div>

          {selectedFarmer && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Policy Number</label>
                  <select value={policyNo} onChange={e => setPolicyNo(e.target.value)} className={inputCls}>
                    <option value="">Select Policy</option>
                    <option>PMFBY-2024-{selectedFarmer.id}-KH</option>
                    <option>PMFBY-2023-{selectedFarmer.id}-RB</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Claim Type <span className="text-destructive">*</span></label>
                  <select value={claimType} onChange={e => setClaimType(e.target.value)} className={inputCls}>
                    <option value="">Select Type</option>
                    {claimTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Cause of Loss <span className="text-destructive">*</span></label>
                  <select value={cause} onChange={e => setCause(e.target.value)} className={inputCls}>
                    <option value="">Select Cause</option>
                    {causesOfLoss.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Date of Loss Event <span className="text-destructive">*</span></label>
                  <input type="date" value={lossDate} onChange={e => setLossDate(e.target.value)} max={new Date().toISOString().split("T")[0]} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Affected Area (acres) <span className="text-destructive">*</span></label>
                  <input type="number" value={affectedArea} onChange={e => {
                    const v = e.target.value;
                    if (parseFloat(v) <= insuredArea || !v) setAffectedArea(v);
                  }} className={inputCls} placeholder={`Max: ${insuredArea}`} />
                </div>
                <div>
                  <label className={labelCls}>Nearest Weather Station</label>
                  <select value={weatherStation} onChange={e => setWeatherStation(e.target.value)} className={inputCls}>
                    <option value="">Select Station</option>
                    {weatherStations.map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Estimated Loss Percentage: <strong>{lossPercent}%</strong></label>
                <input type="range" min={0} max={100} value={lossPercent} onChange={e => setLossPercent(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-secondary" />
                <p className="text-xs text-muted-foreground">You estimate: {lossPercent}% crop loss</p>
              </div>

              {affectedArea && (
                <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
                  <div>Estimated Loss: <strong>₹{estimatedLoss.toLocaleString()}</strong></div>
                  <div>Policy Coverage: ₹{policyCoverage.toLocaleString()}</div>
                  <div className="font-bold">Net Claim Eligible: ₹{Math.min(estimatedLoss, policyCoverage).toLocaleString()}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Witness Name</label>
                  <input value={witnessName} onChange={e => setWitnessName(e.target.value)} className={inputCls} placeholder="Optional" />
                </div>
                <div>
                  <label className={labelCls}>Witness Mobile</label>
                  <input value={witnessMobile} onChange={e => setWitnessMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} className={inputCls} placeholder="Optional" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Description of Loss</label>
                <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 500))} className={`${inputCls} h-24 resize-none`} placeholder="Describe the loss event..." />
                <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
              </div>

              {/* Evidence */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <h4 className="font-heading text-sm">Evidence Upload</h4>
                <div>
                  <label className={labelCls}>Crop Loss Photos (max 5)</label>
                  <div className="flex flex-wrap gap-2">
                    {photos.map((p, i) => (
                      <div key={i} className="w-20 h-20 rounded-lg bg-muted flex flex-col items-center justify-center text-xs relative">
                        📷<span className="mt-1 truncate w-full text-center px-1">{p}</span>
                        <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-xs">×</button>
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <button onClick={addPhoto} className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-secondary/50 flex items-center justify-center">
                        <Camera className="h-5 w-5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
                {claimType === "Localized Calamity" && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm">FIR / Panchnama:</span>
                    <button onClick={() => setFirUploaded(true)} className={`text-xs px-3 py-1.5 rounded-lg ${firUploaded ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"}`}>
                      {firUploaded ? "✅ Uploaded" : "Upload PDF"}
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-sm">Sowing Certificate:</span>
                  <button onClick={() => setSowingCertUploaded(true)} className={`text-xs px-3 py-1.5 rounded-lg ${sowingCertUploaded ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"}`}>
                    {sowingCertUploaded ? "✅ Uploaded" : "Upload PDF"}
                  </button>
                </div>
                <button onClick={captureGps} disabled={gpsCapturing} className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
                  {gpsCapturing ? <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Capturing...</> :
                    gpsLocation ? <><MapPin className="h-4 w-4" /> 📍 {gpsLocation}</> :
                      <><MapPin className="h-4 w-4" /> Capture GPS Location</>}
                </button>
              </div>

              {/* AI Pre-Assessment */}
              {allFilled && (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                  <h4 className="font-heading text-sm mb-2">🤖 AI Pre-Assessment</h4>
                  <div className="text-sm space-y-1">
                    <div>• Satellite data confirms {cause?.toLowerCase()} stress in your region (Jun 10-14)</div>
                    <div>• Your estimated loss ({lossPercent}%) aligns with AI estimate (61%)</div>
                    <div>• Claim appears valid — <strong className="text-success">High approval probability</strong></div>
                    <div>• Estimated processing time: 5-7 working days</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between mt-8 pt-4 border-t border-border">
          <button onClick={onClose} className="text-sm px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/80">Cancel</button>
          <button onClick={handleSubmit} disabled={!allFilled}
            className="text-sm px-6 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 disabled:opacity-50">Submit Claim</button>
        </div>

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
                  <button key={f.id} onClick={() => { setSelectedFarmer(f); setShowFarmerSearch(false); }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-muted text-sm flex justify-between">
                    <div><strong>{f.name}</strong> ({f.id})</div>
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
