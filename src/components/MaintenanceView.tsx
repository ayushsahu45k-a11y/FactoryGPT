import React, { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { API_CLIENT } from "../lib/api";
import IndustrialWidget from "./IndustrialWidget";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  ReferenceLine 
} from "recharts";
import { 
  Wrench, 
  Play, 
  CheckCircle, 
  Percent, 
  Activity, 
  Clock, 
  Sliders, 
  RefreshCw, 
  AlertTriangle,
  Cpu,
  Bookmark
} from "lucide-react";

export default function MaintenanceView() {
  const { equipment, mode, addReadingAndPrediction } = useStore();
  const [selectedEqId, setSelectedEqId] = useState<string>("eq-turbine-01");

  // Single Inference form states
  const [temp, setTemp] = useState(65.0);
  const [vibration, setVibration] = useState(2.2);
  const [pressure, setPressure] = useState(5.0);
  const [voltage, setVoltage] = useState(220.0);
  const [current, setCurrent] = useState(8.5);

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);

  // Model Metadata states
  const [metadata, setMetadata] = useState<any>(null);

  // Batch evaluation states
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Fetch model parameter settings on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const meta = await API_CLIENT.getModelMetadata();
        setMetadata(meta);
      } catch {
        // Suppress
      }
    };
    fetchMeta();
  }, []);

  // Update slider baselines based on selected equipment to make the experience smooth
  useEffect(() => {
    const eq = equipment.find(x => x.id === selectedEqId);
    if (eq) {
      if (eq.status === "warning") {
        setTemp(74.5);
        setVibration(3.4);
      } else if (eq.status === "critical") {
        setTemp(90.0);
        setVibration(5.2);
      } else if (eq.status === "emergency") {
        setTemp(104.2);
        setVibration(7.8);
      } else {
        setTemp(60.0);
        setVibration(1.8);
      }
    }
  }, [selectedEqId]);

  // Execute single custom inference
  const handleInference = async () => {
    setLoading(true);
    try {
      const payload = {
        equipment_id: selectedEqId,
        temperature: Number(temp),
        vibration: Number(vibration),
        pressure: Number(pressure),
        voltage: Number(voltage),
        current: Number(current)
      };

      // Call API or local fallback
      const result = await API_CLIENT.analyzeSingle(payload, mode);
      setPrediction(result);

      // Hydrate Zustand history with this reading
      const nowStr = new Date().toISOString();
      addReadingAndPrediction(
        selectedEqId,
        {
          id: `r-inf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          equipment_id: selectedEqId,
          timestamp: nowStr,
          temperature: payload.temperature,
          vibration: payload.vibration,
          pressure: payload.pressure,
          voltage: payload.voltage,
          current: payload.current
        },
        result
      );

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Run Batch Sweep
  const runBatchSweep = async () => {
    setBatchLoading(true);
    try {
      const payloadItems = equipment.map((eq) => {
        // Collect semi-random logical current readings
        return {
          equipment_id: eq.id,
          temperature: eq.status === "warning" ? 75 : eq.status === "critical" ? 89 : 62,
          vibration: eq.status === "warning" ? 3.1 : eq.status === "critical" ? 5.8 : 2.0,
          pressure: 5.1,
          voltage: 218.4,
          current: 8.4
        };
      });

      const responses = await API_CLIENT.analyzeBatch(payloadItems, mode);
      
      const combined = equipment.map((eq, idx) => ({
        eq,
        prediction: responses[idx]
      }));

      setBatchResults(combined);
    } catch (err) {
      console.error("Batch sweep issue", err);
    } finally {
      setBatchLoading(false);
    }
  };

  // Compile and format SHAP values for Recharts horizontal bar chart
  const getShapChartData = () => {
    if (!prediction || !prediction.shap_explanation) return [];
    
    return Object.entries(prediction.shap_explanation).map(([key, val]: any) => {
      return {
        feature: key.replace("_", " ").toUpperCase(),
        shapValue: val,
        raw_val: prediction.engineered_features_snapshot?.[key] || prediction.shap_explanation[key]
      };
    }).sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue));
  };

  const shapData = getShapChartData();

  return (
    <div id="maintenance-view-canvas" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Hand: Ingestion Control sliders slider details */}
        <div className="lg:col-span-1 space-y-6">
          <IndustrialWidget
            title="REAL-TIME TELEMETRY FEEDER"
            subtitle="Ingest raw mechanical measurements to calculate degradation vectors"
          >
            <div className="space-y-4 font-mono select-none">
              <div>
                <label className="block text-[10px] text-text-secondary uppercase mb-2 font-bold tracking-wider">
                  TARGET FLEET EQUIPMENT
                </label>
                <select
                  id="select-equipment-inference"
                  value={selectedEqId}
                  onChange={(e) => setSelectedEqId(e.target.value)}
                  className="w-full bg-card-machina border border-border-machina text-xs font-mono text-text-primary py-2 px-2 focus:outline-none uppercase font-black"
                >
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name.toUpperCase()} ({eq.serial_number.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sliders */}
              <div className="space-y-4 pt-2">
                {/* Temp */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1 font-bold">
                    <span className="text-text-secondary">TEMPERATURE (°C)</span>
                    <span className="text-text-primary font-black">{temp}°C</span>
                  </div>
                  <input
                    id="slider-temp"
                    type="range"
                    min="20"
                    max="120"
                    step="0.5"
                    value={temp}
                    onChange={(e) => setTemp(Number(e.target.value))}
                    className="w-full bg-[#0F0F0D] h-1 accent-accent-machina"
                  />
                </div>

                {/* Vibration */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1 font-bold">
                    <span className="text-text-secondary">VIBRATION (mm/s)</span>
                    <span className="text-text-primary font-black">{vibration} mm/s</span>
                  </div>
                  <input
                    id="slider-vibration"
                    type="range"
                    min="0.5"
                    max="10.0"
                    step="0.1"
                    value={vibration}
                    onChange={(e) => setVibration(Number(e.target.value))}
                    className="w-full bg-[#0F0F0D] h-1 accent-accent-machina"
                  />
                </div>

                {/* Pressure */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1 font-bold">
                    <span className="text-text-secondary">CHAMBER PRESSURE (bar)</span>
                    <span className="text-text-primary font-black">{pressure} bar</span>
                  </div>
                  <input
                    id="slider-pressure"
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.1"
                    value={pressure}
                    onChange={(e) => setPressure(Number(e.target.value))}
                    className="w-full bg-[#0F0F0D] h-1 accent-accent-machina"
                  />
                </div>

                {/* Voltage */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1 font-bold">
                    <span className="text-text-secondary">TERMINAL VOLTAGE (V)</span>
                    <span className="text-text-primary font-black">{voltage} V</span>
                  </div>
                  <input
                    id="slider-voltage"
                    type="range"
                    min="180"
                    max="260"
                    step="1"
                    value={voltage}
                    onChange={(e) => setVoltage(Number(e.target.value))}
                    className="w-full bg-[#0F0F0D] h-1 accent-accent-machina"
                  />
                </div>

                {/* Current */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1 font-bold">
                    <span className="text-text-secondary">DRAWS CURRENT (A)</span>
                    <span className="text-text-primary font-black">{current} A</span>
                  </div>
                  <input
                    id="slider-current"
                    type="range"
                    min="1.0"
                    max="20.0"
                    step="0.2"
                    value={current}
                    onChange={(e) => setCurrent(Number(e.target.value))}
                    className="w-full bg-[#0F0F0D] h-1 accent-accent-machina"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                id="btn-run-xgboost"
                onClick={handleInference}
                disabled={loading}
                className="w-full py-2.5 bg-bg-machina hover:bg-hover-machina border border-border-machina font-mono text-xs text-text-primary hover:text-accent-machina font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-none mt-4"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                {loading ? "CALCULATING XGBOOST..." : "DEPLOY INFERENCE DECAY"}
              </button>
            </div>
          </IndustrialWidget>
        </div>

        {/* Center/Right: Single Predictor Output & SHAP Decomp */}
        <div className="lg:col-span-2 space-y-6">
          <IndustrialWidget
            title="INFERENCE MODEL ANALYSIS OUTPUTS"
            subtitle="Attribution vectors mapping feature impacts back to raw inputs"
            headerAction={
              <span className="text-[10px] font-mono text-text-primary bg-bg-machina border border-border-machina px-3 py-1 font-bold">
                MATRICES: XGB_BINARY_LOGISTIC
              </span>
            }
          >
            {prediction ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual outputs columns */}
                <div className="space-y-4">
                  {/* Probability */}
                  <div className="bg-bg-machina border border-border-machina p-4 relative rounded-[3px]">
                    <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary uppercase tracking-wider font-extrabold mb-2">
                      <span>Failure Probability Rating</span>
                      <Percent size={12} />
                    </div>
                    <span className="text-4xl font-black font-mono text-text-primary block">
                      {(prediction.failure_probability * 100).toFixed(2)}%
                    </span>
                    <p className="text-[10px] text-text-secondary font-mono mt-2 uppercase font-bold">
                      Confidence probability threshold check
                    </p>
                  </div>

                  {/* Remaining Useful Life */}
                  <div className="bg-bg-machina border border-border-machina p-4 relative rounded-[3px]">
                    <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary uppercase tracking-wider font-extrabold mb-2">
                      <span>Remaining Useful Life (RUL)</span>
                      <Clock size={12} />
                    </div>
                    <span className="text-4xl font-black font-mono text-accent-machina block">
                      {prediction.predicted_remaining_useful_life_hours} HRS
                    </span>
                    <p className="text-[10px] text-text-secondary font-mono mt-2 uppercase font-bold">
                      Estimated periods before bearing decoupling hazard
                    </p>
                  </div>

                  {/* Operational Risk Tier */}
                  <div className="bg-bg-machina border border-border-machina p-4 text-xs font-mono relative rounded-[3px]">
                    <span className="text-[10px] font-mono text-text-secondary block uppercase mb-1 font-bold">
                      REQUIRED REPAIR FLIGHT PATTERN
                    </span>
                    <div className="flex items-center gap-2 mt-1.5">
                      {prediction.failure_probability > 0.5 ? (
                        <span className="bg-danger-machina/10 text-danger-machina border border-danger-machina/30 px-2 py-1 text-[10px] font-black uppercase tracking-wider animate-pulse">
                          DISPATCH IMMEDIATE TEAM INTRUSION
                        </span>
                      ) : prediction.failure_probability > 0.15 ? (
                        <span className="bg-warning-machina/10 text-warning-machina border border-warning-machina/30 px-2 py-1 text-[10px] font-black uppercase tracking-wider">
                          SCHEDULE SERVICE DEPUTY CYCLE (24H)
                        </span>
                      ) : (
                        <span className="bg-accent-machina/10 text-accent-machina border border-accent-machina/30 px-2 py-1 text-[10px] font-black uppercase tracking-wider">
                          MAINTAIN STANDARD CYCLES
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SHAP Graphic attribution chart */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-text-secondary flex items-center gap-1 mb-2 uppercase font-bold tracking-wider">
                    <Sliders size={12} className="text-accent-machina" />
                    SHAP FEATURE CONTRIBUTIONS BAR (LOGIT EFFECTS)
                  </span>

                  <div className="h-56 bg-[#0f0f0d] border border-border-machina p-1.5 flex-1 rounded-[3px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={shapData}
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                      >
                        <XAxis 
                          type="number" 
                          tick={{ fill: 'var(--color-text-secondary)', fontSize: 9, fontFamily: 'IBM Plex Mono', fontWeight: 'bold' }}
                          stroke="var(--color-border-machina)"
                        />
                        <YAxis 
                          type="category" 
                          dataKey="feature" 
                          tick={{ fill: 'var(--color-text-primary)', fontSize: 9, fontFamily: 'IBM Plex Mono', fontWeight: 'bold' }}
                          stroke="var(--color-border-machina)"
                          width={85}
                        />
                        <Tooltip
                          contentStyle={{ background: 'var(--color-card-machina)', border: '1px solid var(--color-border-machina)', borderRadius: '0px', fontFamily: 'IBM Plex Mono', fontSize: '9px', color: 'var(--color-text-primary)' }}
                        />
                        <ReferenceLine x={0} stroke="var(--color-border-machina)" strokeWidth={1} />
                        <Bar dataKey="shapValue" radius={[0, 0, 0, 0]}>
                          {shapData.map((entry, index) => {
                            const isPositive = entry.shapValue > 0;
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={isPositive ? "var(--color-danger-machina)" : "var(--color-accent-machina)"} 
                                fillOpacity={0.8}
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[10px] font-mono text-text-secondary mt-2 flex justify-between font-bold">
                    <span className="text-danger-machina flex items-center gap-1 font-bold">■ POSITIVE DECAY FORCE</span>
                    <span className="text-accent-machina flex items-center gap-1 font-bold">■ HELPFUL AGENT FORCE</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center border border-border-machina text-xs font-mono text-text-secondary">
                CALIBRATE INGESTION TELEMETRY AND CLICK [DEPLOY INFERENCE DECAY] TO MAP SHAP PROBABILITIES.
              </div>
            )}
          </IndustrialWidget>
        </div>
      </div>

      {/* Model Metadata parameters and Batch Prediction swept swept */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Param settings */}
        <div id="metadata-widget" className="lg:col-span-1">
          <IndustrialWidget
            title="HYPERPARAMETER CONSTRUMENTS"
            subtitle="Weights of live classification schema"
          >
            {metadata ? (
              <div className="space-y-3 font-mono text-[10px] p-1 font-bold">
                <div className="flex justify-between border-b border-border-machina pb-1.5 text-text-secondary">
                  <span>MODEL VESSEL</span>
                  <span className="text-text-primary font-black">{metadata.modelVersion}</span>
                </div>
                <div className="flex justify-between border-b border-border-machina pb-1.5 text-text-secondary">
                  <span>LOSS OBJECTIVE</span>
                  <span className="text-accent-machina bg-card-machina border border-border-machina px-1.5 font-bold text-[9px]">{metadata.parameters?.objective || "binary:logistic"}</span>
                </div>
                <div className="flex justify-between border-b border-border-machina pb-1.5 text-text-secondary">
                  <span>SUBSAMPLE RATE</span>
                  <span className="text-text-primary font-black">{metadata.parameters?.subsample || 0.8}</span>
                </div>
                <div className="flex justify-between border-b border-border-machina pb-1.5 text-text-secondary">
                  <span>ETA INTENSITY</span>
                  <span className="text-text-primary font-black">{metadata.parameters?.learning_rate || 0.05}</span>
                </div>
                <div className="flex justify-between border-b border-border-machina pb-1.5 text-text-secondary">
                  <span>F1 THRESHOLD</span>
                  <span className="text-text-primary font-black">{metadata.metrics?.f1_score || 0.941}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>ACC ROC SCORE</span>
                  <span className="text-accent-machina font-black">{metadata.metrics?.auc_roc || 0.982}</span>
                </div>
              </div>
            ) : (
              <span className="text-xs font-mono text-text-secondary">RETRIEVING HYPERMETRIC MATRICES...</span>
            )}
          </IndustrialWidget>
        </div>

        {/* Batch Pred */}
        <div className="lg:col-span-2">
          <IndustrialWidget
            title="FLEET-WIDE SIMULTANEOUS BATCH SWEEP"
            subtitle="Execute model evaluation sweeps across the entire floor loadout concurrently"
            headerAction={
              <button
                id="btn-run-batch-sweep"
                onClick={runBatchSweep}
                disabled={batchLoading}
                className="px-3 py-1.5 bg-bg-machina hover:bg-hover-machina border border-border-machina text-text-primary hover:text-accent-machina font-mono text-[10px] uppercase font-black tracking-wider transition-all duration-100 cursor-pointer flex items-center gap-1.5"
              >
                <Activity size={12} className={batchLoading ? "animate-spin animate-duration-1000" : ""} />
                {batchLoading ? "CALCULATING SWEEP..." : "DEPLOY BATCH EVALUATION"}
              </button>
            }
          >
            {batchResults.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {batchResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2.5 bg-card-machina border border-border-machina text-[11px] font-mono relative rounded-[3px]"
                  >
                    <div className="flex flex-col pl-1">
                      <span className="text-text-primary font-black uppercase tracking-wide">{result.eq.name}</span>
                      <span className="text-[9px] text-text-secondary font-bold">PLATE: {result.eq.serial_number.toUpperCase()}</span>
                    </div>

                    <div className="flex items-center gap-6 text-right pr-1 font-bold">
                      <div>
                        <span className="text-[8px] text-text-secondary block uppercase leading-none font-bold">RUL CYCLE</span>
                        <span className="text-accent-machina mt-1 block font-black">{result.prediction.predicted_remaining_useful_life_hours}H</span>
                      </div>

                      <div>
                        <span className="text-[8px] text-text-secondary block uppercase leading-none font-bold">DECAY EST.</span>
                        <span className="text-text-primary mt-1 block font-black">{(result.prediction.failure_probability * 100).toFixed(1)}%</span>
                      </div>

                      <div className="w-28 text-right">
                        {result.prediction.failure_probability > 0.5 ? (
                          <span className="px-2 py-1 bg-danger-machina/10 text-danger-machina border border-danger-machina/30 font-black text-[9px] uppercase tracking-wider">
                            HIGH DECAY
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-accent-machina/10 text-accent-machina border border-accent-machina/30 font-black text-[9px] uppercase tracking-wider">
                            OPTIMAL
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center border-2 border-border-machina border-dashed text-text-secondary text-xs font-mono rounded-[3px]">
                BATCH MONITOR IDLE. CLICK [DEPLOY BATCH EVALUATION] TO HARNESS DATA FEEDS.
              </div>
            )}
          </IndustrialWidget>
        </div>
      </div>
    </div>
  );
}
