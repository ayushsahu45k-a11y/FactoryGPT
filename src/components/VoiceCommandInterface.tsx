import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { Mic, MicOff, Volume2, X, Play, Command, Cpu, AlertTriangle, ShieldCheck, ArrowRight, CornerDownLeft } from "lucide-react";

interface VoiceCommandInterfaceProps {
  onClose: () => void;
}

interface SectorInfo {
  id: string;
  name: string;
  keywords: string[];
  cameraPreset: { yaw: number; pitch: number; zoom: number };
  getTelemetry: (storeState: any) => string;
}

const SECTORS: SectorInfo[] = [
  {
    id: "reactor-grid",
    name: "Superconducting Voltage Grid Reactor",
    keywords: ["reactor core", "reactor grid", "reactor", "voltage grid", "voltage reactor", "ga-2"],
    cameraPreset: { yaw: 280, pitch: 35, zoom: 2.0 },
    getTelemetry: (storeState) => {
      const readings = storeState.readings["eq-gen-04"] || [];
      const latest = readings[readings.length - 1];
      const temp = latest ? latest.temperature : 55.4;
      return `Reactor Core cryogenic nitrogen loops are fully active. Superconductor winding core is currently at ${temp} degrees Celsius, magnetic induction field is stable at 2.4 Tesla, and subgrid voltage is locked at 13.8 Kilovolts. System operate status is clear.`;
    }
  },
  {
    id: "robo-arms",
    name: "Cognitive Robotic Assembly Swarm",
    keywords: ["assembly hall", "assembly", "robotic assembly", "robotic arms", "robo arms", "be-4", "robot arms"],
    cameraPreset: { yaw: 45, pitch: 50, zoom: 2.1 },
    getTelemetry: (storeState) => {
      const readings = storeState.readings["eq-pump-02"] || [];
      const latest = readings[readings.length - 1];
      const temp = latest ? latest.temperature : 62.4;
      const vib = latest ? latest.vibration : 1.25;
      return `Assembly Hall 6-axis kinematics mechatronics are operational. Conveyor drives registered weld tips at 1420 degrees Celsius, primary coolant pump temperature has calibrated to ${temp} degrees Celsius, and lateral spatial vibration index stands at ${vib} millimeters per second.`;
    }
  },
  {
    id: "steam-vent",
    name: "Geothermal Heat Chimney Ducts",
    keywords: ["steam vent", "vent complex", "geothermal", "ventilation", "chimney", "c-3", "ventilation ducts"],
    cameraPreset: { yaw: 135, pitch: 40, zoom: 1.85 },
    getTelemetry: (storeState) => {
      return `Geothermal Heat Chimney ventilation complex is exhausting recycled thermal kinetic energy. Gas exhaust temperature is rated at 184.2 degrees Celsius with fluid backpressure safe at 4.82 Bar, discharging 1850 cubic meters of volumetric pressure per hour.`;
    }
  },
  {
    id: "secret-lab",
    name: "Hyperthreat Subterranean Analysis Lab",
    keywords: ["secret lab", "subterranean lab", "analysis lab", "sanctuary x-09", "sanctuary", "lab", "underground lab"],
    cameraPreset: { yaw: 220, pitch: 55, zoom: 2.2 },
    getTelemetry: (storeState) => {
      return `Hyperthreat Subterranean Stress lab is secured under deep safety interlock. Environmental containment negative pressure stands at negative 0.2 Bar, hydraulic compression actuator applied force sits at 240 Kilonewtons, with structural shear strain nominal at 0.04 micro-strains.`;
    }
  },
  {
    id: "gpt-core",
    name: "Central FactoryGPT AI Brain Core",
    keywords: ["brain core", "ai brain", "ai core", "gpt core", "central brain", "central core", "delta-01", "delta 01", "brain core delta-01"],
    cameraPreset: { yaw: 320, pitch: 45, zoom: 1.95 },
    getTelemetry: (storeState) => {
      return `Central FactoryGPT neural supercomputing array command cellular is at 99.98 percent model accuracy, liquid nitrogen cooling loop temperature handles stably at 38.5 degrees Celsius, with dynamic compute rates hovering near 410 trillion floating point operations per second. Logical drift is optimized.`;
    }
  }
];

