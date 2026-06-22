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
  Zap
} from "lucide-react";

export default function AnalyticsView() {
  const { equipment, readings } = useStore();
  const [selectedEqId, setSelectedEqId] = useState<string>("eq-turbine-01");

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
    </div>
  );
}
