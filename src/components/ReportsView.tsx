import React, { useState } from "react";
import { useStore } from "../store/useStore";
import IndustrialWidget from "./IndustrialWidget";
import { FileText, Search, Download, Calendar, ShieldCheck, User } from "lucide-react";

export default function ReportsView() {
  const { reports, readings, incidents, equipment } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Filter lists
  const filtered = reports.filter((rep) => {
    const matchesSearch = rep.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === "ALL" ? true : rep.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Client-side CSV exporter for actual historical sensor logs
  const exportSensorLogsCSV = () => {
    const allReadings: any[] = [];
    Object.entries(readings).forEach(([eqId, logs]) => {
      const eqName = equipment.find(e => e.id === eqId)?.name || eqId;
      logs.forEach(log => {
        allReadings.push({
          equipment_id: eqId,
          equipment_name: eqName,
          timestamp: log.timestamp,
          temperature: log.temperature,
          vibration: log.vibration,
          pressure: log.pressure,
          voltage: log.voltage || "",
          current: log.current || ""
        });
      });
    });

    if (allReadings.length === 0) {
      alert("No sensor readings available for export. Re-run simulations or trigger stress anomalies on assets first.");
      return;
    }

    // Header column fields
    const headers = ["Equipment ID", "Equipment Name", "Timestamp", "Temperature (C)", "Vibration (mm/s)", "Pressure (bar)", "Voltage (V)", "Current (A)"];
    
    // Construct rows
    const rows = allReadings.map(r => [
      `"${r.equipment_id}"`,
      `"${r.equipment_name.replace(/"/g, '""')}"`,
      `"${r.timestamp}"`,
      r.temperature,
      r.vibration,
      r.pressure,
      r.voltage,
      r.current
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `factory_sensor_telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client-side JSON exporter for raw security/compliance incident records
  const exportIncidentsJSON = () => {
    if (incidents.length === 0) {
      alert("No active safety logs or infractions recorded.");
      return;
    }

    const payload = incidents.map(inc => ({
      ...inc,
      extracted_at: new Date().toISOString(),
      compliance_status: (inc.category === "PPE Breach" || inc.level === "critical" || inc.level === "emergency") ? "NON_COMPLIANT" : "REGULAR"
    }));

    const jsonContent = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `factory_violations_log_${new Date().toISOString().slice(0, 10)}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="reports-view-layout" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left hand Sidebar Filters & Export Center */}
        <div className="lg:col-span-1 space-y-6">
          <IndustrialWidget
            title="FILTER AUDIT LOGS"
            subtitle="Prune regulatory sheets"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-text-secondary uppercase mb-2 font-black tracking-wider">
                  GENERAL SEARCH
                </label>
                <div className="relative">
                  <input
                    id="input-reports-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-card-machina border border-border-machina py-1.5 pl-8 pr-2 text-xs font-mono text-text-primary focus:outline-none uppercase font-bold"
                    placeholder="E.G. SAFETY, XGBOOST..."
                  />
                  <Search size={12} className="absolute left-2.5 top-2.5 text-text-secondary" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-text-secondary uppercase mb-2 font-black tracking-wider">
                  REPORT CATEGORIES
                </label>
                <div className="space-y-1 font-mono text-xs">
                  {["ALL", "Security", "Predictive", "AssetHealth"].map((cat) => (
                    <button
                      id={`btn-cat-filter-${cat}`}
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`w-full text-left px-2.5 py-2 transition-all duration-150 cursor-pointer font-bold tracking-wider uppercase border border-border-machina/40 ${
                        categoryFilter === cat
                          ? "bg-hover-machina border-accent-machina text-accent-machina font-black"
                          : "bg-card-machina border-transparent text-text-secondary hover:bg-hover-machina"
                      }`}
                    >
                      {cat.replace("AssetHealth", "Asset Health").toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </IndustrialWidget>

          <IndustrialWidget
            title="DATA EXTRACTION CORE"
            subtitle="Secure flat-file output client"
          >
            <div className="space-y-4 pt-1 font-mono text-[11px]">
              <p className="text-text-secondary leading-normal text-xs">
                DUMP LIVE EDGE MECHANICAL READINGS AND SAFETY CHECKS INTO SECURE AUDITING CODES FOR RECORD KEEPING.
              </p>
              
              <div className="space-y-2">
                <button
                   id="btn-export-sensors-csv"
                   onClick={exportSensorLogsCSV}
                   className="w-full py-2 bg-card-machina hover:bg-hover-machina border border-border-machina text-text-primary hover:text-accent-machina font-black uppercase text-xs tracking-wider transition-none cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download size={11} />
                  EXPORT SENSOR LOGS (CSV)
                </button>

                <button
                  id="btn-export-safety-json"
                  onClick={exportIncidentsJSON}
                  className="w-full py-2 bg-card-machina hover:bg-hover-machina border border-border-machina text-text-primary hover:text-accent-machina font-black uppercase text-xs tracking-wider transition-none cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download size={11} />
                  EXPORT VIOLATIONS (JSON)
                </button>
              </div>
              
              <div className="border-t border-border-machina pt-3 text-[9px] text-text-secondary leading-relaxed">
                Applet Encryption Identifier:
                <span className="block text-accent-machina font-bold truncate mt-0.5 select-all">SHA256: 8D3F2949-79BB-4513-8A14-8E428F1645C9</span>
              </div>
            </div>
          </IndustrialWidget>
        </div>

        {/* Right hand listings log list */}
        <div className="lg:col-span-3 font-mono">
          <IndustrialWidget
            title="REGULATORY MECHANICAL COMPLIANCE & CALIBRATION REPORTS"
            subtitle={`Consolidated audit entries — showing ${filtered.length} matching files`}
          >
            <div className="space-y-3">
              {filtered.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 bg-card-machina border border-border-machina flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-mono relative rounded-[3px]"
                >
                  {/* Bolt corners for visual plate motif */}
                  <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
                  <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-border-machina/60"></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-border-machina/60"></div>

                  <div className="flex gap-3 items-start flex-1 pl-2">
                    <div className="p-2.5 bg-bg-machina border border-border-machina text-text-secondary">
                      <FileText size={16} className="text-text-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <span className="font-bold text-text-primary block text-sm tracking-wide uppercase">
                        {rep.title.toUpperCase()}
                      </span>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-text-secondary font-bold">
                        <span className="flex items-center gap-1.5 uppercase">
                          <Calendar size={10} />
                          {rep.created_at.slice(0, 10)}
                        </span>
                        <span className="flex items-center gap-1.5 uppercase">
                          <User size={10} />
                          {rep.author.toUpperCase()}
                        </span>
                        <span className="px-1.5 bg-bg-machina text-[9px] border border-border-machina font-black uppercase text-accent-machina">
                          {rep.category.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 self-end md:self-auto pr-2 z-10">
                    <span className="text-[10px] text-text-secondary font-black tracking-widest">{rep.size.toUpperCase()}</span>
                    <button
                      id={`btn-dl-report-${rep.id}`}
                      onClick={() => alert(`Connecting securely to system vault. Exporting CSV payload for '${rep.title}'... Completed.`)}
                      className="px-2.5 py-1.5 bg-card-machina border border-border-machina hover:bg-hover-machina text-text-primary hover:text-accent-machina font-black uppercase text-[9px] tracking-wider transition-none cursor-pointer flex items-center gap-1.5"
                    >
                      <Download size={10} />
                      Exporter Action
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </IndustrialWidget>
        </div>
      </div>
    </div>
  );
}
