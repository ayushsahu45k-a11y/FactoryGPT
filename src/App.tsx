import React from "react";
import { useStore } from "./store/useStore";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import LoginView from "./components/LoginView";
import DashboardView from "./components/DashboardView";
import SafetyView from "./components/SafetyView";
import MaintenanceView from "./components/MaintenanceView";
import ModelExplorer from "./components/ModelExplorer";
import AnalyticsView from "./components/AnalyticsView";
import DigitalTwinView from "./components/DigitalTwinView";
import ReportsView from "./components/ReportsView";
import AlertsView from "./components/AlertsView";
import CopilotView from "./components/CopilotView";
import SettingsView from "./components/SettingsView";
import AttendanceView from "./components/AttendanceView";
import StaffManagementView from "./components/StaffManagementView";
import HistoryView from "./components/HistoryView";
import PermissionCheckWrapper from "./components/PermissionCheckWrapper";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import { alarmEngine } from "./lib/audio";
import IronNutButton from "./components/IronNutButton";
import LegalConsentSystem from "./components/LegalConsentSystem";

interface ToastMessage {
  id: string;
  type: "safety_non_compliant" | "high_risk_prediction";
  title: string;
  message: string;
  level: "nominal" | "warning" | "critical" | "emergency";
  timestamp: string;
  createdAt?: number;
}

