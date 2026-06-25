import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  X, 
  FileText, 
  Scale, 
  Settings, 
  Cookie, 
  Printer, 
  ArrowRight, 
  Check, 
  Lock, 
  Info,
  ShieldAlert,
  Brain,
  Binary
} from "lucide-react";
import IronNutButton from "./IronNutButton";

// Custom event helper names for cross-component triggers
export const TRIGGER_PRIVACY_EVENT = "factorygpt-open-privacy";
export const TRIGGER_TERMS_EVENT = "factorygpt-open-terms";
export const TRIGGER_PREFERENCES_EVENT = "factorygpt-open-preferences";

export default function LegalConsentSystem() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Preference details (stored in localStorage)
  const [prefEssential, setPrefEssential] = useState(true); // Locked true
  const [prefAnalytics, setPrefAnalytics] = useState(true);
  const [prefCopilot, setPrefCopilot] = useState(true);

  // Check consent status on mount
  useEffect(() => {
    const consentAccepted = localStorage.getItem("cfg_cookie_consent_accepted");
    if (!consentAccepted) {
      // Small delay for industrial feel as systems boot up
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      try {
        const savedPrefs = localStorage.getItem("cfg_cookie_preferences");
        if (savedPrefs) {
          const parsed = JSON.parse(savedPrefs);
          setPrefAnalytics(!!parsed.analytics);
          setPrefCopilot(!!parsed.copilot);
        }
      } catch {}
    }
  }, []);

  // Listen to custom global events for opening modals from sidebar/login/settings
  useEffect(() => {
    const handlePrivacy = () => setShowPrivacy(true);
    const handleTerms = () => setShowTerms(true);
    const handlePrefs = () => setShowPreferences(true);

    window.addEventListener(TRIGGER_PRIVACY_EVENT, handlePrivacy);
    window.addEventListener(TRIGGER_TERMS_EVENT, handleTerms);
    window.addEventListener(TRIGGER_PREFERENCES_EVENT, handlePrefs);

    return () => {
      window.removeEventListener(TRIGGER_PRIVACY_EVENT, handlePrivacy);
      window.removeEventListener(TRIGGER_TERMS_EVENT, handleTerms);
      window.removeEventListener(TRIGGER_PREFERENCES_EVENT, handlePrefs);
    };
  }, []);

  // Accept all cookie parameters
  const handleAcceptAll = () => {
    localStorage.setItem("cfg_cookie_consent_accepted", "all");
    localStorage.setItem("cfg_cookie_preferences", JSON.stringify({
      essential: true,
      analytics: true,
      copilot: true
    }));
    setPrefAnalytics(true);
    setPrefCopilot(true);
    setShowBanner(false);
  };

  // Accept only essential parameters (GDPR compliant)
  const handleEssentialOnly = () => {
    localStorage.setItem("cfg_cookie_consent_accepted", "essential");
    localStorage.setItem("cfg_cookie_preferences", JSON.stringify({
      essential: true,
      analytics: false,
      copilot: false
    }));
    setPrefAnalytics(false);
    setPrefCopilot(false);
    setShowBanner(false);
  };

  // Save customized preferences
  const handleSavePreferences = () => {
    localStorage.setItem("cfg_cookie_consent_accepted", "custom");
    localStorage.setItem("cfg_cookie_preferences", JSON.stringify({
      essential: true,
      analytics: prefAnalytics,
      copilot: prefCopilot
    }));
    setShowPreferences(false);
    setShowBanner(false);
  };

  // Simple print action for legal records
  const handlePrint = (title: string) => {
    window.print();
  };

  return (
    <>
      {/* 1. GDPR COMPLIANT COOKIE CONSENT BANNER (SLIDES IN FROM BOTTOM) */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            id="gdpr-cookie-banner"
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-6 bg-[#0B0B0A] border-t-2 border-border-machina shadow-[0_-8px_32px_rgba(0,0,0,0.9)] select-none"
          >
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative">
              {/* Mechanical rivets */}
              <div className="screw screw-tl"></div>
              <div className="screw screw-tr"></div>

              <div className="flex items-start gap-4 max-w-3xl">
                <div className="p-2.5 bg-accent-machina/10 border border-accent-machina/30 text-accent-machina shrink-0 rounded-[1px]">
                  <Cookie size={20} className="animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase text-accent-machina tracking-[0.18em]">
                      [OSHA TELEMETRY & GDPR PRIVACY PROTOCOL]
                    </span>
                    <span className="text-[8px] bg-[#A8463B]/10 text-danger-machina border border-danger-machina/30 px-1 font-mono font-bold uppercase">
                      GDPR / EU TARGETED
                    </span>
                  </div>
                  <h3 className="text-xs font-sans font-black text-text-primary tracking-wider uppercase leading-tight">
                    This control station uses digital cookies and tracking telemetry.
                  </h3>
                  <p className="text-[11px] font-mono text-text-secondary leading-relaxed max-w-2xl">
                    We process real-time mechanical vibration, temperatures, biometric PPE gate scans, and Copilot dialog history. These trackers ensure interface stability, generate local SHAP explainers, and save offline secure credentials.
                  </p>
                  <div className="flex gap-4 text-[10px] font-mono text-zinc-500 pt-1">
                    <button 
                      onClick={() => setShowPrivacy(true)}
                      className="hover:text-accent-machina hover:underline flex items-center gap-1 cursor-pointer font-bold uppercase"
                    >
                      <FileText size={10} />
                      Privacy Policy
                    </button>
                    <span>•</span>
                    <button 
                      onClick={() => setShowTerms(true)}
                      className="hover:text-accent-machina hover:underline flex items-center gap-1 cursor-pointer font-bold uppercase"
                    >
                      <Scale size={10} />
                      Terms of Service
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons arranged like mechanical triggers */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto font-mono text-[10.5px]">
                <button
                  onClick={() => setShowPreferences(true)}
                  className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-border-machina text-text-secondary hover:text-text-primary font-bold tracking-wider uppercase rounded-[2px] cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Settings size={12} />
                  <span>PREFERENCES</span>
                </button>

                <button
                  onClick={handleEssentialOnly}
                  className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-border-machina text-text-primary font-bold tracking-wider uppercase rounded-[2px] cursor-pointer transition-colors"
                >
                  ESSENTIAL ONLY
                </button>

                <button
                  onClick={handleAcceptAll}
                  className="px-5 py-2.5 bg-accent-machina text-bg-machina hover:bg-white font-black tracking-widest uppercase rounded-[2px] cursor-pointer transition-none flex items-center gap-1.5"
                >
                  <span>ACCEPT ALL COGNITIVE COOKIES</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. COOKIE PREFERENCES MODAL */}
      <AnimatePresence>
        {showPreferences && (
          <div className="fixed inset-0 z-[150] bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0B0B0A] border-2 border-border-machina p-6 relative font-mono text-xs text-text-primary shadow-[0_8px_32px_rgba(0,0,0,0.95)]"
              id="cookie-preferences-modal"
            >
              {/* Rivets */}
              <div className="screw screw-tl"></div>
              <div className="screw screw-tr"></div>
              <div className="screw screw-bl"></div>
              <div className="screw screw-br"></div>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-machina pb-3.5 mb-5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-accent-machina/10 border border-accent-machina/35 text-accent-machina rounded-[1px]">
                    <Settings size={16} />
                  </span>
                  <div>
                    <h2 className="text-xs font-black tracking-widest uppercase text-text-primary">
                      TRACKING TELEMETRY CONFIGURATION
                    </h2>
                    <p className="text-[8px] text-zinc-500">GDPR COGNITIVE PORTAL INTERFACE</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPreferences(false)}
                  className="p-1 hover:bg-hover-machina border border-transparent hover:border-border-machina text-zinc-400 hover:text-text-primary transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Pref 1: Essential */}
                <div className="p-3.5 bg-zinc-950 border border-border-machina flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-primary">
                      <Lock size={12} className="text-accent-machina" />
                      <span>ESSENTIAL GATEWAY STATE (MANDATORY)</span>
                    </div>
                    <p className="text-[9.5px] text-zinc-400 leading-normal">
                      Saves active security roles, current operational shift IDs, and offline local logins. Required for core portal integrity and system enforcer gateways.
                    </p>
                  </div>
                  <div className="text-[9px] bg-[#A8463B]/10 text-danger-machina border border-danger-machina/30 px-1.5 py-0.5 font-bold uppercase tracking-wider select-none shrink-0">
                    REQUIRED
                  </div>
                </div>

                {/* Pref 2: Analytics & SHAP */}
                <button
                  onClick={() => setPrefAnalytics(!prefAnalytics)}
                  className="w-full text-left p-3.5 bg-zinc-950/40 hover:bg-zinc-950 border border-border-machina flex items-start justify-between gap-4 transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-primary">
                      <Binary size={12} className={prefAnalytics ? "text-sky-400" : "text-zinc-500"} />
                      <span>EXPLAINABLE SHAP ANALYTICS & D3 CURVES</span>
                    </div>
                    <p className="text-[9.5px] text-zinc-400 leading-normal">
                      Allows telemetry history tracking to construct real-time game-theory SHAP attribution values and mechanical failure prognosis lines on dashboard visualizers.
                    </p>
                  </div>
                  <div className={`w-8 h-4 border p-0.5 shrink-0 transition-colors ${prefAnalytics ? "bg-accent-machina border-accent-machina" : "bg-zinc-900 border-border-machina"}`}>
                    <div className={`w-2.5 h-2.5 bg-bg-machina transition-transform ${prefAnalytics ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </button>

                {/* Pref 3: AI Copilot Context */}
                <button
                  onClick={() => setPrefCopilot(!prefCopilot)}
                  className="w-full text-left p-3.5 bg-zinc-950/40 hover:bg-zinc-950 border border-border-machina flex items-start justify-between gap-4 transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-primary">
                      <Brain size={12} className={prefCopilot ? "text-emerald-400" : "text-zinc-500"} />
                      <span>COGNITIVE COPILOT CONTEXT & DIALOG CACHE</span>
                    </div>
                    <p className="text-[9.5px] text-zinc-400 leading-normal">
                      Enables the saving and segmentation of local Copilot dialogs based on your logged security clearance role. Turning this off clears local assistant histories.
                    </p>
                  </div>
                  <div className={`w-8 h-4 border p-0.5 shrink-0 transition-colors ${prefCopilot ? "bg-accent-machina border-accent-machina" : "bg-zinc-900 border-border-machina"}`}>
                    <div className={`w-2.5 h-2.5 bg-bg-machina transition-transform ${prefCopilot ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                </button>
              </div>

              {/* Action footing */}
              <div className="mt-6 pt-4 border-t border-border-machina/60 flex gap-3">
                <button
                  onClick={() => {
                    setPrefAnalytics(true);
                    setPrefCopilot(true);
                  }}
                  className="px-4 py-2.5 bg-zinc-950 border border-border-machina hover:border-zinc-700 font-bold uppercase text-[9px] tracking-wider cursor-pointer"
                >
                  ENABLE ALL
                </button>

                <button
                  onClick={handleSavePreferences}
                  className="flex-1 py-2.5 bg-accent-machina text-bg-machina hover:bg-white font-black text-center text-[10px] uppercase tracking-widest cursor-pointer transition-none"
                >
                  CONFIRM TELEMETRY PREFERENCES
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. PRIVACY POLICY MODAL */}
      <AnimatePresence>
        {showPrivacy && (
          <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4 backdrop-blur-xs select-text">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-[#0B0B0A] border-2 border-border-machina p-6 relative font-mono text-xs text-text-primary shadow-[0_8px_32px_rgba(0,0,0,0.95)] flex flex-col max-h-[90vh]"
              id="privacy-policy-modal"
            >
              {/* Rivets */}
              <div className="screw screw-tl"></div>
              <div className="screw screw-tr"></div>
              <div className="screw screw-bl"></div>
              <div className="screw screw-br"></div>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-machina pb-3.5 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-accent-machina/10 border border-accent-machina/35 text-accent-machina rounded-[1px]">
                    <FileText size={16} />
                  </span>
                  <div>
                    <h2 className="text-xs font-black tracking-widest uppercase text-text-primary">
                      PRIVACY POLICY & TELEMETRY DISCLOSURE
                    </h2>
                    <p className="text-[8px] text-zinc-500">COMPLIANCE CODE: GDPR-SOP-PP-9001</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handlePrint("Privacy Policy")}
                    className="p-1.5 hover:bg-hover-machina border border-border-machina text-zinc-400 hover:text-text-primary transition-colors cursor-pointer rounded-[2px]"
                    title="Print Document"
                  >
                    <Printer size={12} />
                  </button>
                  <button 
                    onClick={() => setShowPrivacy(false)}
                    className="p-1.5 hover:bg-hover-machina border border-border-machina text-zinc-400 hover:text-text-primary transition-colors cursor-pointer rounded-[2px]"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Scrollable document body */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-[10.5px] leading-relaxed text-text-secondary select-text border border-border-machina/40 bg-zinc-950/40 p-4 font-mono scrollbar-thin">
                <div className="border-b border-border-machina/30 pb-3 mb-3">
                  <span className="text-[9px] font-black text-accent-machina uppercase tracking-widest block">
                    EFFECTIVE REVISION DATE
                  </span>
                  <p className="text-text-primary font-bold">JUNE 24, 2026 · REV 2.4.9</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-text-primary uppercase tracking-wide">
                    1. GENERAL TELEMETRY STATEMENT
                  </h4>
                  <p>
                    FactoryGPT acts as a real-time smart manufacturing twin and industrial control portal. Under European Union General Data Protection Regulation (GDPR) and global industrial frameworks, users are hereby notified that this application monitors and processes physical telemetry inputs directly originating from operational machinery, alongside authorized operator metrics, to maintain regulatory safety standards and verify worker compliance.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-text-primary uppercase tracking-wide">
                    2. CLASSIFICATION OF DATA COLLECTED
                  </h4>
                  <p className="text-zinc-400 font-bold uppercase text-[9px]">A. PHYSICAL MACHINERY TELEMETRY (NON-PERSONAL)</p>
                  <p className="pl-3 border-l border-zinc-800">
                    Continuous logging of device temperatures (°C), bearing vibrations (mm/s), atmospheric gases (Argon %, Nitrogen ppm), and voltage drops. This data is collected to compile machine health prognoses and train explainable XGBoost maintenance models.
                  </p>
                  <p className="text-zinc-400 font-bold uppercase text-[9px] mt-2">B. SECURITY GATEWAY SCAN METRICS (PERSONAL)</p>
                  <p className="pl-3 border-l border-zinc-800">
                    To satisfy OSHA physical gate-entry enforcements, our smart enforcer gates capture and evaluate camera inputs representing worker profile avatars, full names, position titles, and personal PPE compliance flags (helmets, goggles, safety harnesses). No raw facial biometric vector data is stored outside local sandboxed cache bounds.
                  </p>
                  <p className="text-zinc-400 font-bold uppercase text-[9px] mt-2">C. COGNITIVE CHAT RECORDS & ROLE PROFILES</p>
                  <p className="pl-3 border-l border-zinc-800">
                    Operator query strings dispatched to the local Teletype AI Copilot are cached in localized database blocks segmented strictly by security roles (Admin, Manager, Worker, Viewer). Dialog caching is executed locally via browser state registers (`factory_gpt_role_messages`).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-text-primary uppercase tracking-wide">
                    3. DATA PROCESSING LEGAL BASIS (GDPR ARTICLE 6)
                  </h4>
                  <p>
                    Processing operator names and attendance logs rests on the following criteria:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Contractual Performance:</strong> Enabling plant workers to punch-in, log attendance, and receive custom assignments.</li>
                    <li><strong>Legal Obligation (OSHA Compliance):</strong> Ensuring protective safety equipment verification before granting machinery overrides.</li>
                    <li><strong>Consent:</strong> User approval of cookie trackers for local analytical configurations.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-text-primary uppercase tracking-wide">
                    4. RETENTION & ERASE CONTROLS
                  </h4>
                  <p>
                    All diagnostic reports, safety breach logs, and chat records are retained either in localized persistent client storage or state maps. Under GDPR Article 17, operators hold the "Right to be Forgotten" and may clear history caches, de-register accounts, or request complete ledger flushes inside the System Settings dashboard at any time.
                  </p>
                </div>

                <div className="p-3 bg-[#A8463B]/5 border border-[#A8463B]/20 text-[9.5px] leading-relaxed text-zinc-400 rounded-[2px]">
                  <span className="text-danger-machina font-black uppercase block mb-1">
                    ⚠️ EMERGENCY OVERRIDE NOTE:
                  </span>
                  In high-risk mechanical thresholds (e.g. thermal spikes &gt; 98°C or unacknowledged cryogenic gas leaks), legal safety overrides permit immediate enforcer logging of active worker coordinates to prevent physical plant failures, taking precedence over standard privacy options during active alerts.
                </div>
              </div>

              {/* Footing */}
              <div className="mt-4 pt-3.5 border-t border-border-machina flex justify-between items-center text-[8.5px] font-mono shrink-0 select-none">
                <span className="text-zinc-500 uppercase">ISO 9001 / 14001 COMPLIANT TELEMETRY</span>
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="px-5 py-2 bg-accent-machina hover:bg-white text-bg-machina font-black uppercase tracking-wider rounded-[2px] cursor-pointer"
                >
                  DISMISS LEDGER
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. TERMS OF SERVICE MODAL */}
      <AnimatePresence>
        {showTerms && (
          <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4 backdrop-blur-xs select-text">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-[#0B0B0A] border-2 border-border-machina p-6 relative font-mono text-xs text-text-primary shadow-[0_8px_32px_rgba(0,0,0,0.95)] flex flex-col max-h-[90vh]"
              id="terms-of-service-modal"
            >
              {/* Rivets */}
              <div className="screw screw-tl"></div>
              <div className="screw screw-tr"></div>
              <div className="screw screw-bl"></div>
              <div className="screw screw-br"></div>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-machina pb-3.5 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-accent-machina/10 border border-accent-machina/35 text-accent-machina rounded-[1px]">
                    <Scale size={16} />
                  </span>
                  <div>
                    <h2 className="text-xs font-black tracking-widest uppercase text-text-primary">
                      TERMS & CONDITIONS OF OPERATIONAL USE
                    </h2>
                    <p className="text-[8px] text-zinc-500">REGULATORY STANDARD: OSHA-SOP-TOS-1910</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handlePrint("Terms of Service")}
                    className="p-1.5 hover:bg-hover-machina border border-border-machina text-zinc-400 hover:text-text-primary transition-colors cursor-pointer rounded-[2px]"
                    title="Print Document"
                  >
                    <Printer size={12} />
                  </button>
                  <button 
                    onClick={() => setShowTerms(false)}
                    className="p-1.5 hover:bg-hover-machina border border-border-machina text-zinc-400 hover:text-text-primary transition-colors cursor-pointer rounded-[2px]"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Scrollable document body */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-[10.5px] leading-relaxed text-text-secondary select-text border border-border-machina/40 bg-zinc-950/40 p-4 font-mono scrollbar-thin">
                <div className="border-b border-border-machina/30 pb-3 mb-3">
                  <span className="text-[9px] font-black text-accent-machina uppercase tracking-widest block">
                    GOVERNING REGULATORY AUTHORITY
                  </span>
                  <p className="text-text-primary font-bold">FEDERAL INDUSTRIAL SAFETY BOARD · REGISTRY: ADM-3000</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-text-primary uppercase tracking-wide">
                    1. ACCEPTANCE & ENFORCEMENT OF TERMS
                  </h4>
                  <p>
                    By establishing a digital credentials handshake (logging in) with FactoryGPT, you represent and warrant that you are an authorized plant technician, operations supervisor, or qualified observer. You agree to follow the mechanical calibration, biometric PPE enforcements, and reporting terms articulated herein. If you do not accept these terms, credential handshake gates will remain permanently locked.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-text-primary uppercase tracking-wide">
                    2. ROLE CLEARANCE & COMMAND ACCESS OVERRIDES
                  </h4>
                  <p>
                    Operators must access the platform using ONLY their assigned credentials and role clearance level. 
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Admin Profiles:</strong> Authorized to perform absolute telemetry overrides, system resets, and siren triggers. Unjustified safety-limit resets that risk turbine or dynamo damage may result in shift suspension.</li>
                    <li><strong>Manager Profiles:</strong> Permitted to register equipment, edit task allocations, and download reports. Responsible for accurate data auditing.</li>
                    <li><strong>Worker Profiles:</strong> Restricted to physical calibrations, compliance logs, and PPE scans.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-text-primary uppercase tracking-wide">
                    3. AI COPILOT & XGBOOST PROGNOSIS LIMITATION OF LIABILITY
                  </h4>
                  <p>
                    All predictive algorithms, remaining useful life (RUL) numbers, and SHAP parameter indicators are calculated as statistical simulations using XGBoost modeling. These values represent predictive risk probabilities and are NOT absolute physical failure timelines. 
                  </p>
                  <p className="border-l-2 border-accent-machina/60 pl-3 italic text-text-primary">
                    "Under no circumstances shall FactoryGPT Engineering or the platform developers be liable for physical hardware incidents, bearing fractures, or gaseous leaks that occur when manual verification procedures have been bypassed in favor of AI-guided predictions."
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black text-text-primary uppercase tracking-wide">
                    4. COMPLIANCE WITH ENVIRONMENTAL REGULATIONS
                  </h4>
                  <p>
                    Operators agree to use the Gas/Argon limits settings only in alignment with regional safety and EPA directives. Squelching active alarms or hiding incident histories from auditing boards is strictly prohibited.
                  </p>
                </div>
              </div>

              {/* Footing */}
              <div className="mt-4 pt-3.5 border-t border-border-machina flex justify-between items-center text-[8.5px] font-mono shrink-0 select-none">
                <span className="text-zinc-500 uppercase">OSHA STANDARDS SECTION 1910 APPROVED</span>
                <button
                  onClick={() => setShowTerms(false)}
                  className="px-5 py-2 bg-accent-machina hover:bg-white text-bg-machina font-black uppercase tracking-wider rounded-[2px] cursor-pointer"
                >
                  ACKNOWLEDGE TERMS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
