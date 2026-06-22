import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { Zap, ShieldAlert, Cpu, RefreshCw, SlidersHorizontal, Fan } from "lucide-react";

interface TelemetryPoint {
  timestamp: Date;
  power: number;       // kW (range: 0 - 1500)
  argon: number;       // L/min (range: 0 - 100)
  materials: number;   // % Level (range: 0 - 100)
}

export default function ResourceUtilizationD3() {
  // Configurable states
  const [powerMode, setPowerMode] = useState<"normal" | "boost" | "eco">("normal");
  const [argonValve, setArgonValve] = useState<number>(65); // Valve %
  const [materialFeed, setMaterialFeed] = useState<number>(85); // % Level remaining
  const [sampleRate, setSampleRate] = useState<number>(1500); // ms
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [valveStateChanged, setValveStateChanged] = useState<boolean>(false);

  // Buffer ref for latest values so intervals don't get stale closures
  const stateRef = useRef({ powerMode, argonValve, materialFeed });
  useEffect(() => {
    stateRef.current = { powerMode, argonValve, materialFeed };
  }, [powerMode, argonValve, materialFeed]);

  // Generate initial historical points (20 sequential data points)
  useEffect(() => {
    const points: TelemetryPoint[] = [];
    const now = new Date();
    for (let i = 20; i >= 0; i--) {
      const mockTime = new Date(now.getTime() - i * 1500);
      
      // Power base based on normal mode
      const basePower = 750 + Math.sin(i * 0.4) * 40;
      // Argon base based on 65% valve
      const baseArgon = 40 + Math.cos(i * 0.5) * 3;
      // Materials degrading backwards
      const baseMaterials = Math.max(0, 100 - (20 - i) * 1.5);
      
      points.push({
        timestamp: mockTime,
        power: Number(basePower.toFixed(1)),
        argon: Number(baseArgon.toFixed(1)),
        materials: Number(baseMaterials.toFixed(1)),
      });
    }
    setHistory(points);
    setMaterialFeed(points[points.length - 1].materials);
  }, []);

  // Telemetry running loop
  useEffect(() => {
    const timer = setInterval(() => {
      const current = stateRef.current;
      const now = new Date();

      // Power calculation based on active grid mode
      let basePowerVal = 780;
      let jitterRange = 25;
      if (current.powerMode === "boost") {
        basePowerVal = 1320;
        jitterRange = 45;
      } else if (current.powerMode === "eco") {
        basePowerVal = 410;
        jitterRange = 15;
      }
      const newPower = Number((basePowerVal + (Math.random() - 0.5) * jitterRange * 2).toFixed(1));

      // Argon flow calculation mapped from valve percentage with pneumatic delays
      const targetArgon = (current.argonValve / 100) * 80;
      const newArgon = Number((targetArgon + (Math.random() - 0.5) * 1.8).toFixed(1));

      // Gradual depletion of synthetic matrix coil materials
      setMaterialFeed((prev) => {
        const nextVal = Math.max(0, prev - (current.powerMode === "boost" ? 0.35 : current.powerMode === "eco" ? 0.08 : 0.16));
        return Number(nextVal.toFixed(1));
      });

      const newPoint: TelemetryPoint = {
        timestamp: now,
        power: newPower,
        argon: newArgon,
        materials: current.materialFeed
      };

      setHistory((prev) => {
        const sliced = prev.length > 25 ? prev.slice(1) : prev;
        // Keep the latest material feed synced in the point
        const updatedPoint = { ...newPoint, materials: current.materialFeed };
        return [...sliced, updatedPoint];
      });

    }, sampleRate);

    return () => clearInterval(timer);
  }, [sampleRate]);

  // D3 References
  const d3PowerRef = useRef<SVGSVGElement | null>(null);
  const d3ArgonRef = useRef<SVGSVGElement | null>(null);
  const d3MaterialRef = useRef<SVGSVGElement | null>(null);

  // Render Power Visualizer (D3 selection update)
  useEffect(() => {
    if (!d3PowerRef.current || history.length === 0) return;

    const svg = d3.select(d3PowerRef.current);
    svg.selectAll("*").remove(); // Clean redraw matching the dark industrial minimalistic constraint

    const width = 240;
    const height = 180;
    const padding = { top: 15, right: 15, bottom: 25, left: 45 };

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(history, (d: TelemetryPoint) => d.timestamp) as [Date, Date])
      .range([padding.left, width - padding.right]);

    const yScale = d3.scaleLinear()
      .domain([0, 1600]) // Capacity limit: 1600 kW
      .range([height - padding.bottom, padding.top]);

    // Gridlines (Industrial look)
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0, ${height - padding.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5).tickSize(-height + padding.top + padding.bottom).tickFormat(() => ""))
      .select(".domain").remove();

    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${padding.left}, 0)`)
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-width + padding.left + padding.right).tickFormat(() => ""))
      .select(".domain").remove();

    // Style the grid lines softly
    svg.selectAll(".grid line")
      .attr("stroke", "#1c1c1f")
      .attr("stroke-dasharray", "1 3");

    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(4)
      .tickFormat(d => d3.timeFormat("%M:%S")(d as Date));

    svg.append("g")
      .attr("transform", `translate(0, ${height - padding.bottom})`)
      .attr("class", "axis text-text-secondary")
      .call(xAxis)
      .selectAll("text")
      .attr("class", "font-mono text-[7.5px] fill-zinc-500 font-black");

    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d} kW`);

    svg.append("g")
      .attr("transform", `translate(${padding.left}, 0)`)
      .attr("class", "axis text-text-secondary")
      .call(yAxis)
      .selectAll("text")
      .attr("class", "font-mono text-[7px] fill-zinc-500 font-bold");

    // Remove axis line borders for modern industrial look
    svg.selectAll(".domain").attr("stroke", "#242426").attr("stroke-width", "1");
    svg.selectAll(".tick line").attr("stroke", "#1c1c1f");

    // Line Generator
    const line = d3.line<TelemetryPoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.power))
      .curve(d3.curveMonotoneX);

    // Draw historical line stream with Solid Industrial Muted Red (#EB5E55 / current theme accent)
    svg.append("path")
      .datum(history)
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("stroke", "#EB5E55")
      .attr("stroke-width", "1.75")
      .attr("d", line);

    // Dynamic warning zone when power exceeds critical threshold of 1150 kW
    const latest = history[history.length - 1];
    if (latest && latest.power > 1150) {
      svg.append("line")
        .attr("x1", padding.left)
        .attr("y1", yScale(1150))
        .attr("x2", width - padding.right)
        .attr("y2", yScale(1150))
        .attr("stroke", "#ea580c")
        .attr("stroke-width", "1")
        .attr("stroke-opacity", "0.6")
        .attr("stroke-dasharray", "3 3");

      svg.append("text")
        .attr("x", padding.left + 5)
        .attr("y", yScale(1150) - 4)
        .attr("fill", "#ea580c")
        .attr("class", "font-mono text-[6.5px] uppercase font-black")
        .text("OVERLOAD WARN REGISTRY");
    }

    // Latest Value Indicator Spot
    if (latest) {
      svg.append("circle")
        .attr("cx", xScale(latest.timestamp))
        .attr("cy", yScale(latest.power))
        .attr("r", "3.5")
        .attr("fill", "#EB5E55");

      svg.append("circle")
        .attr("cx", xScale(latest.timestamp))
        .attr("cy", yScale(latest.power))
        .attr("r", "7")
        .attr("fill", "none")
        .attr("stroke", "#EB5E55")
        .attr("stroke-width", "1")
        .attr("class", "animate-ping");
    }

  }, [history]);

  // Render Argon flow rate (D3 selection update)
  useEffect(() => {
    if (!d3ArgonRef.current || history.length === 0) return;

    const svg = d3.select(d3ArgonRef.current);
    svg.selectAll("*").remove(); // Clean redraw

    const width = 240;
    const height = 180;
    const padding = { top: 15, right: 15, bottom: 25, left: 45 };

    const xScale = d3.scaleTime()
      .domain(d3.extent(history, (d: TelemetryPoint) => d.timestamp) as [Date, Date])
      .range([padding.left, width - padding.right]);

    const yScale = d3.scaleLinear()
      .domain([0, 100]) // Argon % L/min capacity limit
      .range([height - padding.bottom, padding.top]);

    // Gridlines
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0, ${height - padding.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5).tickSize(-height + padding.top + padding.bottom).tickFormat(() => ""))
      .select(".domain").remove();

    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${padding.left}, 0)`)
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-width + padding.left + padding.right).tickFormat(() => ""))
      .select(".domain").remove();

    svg.selectAll(".grid line")
      .attr("stroke", "#1c1c1f")
      .attr("stroke-dasharray", "1 3");

    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(4)
      .tickFormat(d => d3.timeFormat("%M:%S")(d as Date));

    svg.append("g")
      .attr("transform", `translate(0, ${height - padding.bottom})`)
      .attr("class", "axis")
      .call(xAxis)
      .selectAll("text")
      .attr("class", "font-mono text-[7.5px] fill-zinc-500 font-black");

    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d} L/m`);

    svg.append("g")
      .attr("transform", `translate(${padding.left}, 0)`)
      .attr("class", "axis")
      .call(yAxis)
      .selectAll("text")
      .attr("class", "font-mono text-[7px] fill-zinc-500 font-bold");

    svg.selectAll(".domain").attr("stroke", "#242426").attr("stroke-width", "1");
    svg.selectAll(".tick line").attr("stroke", "#1c1c1f");

    // Line generator
    const line = d3.line<TelemetryPoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.argon))
      .curve(d3.curveMonotoneX);

    // Clean cyan steel visual color for Argon (#00f0ff or high tech muted purple/cyan)
    svg.append("path")
      .datum(history)
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("stroke", "#10b981") // Cool solid emerald green representing high flow stability
      .attr("stroke-width", "1.75")
      .attr("d", line);

    // Highlight target volume flow matched boundaries
    const targetFlow = (argonValve / 100) * 80;
    svg.append("line")
      .attr("x1", padding.left)
      .attr("y1", yScale(targetFlow))
      .attr("x2", width - padding.right)
      .attr("y2", yScale(targetFlow))
      .attr("stroke", "#3c3c40")
      .attr("stroke-width", "0.75")
      .attr("stroke-dasharray", "2 2");

    svg.append("text")
      .attr("x", padding.left + 5)
      .attr("y", yScale(targetFlow) - 4)
      .attr("fill", "#6c6c72")
      .attr("class", "font-mono text-[6px] font-black")
      .text(`TARGET VALVE POINT: ${targetFlow.toFixed(1)} L/M`);

    const latest = history[history.length - 1];
    if (latest) {
      svg.append("circle")
        .attr("cx", xScale(latest.timestamp))
        .attr("cy", yScale(latest.argon))
        .attr("r", "3.5")
        .attr("fill", "#10b981");
    }

  }, [history, argonValve]);

  // Render Material levels flow (D3 selection update)
  useEffect(() => {
    if (!d3MaterialRef.current || history.length === 0) return;

    const svg = d3.select(d3MaterialRef.current);
    svg.selectAll("*").remove(); // Clean redraw

    const width = 240;
    const height = 180;
    const padding = { top: 15, right: 15, bottom: 25, left: 45 };

    const xScale = d3.scaleTime()
      .domain(d3.extent(history, (d: TelemetryPoint) => d.timestamp) as [Date, Date])
      .range([padding.left, width - padding.right]);

    const yScale = d3.scaleLinear()
      .domain([0, 100]) // % remains
      .range([height - padding.bottom, padding.top]);

    // Gridlines
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0, ${height - padding.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5).tickSize(-height + padding.top + padding.bottom).tickFormat(() => ""))
      .select(".domain").remove();

    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${padding.left}, 0)`)
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-width + padding.left + padding.right).tickFormat(() => ""))
      .select(".domain").remove();

    svg.selectAll(".grid line")
      .attr("stroke", "#1c1c1f")
      .attr("stroke-dasharray", "1 3");

    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(4)
      .tickFormat(d => d3.timeFormat("%M:%S")(d as Date));

    svg.append("g")
      .attr("transform", `translate(0, ${height - padding.bottom})`)
      .attr("class", "axis")
      .call(xAxis)
      .selectAll("text")
      .attr("class", "font-mono text-[7.5px] fill-zinc-500 font-black");

    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d}%`);

    svg.append("g")
      .attr("transform", `translate(${padding.left}, 0)`)
      .attr("class", "axis")
      .call(yAxis)
      .selectAll("text")
      .attr("class", "font-mono text-[7px] fill-zinc-500 font-bold");

    svg.selectAll(".domain").attr("stroke", "#242426").attr("stroke-width", "1");
    svg.selectAll(".tick line").attr("stroke", "#1c1c1f");

    // Line generator
    const line = d3.line<TelemetryPoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.materials));

    // Material flow color: solid bronze/gold (#A87D43)
    svg.append("path")
      .datum(history)
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("stroke", "#d97706")
      .attr("stroke-width", "2")
      .attr("stroke-dasharray", "2 1") // Tactile line styling
      .attr("d", line);

    const latest = history[history.length - 1];
    if (latest) {
      svg.append("circle")
        .attr("cx", xScale(latest.timestamp))
        .attr("cy", yScale(latest.materials))
        .attr("r", "4")
        .attr("fill", "#d97706");
    }

    // Material Depletion Alert Line at 25% level
    svg.append("line")
      .attr("x1", padding.left)
      .attr("y1", yScale(25))
      .attr("x2", width - padding.right)
      .attr("y2", yScale(25))
      .attr("stroke", "#991b1b")
      .attr("stroke-width", "0.8")
      .attr("stroke-dasharray", "4 4");

  }, [history]);

  // Handle re-feeding matrix coil
  const handleRefeedCoil = () => {
    setMaterialFeed(100);
    // Force immediate modification inside history point to show in charts instantly
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updatedLast = { ...last, materials: 100 };
      return [...prev.slice(0, -1), updatedLast];
    });
  };

  const currentPower = history[history.length - 1]?.power || 0;
  const currentArgon = history[history.length - 1]?.argon || 0;

  return (
    <div className="bg-card-machina border border-border-machina relative p-5 rounded-[4px] font-mono text-left select-none overflow-hidden">
      {/* Decorative Machine Screws */}
      <div className="absolute top-1.5 left-1.5 w-1 h-1 bg-border-machina/60 rounded-full"></div>
      <div className="absolute top-1.5 right-1.5 w-1 h-1 bg-border-machina/60 rounded-full"></div>
      <div className="absolute bottom-1.5 left-1.5 w-1 h-1 bg-border-machina/60 rounded-full"></div>
      <div className="absolute bottom-1.5 right-1.5 w-1 h-1 bg-border-machina/60 rounded-full"></div>

      {/* Header section with real-time sync indicators */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border-machina/70 pb-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-accent-machina animate-pulse" />
            <span className="font-sans font-black text-xs tracking-[0.2em] text-text-primary uppercase">
              D3 RESOURCE UTILIZATION TELEMETRY
            </span>
          </div>
          <span className="text-[8px] text-text-secondary uppercase font-bold mt-0.5 block">
            Real-time tracking of heavy grid power load, argon pressure line, and raw matrix depletion
          </span>
        </div>

        {/* Diagnostic speed tuning selector */}
        <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
          <span className="text-[7.5px] text-text-secondary uppercase font-black">RATE SEC:</span>
          <select
            value={sampleRate}
            onChange={(e) => setSampleRate(Number(e.target.value))}
            className="bg-[#121214] border border-border-machina font-mono text-[8.5px] font-bold text-accent-machina px-1 py-0.5 rounded-[1px] outline-none cursor-pointer hover:border-accent-machina"
          >
            <option value={1000}>FAST (1.0S)</option>
            <option value={2000}>STABLE (2.0S)</option>
            <option value={4000}>ECO (4.0S)</option>
          </select>
        </div>
      </div>

      {/* Visualizers Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Panel 1: Power Grid coupler */}
        <div className="border border-border-machina/60 p-3 bg-bg-machina relative flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[9px] font-black text-text-primary uppercase tracking-wider flex items-center gap-1">
                <Zap size={10} className="text-accent-machina" />
                Power Draw Core
              </span>
              <span className={`text-[7.5px] px-1 py-0.2 rounded-[1px] font-black border uppercase ${
                powerMode === "boost" ? "bg-amber-500/10 border-amber-500 text-amber-500" :
                powerMode === "eco" ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" :
                "bg-zinc-800 border-zinc-700 text-text-primary"
              }`}>
                {powerMode} MODE
              </span>
            </div>

            {/* D3 canvas container */}
            <div className="bg-[#0b0c0d] border border-border-machina rounded-[1px] p-1 flex justify-center items-center">
              <svg ref={d3PowerRef} width="240" height="180" className="block max-w-full" />
            </div>
          </div>

          <div className="mt-3 block text-left">
            <span className="text-[7px] text-text-secondary uppercase font-bold block mb-1">
              GRID INTEGRATION MODE SELECTOR:
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setPowerMode("eco")}
                className={`py-1 text-[8.5px] font-black tracking-wider uppercase border transition-all cursor-pointer rounded-[1px] ${
                  powerMode === "eco"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                    : "bg-[#141519] border-border-machina text-text-secondary hover:text-text-primary"
                }`}
              >
                ECO
              </button>
              <button
                onClick={() => setPowerMode("normal")}
                className={`py-1 text-[8.5px] font-black tracking-wider uppercase border transition-all cursor-pointer rounded-[1px] ${
                  powerMode === "normal"
                    ? "bg-[#1c1d22] border-accent-machina text-accent-machina"
                    : "bg-[#141519] border-border-machina text-text-secondary hover:text-text-primary"
                }`}
              >
                NORMAL
              </button>
              <button
                onClick={() => setPowerMode("boost")}
                className={`py-1 text-[8.5px] font-black tracking-wider uppercase border transition-all cursor-pointer rounded-[1px] ${
                  powerMode === "boost"
                    ? "bg-red-500/15 border-red-500 text-red-400 animate-pulse"
                    : "bg-[#141519] border-border-machina text-text-secondary hover:text-text-primary"
                }`}
              >
                BOOST
              </button>
            </div>
            
            <div className="flex justify-between items-center text-[9px] mt-2.5 font-mono pt-2 border-t border-border-machina/40 text-text-secondary">
              <span>ACTIVE CAPACITY:</span>
              <span className="font-black text-text-primary">{currentPower} kW</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Argon Valve telemetry */}
        <div className="border border-border-machina/60 p-3 bg-bg-machina relative flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[9px] font-black text-text-primary uppercase tracking-wider flex items-center gap-1">
                <Fan size={10} className="text-emerald-500" />
                Argon Blanket flow
              </span>
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">
                VALVE: {argonValve}%
              </span>
            </div>

            {/* D3 canvas container */}
            <div className="bg-[#0b0c0d] border border-border-machina rounded-[1px] p-1 flex justify-center items-center">
              <svg ref={d3ArgonRef} width="240" height="180" className="block max-w-full" />
            </div>
          </div>

          <div className="mt-3 block text-left">
            <span className="text-[7px] text-text-secondary uppercase font-bold block mb-1">
              VALVE APERTURE SLIDER:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="10"
                max="100"
                value={argonValve}
                onChange={(e) => {
                  setArgonValve(Number(e.target.value));
                  setValveStateChanged(true);
                }}
                className="w-full accent-emerald-500 h-[3px] bg-[#1a1b20] rounded-[1px] cursor-pointer"
              />
            </div>
            
            <div className="flex justify-between items-center text-[9px] mt-2.5 font-mono pt-2 border-t border-border-machina/40 text-text-secondary">
              <span>CURRENT DISCHARGE:</span>
              <span className={`font-black uppercase tracking-wider ${currentArgon > 70 ? "text-amber-500 animate-pulse" : "text-emerald-500"}`}>
                {currentArgon} L/MIN
              </span>
            </div>
          </div>
        </div>

        {/* Panel 3: Materials levels */}
        <div className="border border-border-machina/60 p-3 bg-bg-machina relative flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[9px] font-black text-text-primary uppercase tracking-wider flex items-center gap-1">
                <SlidersHorizontal size={10} className="text-[#d97706]" />
                Steel Substrate Feed
              </span>
              <span className={`text-[7.5px] px-1 py-0.2 font-black border uppercase ${
                materialFeed <= 25 ? "bg-red-500/10 border-red-500 text-red-500 animate-pulse" : "bg-zinc-800 border-zinc-700 text-text-secondary"
              }`}>
                {materialFeed <= 25 ? "CRITICAL STAGE" : "NOMINAL VOLUME"}
              </span>
            </div>

            {/* D3 canvas container */}
            <div className="bg-[#0b0c0d] border border-border-machina rounded-[1px] p-1 flex justify-center items-center">
              <svg ref={d3MaterialRef} width="240" height="180" className="block max-w-full" />
            </div>
          </div>

          <div className="mt-3 block text-left">
            <button
              onClick={handleRefeedCoil}
              className="w-full py-1.5 text-[8.5px] font-black tracking-widest bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black border border-amber-500 uppercase transition-all rounded-[1px] cursor-pointer flex items-center justify-center gap-1.5 group"
            >
              <RefreshCw size={10} className="group-hover:rotate-180 transition-all duration-300" />
              RE-FEED STEEL MATRIX COIL
            </button>
            
            <div className="flex justify-between items-center text-[9px] mt-2.5 font-mono pt-2 border-t border-border-machina/40 text-text-secondary">
              <span>COIL COUPLER GAP:</span>
              <span className={`font-black ${materialFeed <= 25 ? "text-red-500 font-extrabold animate-pulse" : "text-amber-500"}`}>
                {materialFeed}% LOAD
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Alarm status readout */}
      {materialFeed <= 25 && (
        <div className="mt-4 p-2 bg-[#991b1b]/10 border border-[#991b1b]/40 text-red-400 text-[8.5px] font-bold tracking-wider flex items-center gap-2 uppercase animate-pulse">
          <ShieldAlert size={12} />
          <span>[WARN CRITICAL DEBOTTLE]: COIL LEVEL IN FEED CHANNEL HAS PLUMMETED BELOW 25%. ENGAGE RE-FEEDING MECHANISM IMMEDIATELY.</span>
        </div>
      )}
    </div>
  );
}