export default function VoiceCommandInterface({ onClose }: VoiceCommandInterfaceProps) {
  const store = useStore();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("Awaiting verbal authorization...");
  const [manualCommand, setManualCommand] = useState<string>("Go to Reactor Core");
  const [synthFeedback, setSynthFeedback] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Standard SpeechRecognition instantiation (checking prefixes)
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
        setTranscript("");
        setFeedback("Capturing audio channel... Speak now.");
      };

      rec.onresult = (e: any) => {
        const resultText = e.results[0][0].transcript;
        setTranscript(resultText);
        handleProcessTextCommand(resultText);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error", e);
        if (e.error === "not-allowed") {
          setErrorMsg(
            "Microphone permission blocked (NOT-ALLOWED). Please: " +
            "1. Click the lock/settings icon in your browser's URL address bar and change Microphone permission to 'Allow'. " +
            "2. If you are inside the embedded iFrame preview, click 'Open in a new tab' at the top-right of your preview frame to bypass secure sandbox boundaries."
          );
        } else {
          setErrorMsg(`Microphone block / error: ${e.error || "Access denied"}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      setErrorMsg("Browser SpeechRecognition interface not supported. Manual entry mode enabled.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const triggerVoiceSynthesis = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // Clears running queues
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      
      // Select the highest-fidelity natural english voice
      const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith("en"));
      let selectedVoice: SpeechSynthesisVoice | null = null;
      if (englishVoices.length > 0) {
        const rank = (voice: SpeechSynthesisVoice): number => {
          const name = voice.name.toLowerCase();
          if (name.includes("natural")) return 100;
          if (name.includes("google") && (name.includes("us english") || name.includes("uk english") || name.includes("english"))) return 95;
          if (name.includes("google")) return 90;
          if (name.includes("premium") || name.includes("enhanced") || name.includes("hi-fi")) return 80;
          if (name.includes("samantha") || name.includes("hazel") || name.includes("daniel") || name.includes("siri")) return 70;
          if (name.includes("susan") || name.includes("zira") || name.includes("david") || name.includes("mark")) return 60;
          if (name.includes("microsoft")) return 50;
          return 10;
        };
        selectedVoice = [...englishVoices].sort((a, b) => rank(b) - rank(a))[0];
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = 0.98; // Well-paced, steady human speed
      utterance.pitch = 1.0; // Standard neutral warm pitch (no deep computerized hums)
      
      setSynthFeedback(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Retrying start speech connection...", e);
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    } else {
      setErrorMsg("No speech device configured. Use the system terminal below.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleProcessTextCommand = (rawText: string) => {
    const text = rawText.trim().toLowerCase();
    
    // Command category 1: Switch between sectors
    const isNavigation = 
      text.includes("go to") || 
      text.includes("switch to") || 
      text.includes("navigate to") || 
      text.includes("show me") || 
      text.includes("focus") || 
      text.includes("jump to") ||
      text.includes("teleport to");

    const matchedSector = SECTORS.find((sec) => 
      sec.keywords.some((kw) => text.includes(kw))
    );

    // Command category 2: Telemetry query
    const isTelemetryQuery = 
      text.includes("temperature") || 
      text.includes("temp") || 
      text.includes("vibration") || 
      text.includes("vibe") || 
      text.includes("pressure") || 
      text.includes("humidity") || 
      text.includes("capacity") || 
      text.includes("valves") || 
      text.includes("status") || 
      text.includes("readings") || 
      text.includes("telemetry") || 
      text.includes("check on") || 
      text.includes("report");

    if (matchedSector && isNavigation) {
      // Switch tab to 'twin' where the rotatable 3D view sits!
      store.setActiveTab("twin");
      setFeedback(`Matched sector: "${matchedSector.name}". Focusing camera...`);
      
      // Dispatch custom event to trigger camera glide transition inside DigitalTwinView
      const voiceEvent = new CustomEvent("voice-select-sector", {
        detail: {
          sectorId: matchedSector.id,
          ...matchedSector.cameraPreset
        }
      });
      window.dispatchEvent(voiceEvent);

      const confirmMsg = `Acknowledged. Swiveling spatial blueprint camera telemetry to focus on ${matchedSector.name}.`;
      triggerVoiceSynthesis(confirmMsg);
      
      // Add record to central facility logs
      store.addHistory(
        "COPILOT",
        "VOICE NAVIGATION ENGAGED",
        `Vocal directive received to relocate mechatronics coordinate target to: ${matchedSector.name.toUpperCase()} viewport.`,
        store.user
      );
      return;
    }

    if (matchedSector && isTelemetryQuery) {
      setFeedback(`Querying telemetry for "${matchedSector.name}"...`);
      const telemetryOutput = matchedSector.getTelemetry(store);
      triggerVoiceSynthesis(telemetryOutput);
      
      // Add record to central facility logs
      store.addHistory(
        "COPILOT",
        "TELEMETRY VOICE QUERY",
        `Vocal query triggered status report on zone: ${matchedSector.name.toUpperCase()}. Telemetry reported successfully.`,
        store.user
      );
      return;
    }

    // Command category 3: Acknowledge/Silence alarms
    if (text.includes("clear alarm") || text.includes("silence alarm") || text.includes("acknowledge alarm") || text.includes("shut up") || text.includes("quiet")) {
      store.acknowledgeAllIncidents();
      setFeedback("Executing bulk alarm silence...");
      const alarmMsg = "Bulk alarm silence directive evaluated. Purging current safety warning queue index and resetting speaker levels.";
      triggerVoiceSynthesis(alarmMsg);
      return;
    }

    // Command category 4: Generic navigation to other tabs
    if (text.includes("dashboard")) {
      store.setActiveTab("dashboard");
      triggerVoiceSynthesis("Switching console view to main predictive maintenance dashboard.");
      return;
    } else if (text.includes("safety") || text.includes("incident") || text.includes("compliance")) {
      store.setActiveTab("safety");
      triggerVoiceSynthesis("Opening floor computer vision safety portal framework.");
      return;
    } else if (text.includes("attendance") || text.includes("shift") || text.includes("punch")) {
      store.setActiveTab("attendance");
      triggerVoiceSynthesis("Displaying real-time operative shift attendance spreadsheet ledger.");
      return;
    } else if (text.includes("logs") || text.includes("history") || text.includes("audit")) {
      store.setActiveTab("history");
      triggerVoiceSynthesis("Accessing secure digital twins audit logs chronological ledger.");
      return;
    } else if (text.includes("maintenance") || text.includes("predictive")) {
      store.setActiveTab("maintenance");
      triggerVoiceSynthesis("Accessing machine residual life and predictive failure analyzer.");
      return;
    } else if (text.includes("settings") || text.includes("role") || text.includes("profile")) {
      store.setActiveTab("settings");
      triggerVoiceSynthesis("Modifying console kernel configuration settings parameters.");
      return;
    } else if (text.includes("copilot") || text.includes("ask") || text.includes("ai")) {
      store.setActiveTab("copilot");
      triggerVoiceSynthesis("Opening the Cognitive AI Copilot chat dialogue.");
      return;
    }

    // Fallback: didn't match perfectly, guess if sector was named on its own
    if (matchedSector) {
      setFeedback(`Understood sector "${matchedSector.name}". Triggering standard auto-sweep.`);
      store.setActiveTab("twin");
      
      const voiceEvent = new CustomEvent("voice-select-sector", {
        detail: {
          sectorId: matchedSector.id,
          ...matchedSector.cameraPreset
        }
      });
      window.dispatchEvent(voiceEvent);
      
      const confirmMsg = `Acknowledged. Scanning telemetry in ${matchedSector.name}. Temperature and vibration indices are normal.`;
      triggerVoiceSynthesis(confirmMsg);
      return;
    }

    // No match
    setFeedback("Command not recognized. Check industrial parsing matrices.");
    triggerVoiceSynthesis("Operator command could not be parsed by the mechatronics processor kernel.");
  };

  return (
    <div 
      id="voice-command-hud" 
      className="fixed top-24 right-8 z-50 w-96 bg-bg-machina border border-border-machina p-4 shadow-[0_4px_24px_rgba(0,0,0,0.8)] text-left select-none animate-fadeIn flex flex-col gap-4 font-mono text-xs text-text-primary"
    >
      <style>{`
        @keyframes wave-bar {
          0%, 100% { height: 4px; }
          50% { height: 24px; }
        }
        .wave-bar-1 { animation: wave-bar 0.7s infinite ease-in-out; }
        .wave-bar-2 { animation: wave-bar 0.4s infinite ease-in-out; }
        .wave-bar-3 { animation: wave-bar 0.9s infinite ease-in-out; }
        .wave-bar-4 { animation: wave-bar 0.5s infinite ease-in-out; }
        .wave-bar-5 { animation: wave-bar 0.8s infinite ease-in-out; }
      `}</style>

      {/* Title Bar Area */}
      <div className="flex items-center justify-between border-b border-border-machina pb-2">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-[#EB5E55]/10 text-accent-machina border border-accent-machina/20 rounded-[1px]">
            <Command size={12} />
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest text-text-primary uppercase whitespace-nowrap">COGNITIVE VOICE ENGINE</span>
            <span className="text-[8px] text-text-secondary">WEB SPEECH API LAYER · PORT 3000</span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 hover:bg-hover-machina rounded-[1px] text-text-secondary hover:text-text-primary border border-transparent hover:border-border-machina transition-all cursor-pointer"
        >
          <X size={12} />
        </button>
      </div>

      {/* Main Microphone Action Panel */}
      <div className="border border-border-machina bg-card-machina p-4 rounded-[2px] flex flex-col gap-3 relative items-center text-center">
        {/* State Indicators */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 font-mono text-[8px] font-bold">
          <span className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-[#EB5E55] animate-ping" : "bg-text-secondary"}`}></span>
          <span className={isListening ? "text-accent-machina" : "text-text-secondary"}>
            {isListening ? "STREAMING FEED" : "STANDBY"}
          </span>
        </div>

        {/* Big Mic Toggle circle */}
        <button
          onClick={isListening ? stopListening : startListening}
          className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 cursor-pointer ${
            isListening 
              ? "bg-[#EB5E55]/10 border-accent-machina hover:bg-[#EB5E55]/20 shadow-[0_0_15px_rgba(235,94,85,0.3)]" 
              : "bg-bg-machina border-border-machina hover:border-text-secondary text-text-secondary hover:text-text-primary"
          }`}
          title={isListening ? "Click to stop listening" : "Click to arm microphone"}
        >
          {isListening ? (
            <div className="flex items-end gap-1 h-6">
              <span className="w-0.75 bg-accent-machina rounded-full wave-bar-1"></span>
              <span className="w-0.75 bg-accent-machina rounded-full wave-bar-2"></span>
              <span className="w-0.75 bg-accent-machina rounded-full wave-bar-3"></span>
              <span className="w-0.75 bg-accent-machina rounded-full wave-bar-4"></span>
              <span className="w-0.75 bg-accent-machina rounded-full wave-bar-5"></span>
            </div>
          ) : (
            <Mic size={24} />
          )}
        </button>

        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase text-text-primary">
            {isListening ? "OPERATOR TALK CHANNEL INITIATED" : "MIC MUTED / CLICK TO TALK"}
          </div>
          <p className="text-[9px] text-text-secondary leading-normal max-w-[260px] mx-auto">
            Authorize browser mic permissions, click standard trigger matrix, then state factory directive commands.
          </p>
        </div>
      </div>

      {/* Transcript Log & Vocal Synthetic feedback overlays */}
      <div className="space-y-2 border border-border-machina bg-[#080808] p-3 rounded-[2px]">
        <div className="space-y-1">
          <div className="text-[8px] text-text-secondary font-bold uppercase tracking-wider">Operator Vocalization:</div>
          <p className={`p-1 text-xs font-sans italic border-l border-accent-machina bg-bg-machina rounded-[1px] min-h-[22px] ${transcript ? "text-text-primary" : "text-text-secondary/50"}`}>
            {transcript ? `"${transcript}"` : "e.g., \"Go to Reactor Core\" or \"What is the current temperature in Assembly Hall?\""}
          </p>
        </div>

        <div className="space-y-1">
          <div className="text-[8px] text-text-secondary font-bold uppercase tracking-wider flex items-center gap-1">
            <Volume2 size={10} />
            <span>Telemetry Processor Response:</span>
          </div>
          <p className={`p-1.5 font-mono text-[9px] leading-relaxed border-l border-text-secondary bg-[#121212] rounded-[1px] min-h-[30px] ${synthFeedback ? "text-text-primary bg-accent-machina/5 border-l-accent-machina" : "text-text-secondary"}`}>
            {feedback}
          </p>
        </div>
      </div>

      {/* Standard Terminal text entries input fallback for iframe-safety */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[8px] font-bold uppercase text-text-secondary">
          <span>OPERATIONS TERMINAL SUB-CHANNEL SIMULATION</span>
          <span className="text-emerald-500 font-black">[SANDBOX READY]</span>
        </div>
        <div className="border border-border-machina bg-[#050505] p-1.5 rounded-[2px] flex items-center gap-2">
          <span className="text-[10px] font-mono text-accent-machina select-none pl-1">&gt;</span>
          <input
            type="text"
            placeholder="Type vocal command sequence..."
            className="bg-transparent border-none outline-none text-xs text-text-primary px-1 py-0.5 font-mono flex-1 uppercase"
            value={manualCommand}
            onChange={(e) => setManualCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && manualCommand) {
                setTranscript(manualCommand);
                handleProcessTextCommand(manualCommand);
                setManualCommand("");
              }
            }}
          />
          <button
            onClick={() => {
              if (manualCommand) {
                setTranscript(manualCommand);
                handleProcessTextCommand(manualCommand);
                setManualCommand("");
              }
            }}
            className="p-1 px-2.5 bg-hover-machina border border-border-machina text-[9px] font-mono hover:text-accent-machina hover:border-accent-machina/50 cursor-pointer flex items-center gap-1 uppercase font-bold"
          >
            <span>SEND</span>
            <CornerDownLeft size={10} />
          </button>
        </div>
      </div>

      {/* Quick Access Matrix Shortcuts */}
      <div className="space-y-1.5 text-left bg-card-machina p-3 border border-border-machina rounded-[1px]">
        <div className="text-[8px] text-text-secondary font-black uppercase tracking-wider">APPROVED PARSING MATRIX DIRECTIVES</div>
        <div className="grid grid-cols-1 gap-1">
          {[
            { tag: "NAV", text: "Go to Reactor Core" },
            { tag: "NAV", text: "Go to Assembly Hall" },
            { tag: "TEL", text: "What is the current temperature in Assembly Hall?" },
            { tag: "TEL", text: "Check on Central AI Brain Core status" },
            { tag: "ALC", text: "Acknowledge alarms" }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setManualCommand(item.text);
              }}
              className="text-[9px] text-text-secondary hover:text-text-primary flex items-center justify-between hover:bg-hover-machina p-1 rounded-[1px] transition-all text-left group"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className={`text-[7px] px-1 font-black rounded-[1px] font-mono ${
                  item.tag === "NAV" ? "bg-accent-machina/10 text-accent-machina border border-accent-machina/10" : 
                  item.tag === "TEL" ? "bg-teal-500/10 text-teal-400 border border-teal-500/10" : "bg-danger-machina/10 text-danger-machina border border-danger-machina/10"
                }`}>
                  {item.tag}
                </span>
                <span className="truncate">"{item.text}"</span>
              </div>
              <ArrowRight size={10} className="text-text-secondary opacity-0 group-hover:opacity-100 transition-all pl-1" />
            </button>
          ))}
        </div>
      </div>

      {/* Warnings & Errors */}
      {errorMsg && (
        <div className="bg-amber-950/20 text-amber-500 border border-amber-800/50 p-2.5 rounded-[1px] flex gap-2 text-left items-start text-[9px] leading-normal uppercase">
          <AlertTriangle size={12} className="shrink-0 text-amber-500 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
