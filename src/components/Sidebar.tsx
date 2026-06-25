import React, { useEffect, useMemo, useState, useRef } from "react";
import { useStore } from "../store/useStore";
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Wrench, 
  LineChart, 
  Radio, 
  FileText, 
  AlertTriangle, 
  Cpu, 
  Settings, 
  Lock,
  Compass,
  Boxes,
  Binary,
  Calendar,
  Landmark,
  History,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Upload,
  Camera,
  User,
  UserCheck,
  UserX,
  Activity,
  Fingerprint,
  Clock,
  X,
  Briefcase
} from "lucide-react";

export default function Sidebar() {
  const { 
    user, 
    activeTab, 
    setActiveTab, 
    incidents, 
    setUser, 
    isSidebarCollapsed, 
    setIsSidebarCollapsed,
    attendance,
    updateUser,
    punchInWorker,
    punchOutWorker
  } = useStore();

  const [showProfilePortal, setShowProfilePortal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Non-persistent temporary profile states
  const [tempName, setTempName] = useState(user.full_name);
  const [tempPosition, setTempPosition] = useState(user.position || "");
  const [tempAvatar, setTempAvatar] = useState(user.avatar_url || "");

  useEffect(() => {
    if (showProfilePortal && user) {
      setTempName(user.full_name);
      setTempPosition(user.position || "");
      setTempAvatar(user.avatar_url || "");
    }
  }, [showProfilePortal, user]);

  const allMenuItems = [
    { id: "dashboard", label: "DASHBOARD", icon: LayoutDashboard, roles: ["Admin", "Manager", "Worker", "Viewer"] },
    { id: "safety", label: "SAFETY PORTAL", icon: ShieldAlert, roles: ["Admin", "Manager", "Worker"] },
    { id: "attendance", label: "SHIFT ATTENDANCE", icon: Calendar, roles: ["Admin", "Manager", "Worker"] },
    { id: "history", label: "FACILITY LOGS", icon: History, roles: ["Admin", "Manager", "Worker", "Viewer"] },
    { id: "maintenance", label: "PREDICTIVE MAIN", icon: Wrench, roles: ["Admin", "Manager"] },
    { id: "model_explorer", label: "MODEL EXPLORER", icon: Binary, roles: ["Admin", "Manager"] },
    { id: "analytics", label: "DEEP ANALYTICS", icon: LineChart, roles: ["Admin", "Manager"] },
    { id: "twin", label: "DIGITAL TWIN", icon: Radio, roles: ["Admin", "Manager", "Viewer"] },
    { id: "reports", label: "COMPLIANCE", icon: FileText, roles: ["Admin", "Manager"] },
    { id: "alerts", label: "ALERTS CENTER", icon: AlertTriangle, roles: ["Admin", "Manager", "Worker"], count: () => incidents.filter(i => !i.acknowledged).length },
    { id: "copilot", label: "COGNITIVE COPILOT", icon: Cpu, roles: ["Admin", "Manager", "Worker", "Viewer"] },
    { id: "staff_mgmt", label: "STAFF DECK", icon: Landmark, roles: ["Admin", "Manager"] },
    { id: "settings", label: "SYSTEM SETTINGS", icon: Settings, roles: ["Admin", "Manager", "Worker", "Viewer"] },
  ];

  if (!user) return null;

  // Filter menu items by active role permission keys (memoized to prevent render loops)
  const menuItems = useMemo(() => {
    return allMenuItems.filter(item => item.roles.includes(user.role));
  }, [user.role]);

  // Redirect if current active tab is unauthorized for current login role
  useEffect(() => {
    const isAuthorized = menuItems.some(item => item.id === activeTab);
    if (!isAuthorized && menuItems.length > 0) {
      setActiveTab(menuItems[0].id);
    }
  }, [user.role, activeTab, menuItems, setActiveTab]);

  // Automatically verify if logged in operator is marked present (has an active shift)
  const isPresent = useMemo(() => {
    return attendance.some(a => a.userEmail === user.email && a.status === "active");
  }, [attendance, user.email]);

  const activeShift = useMemo(() => {
    return attendance.find(a => a.userEmail === user.email && a.status === "active");
  }, [attendance, user.email]);

  // Handle Display Picture base64 upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setTempAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <>
      <aside 
        id="factory-sidebar" 
        className={`bg-card-machina border-r border-border-machina flex flex-col justify-between h-screen fixed left-0 top-0 z-50 select-none transition-all duration-300 ${isSidebarCollapsed ? "w-0 -translate-x-full border-r-0 opacity-0 pointer-events-none" : "w-[280px]"}`}
      >
        {/* Sidebar Header Plate */}
        <div className="p-4 flex flex-col border-b border-border-machina bg-bg-machina relative shrink-0">
          <div className="absolute top-1.5 right-2 text-[7px] font-mono text-text-secondary">SYS-807-PRT</div>
          
          <div className="border border-border-machina p-2 bg-card-machina text-center relative flex items-center justify-center min-h-[58px]">
            {/* Machine Rivets */}
            <div className="screw screw-tl"></div>
            <div className="screw screw-tr"></div>
            <div className="screw screw-bl"></div>
            <div className="screw screw-br"></div>
            
            {isSidebarCollapsed ? (
              <span className="text-text-primary font-bebas text-2xl tracking-widest font-black uppercase">
                F-G
              </span>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-text-primary font-bebas text-3xl tracking-[0.16em] font-black uppercase leading-none">
                  FACTORYGPT
                </span>
                <span className="text-[8px] text-accent-machina font-mono tracking-[0.2em] uppercase block mt-1 font-bold">
                  OPERATING SYSTEM
                </span>
              </div>
            )}
          </div>

          {/* Toggle Button on bottom edge of header frame */}
          {!isSidebarCollapsed && (
            <button 
              onClick={toggleSidebarCollapse}
              className="absolute -right-3 top-7 bg-bg-machina hover:bg-hover-machina border border-border-machina p-1 rounded-full text-text-secondary hover:text-text-primary transition-colors cursor-pointer z-50 shadow-md"
              title="Collapse Command Dock"
            >
              <ChevronLeft size={11} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            const alarmCount = item.count ? item.count() : 0;

            return (
              <React.Fragment key={item.id}>
                {/* Horizontal Mechanical separator index lines */}
                {!isSidebarCollapsed && (index === 3 || index === 6) && (
                  <div className="my-3 flex items-center justify-center px-1">
                    <div className="w-full h-[1px] bg-border-machina border-b border-[#0F0F0D]"></div>
                  </div>
                )}

                <button
                  id={`nav-item-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-none text-xs tracking-[0.18em] font-sans font-black transition-all duration-150 cursor-pointer text-left relative group-hover:bg-hover-machina/60 ${
                    isSidebarCollapsed ? "justify-center py-3.5 px-0" : "justify-between px-3.5 py-3"
                  } ${
                    isActive
                      ? "bg-hover-machina text-accent-machina"
                      : "text-text-secondary hover:bg-hover-machina/40 hover:text-text-primary"
                  }`}
                >
                  {/* Brass state indicator slider */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-machina" style={{ borderRight: "1px solid #0F0F0D" }}></div>
                  )}

                  <div className="flex items-center gap-3">
                    <IconComponent
                      size={14}
                      className={`shrink-0 transition-all ${isActive ? "text-accent-machina" : "text-text-secondary group-hover:text-text-primary"}`}
                      strokeWidth={2.5}
                    />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  
                  {!isSidebarCollapsed && alarmCount > 0 && (
                    <span className="bg-danger-machina text-white text-[9px] px-2 py-0.5 border border-border-machina font-mono font-bold leading-none shrink-0">
                      {alarmCount}
                    </span>
                  )}

                  {isSidebarCollapsed && alarmCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger-machina border border-bg-machina" />
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Heavy Mechanical Operator Badge (Collapsible and click to open Portal) */}
        <div className={`p-4 border-t border-border-machina bg-bg-machina flex flex-col gap-3 relative shrink-0`}>
          <div className="screw screw-tl"></div>
          <div className="screw screw-tr"></div>
          
          {isSidebarCollapsed ? (
            <button
              onClick={() => setShowProfilePortal(true)}
              className="relative mx-auto w-10 h-10 border border-border-machina bg-card-machina/80 hover:border-accent-machina/80 p-0.5 rounded-[1px] cursor-pointer group transition-all"
              title="Operative Profile Portal"
            >
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.full_name} 
                  className="w-full h-full object-cover filter brightness-[0.85] contrast-[1.1] grayscale-[20%]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center font-black text-accent-machina text-sm font-sans tracking-tighter">
                  {user.full_name.slice(0, 2).toUpperCase()}
                </div>
              )}
              {/* Active attendance state dot */}
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-bg-machina rounded-full ${
                isPresent ? "bg-emerald-400" : "bg-zinc-500"
              }`} />
            </button>
          ) : (
            <div className="space-y-3">
              {/* Clickable Card Body opening Portal */}
              <button 
                onClick={() => setShowProfilePortal(true)}
                className="w-full text-left bg-card-machina border border-border-machina p-3 hover:border-zinc-700 transition-colors cursor-pointer block relative group"
              >
                <div className="absolute top-1 right-1 text-[7px] text-zinc-500 font-bold tracking-widest uppercase">
                  META
                </div>
                
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 border border-border-machina bg-bg-machina overflow-hidden relative">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt="DP" 
                        className="w-full h-full object-cover filter brightness-[0.85] contrast-[1.1]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center font-mono font-black text-[10px] text-accent-machina">
                        {user.full_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {/* Tiny visual attendance light */}
                    <span className={`absolute bottom-0 right-0 w-2 h-2 border border-bg-machina rounded-full ${
                      isPresent ? "bg-emerald-400" : "bg-zinc-500"
                    }`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-text-primary font-black uppercase tracking-wider truncate font-sans group-hover:text-accent-machina transition-colors">
                      {user.full_name}
                    </p>
                    <span className="text-[8px] text-zinc-400 font-mono  uppercase block tracking-wider truncate">
                      {user.position || user.role}
                    </span>
                  </div>
                </div>

                {/* Interactive State Bar inside summary */}
                <div className="mt-2 pt-2 border-t border-border-machina/60 flex items-center justify-between text-[8px] font-mono">
                  <span className="text-text-secondary">DUTY STATUS:</span>
                  <span className={isPresent ? "text-emerald-400 font-bold" : "text-zinc-500 font-bold"}>
                    {isPresent ? "PRESENT (ON SHIFT)" : "ABSENT (STANDBY)"}
                  </span>
                </div>
              </button>

              <button
                id="btn-logout-advanced-toggle"
                onClick={() => setShowProfilePortal(true)}
                className="w-full py-2 bg-zinc-950 hover:bg-[#8f3227] hover:text-white border border-border-machina text-[9px] font-mono tracking-[0.16em] uppercase transition-all duration-150 cursor-pointer text-center font-bold flex items-center justify-center gap-1.5"
              >
                <LogOut size={10} />
                <span>OPERATIVE SYSTEM CONTROL</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Advanced Logout System and Operator Profile Portal Overlay */}
      {showProfilePortal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div 
            className="w-full max-w-lg bg-[#0B0B0A] border-2 border-border-machina p-6 relative font-mono text-xs text-text-primary shadow-[0_8px_32px_rgba(0,0,0,0.95)]"
            id="advanced-profile-modal"
          >
            {/* Structural Rivets */}
            <div className="screw screw-tl"></div>
            <div className="screw screw-tr"></div>
            <div className="screw screw-bl"></div>
            <div className="screw screw-br"></div>

            {/* Header Plate block */}
            <div className="flex items-center justify-between border-b border-border-machina pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-accent-machina/10 border border-accent-machina/35 text-accent-machina rounded-[1px]">
                  <Fingerprint size={16} />
                </span>
                <div>
                  <h2 className="text-sm font-black tracking-widest uppercase text-text-primary">
                    OPERATIVE TERMINAL COUPLING HUB
                  </h2>
                  <p className="text-[8px] text-zinc-400">SESSION ID: SESS-CR12-W807 · SECURE RFID VERIFIED</p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowProfilePortal(false)}
                className="p-1 hover:bg-hover-machina border border-transparent hover:border-border-machina text-zinc-400 hover:text-text-primary transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Main Interactive Matrix Layout */}
            <div className="space-y-4">
              
              {/* Row 1: Avatar Upload & Identity Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                
                {/* DP / Image Upload block */}
                <div className="text-center sm:text-left flex flex-col items-center p-4 border border-border-machina bg-zinc-950/80 relative">
                  <div className="text-[7px] text-zinc-500 uppercase tracking-widest mb-2 font-black">
                    DISPLAY PICTURE
                  </div>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 border border-border-machina bg-bg-machina hover:border-accent-machina transition-colors cursor-pointer overflow-hidden relative group"
                    title="Click to select standard identification photo"
                  >
                    {tempAvatar ? (
                      <img 
                        src={tempAvatar} 
                        alt="Interactive Profile DP" 
                        className="w-full h-full object-cover filter brightness-[0.8] contrast-[1.1]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-900/60 flex flex-col items-center justify-center font-sans">
                        <User size={32} className="text-zinc-600 group-hover:text-accent-machina transition-colors mb-1" />
                        <span className="text-[8px] text-zinc-500 font-bold font-mono">EMPTY PROFILE</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                      <Camera size={16} className="text-accent-machina mb-1" />
                      <span className="text-[7.5px] font-black text-white px-1 text-center font-mono leading-none tracking-tight">
                        REPLACE DP
                      </span>
                    </div>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-card-machina hover:bg-hover-machina border border-border-machina text-[9px] font-bold text-text-primary transition-all cursor-pointer rounded-[2px]"
                  >
                    <Upload size={10} />
                    <span>CHOOSE FILE</span>
                  </button>
                  <p className="text-[7px] text-zinc-500 mt-1.5 leading-normal text-center">Drag files or click frame bounds above.</p>
                </div>

                {/* Identity Input fields edit */}
                <div className="sm:col-span-2 space-y-3.5 p-4 border border-border-machina bg-zinc-950/40">
                  <div className="space-y-1">
                    <label className="text-[8px] text-zinc-400 font-black tracking-widest uppercase flex items-center gap-1">
                      <User size={10} />
                      <span>OPERATIVE IDENTITY FULL NAME</span>
                    </label>
                    <input 
                      type="text" 
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full p-2 bg-[#050505] border border-border-machina text-xs outline-none text-text-primary font-bold focus:border-accent-machina"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-black tracking-widest uppercase flex items-center justify-between gap-1">
                        <span className="flex items-center gap-1">
                          <Briefcase size={10} />
                          <span>ROLE LEVEL</span>
                        </span>
                        <span className="text-[7px] text-[#A8463B] bg-[#A8463B]/10 border border-[#A8463B]/30 px-1 font-mono tracking-tight font-black flex items-center gap-0.5">
                          🔒 SYSTEM-ENFORCED
                        </span>
                      </label>
                      <select
                        value={user.role}
                        disabled={true}
                        className="w-full p-2 bg-[#050505] border border-border-machina text-xs outline-none text-text-primary font-bold text-accent-machina focus:border-accent-machina disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-zinc-950/90 disabled:text-zinc-500"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Worker">Worker</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] text-zinc-400 font-black tracking-widest uppercase flex items-center justify-between">
                        <span>SPECIFIC ASSIGNMENT</span>
                        {(user.role === "Worker" || user.role === "Viewer") ? (
                          <span className="text-[7px] text-[#A8463B] bg-[#A8463B]/10 border border-[#A8463B]/30 px-1 font-mono tracking-tight font-black flex items-center gap-0.5">
                            🔒 READ-ONLY
                          </span>
                        ) : (
                          <span className="text-[7px] text-zinc-500 font-mono tracking-tight font-black">
                            🔧 EDITABLE
                          </span>
                        )}
                      </label>
                      <input 
                        type="text" 
                        value={tempPosition}
                        placeholder="e.g. Lead Control Specialist"
                        onChange={(e) => setTempPosition(e.target.value)}
                        disabled={user.role === "Worker" || user.role === "Viewer"}
                        className="w-full p-2 bg-[#050505] border border-border-machina text-xs outline-none text-text-primary font-bold focus:border-accent-machina placeholder-zinc-700 disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-zinc-950/90 disabled:text-zinc-500"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Row 2: Live Shift Attendance automatic verification status board */}
              <div className="border border-border-machina bg-[#0D0D0C] p-4">
                <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest block mb-1.5">
                  SHIFT ATTENDANCE VERIFICATION LEDGER
                </span>
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-zinc-950 border border-border-machina/65">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-[2px] ${
                      isPresent ? "bg-emerald-950/50 border border-emerald-800 text-emerald-400" : "bg-neutral-900 border border-border-machina text-zinc-500"
                    }`}>
                      {isPresent ? <UserCheck size={18} /> : <UserX size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-primary font-black uppercase">
                          STATUS: {isPresent ? "PRESENT & SIGNED-IN" : "ABSENT / STANDBY"}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                      </div>
                      <p className="text-[8px] text-zinc-400 leading-normal max-w-[280px]">
                        {isPresent 
                          ? `Currently verified. RFID tag punched in at ${activeShift?.punchIn.slice(11, 19)} verified by shift registry database.` 
                          : "Device ledger shows lack of active RFID shift keys. Operative is signed out from shift logbooks."}
                      </p>
                    </div>
                  </div>

                  {/* Manual Override control inside Advanced Disconnect Hub */}
                  <button
                    onClick={() => {
                      if (isPresent) {
                        punchOutWorker(user.email);
                      } else {
                        punchInWorker(user.email, user.full_name);
                      }
                    }}
                    className={`px-3 py-2 border font-mono text-[9px] font-black tracking-wider transition-colors cursor-pointer shrink-0 rounded-[1px] uppercase ${
                      isPresent 
                        ? "bg-zinc-950 border-danger-machina text-danger-machina hover:bg-danger-machina/10" 
                        : "bg-accent-machina text-bg-machina border-accent-machina hover:bg-white"
                    }`}
                  >
                    {isPresent ? "Punch Out Shift" : "Punch In Shift"}
                  </button>
                </div>
              </div>

              {/* Row 3: Security Clearances Details */}
              <div className="grid grid-cols-2 gap-3.5 text-[9.5px]">
                <div className="p-3 bg-zinc-950 border border-border-machina space-y-1">
                  <span className="text-zinc-500 text-[8px] font-black uppercase">GATE ACCESS LEVEL</span>
                  <div className="text-text-primary font-bold uppercase flex items-center gap-1.5">
                    <span className="text-accent-machina font-black">INDEX L-3</span>
                    <span>· SECURE ENFORCER</span>
                  </div>
                </div>
                <div className="p-3 bg-zinc-950 border border-border-machina space-y-1">
                  <span className="text-zinc-500 text-[8px] font-black uppercase font-mono">AUTHORIZED COUPLING CHANNELS</span>
                  <span className="text-text-primary block font-bold leading-tight truncate uppercase">
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Row 4: Compliance Documentation */}
              <div className="p-3 bg-zinc-950 border border-border-machina space-y-1">
                <span className="text-zinc-500 text-[8px] font-black uppercase block">OPERATIVE PRIVACY & COMPLIANCE AGREEMENT</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-mono text-zinc-400 pt-0.5 select-none">
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("factorygpt-open-privacy"))}
                    className="hover:text-accent-machina hover:underline font-bold uppercase cursor-pointer text-left"
                  >
                    🔒 PRIVACY POLICY
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("factorygpt-open-terms"))}
                    className="hover:text-accent-machina hover:underline font-bold uppercase cursor-pointer text-left"
                  >
                    ⚖️ TERMS OF SERVICE
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("factorygpt-open-preferences"))}
                    className="hover:text-accent-machina hover:underline font-bold uppercase cursor-pointer text-left"
                  >
                    🍪 COOKIES
                  </button>
                </div>
              </div>

            </div>

            {/* Heavy Tactical disconnect buttons */}
            <div className="mt-6 pt-4 border-t border-border-machina flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  updateUser({
                    full_name: tempName,
                    position: tempPosition,
                    avatar_url: tempAvatar,
                  });
                  setShowProfilePortal(false);
                }}
                className="flex-1 py-3 bg-accent-machina text-bg-machina hover:bg-white border border-border-machina font-mono text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer text-center"
              >
                SAVE REIFIED CHANGES
              </button>

              <button
                onClick={() => {
                  setUser(null);
                  setShowProfilePortal(false);
                }}
                className="py-3 px-4 bg-danger-machina text-white hover:bg-[#8f3227] border border-border-machina font-mono text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer text-center"
              >
                LOGOUT
              </button>
              
              <button
                onClick={() => setShowProfilePortal(false)}
                className="py-3 px-4 bg-zinc-900 border border-border-machina hover:border-zinc-700 text-[9px] font-black tracking-widest font-mono text-center uppercase cursor-pointer"
              >
                DISMISS HUD
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
