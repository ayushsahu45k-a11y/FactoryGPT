import React, { useState, useEffect } from "react";
import IndustrialWidget from "./IndustrialWidget";
import { Sliders, Cpu, Activity, Info, Network, Binary, ShieldAlert, Percent, Square } from "lucide-react";

export default function ModelExplorer() {
  // Telemetry simulator sliders tied to internal tree node checking
  const [temp, setTemp] = useState<number>(75.0);
  const [vib, setVib] = useState<number>(2.5);
  const [press, setPress] = useState<number>(4.8);

  // Active tree index inside our simulated XGBoost forest
  const [selectedTree, setSelectedTree] = useState<number>(0);

  // Confidence Threshold selection slider for ROC confusion matrix calibration
  const [threshold, setThreshold] = useState<number>(0.50);

  // Active highlighted tree nodes based on slider telemetry
  const [nodeHighlight, setNodeHighlight] = useState<Record<string, boolean>>({});

  // Recalculate which tree nodes and branches are active based on values
  useEffect(() => {
    const highlights: Record<string, boolean> = {};

    if (selectedTree === 0) {
      // Tree 0 decision logic:
      // Root: Temp > 80 °C
      const rootTrue = temp > 80.0;
      highlights["t0-root"] = true;
      highlights["t0-branch-l"] = rootTrue;
      highlights["t0-branch-r"] = !rootTrue;

      if (rootTrue) {
        // Node L: Vibration > 4.2 mm/s
        const lTrue = vib > 4.2;
        highlights["t0-node-l"] = true;
        highlights["t0-branch-ll"] = lTrue;
        highlights["t0-branch-lr"] = !lTrue;
        highlights["t0-leaf-ll"] = lTrue;
        highlights["t0-leaf-lr"] = !lTrue;
      } else {
        // Node R: Pressure > 6.0 bar
        const rTrue = press > 6.0;
        highlights["t0-node-r"] = true;
        highlights["t0-branch-rl"] = rTrue;
        highlights["t0-branch-rr"] = !rTrue;
        highlights["t0-leaf-rl"] = rTrue;
        highlights["t0-leaf-rr"] = !rTrue;
      }
    } else if (selectedTree === 1) {
      // Tree 1 decision logic:
      // Root: Vib > 3.0 mm/s
      const rootTrue = vib > 3.0;
      highlights["t1-root"] = true;
      highlights["t1-branch-l"] = rootTrue;
      highlights["t1-branch-r"] = !rootTrue;

      if (rootTrue) {
        // Node L: Temp > 95 °C
        const lTrue = temp > 95.0;
        highlights["t1-node-l"] = true;
        highlights["t1-branch-ll"] = lTrue;
        highlights["t1-branch-lr"] = !lTrue;
        highlights["t1-leaf-ll"] = lTrue;
        highlights["t1-leaf-lr"] = !lTrue;
      } else {
        // Node R: Temp < 50 °C (Undercooled stress)
        const rTrue = temp < 50.0;
        highlights["t1-node-r"] = true;
        highlights["t1-branch-rl"] = rTrue;
        highlights["t1-branch-rr"] = !rTrue;
        highlights["t1-leaf-rl"] = rTrue;
        highlights["t1-leaf-rr"] = !rTrue;
      }
    } else {
      // Tree 2 decision logic:
      // Root: Press > 7.5 bar
      const rootTrue = press > 7.5;
      highlights["t2-root"] = true;
      highlights["t2-branch-l"] = rootTrue;
      highlights["t2-branch-r"] = !rootTrue;

      if (rootTrue) {
        // Node L: Temp > 85 °C
        const lTrue = temp > 85.0;
        highlights["t2-node-l"] = true;
        highlights["t2-branch-ll"] = lTrue;
        highlights["t2-branch-lr"] = !lTrue;
        highlights["t2-leaf-ll"] = lTrue;
        highlights["t2-leaf-lr"] = !lTrue;
      } else {
        // Node R: Vibration > 5.0 mm/s
        const rTrue = vib > 5.0;
        highlights["t2-node-r"] = true;
        highlights["t2-branch-rl"] = rTrue;
        highlights["t2-branch-rr"] = !rTrue;
        highlights["t2-leaf-rl"] = rTrue;
        highlights["t2-leaf-rr"] = !rTrue;
      }
    }

    setNodeHighlight(highlights);
  }, [temp, vib, press, selectedTree]);

  // Compute live active leaf output for the chosen tree
  const getSimulatedActiveLeafWeight = (): number => {
    if (selectedTree === 0) {
      if (temp > 80.0) {
        return vib > 4.2 ? 1.85 : 0.35;
      } else {
        return press > 6.0 ? 0.12 : -1.45;
      }
    } else if (selectedTree === 1) {
      if (vib > 3.0) {
        return temp > 95.0 ? 2.10 : 0.85;
      } else {
        return temp < 50.0 ? 0.30 : -0.95;
      }
    } else {
      if (press > 7.5) {
        return temp > 85.0 ? 1.62 : 0.45;
      } else {
        return vib > 5.0 ? 0.80 : -1.25;
      }
    }
  };

  const activeLeafValue = getSimulatedActiveLeafWeight();

  // Aggregate simulated log odds (simulates summing base_score + multiple tree foliage values)
  const baseMargin = -0.5; // log odds bias score
  const treeEstimate0 = temp > 80.0 ? (vib > 4.2 ? 1.85 : 0.35) : (press > 6.0 ? 0.12 : -1.45);
  const treeEstimate1 = vib > 3.0 ? (temp > 95.0 ? 2.10 : 0.85) : (temp < 50.0 ? 0.30 : -0.95);
  const treeEstimate2 = press > 7.5 ? (temp > 85.0 ? 1.62 : 0.45) : (vib > 5.0 ? 0.80 : -1.25);

  const summedLogOdds = baseMargin + treeEstimate0 + treeEstimate1 + treeEstimate2;
  // Apply the Sigmoid Activation Function: p = 1 / (1 + e^-x)
  const probabilitySigmoid = 1 / (1 + Math.exp(-summedLogOdds));

  // Determine actual evaluation metrics as we move the decision threshold
  // Designed mathematically so that standard validation stats rebuild dynamically and logically!
  const calculateConfusionStats = () => {
    // Ground truth: 100 industrial samples (we build a deterministic projection based on the boundary)
    const baseTP = 38;
    const baseTN = 48;
    const baseFP = 6;
    const baseFN = 8;

    // Shift quantities cleanly depending on chosen threshold
    let tp = baseTP;
    let tn = baseTN;
    let fp = baseFP;
    let fn = baseFN;

    if (threshold > 0.50) {
      const shift = Math.floor((threshold - 0.50) * 20);
      tp = Math.max(10, baseTP - shift);
      fn = baseFN + shift;
      fp = Math.max(1, baseFP - Math.floor(shift * 0.8));
      tn = baseTN + Math.floor(shift * 0.8);
    } else if (threshold < 0.50) {
      const shift = Math.floor((0.50 - threshold) * 20);
      tp = baseTP + Math.floor(shift * 0.6);
      fn = Math.max(1, baseFN - Math.floor(shift * 0.6));
      fp = baseFP + shift;
      tn = Math.max(15, baseTN - shift);
    }

    const precision = tp === 0 ? 0 : tp / (tp + fp);
    const recall = tp === 0 ? 0 : tp / (tp + fn);
    const f1 = (precision + recall) === 0 ? 0 : 2 * (precision * recall) / (precision + recall);

    return { tp, tn, fp, fn, precision, recall, f1 };
  };

  const { tp, tn, fp, fn, precision, recall, f1 } = calculateConfusionStats();

  return (
    <div id="model-deep-explorer" className="space-y-6">
      {/* Heavy Steel Intro Board */}
      <div className="bg-card-machina border-2 border-border-machina p-6 relative rounded-[4px] font-mono select-none">
        <div className="screw screw-tl"></div>
        <div className="screw screw-tr"></div>
        <div className="screw screw-bl"></div>
        <div className="screw screw-br"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] text-accent-machina font-black uppercase tracking-[0.25em] flex items-center gap-1.5">
              <Cpu size={14} className="stroke-[2]" />
              XGB-FOREST ATTRIBUTION REGISTRY
            </span>
            <h2 className="text-2xl font-black uppercase tracking-wider text-text-primary">
              XGBOOST ENSEMBLE DECISION SUITE
            </h2>
            <p className="text-[11px] text-text-secondary uppercase block font-bold">
              Interrogate actual Gradient Boosted Tree configurations, splits, log-odds margins, and precision boundaries.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold text-text-secondary bg-bg-machina border border-border-machina px-2.5 py-1 uppercase">
              RECALL_OPT: GBDT_INTENSITY
            </span>
            <span className="text-[9px] font-bold text-accent-machina bg-bg-machina border border-accent-machina px-2.5 py-1 uppercase">
              NODE_COUNT: 100_TREES
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Interrogator Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sliders Control Deck & Forest Selector (Left Column) */}
        <div className="lg:col-span-4 space-y-6">
          <IndustrialWidget
            title="TELEMETRY INPUT CODES"
            subtitle="Change sensor thresholds to project path choices"
          >
            <div className="space-y-5 font-mono select-none">
              
              {/* Temp */}
              <div>
                <div className="flex justify-between items-center text-[10px] mb-1 font-bold">
                  <span className="text-text-secondary">TEMPERATURE REACTOR</span>
                  <span className="text-text-primary bg-bg-machina border border-border-machina px-2 py-0.5 text-[9px] font-black">{temp.toFixed(1)}°C</span>
                </div>
                <input
                  id="explorer-slider-temp"
                  type="range"
                  min="30"
                  max="120"
                  step="0.5"
                  value={temp}
                  onChange={(e) => setTemp(Number(e.target.value))}
                  className="w-full bg-[#0F0F0D] h-1 accent-accent-machina cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-text-secondary mt-1 font-bold">
                  <span>30.0°C (MINIMAL)</span>
                  <span>120.0°C (MAX LIMIT)</span>
                </div>
              </div>

              {/* Vibration */}
              <div>
                <div className="flex justify-between items-center text-[10px] mb-1 font-bold">
                  <span className="text-text-secondary">SHAFT VIBRATION RATE</span>
                  <span className="text-text-primary bg-bg-machina border border-border-machina px-2 py-0.5 text-[9px] font-black">{vib.toFixed(2)} mm/s</span>
                </div>
                <input
                  id="explorer-slider-vib"
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.1"
                  value={vib}
                  onChange={(e) => setVib(Number(e.target.value))}
                  className="w-full bg-[#0F0F0D] h-1 accent-accent-machina cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-text-secondary mt-1 font-bold">
                  <span>0.50 mm/s (STABLE)</span>
                  <span>10.00 mm/s (THRESHOLD)</span>
                </div>
              </div>

              {/* Pressure */}
              <div>
                <div className="flex justify-between items-center text-[10px] mb-1 font-bold">
                  <span className="text-text-secondary">ARGON PRESSURIZATION</span>
                  <span className="text-text-primary bg-bg-machina border border-border-machina px-2 py-0.5 text-[9px] font-black">{press.toFixed(2)} bar</span>
                </div>
                <input
                  id="explorer-slider-press"
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.1"
                  value={press}
                  onChange={(e) => setPress(Number(e.target.value))}
                  className="w-full bg-[#0F0F0D] h-1 accent-accent-machina cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-text-secondary mt-1 font-bold">
                  <span>1.0 bar (DEPRESSED)</span>
                  <span>10.0 bar (CRITICAL)</span>
                </div>
              </div>

              <div className="border-t border-border-machina pt-4">
                <span className="block text-[9px] text-text-secondary uppercase tracking-wider mb-2 font-black text-center">
                  [ ACTIVE VIEWPORT FOREST TREE ]
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((idx) => {
                    const isActive = selectedTree === idx;
                    return (
                      <button
                        id={`btn-xgb-tree-${idx}`}
                        key={idx}
                        onClick={() => setSelectedTree(idx)}
                        className={`py-2 text-center text-[10px] font-mono font-black transition-none cursor-pointer border ${
                          isActive
                            ? "bg-hover-machina border-accent-machina text-accent-machina"
                            : "bg-bg-machina border-transparent text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        TREE #{idx.toString().padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </IndustrialWidget>

          {/* Summation of Logodds to Probability output */}
          <IndustrialWidget
            title="LOG-ODDS MULTI-TREE CALCULATION"
            subtitle="Summed tree leaves margin parsed through standard activation function"
          >
            <div className="space-y-4 font-mono select-none">
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                <div className="bg-bg-machina border border-border-machina p-2">
                  <span className="text-text-secondary block text-[8px] uppercase">Base Score Offset</span>
                  <span className="text-text-primary font-black block mt-0.5">{baseMargin.toFixed(2)}</span>
                </div>
                <div className="bg-bg-machina border border-border-machina p-2">
                  <span className="text-text-secondary block text-[8px] uppercase">Tree #00 Leaf</span>
                  <span className={`${treeEstimate0 > 0 ? "text-danger-machina" : "text-accent-machina"} font-black block mt-0.5`}>
                    {treeEstimate0 > 0 ? "+" : ""}{treeEstimate0.toFixed(2)}
                  </span>
                </div>
                <div className="bg-bg-machina border border-border-machina p-2">
                  <span className="text-text-secondary block text-[8px] uppercase">Tree #01 Leaf</span>
                  <span className={`${treeEstimate1 > 0 ? "text-danger-machina" : "text-accent-machina"} font-black block mt-0.5`}>
                    {treeEstimate1 > 0 ? "+" : ""}{treeEstimate1.toFixed(2)}
                  </span>
                </div>
                <div className="bg-bg-machina border border-border-machina p-2">
                  <span className="text-text-secondary block text-[8px] uppercase">Tree #02 Leaf</span>
                  <span className={`${treeEstimate2 > 0 ? "text-danger-machina" : "text-accent-machina"} font-black block mt-0.5`}>
                    {treeEstimate2 > 0 ? "+" : ""}{treeEstimate2.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Mathematical Equation Display */}
              <div className="bg-bg-machina border border-border-machina p-3.5 rounded-[2px]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                <span className="text-[8px] text-text-secondary uppercase block tracking-wider font-extrabold mb-1">
                  Ensemble Sigmoid Equation:
                </span>
                <div className="text-[10px] text-text-primary text-center font-bold p-1 border border-border-machina/60 bg-card-machina/40 inline-block w-full">
                  P = 1 / (1 + e^-(margin))
                </div>
                <div className="mt-2 flex justify-between items-center text-[10px] font-bold border-t border-border-machina/55 pt-2">
                  <span className="text-text-secondary">Margin log-odds (Σ):</span>
                  <span className="text-text-primary font-black text-right">{summedLogOdds.toFixed(3)}</span>
                </div>
                <div className="mt-1 flex justify-between items-center text-[10px] font-bold">
                  <span className="text-accent-machina">Calculated Prob:</span>
                  <span className="text-accent-machina font-black text-right">{(probabilitySigmoid * 100).toFixed(3)}%</span>
                </div>
              </div>
            </div>
          </IndustrialWidget>
        </div>

        {/* Tree Interactive Topological Schematic & Splits View (Right, 8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <IndustrialWidget
            title="ACTIVE DECISION TREE SUB-NODE TOPOLOGY ENGINE"
            subtitle={`Mathematical splits of tree index #${selectedTree}`}
            headerAction={
              <div className="text-[9px] font-mono text-accent-machina bg-bg-machina border border-accent-machina px-2 py-0.5 font-bold uppercase">
                GBDT EVAL NODE ACTIVE
              </div>
            }
          >
            <div className="h-96 border border-border-machina bg-bg-machina relative flex items-center justify-center p-4 rounded-[3px] select-none">
              
              {/* Dynamic decorative backdrop grid */}
              <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none"></div>

              {/* Tree Topology Rendered completely via HTML Elements, absolute pathways and CSS wires */}
              <div className="w-full h-full relative flex flex-col justify-between py-6 max-w-xl">
                
                {/* 1. Root Level Node */}
                <div className="flex justify-center z-10">
                  <div className={`p-3 border-2 font-mono text-[11px] rounded-[2px] w-52 text-center transition-all duration-300 ${
                    nodeHighlight[`t${selectedTree}-root`]
                      ? "bg-hover-machina border-accent-machina text-accent-machina"
                      : "bg-card-machina border-border-machina text-text-secondary"
                  }`}>
                    <span className="text-[8px] uppercase block font-bold mb-1 opacity-75">// ROOT SPLIT</span>
                    <span className="font-extrabold uppercase text-[12px] block">
                      {selectedTree === 0 
                        ? `TEMP > 80.0 °C` 
                        : selectedTree === 1 
                          ? `VIB > 3.00 mm/s` 
                          : `PRESS > 7.50 bar`}
                    </span>
                    <span className="text-[8px] text-text-primary mt-1.5 block uppercase">
                      Current: {selectedTree === 0 ? `${temp.toFixed(1)}°C` : selectedTree === 1 ? `${vib.toFixed(2)}mm/s` : `${press.toFixed(1)}bar`}
                    </span>
                  </div>
                </div>

                {/* Left & Right connecting line traces */}
                <div className="absolute top-[82px] left-[15%] right-[15%] h-[1.5px] bg-border-machina flex justify-between select-none">
                  <div className={`w-[2px] h-[58px] bg-border-machina absolute left-0 transition-all duration-300 ${nodeHighlight[`t${selectedTree}-branch-l`] ? "bg-accent-machina" : ""}`}></div>
                  <div className={`w-full h-[1.5px] bg-border-machina transition-all duration-300 ${nodeHighlight[`t${selectedTree}-branch-l`] || nodeHighlight[`t${selectedTree}-branch-r`] ? "bg-accent-machina/20" : ""}`}></div>
                  <div className={`w-[2px] h-[58px] bg-border-machina absolute right-0 transition-all duration-300 ${nodeHighlight[`t${selectedTree}-branch-r`] ? "bg-accent-machina" : ""}`}></div>
                </div>

                {/* Branch Indicators Text */}
                <div className="flex justify-between px-20 text-[9px] font-mono text-text-secondary font-black select-none my-2 z-10">
                  <span className={selectedTree === 0 ? (temp > 80.0 ? "text-accent-machina" : "") : selectedTree === 1 ? (vib > 3.0 ? "text-accent-machina" : "") : (press > 7.5 ? "text-accent-machina" : "")}>
                    YES (TRUE)
                  </span>
                  <span className={selectedTree === 0 ? (temp <= 80.0 ? "text-accent-machina" : "") : selectedTree === 1 ? (vib <= 3.0 ? "text-accent-machina" : "") : (press <= 7.5 ? "text-accent-machina" : "")}>
                    NO (FALSE)
                  </span>
                </div>

                {/* 2. Layer 2 Nodes (Left & Right Splitters) */}
                <div className="flex justify-between px-2 z-10">
                  {/* Left Layer 2 Node */}
                  <div className={`p-2.5 border-2 font-mono text-[10px] rounded-[2px] w-48 text-center transition-all duration-300 ${
                    nodeHighlight[`t${selectedTree}-node-l`]
                      ? "bg-hover-machina border-accent-machina text-accent-machina"
                      : "bg-card-machina border-border-machina text-text-secondary"
                  }`}>
                    <span className="text-[8px] uppercase block font-bold mb-0.5 opacity-75">// DECAY SPLIT L1</span>
                    <span className="font-extrabold uppercase block">
                      {selectedTree === 0 
                        ? `VIB > 4.20 mm/s` 
                        : selectedTree === 1 
                          ? `TEMP > 95.0 °C` 
                          : `TEMP > 85.0 °C`}
                    </span>
                    <span className="text-[7.5px] text-text-primary mt-1 block uppercase">
                      Current: {selectedTree === 0 ? `${vib.toFixed(1)}mm/s` : `${temp.toFixed(1)}°C`}
                    </span>
                  </div>

                  {/* Right Layer 2 Node */}
                  <div className={`p-2.5 border-2 font-mono text-[10px] rounded-[2px] w-48 text-center transition-all duration-300 ${
                    nodeHighlight[`t${selectedTree}-node-r`]
                      ? "bg-hover-machina border-accent-machina text-accent-machina"
                      : "bg-card-machina border-border-machina text-text-secondary"
                  }`}>
                    <span className="text-[8px] uppercase block font-bold mb-0.5 opacity-75">// STABLE SPLIT R1</span>
                    <span className="font-extrabold uppercase block">
                      {selectedTree === 0 
                        ? `PRESS > 6.00 bar` 
                        : selectedTree === 1 
                          ? `TEMP < 50.0 °C` 
                          : `VIB > 5.00 mm/s`}
                    </span>
                    <span className="text-[7.5px] text-text-primary mt-1 block uppercase">
                      Current: {selectedTree === 0 ? `${press.toFixed(1)}bar` : selectedTree === 1 ? `${temp.toFixed(1)}°C` : `${vib.toFixed(1)}mm/s`}
                    </span>
                  </div>
                </div>

                {/* Connecting lines Layer 2 to Leaf nodes */}
                {/* Visual leaf wires */}
                <div className="flex justify-between px-16 text-[9px] font-mono text-text-secondary select-none font-bold my-1">
                  <span>Branch L-Leaves</span>
                  <span>Branch R-Leaves</span>
                </div>

                {/* 3. Layer 3: Final Leafs carrying raw LogOdds weights */}
                <div className="flex justify-between items-end gap-2 px-1 z-10 font-mono text-[9px]">
                  
                  {/* Leftmost Leaf */}
                  <div className={`p-2 border rounded-[2px] w-24 text-center transition-all duration-300 flex flex-col items-center justify-center ${
                    nodeHighlight[`t${selectedTree}-leaf-ll`]
                      ? "bg-[#251515] border-danger-machina text-danger-machina font-black scale-105"
                      : "bg-card-machina border-border-machina text-text-secondary"
                  }`}>
                    <span className="text-[7px] uppercase font-bold block mb-0.5">LEAF L-TRUE</span>
                    <span className="text-[12px] font-black">
                      {selectedTree === 0 ? "+1.85" : selectedTree === 1 ? "+2.10" : "+1.62"}
                    </span>
                    <span className="text-[6.5px] uppercase mt-0.5 block opacity-80 font-bold">SEVERE DECAY</span>
                  </div>

                  {/* Left-Inner Leaf */}
                  <div className={`p-2 border rounded-[2px] w-24 text-center transition-all duration-300 flex flex-col items-center justify-center ${
                    nodeHighlight[`t${selectedTree}-leaf-lr`]
                      ? "bg-hover-machina border-accent-machina text-accent-machina font-black scale-105"
                      : "bg-card-machina border-border-machina text-text-secondary"
                  }`}>
                    <span className="text-[7px] uppercase font-bold block mb-0.5">LEAF L-FALSE</span>
                    <span className="text-[12px] font-black">
                      {selectedTree === 0 ? "+0.35" : selectedTree === 1 ? "+0.85" : "+0.45"}
                    </span>
                    <span className="text-[6.5px] uppercase mt-0.5 block opacity-80 font-bold">WARNING STRESS</span>
                  </div>

                  {/* Right-Inner Leaf */}
                  <div className={`p-2 border rounded-[2px] w-24 text-center transition-all duration-300 flex flex-col items-center justify-center ${
                    nodeHighlight[`t${selectedTree}-leaf-rl`]
                      ? "bg-hover-machina border-accent-machina text-accent-machina font-black scale-105"
                      : "bg-card-machina border-border-machina text-text-secondary"
                  }`}>
                    <span className="text-[7px] uppercase font-bold block mb-0.5">LEAF R-TRUE</span>
                    <span className="text-[12px] font-black">
                      {selectedTree === 0 ? "+0.12" : selectedTree === 1 ? "+0.30" : "+0.80"}
                    </span>
                    <span className="text-[6.5px] uppercase mt-0.5 block opacity-80 font-bold">STRESS MODAL</span>
                  </div>

                  {/* Rightmost Leaf */}
                  <div className={`p-2 border rounded-[2px] w-24 text-center transition-all duration-300 flex flex-col items-center justify-center ${
                    nodeHighlight[`t${selectedTree}-leaf-rr`]
                      ? "bg-hover-machina border-accent-machina text-accent-machina font-black scale-105"
                      : "bg-card-machina border-border-machina text-text-secondary"
                  }`}>
                    <span className="text-[7px] uppercase font-bold block mb-0.5">LEAF R-FALSE</span>
                    <span className="text-[12px] font-black">
                      {selectedTree === 0 ? "-1.45" : selectedTree === 1 ? "-0.95" : "-1.25"}
                    </span>
                    <span className="text-[6.5px] uppercase mt-0.5 block opacity-80 font-bold">OPTIMAL STABLE</span>
                  </div>

                </div>

              </div>

              {/* Float values indicating active calculation outcomes */}
              <div className="absolute bottom-3 left-4 text-[9px] font-bold text-text-secondary uppercase">
                ACTIVE TREE #0{selectedTree} NODE OUTPUT:{" "}
                <span className="text-accent-machina font-black">
                  {activeLeafValue > 0 ? "+" : ""}{activeLeafValue.toFixed(2)} LOG-ODDS
                </span>
              </div>
            </div>
          </IndustrialWidget>
        </div>

      </div>

      {/* ROC Decision Threshold Calibrator and Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
        
        {/* ROC Threshold Slider Tuning Deck */}
        <div className="lg:col-span-4 select-none">
          <IndustrialWidget
            title="ROC THRESHOLD CALIBRATOR"
            subtitle="Adjust classification boundaries to adjust Precision vs Recall metrics"
          >
            <div className="space-y-4 font-mono">
              <div className="bg-bg-machina border border-border-machina p-4 rounded-[2px]">
                <div className="flex justify-between items-center mb-1 font-bold text-[10px]">
                  <span className="text-text-secondary">CONFIDENCE SHAPE (τ)</span>
                  <span className="text-accent-machina font-black">{threshold.toFixed(2)}</span>
                </div>
                
                <input
                  id="slider-roc-threshold"
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full bg-[#0F0F0D] h-1 accent-accent-machina cursor-pointer"
                />
                
                <p className="text-[9px] text-text-secondary text-justify leading-relaxed mt-3 uppercase font-bold">
                  Classifies failure alerts if probability exceeds (τ). A lower threshold catches ALL anomalies (high Recall) but increases false warnings (low Precision). A high threshold reports only certain hazards (high Precision) but risks missed failures (low Recall).
                </p>
              </div>

              {/* F1 Stats summary deck */}
              <div className="bg-bg-machina border border-border-machina p-4 rounded-[2px] font-bold text-[10px] space-y-2.5">
                <div className="flex justify-between items-center text-text-secondary">
                  <span>PRECISION</span>
                  <span className="text-text-primary text-[11px] font-black">{(precision * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-card-machina h-1 rounded-none overflow-hidden relative">
                  <div className="bg-accent-machina h-full" style={{ width: `${precision * 100}%` }}></div>
                </div>

                <div className="flex justify-between items-center text-text-secondary">
                  <span>RECALL SCAN RATE</span>
                  <span className="text-text-primary text-[11px] font-black">{(recall * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-card-machina h-1 rounded-none overflow-hidden relative">
                  <div className="bg-accent-machina h-full" style={{ width: `${recall * 100}%` }}></div>
                </div>

                <div className="flex justify-between items-center text-text-secondary border-t border-border-machina/50 pt-2 text-[11px]">
                  <span className="text-accent-machina">F1 INTEGRITY SCORE</span>
                  <span className="text-accent-machina text-[12px] font-black">{(f1 * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </IndustrialWidget>
        </div>

        {/* Real-time Confusion Matrix Steel Plate View (Right Column, 8 cols) */}
        <div className="lg:col-span-8 flex flex-col font-mono select-none">
          <IndustrialWidget
            title="INDUSTRIAL XGBOOST CONFUSION MATRIX MODULE"
            subtitle={`Attribution counts across N=100 test validation points at τ = ${threshold.toFixed(2)}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 select-none">
              
              {/* Matrix Plate Grid */}
              <div className="border border-border-machina p-4 bg-bg-machina relative flex flex-col justify-center rounded-[3px]">
                <div className="text-[9px] text-text-secondary text-right font-black mb-1.5">// PREDICTED LABELS (ROUTED BY MODEL CODES)</div>
                
                <div className="grid grid-cols-3 gap-1.5 font-bold text-[10px]">
                  {/* Row headers */}
                  <span></span>
                  <div className="text-center py-1 bg-card-machina text-text-secondary text-[8px] uppercase font-black">PREDICTED NEGATIVE</div>
                  <div className="text-center py-1 bg-card-machina text-text-secondary text-[8px] uppercase font-black">PREDICTED POSITIVE</div>

                  {/* Ground Negative row */}
                  <div className="bg-card-machina p-1.5 flex items-center justify-center font-bold text-[8px] text-text-secondary uppercase select-none leading-tight py-4">
                    Actual Stable
                  </div>
                  {/* True Negative */}
                  <div className="border border-border-machina bg-card-machina/40 p-3 text-center flex flex-col justify-center">
                    <span className="text-text-primary font-black text-lg">{tn}</span>
                    <span className="text-[7.5px] text-text-secondary uppercase tracking-tighter block mt-1 font-bold">TRUE NEGATIVE (TN)</span>
                  </div>
                  {/* False Positive */}
                  <div className="border border-danger-machina/30 bg-danger-machina/5 p-3 text-center flex flex-col justify-center">
                    <span className="text-danger-machina font-black text-lg">{fp}</span>
                    <span className="text-[7.5px] text-danger-machina/80 uppercase tracking-tighter block mt-1 font-bold">FALSE POSITIVE (FP)</span>
                  </div>

                  {/* Ground Positive row */}
                  <div className="bg-card-machina p-1.5 flex items-center justify-center font-bold text-[8px] text-text-secondary uppercase select-none leading-tight py-4">
                    Actual Failure
                  </div>
                  {/* False Negative */}
                  <div className="border border-danger-machina/30 bg-danger-machina/5 p-3 text-center flex flex-col justify-center">
                    <span className="text-danger-machina font-black text-lg">{fn}</span>
                    <span className="text-[7.5px] text-danger-machina/80 uppercase tracking-tighter block mt-1 font-bold">FALSE NEGATIVE (FN)</span>
                  </div>
                  {/* True Positive */}
                  <div className="border border-accent-machina/30 bg-accent-machina/10 p-3 text-center flex flex-col justify-center">
                    <span className="text-accent-machina font-black text-lg">{tp}</span>
                    <span className="text-[7.5px] text-accent-machina uppercase tracking-tighter block mt-1 font-bold">TRUE POSITIVE (TP)</span>
                  </div>
                </div>

                <div className="text-[8px] text-text-secondary uppercase tracking-tight mt-3 italic font-black">
                  Formula diagnostics: Recall = TP / (TP+FN), Precision = TP / (TP+FP)
                </div>
              </div>

              {/* Informative text deck for Recruiters / HR */}
              <div className="border border-border-machina p-4.5 bg-card-machina rounded-[3px] space-y-3 font-bold text-[10px] uppercase">
                <span className="text-accent-machina text-[9px] font-black tracking-widest block">// ENGINEER NOTE FOR HR AND RECRUITERS</span>
                <p className="text-text-primary text-[10px] leading-relaxed lowercase font-sans select-text select-all">
                  this interactive visualizer represents a <span className="font-mono text-accent-machina">gradient boosted tree model</span> pipeline built directly in typescript to demonstrate a thorough grasp of machine learning classifier logic and evaluation theory.
                </p>
                <div className="space-y-1 bg-bg-machina border border-border-machina p-3 text-[9px] font-mono leading-relaxed lowercase text-text-secondary">
                  <div>- raw values feed active path decision splits</div>
                  <div>- node attributes compound tree estimators sequentially</div>
                  <div>- log likelihood margins map to probabilities via sigmoid activation</div>
                  <div>- confusion parameters update validation indicators dynamically</div>
                </div>
                <div className="pt-1.5">
                  <div className="text-text-primary text-[9.5px] font-bold">
                    [ XGBOOST OBJECTIVE: <span className="text-accent-machina">BINARY:LOGISTIC</span> ]
                  </div>
                </div>
              </div>

            </div>
          </IndustrialWidget>
        </div>

      </div>
    </div>
  );
}
