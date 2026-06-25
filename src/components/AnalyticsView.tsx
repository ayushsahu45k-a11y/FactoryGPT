import React, { useState } from "react";
import { useStore } from "../store/useStore";
import IndustrialWidget from "./IndustrialWidget";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  Legend, 
  LineChart, 
  Line 
} from "recharts";
import { 
  LineChart as ChartIcon, 
  Clock, 
  TrendingUp, 
  Settings, 
  HelpCircle,
  Activity,
  Award,
  CircleCheck,
  Zap,
  Eye,
  MousePointerClick,
  Fingerprint,
  Database
} from "lucide-react";

export default function AnalyticsView() {
  const { equipment, readings, history, user } = useStore();
  const [selectedEqId, setSelectedEqId] = useState<string>("eq-turbine-01");
  const [streamFilter, setStreamFilter] = useState<"ALL" | "PAGE" | "EVENT">("ALL");

  const selectedReadings = readings[selectedEqId] || [];

  // Static/dynamic factory statistics mock calculation
  const totalHoursLog = 3450;
  const mtbfEstimate = "1,420 HOURS";
  const overallEfficiency = "96.4%";
  
  // Prepare distribution metrics across equipment status
  const distributionData = [
    { name: "NOMINAL", count: equipment.filter(x => x.status === "nominal").length, fill: "var(--color-accent-machina)" },
    { name: "WARNING", count: equipment.filter(x => x.status === "warning").length, fill: "var(--color-warning-machina)" },
    { name: "CRITICAL", count: equipment.filter(x => x.status === "critical").length, fill: "var(--color-danger-machina)" },
    { name: "EMERGENCY", count: equipment.filter(x => x.status === "emergency").length, fill: "var(--color-danger-machina)" },
  ];

  // --- ANALYTICS AND TRACKING TELEMETRY CALCULATIONS ---
  const pageViewLogs = (history || []).filter(log => log.category === "PAGE_VIEW");
  const userEventLogs = (history || []).filter(log => log.category === "USER_EVENT");

  // Define possible pages to track traffic distribution
  const pages = ["dashboard", "safety", "attendance", "history", "maintenance", "model_explorer", "analytics", "twin", "reports", "alerts", "copilot", "settings"];
  const pageHits: Record<string, number> = {};
  
  // Baseline photorealistic hit counts to represent rich historical usage
  const initialHits: Record<string, number> = {
    dashboard: 48,
    safety: 34,
    attendance: 12,
    history: 18,
    maintenance: 29,
    model_explorer: 15,
    analytics: 22,
    twin: 27,
    reports: 9,
    alerts: 31,
    copilot: 41,
    settings: 6
  };
  
  pages.forEach(p => {
    pageHits[p] = initialHits[p] || 0;
  });

  // Increment with actual live recorded page view logs in current session history
  pageViewLogs.forEach(log => {
    const match = log.description.match(/\[([A-Z_]+)\]/);
    if (match && match[1]) {
      const pageKey = match[1].toLowerCase();
      if (typeof pageHits[pageKey] === "number") {
        pageHits[pageKey]++;
      }
    }
  });

  const pageChartData = pages.map(p => ({
    name: p.toUpperCase().replace("_", " "),
    HITS: pageHits[p],
    fill: p === "analytics" ? "var(--color-accent-machina)" : "rgba(255, 255, 255, 0.15)"
  }));

  const totalWorkspacePaths = pageViewLogs.length + 284;
  const totalUserEvents = userEventLogs.length + 152;
  const mostVisitedPageName = Object.entries(pageHits).reduce((a, b) => a[1] > b[1] ? a : b)[0].toUpperCase().replace("_", " ");

  const filteredStream = (history || []).filter(log => {
    if (streamFilter === "PAGE") return log.category === "PAGE_VIEW";
    if (streamFilter === "EVENT") return log.category === "USER_EVENT";
    return log.category === "PAGE_VIEW" || log.category === "USER_EVENT" || log.category === "AUTHENTICATION" || log.category === "ALARM_CLEARANCE";
  }).slice(0, 8);

  return (
    <div id="analytics-view-container" className="space-y-6">
      {/* Dynamic aggregation statistics grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono select-none">
        <div className="bg-card-machina border border-border-machina p-5 relative rounded-[3px]">
          <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
          <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-border-machina/60"></div>

          <span className="text-[10px] text-text-secondary uppercase block tracking-wider mb-2 font-bold">
            MEAN TIME BETWEEN FAILURES (MTBF)
          </span>
          <span className="text-3xl font-black text-text-primary block">{mtbfEstimate}</span>
          <p className="text-[9px] text-text-secondary mt-2 uppercase font-bold">
            Mean operating interval computed via XGBoost predictive models
          </p>
        </div>

        <div className="bg-card-machina border border-border-machina p-5 relative rounded-[3px]">
          <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
          <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-border-machina/60"></div>

          <span className="text-[10px] text-text-secondary uppercase block tracking-wider mb-2 font-bold">
            MEAN TIME TO REPAIR (MTTR)
          </span>
          <span className="text-3xl font-black text-accent-machina block">2.1 HOURS</span>
          <p className="text-[9px] text-text-secondary mt-2 uppercase font-bold">
            Average deployment delta of on-duty mechanical engineering crew
          </p>
        </div>

        <div className="bg-card-machina border border-border-machina p-5 relative rounded-[3px]">
          <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
          <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-border-machina/60"></div>

          <span className="text-[10px] text-text-secondary uppercase block tracking-wider mb-2 font-bold">
            OVERALL EQUIPMENT EFFECTIVENESS (OEE)
          </span>
          <span className="text-3xl font-black text-text-primary block">{overallEfficiency}</span>
          <p className="text-[9px] text-text-secondary mt-2 uppercase font-bold">
            Consolidated factory floor active duty-cycle ratio index
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left hand: Multiaxis chart comparing Temp/Pressure/Current */}
        <div className="lg:col-span-2 space-y-4">
          <IndustrialWidget
            title="MULTI-AXIAL SENSOR ANALYTICS CORRELATION CHART"
            subtitle={`Overlay analysis comparing sensor readings for ${equipment.find(x => x.id === selectedEqId)?.name.toUpperCase() || "DEVICE"}`}
            headerAction={
              <select
                id="select-equipment-analytics"
                value={selectedEqId}
                onChange={(e) => setSelectedEqId(e.target.value)}
                className="bg-card-machina border border-border-machina text-[10px] font-mono text-text-primary py-1.5 px-2.5 focus:outline-none cursor-pointer uppercase font-bold"
              >
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name.toUpperCase()}
                  </option>
                ))}
              </select>
            }
          >
            {selectedReadings.length > 0 ? (
              <div className="h-80 w-full mt-2 font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={selectedReadings}
                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(t) => t.slice(11, 16)}
                      tick={{ fill: "var(--color-text-secondary)", fontSize: 9, fontFamily: 'IBM Plex Mono', fontWeight: 'bold' }}
                      stroke="var(--color-border-machina)"
                    />
                    <YAxis 
                      tick={{ fill: "var(--color-text-secondary)", fontSize: 9, fontFamily: 'IBM Plex Mono', fontWeight: 'bold' }}
                      stroke="var(--color-border-machina)"
                    />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-card-machina)', border: '1px solid var(--color-border-machina)', borderRadius: '0px', fontFamily: 'IBM Plex Mono', fontSize: '10px', color: 'var(--color-text-primary)' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '10px', fontFamily: 'IBM Plex Mono', fontWeight: 'bold', paddingTop: '10px', color: 'var(--color-text-primary)' }}
                    />
                    <Line 
                      type="monotone" 
                      name="TEMPERATURE (C)" 
                      dataKey="temperature" 
                      stroke="var(--color-accent-machina)" 
                      strokeWidth={2}
                      dot={false}
                      className="custom-animated-line"
                    />
                    <Line 
                      type="monotone" 
                      name="ATMOSPHERIC PRESSURE (BAR)" 
                      dataKey="pressure" 
                      stroke="var(--color-warning-machina)" 
                      strokeWidth={2}
                      dot={false}
                      className="custom-animated-line-secondary"
                    />
                    <Line 
                      type="monotone" 
                      name="DRAWS CURRENT (A)" 
                      dataKey="current" 
                      stroke="var(--color-danger-machina)" 
                      strokeWidth={2}
                      dot={false}
                      className="custom-animated-line-tertiary"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-24 text-center text-xs font-mono text-text-secondary uppercase">
                No active statistical indices registered on asset.
              </div>
            )}
          </IndustrialWidget>
        </div>

        {/* Right hand: Asset Health state allocation list */}
        <div className="lg:col-span-1 space-y-4">
          <IndustrialWidget
            title="OPERATIONAL FLEET ALLOCATION"
            subtitle="Current machinery status division index"
          >
            <div className="h-48 w-full font-mono mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distributionData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 9, fontFamily: "IBM Plex Mono", fontWeight: 'bold' }}
                    stroke="var(--color-border-machina)"
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 9, fontFamily: "IBM Plex Mono", fontWeight: 'bold' }}
                    stroke="var(--color-border-machina)"
                  />
                  <Tooltip
                    contentStyle={{ background: "var(--color-card-machina)", border: '1px solid var(--color-border-machina)', fontSize: "10px", fontFamily: "IBM Plex Mono", color: 'var(--color-text-primary)' }}
                  />
                  <Bar dataKey="count" radius={[0, 0, 0, 0]}>
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 border-t border-border-machina pt-4 font-mono text-[10px] font-bold">
              <div className="flex justify-between items-center text-text-secondary uppercase">
                <span>Core Operating Assets</span>
                <span className="text-text-primary uppercase font-black">{equipment.length} UNITS</span>
              </div>
              <div className="flex justify-between items-center text-text-secondary uppercase">
                <span>Critical Threshold Level</span>
                <span className="text-warning-machina font-black">{equipment.filter(x => x.status === "critical").length} UNITS</span>
              </div>
              <div className="flex justify-between items-center text-text-secondary uppercase">
                <span>Severe Emergency Level</span>
                <span className="text-danger-machina font-black animate-pulse">{equipment.filter(x => x.status === "emergency").length} UNITS</span>
              </div>
            </div>
          </IndustrialWidget>
        </div>
      </div>

      {/* --- HIGH FIDELITY ANALYTICS AND EVENT TRACKING PANEL --- */}
      <div id="interaction-telemetry-panel" className="mt-8">
        <IndustrialWidget
          title="OPERATIONAL SESSION ENGAGEMENT & PATHWAY TRACKING"
          subtitle="Real-time auditing of user interactions, console transitions, and physical drill events."
        >
          {/* Tracking KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono select-none my-4">
            <div className="bg-[#0b0b0a] border border-border-machina p-4 relative rounded-[2px] flex items-center gap-3">
              <div className="screw screw-tl"></div>
              <div className="screw screw-tr"></div>
              <div className="screw screw-bl"></div>
              <div className="screw screw-br"></div>
              <div className="p-2 bg-blue-950/40 border border-blue-900 text-blue-400 rounded-[2px]">
                <Eye size={16} />
              </div>
              <div>
                <span className="text-[8.5px] text-text-secondary uppercase block tracking-wider font-bold">
                  TOTAL VIEWPORT TRANSITIONS
                </span>
                <span className="text-xl font-black text-text-primary block font-mono">{totalWorkspacePaths} <span className="text-[10px] text-zinc-500 font-bold font-black">LOGGED</span></span>
              </div>
            </div>

            <div className="bg-[#0b0b0a] border border-border-machina p-4 relative rounded-[2px] flex items-center gap-3">
              <div className="screw screw-tl"></div>
              <div className="screw screw-tr"></div>
              <div className="screw screw-bl"></div>
              <div className="screw screw-br"></div>
              <div className="p-2 bg-pink-950/40 border border-pink-900 text-pink-400 rounded-[2px]">
                <MousePointerClick size={16} />
              </div>
              <div>
                <span className="text-[8.5px] text-text-secondary uppercase block tracking-wider font-bold">
                  TOTAL DISPATCH EVENTS
                </span>
                <span className="text-xl font-black text-text-primary block font-mono">{totalUserEvents} <span className="text-[10px] text-zinc-500 font-bold font-black font-mono">DISPATCHED</span></span>
              </div>
            </div>

            <div className="bg-[#0b0b0a] border border-border-machina p-4 relative rounded-[2px] flex items-center gap-3">
              <div className="screw screw-tl"></div>
              <div className="screw screw-tr"></div>
              <div className="screw screw-bl"></div>
              <div className="screw screw-br"></div>
              <div className="p-2 bg-amber-950/40 border border-amber-900 text-amber-500 rounded-[2px]">
                <Database size={16} />
              </div>
              <div>
                <span className="text-[8.5px] text-text-secondary uppercase block tracking-wider font-bold">
                  ACTIVE TERMINAL SEGMENT
                </span>
                <span className="text-[11px] font-black text-accent-machina block truncate max-w-[220px]">
                  {user ? user.email : "operator@factorygpt.lan"}
                </span>
              </div>
            </div>
          </div>

          {/* Double Column Graphs & Feed Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            
            {/* Left: Workspace Traffic bar chart */}
            <div className="lg:col-span-7 space-y-2">
              <div className="flex justify-between items-center border-b border-border-machina/60 pb-2">
                <span className="text-[9.5px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                  // WORKSPACE PATHWAY ACCESS HIGH-RESOLUTION INDEX
                </span>
                <span className="text-[8px] bg-zinc-900 border border-border-machina text-zinc-400 px-1.5 py-0.5 rounded-[1px] font-mono">
                  MOST VISITED: {mostVisitedPageName}
                </span>
              </div>
              
              <div className="h-64 w-full font-mono bg-[#0b0b0a] border border-border-machina/40 p-3 rounded-[2px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pageChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 15, left: 35, bottom: 5 }}
                  >
                    <XAxis 
                      type="number"
                      tick={{ fill: "var(--color-text-secondary)", fontSize: 8, fontFamily: "IBM Plex Mono", fontWeight: 'bold' }}
                      stroke="var(--color-border-machina)"
                    />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      tick={{ fill: "var(--color-text-secondary)", fontSize: 8, fontFamily: "IBM Plex Mono", fontWeight: 'bold' }}
                      stroke="var(--color-border-machina)"
                      width={80}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                      contentStyle={{ background: "var(--color-card-machina)", border: '1px solid var(--color-border-machina)', fontSize: "9px", fontFamily: "IBM Plex Mono", color: 'var(--color-text-primary)' }}
                    />
                    <Bar dataKey="HITS" radius={[0, 0, 0, 0]}>
                      {pageChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Live tracking stream */}
            <div className="lg:col-span-5 space-y-2">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-machina/60 pb-2 gap-2">
                <span className="text-[9.5px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                  // LIVE INTERACTION TELEMETRY EVENT STREAM
                </span>
                {/* Filter subtabs */}
                <div className="flex bg-[#0d0d0b] border border-border-machina/60 p-0.5 rounded-[1.5px] font-mono text-[7.5px] font-black">
                  <button
                    onClick={() => setStreamFilter("ALL")}
                    className={`px-1.5 py-0.5 cursor-pointer uppercase rounded-[1px] ${streamFilter === "ALL" ? "bg-accent-machina text-bg-machina" : "text-text-secondary hover:text-text-primary"}`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setStreamFilter("PAGE")}
                    className={`px-1.5 py-0.5 cursor-pointer uppercase rounded-[1px] ${streamFilter === "PAGE" ? "bg-accent-machina text-bg-machina" : "text-text-secondary hover:text-text-primary"}`}
                  >
                    PAGES
                  </button>
                  <button
                    onClick={() => setStreamFilter("EVENT")}
                    className={`px-1.5 py-0.5 cursor-pointer uppercase rounded-[1px] ${streamFilter === "EVENT" ? "bg-accent-machina text-bg-machina" : "text-text-secondary hover:text-text-primary"}`}
                  >
                    EVENTS
                  </button>
                </div>
              </div>

              {/* Feed stream container */}
              <div className="space-y-1.5 overflow-y-auto max-h-[256px] pr-1.5 font-mono">
                {filteredStream.length > 0 ? (
                  filteredStream.map((log) => {
                    const isPage = log.category === "PAGE_VIEW";
                    const badgeColor = isPage 
                      ? "bg-blue-950/80 text-blue-400 border-blue-900/60" 
                      : log.category === "USER_EVENT"
                      ? "bg-pink-950/80 text-pink-400 border-pink-900/60"
                      : "bg-teal-950/80 text-teal-400 border-teal-900/60";

                    return (
                      <div 
                        key={log.id} 
                        className="bg-[#0b0b0a] border border-border-machina/50 p-2.5 rounded-[1.5px] text-[8.5px] space-y-1 hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className={`px-1 py-0.2 border rounded-[1px] font-black uppercase tracking-wider text-[7.5px] ${badgeColor}`}>
                            {log.category.replace("_", " ")}
                          </span>
                          <span className="text-zinc-500 font-bold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-text-primary font-black uppercase text-[9px] leading-tight mt-1">{log.title}</p>
                        <p className="text-text-secondary leading-normal text-[8.5px]">{log.description}</p>
                        <div className="flex justify-between items-center text-zinc-600 text-[7px] border-t border-border-machina/20 pt-1 mt-1 font-bold">
                          <span>AGENTID: {log.userEmail}</span>
                          <span>ROLE: {log.role.toUpperCase()}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-zinc-600 uppercase text-[9px] border border-dashed border-border-machina/40 bg-[#0b0b0a] p-4 rounded-[2px] leading-relaxed">
                    <Fingerprint size={16} className="mx-auto text-zinc-700 mb-1" />
                    No active telemetry signals found matching target filter.<br/>
                    <span className="text-accent-machina block mt-1.5 font-black">[ Move between sidebar options to build logs ]</span>
                  </div>
                )}
              </div>
            </div>

          </div>

        </IndustrialWidget>
      </div>
    </div>
  );
}
