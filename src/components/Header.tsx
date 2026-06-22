import React, { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { Wifi, WifiOff, Bell, BellOff, ShieldAlert, Volume2, VolumeX, Mic, Menu } from "lucide-react";
import { alarmEngine } from "../lib/audio";
import VoiceCommandInterface from "./VoiceCommandInterface";

export default function Header() {
  const { user, mode, setMode, incidents, activeTab, isSidebarCollapsed, setIsSidebarCollapsed } = useStore();
  const [time, setTime] = useState(new Date());
  const [isMuted, setIsMuted] = useState(alarmEngine.getIsMuted());
  const [showVoiceConsole, setShowVoiceConsole] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  const pendingAlarms = incidents.filter((x) => !x.acknowledged);

  const handleSpeakerClick = () => {
    // Explicit user gesture unlocks standard browser AudioContext security sandbox
    alarmEngine.armSpeaker();
    const mutedStatus = alarmEngine.toggleMute();
    setIsMuted(mutedStatus);
  };

  return (
    <header id="factory-header" className={`h-16 border-b border-border-machina bg-card-machina px-8 flex items-center justify-between fixed top-0 right-0 ${isSidebarCollapsed ? "left-0" : "left-[280px]"} z-40 select-none transition-all duration-300`}>
      {/* Tab Title Area */}
      <div className="flex items-center gap-3">
        {isSidebarCollapsed && (
          <button
            id="btn-sidebar-recover-open"
            onClick={() => setIsSidebarCollapsed(false)}
            className="flex items-center justify-center p-2 bg-bg-machina border border-accent-machina text-accent-machina hover:bg-hover-machina transition-colors cursor-pointer rounded-[1px] shadow-[0_0_8px_rgba(235,94,85,0.1)] mr-1"
            title="Open Command Console Dock (Menu)"
          >
            <Menu size={14} />
          </button>
        )}
        <h1 className="text-text-primary font-sans text-xs tracking-[0.25em] uppercase font-black">
          {activeTab.replace("-", " ")}
        </h1>
        <span className="text-[9px] font-mono text-accent-machina bg-bg-machina border border-border-machina px-2 py-0.5 font-bold uppercase tracking-wider">
          MASTER_CONSOLE
        </span>

        {/* Dynamic Connected vs Offline gorgeous status pills */}
        <div className="hidden lg:flex items-center gap-2 ml-4 font-mono text-[9px] font-bold uppercase">
          {mode === "connected" ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-800/80 rounded-[2px] animate-pulse">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
              <span>[SECURE COBALT IP GATEWAY LINKED]</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-950/40 text-amber-400 border border-amber-800/80 rounded-[2px]">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></span>
              <span>[OFFLINE CLIENT TELEMETRY STREAM]</span>
            </div>
          )}
        </div>
      </div>

      {/* Metric controls and toggle mode */}
      <div className="flex items-center gap-6">
        {/* Connection Toggle */}
        <div className="flex items-center gap-1.5 border border-border-machina p-1 bg-bg-machina">
          <button
            id="toggle-mode-demo"
            onClick={() => setMode("demo")}
            className={`px-3 py-1 text-[9px] font-mono tracking-widest uppercase cursor-pointer font-bold ${
              mode === "demo"
                ? "bg-hover-machina text-accent-machina border border-border-machina"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Offline Sim
          </button>
          <button
            id="toggle-mode-connected"
            onClick={() => setMode("connected")}
            className={`px-3 py-1 text-[9px] font-mono tracking-widest uppercase cursor-pointer flex items-center gap-1.5 font-bold ${
              mode === "connected"
                ? "bg-hover-machina text-accent-machina border border-border-machina"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <span>Connected API</span>
            {mode === "connected" ? <Wifi size={10} className="text-accent-machina" /> : <WifiOff size={10} />}
          </button>
        </div>

        {/* Industrial Clocks */}
        <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-text-secondary border-l border-r border-border-machina px-5">
          <div className="flex flex-col">
            <span className="text-[8px] text-text-secondary font-bold uppercase tracking-wider">Local Time</span>
            <span className="text-text-primary font-bold">{time.toLocaleTimeString()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-text-secondary font-bold uppercase tracking-wider">UTC Chrono</span>
            <span className="text-text-primary font-bold">{time.toUTCString().slice(17, 25)} Z</span>
          </div>
        </div>

        {/* Tactical Speaker toggle box */}
        <button
          id="btn-toggle-speaker"
          onClick={handleSpeakerClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono text-[10px] uppercase font-black tracking-wide transition-all duration-100 cursor-pointer ${
            isMuted 
              ? "bg-bg-machina border-danger-machina/30 text-danger-machina" 
              : "bg-bg-machina border-accent-machina/30 text-accent-machina"
          }`}
          title={isMuted ? "Siren is muted. Click to arm." : "Siren is active. Click to squelch."}
        >
          {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          <span>{isMuted ? "SPEAKER MUTED" : "SPEAKER ARMED"}</span>
        </button>

        {/* Tactical Voice Console Toggle Button */}
        <button
          id="btn-voice-console-toggle"
          onClick={() => setShowVoiceConsole(!showVoiceConsole)}
          className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono text-[10px] uppercase font-black tracking-wide transition-all duration-100 cursor-pointer ${
            showVoiceConsole 
              ? "bg-accent-machina text-bg-machina border-accent-machina shadow-[0_0_8px_rgba(235,94,85,0.2)]" 
              : "bg-bg-machina border-border-machina text-text-primary hover:text-accent-machina"
          }`}
          title="Toggle vocal directives sandbox HUD"
        >
          <Mic size={12} />
          <span>VOICE CONSOLE</span>
        </button>

        {/* Pending Alarms Header Status Block */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {pendingAlarms.length > 0 ? (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 px-3 py-1 bg-bg-machina text-[#E2C799] border-2 border-danger-machina">
                <ShieldAlert size={12} className="text-danger-machina animate-bounce" />
                <span className="text-[10px] font-black tracking-widest text-danger-machina uppercase">{pendingAlarms.length} ALARMS ACTIVE</span>
              </div>
              {pendingAlarms.length > 1 && !isMuted && (
                <span className="text-[8px] bg-red-950 text-red-400 border border-red-700 px-1 py-0.2 font-black tracking-wider animate-pulse uppercase">
                  ◀ SPEAKER AMPLIFIED 400% ▶
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-machina border border-border-machina text-text-secondary">
              <BellOff size={11} className="text-text-secondary" />
              <span className="text-[10px] font-bold tracking-wider uppercase">ALL SYSTEMS CLEAR</span>
            </div>
          )}
        </div>
      </div>

      {showVoiceConsole && <VoiceCommandInterface onClose={() => setShowVoiceConsole(false)} />}
    </header>
  );
}