// Toast individual tracker component with high-resolution frame-by-frame progress estimation
const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  const isEmergency = toast.level === "emergency";
  const isCritical = toast.level === "critical";
  const isCriticalEmergency = isEmergency || isCritical;

  const [timeLeft, setTimeLeft] = React.useState(5000);

  React.useEffect(() => {
    if (isCriticalEmergency) return;

    const start = toast.createdAt || Date.now();
    let animFrameId: number;

    const update = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 5000 - elapsed);
      setTimeLeft(remaining);

      if (remaining > 0) {
        animFrameId = requestAnimationFrame(update);
      }
    };

    animFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animFrameId);
  }, [toast.createdAt, isCriticalEmergency]);

  const progressPercent = isCriticalEmergency ? 100 : (timeLeft / 5000) * 100;

  const alertColor = isCriticalEmergency ? "text-danger-machina" : "text-warning-machina";
  const pulseClass = isCriticalEmergency ? "animate-pulse border-danger-machina/60 shadow-[0_0_15px_rgba(235,94,85,0.25)] bg-[#1a0a0a]" : "bg-card-machina";

  return (
    <div
      className={`pointer-events-auto border-l-4 p-5 pb-6 shadow-none transition-all duration-150 relative flex gap-3 border-r border-t border-b border-border-machina ${pulseClass}`}
      style={{
        borderLeftColor: isCriticalEmergency ? "var(--color-danger-machina)" : "var(--color-warning-machina)"
      }}
    >
      <div className="screw screw-tl"></div>
      <div className="screw screw-tr"></div>
      <div className="screw screw-bl"></div>
      <div className="screw screw-br"></div>

      {/* Alert Icon matching compliance style */}
      <div className="mt-0.5 shrink-0">
        {toast.type === "safety_non_compliant" ? (
          <ShieldAlert size={16} className={alertColor} />
        ) : (
          <AlertTriangle size={16} className={alertColor} />
        )}
      </div>

      {/* Message Details */}
      <div className="space-y-1.5 pr-4 flex-1">
        <span className={`text-[10px] font-black uppercase tracking-[0.16em] block leading-none flex items-center gap-1.5 ${alertColor}`}>
          <span className={`w-1.5 h-1.5 ${isEmergency ? "bg-danger-machina animate-ping" : "bg-warning-machina"}`}></span>
          {toast.title} {isCriticalEmergency && "[CRITICAL PINNED]"}
        </span>
        <p className="text-[11px] leading-relaxed text-text-primary">{toast.message}</p>
        <div className="flex items-center gap-2 text-[9px] text-text-secondary">
          <span>REGISTRY: ENFORCER_EDGE_L4</span>
          <span>•</span>
          <span>{toast.timestamp}</span>
        </div>
      </div>

      {/* Close button that looks like an iron nut */}
      <div className="absolute top-2.5 right-2.5">
        <IronNutButton
          onClick={onRemove}
          title="Press iron nut to close message"
        />
      </div>

      {/* Progress Bar for Non-critical Alerts */}
      {!isCriticalEmergency && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900/60 overflow-hidden">
          <div 
            className="h-full bg-warning-machina/60 transition-all duration-[16ms] ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { user, activeTab, incidents, predictions, equipment, mode, isSidebarCollapsed } = useStore();
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  // Refs to prevent spamming previous history on first app mount
  const processedIncidentIds = React.useRef<Set<string>>(new Set());
  const processedPredictionKeys = React.useRef<Set<string>>(new Set());
  const isFirstMount = React.useRef(true);
  const initialIncidentIds = React.useRef<Set<string>>(new Set());
  const isInitialLoadDone = React.useRef(false);

  // Load existing entities into seen arrays on active session startup
  React.useEffect(() => {
    if (user && isFirstMount.current) {
      incidents.forEach((inc) => {
        processedIncidentIds.current.add(inc.id);
        initialIncidentIds.current.add(inc.id);
      });
      Object.entries(predictions).forEach(([eqId, list]) => {
        list.forEach((_, idx) => {
          processedPredictionKeys.current.add(`${eqId}-${idx}`);
        });
      });
      isFirstMount.current = false;
      isInitialLoadDone.current = true;
    }
  }, [user, incidents, predictions]);

  // Reset initial load tracking on user session changes (login state boundaries)
  React.useEffect(() => {
    if (!user) {
      initialIncidentIds.current.clear();
      isInitialLoadDone.current = false;
    }
  }, [user]);

  // Monitor live streams for incoming violations or dangerous state boundaries
  React.useEffect(() => {
    if (!user || isFirstMount.current) return;

    // 1. Detect fresh safety infractions
    incidents.forEach((inc) => {
      if (!processedIncidentIds.current.has(inc.id)) {
        processedIncidentIds.current.add(inc.id);

        const isNonCompliant = 
          inc.category === "PPE Breach" || 
          inc.category === "Gas Leak" || 
          inc.message.toLowerCase().includes("breach") ||
          inc.message.toLowerCase().includes("infraction") ||
          inc.message.toLowerCase().includes("deviation") ||
          inc.message.toLowerCase().includes("non-compliant");

        if (isNonCompliant) {
          const newToast: ToastMessage = {
            id: `toast-inc-${inc.id}`,
            type: "safety_non_compliant",
            title: "NON-COMPLIANT SAFETY THREAT DETECTED",
            message: `[${inc.zone}] ${inc.message}`,
            level: inc.level,
            timestamp: new Date().toLocaleTimeString(),
            createdAt: Date.now()
          };
          setToasts((prev) => [newToast, ...prev].slice(0, 15));

          // Speak voice alert via SpeechSynthesis fallback
          alarmEngine.announceEmergencyVoice(
            `Safety alert! Non compliant situation reported in ${inc.zone}. Message states: ${inc.message}`,
            inc.id
          );
        }
      }
    });

    // 2. Detect fresh high-risk predictions (Failure prob > 65% or Critical/Emergency levels)
    Object.entries(predictions).forEach(([eqId, list]) => {
      const eq = equipment.find((e) => e.id === eqId);
      list.forEach((pred, idx) => {
        const key = `${eqId}-${idx}`;
        if (!processedPredictionKeys.current.has(key)) {
          processedPredictionKeys.current.add(key);

          if (pred.failure_probability > 0.65 || pred.risk_level === "critical" || pred.risk_level === "emergency") {
            const newToast: ToastMessage = {
              id: `toast-pred-${Date.now()}-${eqId}-${idx}`,
              type: "high_risk_prediction",
              title: "HIGH-RISK PROBABILITY PROGNOSIS",
              message: `'${eq?.name || "Equipment"}' XGBoost risk elevated! Probability: ${(pred.failure_probability * 100).toFixed(1)}%. Est. RUL: ${pred.predicted_remaining_useful_life_hours} hrs.`,
              level: pred.risk_level,
              timestamp: new Date().toLocaleTimeString(),
              createdAt: Date.now()
            };
            setToasts((prev) => [newToast, ...prev].slice(0, 15));

            // Speak voice alert via SpeechSynthesis fallback
            alarmEngine.announceEmergencyVoice(
              `Warning! Mechanical breakdown risk elevated on ${eq?.name || "Equipment"}. XGBoost probability calculated at ${(pred.failure_probability * 100).toFixed(0)} percent.`,
              key
            );
          }
        }
      });
    });
  }, [incidents, predictions, equipment, user]);

  // Reactive siren automation hook controlling AudioContext oscillations
  React.useEffect(() => {
    if (!user) {
      alarmEngine.stopSiren();
      return;
    }

    // Only count unacknowledged emergency/critical alerts that were triggered DURING this session (not pre-existing / historical ones)
    const sessionActiveUnacknowledged = incidents.filter(
      (inc) => !inc.acknowledged && !initialIncidentIds.current.has(inc.id)
    );

    const hasEmergency = sessionActiveUnacknowledged.some(
      (inc) => inc.level === "emergency" || inc.level === "critical"
    );

    if (hasEmergency) {
      // Trigger 400% volume amplification when multiple hazards are coming
      alarmEngine.startSiren(sessionActiveUnacknowledged.length > 1);
    } else {
      alarmEngine.stopSiren();
    }

    return () => {
      alarmEngine.stopSiren();
    };
  }, [incidents, user]);

  // Auto-fading minor status alerts after 5 seconds to reduce clutter, keeping critical pinned
  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setToasts((prev) =>
        prev.filter((t) => {
          const isCriticalEmergency = t.level === "emergency" || t.level === "critical";
          if (isCriticalEmergency) {
            return true; // Keep critical alerts persistent on HUD until operational clearance
          }
          const created = t.createdAt || now;
          return now - created < 5000; // Minor warnings or nominal notifications auto-fade after 5 seconds
        })
      );
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // If no active operator session exists, gate with the secure lock screen
  if (!user) {
    return (
      <>
        <LoginView />
        <LegalConsentSystem />
      </>
    );
  }

  // Dynamic route dispatcher
  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView />;
      case "safety":
        return <SafetyView />;
      case "attendance":
        return <AttendanceView />;
      case "history":
        return <HistoryView />;
      case "maintenance":
        return <MaintenanceView />;
      case "model_explorer":
        return <ModelExplorer />;
      case "analytics":
        return (
          <PermissionCheckWrapper requiredRole="Manager" viewName="Deep Analytics">
            <AnalyticsView />
          </PermissionCheckWrapper>
        );
      case "twin":
        return (
          <PermissionCheckWrapper requiredRole="Manager" viewName="Digital Twin 3D Platform">
            <DigitalTwinView />
          </PermissionCheckWrapper>
        );
      case "reports":
        return <ReportsView />;
      case "alerts":
        return <AlertsView />;
      case "copilot":
        return <CopilotView />;
      case "staff_mgmt":
        return (
          <PermissionCheckWrapper requiredRole="Manager" viewName="Staff Register Terminal">
            <StaffManagementView />
          </PermissionCheckWrapper>
        );
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div id="factory-app-shell" className="min-h-screen bg-bg-machina text-text-primary flex selection:bg-accent-machina/20 selection:text-text-primary relative font-sans">
      {/* 1. Left Command Console Dock */}
      <Sidebar />

      {/* 2. Main content viewport frame */}
      <div className={`flex-1 flex flex-col ${isSidebarCollapsed ? "pl-0" : "pl-[280px]"} min-w-0 transition-all duration-300 ${mode === "connected" ? "mode-connected-glow" : "mode-offline-glow"}`}>
        
        {/* Fixed System telemetry and header clocks */}
        <Header />

        {/* Dynamic subpage viewpoint container */}
        <main className="flex-1 pt-20 px-8 pb-12 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Toast Notification HUD Overlay */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 w-[420px] font-mono pointer-events-none">
        {(() => {
          const sortedToasts = [...toasts].sort((a, b) => {
            const aCrit = a.level === "emergency" || a.level === "critical" ? 1 : 0;
            const bCrit = b.level === "emergency" || b.level === "critical" ? 1 : 0;
            if (aCrit !== bCrit) return bCrit - aCrit; // Pin emergencies & critical to the absolute top of toast list
            return (b.createdAt || 0) - (a.createdAt || 0); // Chronological sub-sort (newer first)
          });

          return sortedToasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onRemove={() => removeToast(toast.id)}
            />
          ));
        })()}
      </div>

      <LegalConsentSystem />
    </div>
  );
}
