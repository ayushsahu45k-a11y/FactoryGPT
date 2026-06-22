import React, { useState, useMemo } from "react";
import { useStore } from "../store/useStore";
import { UserRole, HistoryRecord } from "../types";
import IndustrialWidget from "./IndustrialWidget";
import {
  Search,
  Filter,
  Trash2,
  Plus,
  Download,
  User,
  Calendar,
  Activity,
  Cpu,
  Layers,
  ChevronRight,
  Fingerprint,
  FileText,
  CheckCircle2,
  AlertOctagon,
  ShieldAlert,
  Sliders,
  History,
  HardDrive
} from "lucide-react";

export default function HistoryView() {
  const { user, history, addHistory, registeredWorkers } = useStore();

  // Search parameters & state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  // Manual entry state (Managers & Admins only)
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState<HistoryRecord["category"]>("EQUIPMENT_MAINTENANCE");
  const [entryStatus, setEntryStatus] = useState<string | null>(null);

  // Determine user-scoped baseline history based on user's active role security tier.
  // Workers can ONLY view their own records for strict privacy compliance.
  const roleScopedBaseLogs = useMemo(() => {
    if (!user) return [];
    if (user.role === "Worker") {
      // Worker Carter / Riggs gets private worker logs
      return history.filter(
        (log) => log.userEmail === user.email || log.category === "SYSTEM_RESET"
      );
    }
    // Admin, Manager, and read-only Audience Viewers see the global flow
    return history;
  }, [history, user]);

  // Compute stats based on scoped raw logs history
  const stats = useMemo(() => {
    const logs = roleScopedBaseLogs;
    const totals = logs.length;
    const authLogs = logs.filter((l) => l.category === "AUTHENTICATION").length;
    const safetyLogs = logs.filter((l) => l.category === "SAFETY_SCAN").length;
    const maintenanceLogs = logs.filter((l) => l.category === "EQUIPMENT_MAINTENANCE").length;
    const alarmLogs = logs.filter((l) => l.category === "ALARM_CLEARANCE").length;
    
    return {
      totals,
      authLogs,
      safetyLogs,
      maintenanceLogs,
      alarmLogs
    };
  }, [roleScopedBaseLogs]);

  // Apply search/category filters to the scoped list
  const filteredLogs = useMemo(() => {
    return roleScopedBaseLogs.filter((log) => {
      // 1. Text Search matching title, description, user name or email
      const rawText = `${log.title} ${log.description} ${log.workerName} ${log.userEmail}`.toLowerCase();
      const matchesSearch = rawText.includes(searchTerm.toLowerCase());

      // 2. Category selection dropdown filter
      const matchesCategory = selectedCategory === "ALL" || log.category === selectedCategory;

      // 3. User Role category filter (Managers & Admins see this control)
      const matchesRole = selectedRoleFilter === "ALL" || log.role === selectedRoleFilter;

      return matchesSearch && matchesCategory && matchesRole;
    });
  }, [roleScopedBaseLogs, searchTerm, selectedCategory, selectedRoleFilter]);

  // Handle selecting the first item if none is selected
  const activeLog = useMemo(() => {
    if (selectedLogId) {
      return history.find((h) => h.id === selectedLogId) || null;
    }
    return filteredLogs[0] || null;
  }, [filteredLogs, selectedLogId, history]);

  // Color schemes for categorical labels
  const getCategoryTheme = (cat: HistoryRecord["category"]) => {
    switch (cat) {
      case "AUTHENTICATION":
        return "bg-teal-950/70 text-teal-400 border-teal-900";
      case "SAFETY_SCAN":
        return "bg-emerald-950/70 text-emerald-400 border-emerald-900";
      case "ALARM_CLEARANCE":
        return "bg-violet-950/70 text-violet-400 border-violet-900";
      case "EQUIPMENT_MAINTENANCE":
        return "bg-amber-950/70 text-amber-400 border-amber-900";
      case "WORKER_REGISTRATION":
        return "bg-fuchsia-950/70 text-fuchsia-400 border-fuchsia-900";
      case "ATTENDANCE":
        return "bg-zinc-900/90 text-zinc-400 border-zinc-800";
      case "COPILOT":
        return "bg-sky-950/70 text-sky-400 border-sky-900";
      case "SYSTEM_RESET":
        return "bg-red-950/70 text-red-400 border-red-900";
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
    }
  };

  // Add a manual ledger action entry to store
  const handleAddManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      setEntryStatus("ERR: Header and detail context fields cannot be vacant.");
      return;
    }

    addHistory(newCat, newTitle.trim(), newDesc.trim());
    setNewTitle("");
    setNewDesc("");
    setEntryStatus("SUCCESS: Operational entry recorded inside facility ledger.");
    setTimeout(() => setEntryStatus(null), 3000);
  };

  // Export filtered logs as CSV data format
  const triggerSpreadsheetExport = () => {
    const headerRow = "ID,Timestamp,Operator Name,Operator Email,Hierarchy Role,Category,Action Header,Description\n";
    const contentRows = filteredLogs
      .map((log) => {
        const row = [
          log.id,
          log.timestamp,
          `"${log.workerName.replace(/"/g, '""')}"`,
          log.userEmail,
          log.role,
          log.category,
          `"${log.title.replace(/"/g, '""')}"`,
          `"${log.description.replace(/"/g, '""')}"`
        ];
        return row.join(",");
      })
      .join("\n");

    const blob = new Blob([headerRow + contentRows], { type: "text/csv" });
    const blobUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = `FACTORYGPT_LEDGER_${user?.role.toUpperCase()}_EXPORT.csv`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(blobUrl);
  };

  // Reset the search inputs
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("ALL");
    setSelectedRoleFilter("ALL");
    setSelectedLogId(null);
  };

  if (!user) return null;

  return (
    <div id="facility-history-tab" className="space-y-6">
      
      {/* 1. Header Banner & Safety Notification Scope Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card-machina border border-border-machina p-5 relative rounded-[3px] select-none">
        <div className="screw screw-tl"></div>
        <div className="screw screw-tr"></div>
        <div className="screw screw-bl"></div>
        <div className="screw screw-br"></div>
        
        <div>
          <span className="text-[8px] font-mono text-accent-machina bg-zinc-950 px-2 py-0.5 border border-border-machina font-bold uppercase tracking-widest block w-fit mb-1">
            SECURITY TIER: {user.role.toUpperCase()} LEDGER VIEW
          </span>
          <h2 className="font-bebas text-3xl tracking-[0.08em] text-text-primary uppercase leading-tight">
            OPERATIONAL LEDGER & AUDIT TRAIL
          </h2>
          <p className="text-[10px] text-text-secondary font-mono tracking-wider mt-1 uppercase font-bold">
            {user.role === "Worker" 
              ? `Showing localized personal activity for ${user.full_name} (${user.email}).` 
              : "Comprehensive system activities logs mapped across operators, security events, and AI triggers."}
          </p>
        </div>

        <button
          onClick={triggerSpreadsheetExport}
          disabled={filteredLogs.length === 0}
          className="mt-4 md:mt-0 px-4 py-2 bg-[#121211] hover:bg-hover-machina border border-border-machina text-[9px] font-mono font-black text-text-primary hover:text-accent-machina uppercase tracking-widest cursor-pointer disabled:opacity-40 select-none flex items-center gap-2 rounded-[1.5px]"
        >
          <Download size={12} strokeWidth={2.5} />
          Export Ledger (.CSV)
        </button>
      </div>

      {/* 2. Top-level Analytical Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Logs Counter */}
        <div className="bg-card-machina border border-border-machina p-4 relative font-mono rounded-[2px] shadow-none flex flex-col justify-between select-none">
          <div className="flex justify-between items-center text-[8.5px] text-zinc-500 font-extrabold uppercase">
            <span>MEMORIES LOADED</span>
            <Layers size={10} className="text-zinc-500" />
          </div>
          <span className="text-2xl font-black text-text-primary block mt-2 font-mono">
            {stats.totals}
          </span>
          <span className="text-[7.5px] text-accent-machina mt-1.5 uppercase font-bold block">// SCROLLING FRAME</span>
        </div>

        {/* Security / Auth Scan */}
        <div className="bg-card-machina border border-border-machina p-4 relative font-mono rounded-[2px] shadow-none flex flex-col justify-between select-none">
          <div className="flex justify-between items-center text-[8.5px] text-zinc-500 font-extrabold uppercase">
            <span>SIGNON SIGNALS</span>
            <Fingerprint size={10} className="text-zinc-500" />
          </div>
          <span className="text-2xl font-black text-teal-400 block mt-2 font-mono">
            {stats.authLogs}
          </span>
          <span className="text-[7.5px] text-teal-400 mt-1.5 uppercase font-bold block">// SECURE PORT COMMITS</span>
        </div>

        {/* Optical PPE Checks */}
        <div className="bg-card-machina border border-border-machina p-4 relative font-mono rounded-[2px] shadow-none flex flex-col justify-between select-none">
          <div className="flex justify-between items-center text-[8.5px] text-zinc-500 font-extrabold uppercase">
            <span>PPE SIGMA CHECKS</span>
            <ShieldAlert size={10} className="text-zinc-500" />
          </div>
          <span className="text-2xl font-black text-emerald-400 block mt-2 font-mono">
            {stats.safetyLogs}
          </span>
          <span className="text-[7.5px] text-emerald-400 mt-1.5 uppercase font-bold block">// OP CV MATRIX APPROVALS</span>
        </div>

        {/* Maintenance */}
        <div className="bg-card-machina border border-border-machina p-4 relative font-mono rounded-[2px] shadow-none flex flex-col justify-between select-none">
          <div className="flex justify-between items-center text-[8.5px] text-zinc-500 font-extrabold uppercase">
            <span>MAINT INTERVALS</span>
            <Activity size={10} className="text-zinc-500" />
          </div>
          <span className="text-2xl font-black text-amber-500 block mt-2 font-mono">
            {stats.maintenanceLogs}
          </span>
          <span className="text-[7.5px] text-amber-500 mt-1.5 uppercase font-bold block">// COUPLER CORRECTIONS</span>
        </div>

        {/* Alarms Clearances */}
        <div className="bg-card-machina border border-border-machina p-4 relative font-mono rounded-[2px] shadow-none flex flex-col justify-between col-span-2 lg:col-span-1 select-none">
          <div className="flex justify-between items-center text-[8.5px] text-zinc-500 font-extrabold uppercase">
            <span>MUTED HAZARDS</span>
            <AlertOctagon size={10} className="text-zinc-500" />
          </div>
          <span className="text-2xl font-black text-violet-400 block mt-2 font-mono">
            {stats.alarmLogs}
          </span>
          <span className="text-[7.5px] text-violet-400 mt-1.5 uppercase font-bold block">// SQUELCH MANUAL LOGS</span>
        </div>
      </div>

      {/* 3. Main Bento Filtering & Audit Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono text-[10px]">

        {/* Left Interactive Flow (Search, Filter, Log Stack) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col">
          <div className="bg-card-machina border border-border-machina p-4 font-mono space-y-3.5 rounded-[2px] select-none">
            <span className="text-[8px] text-accent-machina font-black uppercase tracking-widest block">// GRID SEARCH CONTROLLERS:</span>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search keywords */}
              <div className="relative md:col-span-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="SEARCH KEYWORDS..."
                  className="w-full bg-[#0d0d0b] border border-border-machina px-8 py-2 text-[9.5px] font-black focus:border-accent-machina focus:outline-none uppercase rounded-[1.5px] text-text-primary placeholder:text-zinc-600"
                />
                <Search size={11} className="absolute left-2.5 top-3 text-zinc-500" strokeWidth={2.5} />
              </div>

              {/* Filter by category category */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#0d0d0b] border border-border-machina px-2.5 py-2 text-[9.5px] font-black focus:border-accent-machina focus:outline-none uppercase cursor-pointer rounded-[1.5px] text-text-primary"
                >
                  <option value="ALL">ALL LOG CATEGORIES</option>
                  <option value="AUTHENTICATION">AUTHENTICATION</option>
                  <option value="SAFETY_SCAN">SAFETY SCAN</option>
                  <option value="ALARM_CLEARANCE">ALARM CLEARANCE</option>
                  <option value="EQUIPMENT_MAINTENANCE">MAINTENANCE</option>
                  <option value="WORKER_REGISTRATION">REGISTRIES</option>
                  <option value="COPILOT">COPILOT EVENTS</option>
                  <option value="ATTENDANCE">SHIFT ATTENDANCE</option>
                  <option value="SYSTEM_RESET">SYSTEM REALLOCATION</option>
                </select>
              </div>

              {/* Filter by Worker role (Only visible for non-worker tiers) */}
              <div>
                {user.role === "Worker" ? (
                  <button
                    disabled
                    className="w-full bg-[#0d0d0b]/40 border border-border-machina/60 opacity-60 text-zinc-500 text-[9.5px] py-2 font-black uppercase tracking-wide cursor-not-allowed rounded-[1.5px] text-center"
                  >
                    LOCKED PRIVATE VIEW
                  </button>
                ) : (
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    className="w-full bg-[#0d0d0b] border border-border-machina px-2.5 py-2 text-[9.5px] font-black focus:border-accent-machina focus:outline-none uppercase cursor-pointer rounded-[1.5px] text-text-primary"
                  >
                    <option value="ALL">ALL OPERATIVE ROLES</option>
                    <option value="Admin">ADMIN ROLE</option>
                    <option value="Manager">MANAGER ROLE</option>
                    <option value="Worker">WORKER ROLE</option>
                    <option value="Viewer">VIEWER ROLE</option>
                  </select>
                )}
              </div>
            </div>

            {/* Clear Filters alert ribbon */}
            {(searchTerm || selectedCategory !== "ALL" || selectedRoleFilter !== "ALL") && (
              <div className="flex justify-between items-center text-[8.5px] uppercase pt-1.5 border-t border-border-machina/30">
                <span className="text-zinc-500 font-bold">
                  Matched <strong className="text-accent-machina">{filteredLogs.length}</strong> subset entries.
                </span>
                <button
                  onClick={clearFilters}
                  className="text-red-400 bg-none border-none p-0 cursor-pointer hover:underline uppercase font-extrabold"
                >
                  Clear filter flags
                </button>
              </div>
            )}
          </div>

          {/* List display stack */}
          <IndustrialWidget
            title="SYSTEM TIME SHIFT TRANSACTION STACK"
            subtitle={`${filteredLogs.length} matching indices in cache memory`}
          >
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredLogs.map((log) => {
                const isSelected = activeLog?.id === log.id;
                const catTheme = getCategoryTheme(log.category);
                
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`p-3.5 border transition-all cursor-pointer text-left select-none relative rounded-[1.5px] ${
                      isSelected 
                        ? "bg-hover-machina border-accent-machina" 
                        : "bg-[#0c0c0a] border-border-machina/80 hover:border-zinc-500"
                    }`}
                  >
                    {/* Active brass bar for highlights */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-machina"></div>
                    )}

                    <div className="flex justify-between items-start gap-1 pb-1 border-b border-border-machina/30 mb-2">
                      <span className={`text-[7.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 select-none border rounded-[1px] ${catTheme}`}>
                        {log.category}
                      </span>
                      <span className="text-[8px] text-zinc-500 font-bold select-none">
                        {log.timestamp.slice(11, 19)} • {log.timestamp.slice(0, 10)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="block font-black text-text-primary uppercase text-[10.5px]">
                          {log.title}
                        </span>
                        <p className="text-text-secondary text-[9px] line-clamp-1 uppercase leading-normal">
                          {log.description}
                        </p>
                      </div>
                      <ChevronRight size={13} className={`text-zinc-600 transition-transform ${isSelected ? "text-accent-machina translate-x-1" : ""}`} />
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-border-machina/20 text-[7.5px] text-zinc-500 font-bold">
                      <span className="flex items-center gap-1">
                        <User size={8} /> {log.workerName.toUpperCase()}
                      </span>
                      <span>•</span>
                      <span>ROLE: {log.role.toUpperCase()}</span>
                      <span>•</span>
                      <span>ID: {log.id.slice(-6).toUpperCase()}</span>
                    </div>
                  </div>
                );
              })}

              {filteredLogs.length === 0 && (
                <div className="text-center py-20 text-zinc-600 uppercase">
                  <History size={16} className="mx-auto text-zinc-600 mb-2.5 opacity-60 animate-spin-slow" />
                  No action matching keys in current directory memory.
                </div>
              )}
            </div>
          </IndustrialWidget>
        </div>

        {/* Right Detail Analyzer (Inspector card & Manual Log) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Detailed Inspector Panel */}
          <IndustrialWidget
            title="LENS METADATA INSPECTOR (DIAG)"
            subtitle="Deep cryptographic matrix log trace"
          >
            {activeLog ? (
              <div className="space-y-4">
                
                {/* Visual state headers */}
                <div className="p-4 bg-zinc-950 border border-border-machina/50 flex flex-col justify-between align-middle bg-[radial-gradient(ellipse_at_top,rgba(196,164,132,0.06)_0%,transparent_100%)] rounded-[2px] relative select-none">
                  <div className="absolute top-1.5 right-2 font-mono text-[7px] text-zinc-600 uppercase font-black tracking-widest">// LEDGER HEX SECURITY</div>
                  
                  <div className="space-y-1.5">
                    <span className="text-[7.5px] text-accent-machina font-black tracking-widest uppercase">// PHYSICAL HARDWARE LOG ADDRESS</span>
                    <h4 className="text-sm font-black text-text-primary uppercase leading-tight tracking-wider">
                      {activeLog.title}
                    </h4>
                  </div>
                </div>

                {/* Grid metrics */}
                <div className="grid grid-cols-2 gap-3.5 text-[8.5px] uppercase font-mono">
                  <div className="p-2.5 bg-bg-machina border border-border-machina rounded-[1px]">
                    <span className="text-zinc-500 font-black block">CLOCK STACK INDEX:</span>
                    <span className="text-text-primary font-bold block mt-1 break-all select-all">{activeLog.id}</span>
                  </div>

                  <div className="p-2.5 bg-bg-machina border border-border-machina rounded-[1px]">
                    <span className="text-zinc-500 font-black block">GMT RECORD DATE:</span>
                    <span className="text-text-primary font-bold block mt-1">{activeLog.timestamp.slice(0, 10)} @ {activeLog.timestamp.slice(11, 19)}</span>
                  </div>

                  <div className="p-2.5 bg-bg-machina border border-border-machina rounded-[1px]">
                    <span className="text-zinc-500 font-black block">AUTHOR DISPATCHER:</span>
                    <span className="text-accent-machina font-bold block mt-1 truncate">{activeLog.workerName}</span>
                  </div>

                  <div className="p-2.5 bg-bg-machina border border-border-machina rounded-[1px]">
                    <span className="text-zinc-500 font-black block">CORPORATE EMAIL:</span>
                    <span className="text-text-primary font-bold block mt-1 truncate select-all">{activeLog.userEmail}</span>
                  </div>
                </div>

                <div className="space-y-2 uppercase">
                  <span className="text-[8px] text-zinc-500 font-black tracking-widest block">// EXPLICIT LOG DETAILS Context:</span>
                  <div className="p-4 bg-zinc-950 border border-border-machina/50 leading-relaxed text-[10px] text-text-primary text-justify font-mono uppercase bg-[radial-gradient(100%_100%_at_0%_0%,rgba(0,120,80,0.02)_0%,transparent_100%)] rounded-[2px]">
                    {activeLog.description}
                  </div>
                </div>

                <div className="p-3 bg-card-machina border border-border-machina/60 flex items-center gap-3 rounded-[2.5px] text-[8.5px]">
                  <div className="w-4 h-4 shrink-0 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-900 flex items-center justify-center font-bold">✓</div>
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-[#C4A484] block">INTEGRITY BLOCK ATTESTED</span>
                    <p className="text-zinc-500 leading-normal">
                      COBALT SECURE SIG-109 REVISION REGISTERED IN HARD DIRECTORY MEMORY.
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-20 text-zinc-600 uppercase select-none">
                <Sliders size={18} className="mx-auto text-zinc-600 mb-2 opacity-60" />
                Select incident track vector to inspect binary parameters
              </div>
            )}
          </IndustrialWidget>

          {/* Manual Entry Form - limited strictly to Manager / Admin roles to avoid Worker unauthorized tampering */}
          {(user.role === "Admin" || user.role === "Manager") ? (
            <form onSubmit={handleAddManualLog} className="bg-card-machina border border-border-machina p-5 relative rounded-[3px] space-y-3.5 select-none">
              <div className="screw screw-tl"></div>
              <div className="screw screw-tr"></div>
              <div className="screw screw-bl"></div>
              <div className="screw screw-br"></div>

              <div className="flex justify-between items-center border-b border-border-machina/60 pb-1.5">
                <span className="text-accent-machina font-black uppercase tracking-wider text-[9px] block">// INJECT AUDIT LEDGER TRANSACTION</span>
                <span className="bg-red-950 text-red-400 border border-red-900 px-1.5 py-0.2 rounded-[1.5px] font-black uppercase text-[7.5px] leading-none select-none">
                  ROOT PRIVILEGES
                </span>
              </div>

              {entryStatus && (
                <div className={`p-3 border rounded-[1.5px] text-[8.5px] font-bold font-mono uppercase ${
                  entryStatus.startsWith("ERR") 
                    ? "bg-red-950/40 text-red-400 border-red-900/60" 
                    : "bg-emerald-950/40 text-emerald-400 border-emerald-900/60"
                }`}>
                  {entryStatus}
                </div>
              )}

              <div className="space-y-3 font-mono text-[9px]">
                
                {/* Select log category type */}
                <div>
                  <label className="block text-zinc-500 uppercase font-black mb-1">LEDGER CATEGORY TARGET</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as any)}
                    className="w-full bg-[#0c0c0a] border border-border-machina px-2.5 py-1.5 select-none focus:outline-none focus:border-accent-machina rounded-[1px] text-[9.5px] font-bold text-text-primary uppercase cursor-pointer"
                  >
                    <option value="EQUIPMENT_MAINTENANCE">EQUIPMENT MAINTENANCE</option>
                    <option value="SAFETY_SCAN">SAFETY COMPLIANCE SCAN</option>
                    <option value="ALARM_CLEARANCE">ALARM RE-ACTIVATION CLEARANCE</option>
                    <option value="SYSTEM_RESET">SYSTEM REALLOCATION FLUSH</option>
                  </select>
                </div>

                {/* Entry Title */}
                <div>
                  <label className="block text-zinc-500 uppercase font-black mb-1">ACTION HEADER (TITLE)</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="E.G. CALIBRATED COUPLING SHAFT REPAIR VALVES"
                    className="w-full bg-[#0c0c0a] border border-border-machina px-2.5 py-1.5 focus:outline-none focus:border-accent-machina rounded-[1.5px] text-[9.5px] font-bold text-text-primary placeholder:text-zinc-700 uppercase"
                    maxLength={60}
                    required
                  />
                </div>

                {/* Entry details context */}
                <div>
                  <label className="block text-zinc-500 uppercase font-black mb-1">SUMMARY CONTEXT (DESCRIPTION)</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="E.G. TECHNICAL SWELL INTENSITY MITIGATED FROM AXIAL METADATA COUPLING. SEAL GREASE RATED NORMAL SHIELD OVER PRESSURE COMPRESSORS."
                    className="w-full bg-[#0c0c0a] border border-border-machina px-2.5 py-1.5 focus:outline-none focus:border-accent-machina rounded-[1.5px] text-[9.5px] font-bold text-text-primary placeholder:text-zinc-700 uppercase h-16 resize-none"
                    maxLength={300}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-accent-machina text-bg-machina hover:bg-white text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors select-none text-center rounded-[1.5px] flex items-center justify-center gap-1.5"
                >
                  <Plus size={11} strokeWidth={3} />
                  Inject Transaction
                </button>

              </div>
            </form>
          ) : (
            <div className="bg-card-machina border border-border-machina/60 p-4 font-mono text-[8.5px] rounded-[3px] select-none text-zinc-500 space-y-1">
              <span className="block font-black uppercase text-zinc-400">// SECURITY MEMORY ACCESS NOTICE:</span>
              <p className="leading-relaxed">
                AS FLOORSPEC OPERATIVE, THE FACILITY GATEWAY AUTOMATICALLY REVOKES ACCESS TO INTERNAL MANUAL INJECTORS TO PREVENT RECORD TAMPERING. YOUR ACTIONS ARE REGISTERED DIRECTLY TO TERMINAL CONSOLES.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
