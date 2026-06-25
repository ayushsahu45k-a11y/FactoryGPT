import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import { API_CLIENT } from "../lib/api";
import { useEmailValidator } from "../hooks/useEmailValidator";
import { 
  Lock, 
  Cpu, 
  Eye, 
  EyeOff,
  ShieldAlert, 
  Wrench, 
  Shield, 
  KeyRound, 
  CheckCircle2,
  UserPlus,
  RefreshCw,
  Mail,
  Fingerprint,
  ArrowLeft,
  ShieldCheck,
  Globe,
  Loader2,
  Terminal,
  HelpCircle,
  AlertTriangle
} from "lucide-react";

export default function LoginView() {
  const { setUser, mode, registeredWorkers, registerWorker } = useStore();
  const [formMode, setFormMode] = useState<"login" | "signup" | "forgotPassword" | "verifyEmail">("login");
  const [selectedRole, setSelectedRole] = useState<"Admin" | "Manager" | "Worker" | "Viewer">("Admin");
  
  // Custom Email Validators
  const loginSignupEmailValidator = useEmailValidator("connor.admin@factorygpt.lan");
  const email = loginSignupEmailValidator.email;
  const rawEmail = loginSignupEmailValidator.rawEmail;
  const setEmail = loginSignupEmailValidator.setEmail;
  const isEmailValid = loginSignupEmailValidator.isValid;
  const emailValidationError = loginSignupEmailValidator.validationError;

  const resetEmailValidator = useEmailValidator("");
  const resetEmail = resetEmailValidator.email;
  const rawResetEmail = resetEmailValidator.rawEmail;
  const setResetEmail = resetEmailValidator.setEmail;
  const isResetEmailValid = resetEmailValidator.isValid;
  const resetEmailValidationError = resetEmailValidator.validationError;

  // Inputs
  const [password, setPassword] = useState("factory");
  const [fullName, setFullName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  // Verification Overlay Modal State
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);

  // States
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [oauthStatusText, setOauthStatusText] = useState("");

  // Anti-Brute-Force Rate Limiting States
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [forensicLogs, setForensicLogs] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clearance presets
  const clearanceLevels = {
    Admin: {
      email: "connor.admin@factorygpt.lan",
      title: "LEAD SYSTEM ADMINISTRATOR (ROOT)",
      badge: "SYS_ADMIN_CMD",
      colorClass: "text-danger-machina border-danger-machina/30 bg-danger-machina/10",
      accentColor: "var(--color-danger-machina)",
      desc: "HIGHEST OPERATIONAL CLEARANCE. ROOT OVERRIDE ACCESS, TELEMETRY CACHE INJECTION FLUSH, SIREN TRIGGER MODULATION, AND ADVANCED CLOCK DRIFT SHAPING CHECKS.",
      abilities: [
        "FORCE SIMULATED FAILURE ANOMALIES ON COUPLERS",
        "RETROACTIVELY PURGE MACHINE REPAIR INTERVAL TICKETS",
        "RE-CONFIGURE INSTANT SENSOR WEIGHT OVERRIDES",
        "ACCESS FULL DIAGNOSTIC ALARMS CONSOLE TELEMETRY"
      ]
    },
    Manager: {
      email: "patel.manager@factorygpt.lan",
      title: "PREDICTIVE MAINTENANCE ENGINEER",
      badge: "ML_MAIN_ENG",
      colorClass: "text-warning-machina border-warning-machina/30 bg-warning-machina/10",
      accentColor: "var(--color-warning-machina)",
      desc: "ML PARAMETER TUNING CLEARANCE. AUTHORIZED TO EVALUATE XGBOOST GRADIENTS, RUL PROGNOSIS INDICES, SHAP ATTRIBUTION EXPLAINERS, AND TRANSCRIBE COMPLIANCE WRITES.",
      abilities: [
        "CALIBRATE XGBOOST F1 LOSS HYPERPARAMETERS",
        "DEPLOY MULTI-EQUIPMENT BATCH SWEEPS",
        "EXPORT FORMAL LEDGER AUDITING COMPLIANCE CERTIFICATES",
        "TRAIN LOCAL CORRELATION BIASES VIA AI COPILOT"
      ]
    },
    Worker: {
      email: "miller.worker@factorygpt.lan",
      title: "MECHANICAL FIELD SPECIALIST (LVL-2)",
      badge: "FLD_OPS_SPEC",
      colorClass: "text-accent-machina border-accent-machina/30 bg-accent-machina/10",
      accentColor: "var(--color-accent-machina)",
      desc: "FLOOR ENGINEERING & FLUID CONTROL. POWERS MANUAL RESET CHANNELS, LUBRICATION SCHEDULING, REALTIME GASKET VALVES RE-ALIGNMENT, AND BROADWAY SIRENS SQUELCHING.",
      abilities: [
        "COMMIT PHYSICAL LUBRICITY MAINTENANCE ACTIONS",
        "BULK REPORT ACKNOWLEDGE & COUPLING FAULTS SIREN SQUELCH",
        "DISPATCH LEVEL-2 REPAIR FIELD RESPONSE TEAM UNIT",
        "ACCESS COMPACT OPERATIONAL FLOW BLUEPRINT MANUALS"
      ]
    },
    Viewer: {
      email: "operator.viewer@factorygpt.lan",
      title: "STANDARD FLOOR OBSERVER (READ-ONLY)",
      badge: "OBS_PORT_LIVE",
      colorClass: "text-text-secondary border-border-machina bg-card-machina",
      accentColor: "var(--color-text-secondary)",
      desc: "GATEWAY ACCESS GRANTED. NON-INTERACTIVE OBSERVER ACCESS TO SCROLLING OSCILLOSCOPE READINGS, DIGITAL TWIN SVG SCHEMATICS, AND AI COMPENSATOR CORRESPONDENCE.",
      abilities: [
        "MONITOR STEADY-STATE WAVE VIBRATION SPECS",
        "INTERROGATE STRUCTURAL DIGITAL CAD TWIN CODES",
        "QUERY REALTIME TELEMETRY STREAM PACKETS",
        "COMMU WITH LOCAL INDUSTRIAL COPILOT INTERFACE"
      ]
    }
  };

  // Lockout countdown tick
  useEffect(() => {
    if (lockoutTimer > 0) {
      timerRef.current = setTimeout(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
    } else if (lockoutTimer === 0 && failedAttempts >= 5) {
      // Unlock
      setFailedAttempts(0);
      setError(null);
      addForensicLog("GATEWAY AUTOLOCK INTRUSION PROTOCOL ROTATED. TERMINAL UNLOCKED.");
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lockoutTimer, failedAttempts]);

  // Helper to log intrusion reports
  const addForensicLog = (msg: string) => {
    const timestamp = new Date().toISOString().slice(11, 19);
    setForensicLogs((prev) => [`[${timestamp}] ${msg}`, ...prev].slice(0, 5));
  };

  const handleRoleTabChange = (role: "Admin" | "Manager" | "Worker" | "Viewer") => {
    if (lockoutTimer > 0) return;
    setSelectedRole(role);
    setEmail(clearanceLevels[role].email);
    setPassword("factory");
    setError(null);
    setInfoMessage(null);
  };

  // 1. SIGN IN FLOW (With Brute-force rate limiter)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    if (!email || !password) {
      setError("SECURITY SYSTEM: Credentials cannot be vacant.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    // Simulated network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Password validation logic
    const isPresetUser = Object.values(clearanceLevels).some((lvl) => lvl.email.toLowerCase() === email.toLowerCase());
    const matchedWorker = registeredWorkers?.find(w => w.email.toLowerCase() === email.toLowerCase());
    const isValidPassword = password === "factory" || password === "password123" || matchedWorker;

    if (!isValidPassword) {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      setLoading(false);

      if (nextFailures >= 5) {
        setLockoutTimer(30);
        setError("CRITICAL LOCKOUT ENGAGED: Too many failed security handshake codes. Gateway frozen.");
        addForensicLog("ALERT: BRUTE-FORCE THRESHOLD EXCEEDED (5 FAILURES). ENGAGING TERMINAL SHIELD WALL.");
        addForensicLog(`IP INGRESS ROUTE: 127.0.0.1 COMPROMISED. PORT 3000 SLEW-RATE LIMIT INITIATED.`);
      } else {
        setError(`AUTHENTICATION FAILURE: Handshake signature mismatch. (${nextFailures}/5 attempts allowed before terminal lockdown)`);
        addForensicLog(`WARNING: INVALID PASSWORD ATTEMPT FOR USER <${email.toUpperCase()}>`);
      }
      return;
    }

    try {
      // Connects to simulated auth backend fallback
      const authenticatedUser = await API_CLIENT.login(email, password, mode);
      
      // Map user configuration profile
      const level = clearanceLevels[selectedRole];
      const isDefaultPresetEmail = level && email.toLowerCase() === level.email.toLowerCase();
      const existingWorker = isDefaultPresetEmail
        ? undefined
        : registeredWorkers?.find(w => w.email.toLowerCase() === email.toLowerCase());
      
      setUser({
        id: existingWorker?.id || authenticatedUser.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        email: email,
        full_name: existingWorker?.full_name || authenticatedUser.full_name || level?.title || email.split("@")[0].toUpperCase(),
        role: existingWorker?.role || authenticatedUser.role || selectedRole,
        permissions: (existingWorker?.role || authenticatedUser.role || selectedRole) === "Admin" 
          ? ["Admin", "Manager", "Worker", "Viewer"] 
          : (existingWorker?.role || authenticatedUser.role || selectedRole) === "Manager" 
            ? ["Manager", "Worker", "Viewer"] 
            : (existingWorker?.role || authenticatedUser.role || selectedRole) === "Worker" 
              ? ["Worker", "Viewer"] 
              : ["Viewer"],
        is_active: true,
        created_at: existingWorker?.created_at || authenticatedUser.created_at || new Date().toISOString(),
        position: existingWorker?.position || level?.badge || "STAFF_OPERATIVE",
        avatar_url: existingWorker?.avatar_url || undefined,
        work_description: existingWorker?.work_description || undefined
      });
      
      // Clear failure metrics
      setFailedAttempts(0);
    } catch (err: any) {
      setError(err?.message || "AUTHENTICATION FAILURE: Handshake signature mismatch.");
    } finally {
      setLoading(false);
    }
  };

  // 2. SIGN UP / REGISTRATION FLOW (Initiator)
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!fullName || !email || !signupPassword || !signupConfirmPassword) {
      setError("REGISTRATION DEVIATION: Complete all contract fields.");
      return;
    }

    if (!isEmailValid) {
      setError(emailValidationError || "REGISTRATION DEVIATION: Email format is invalid.");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError("REGISTRATION DEVIATION: Cryptographic confirm codes do not correlate.");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);

    // Trigger overlay modal verification
    setShowVerificationModal(true);
    setInfoMessage("REGISTRATION SUCCESS: Verification token dispatched to your email route.");
    addForensicLog(`TRANSMITTED EMAIL VERIFICATION CRYPTO TOKEN (PIN: 551923) TO <${email.toUpperCase()}>`);
  };

  // 3. EMAIL VERIFICATION COMPLETION
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!verificationCode) {
      setError("VERIFICATION FAILURE: Validation block is blank.");
      return;
    }

    if (verificationCode.replace("-", "").trim() !== "551923") {
      setError("VERIFICATION FAILURE: PIN signature mismatch. Please inspect diagnostic code log or enter '551-923'.");
      addForensicLog(`WARNING: INCORRECT VERIFICATION ATTEMPT RECORDED`);
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setLoading(false);

    // Register inside mock list and automatically log in!
    const signupRole = selectedRole === "Admin" ? "Worker" : selectedRole; // Fallback to safe defaults if they chose presets
    
    // Register worker first so they persist in the local system and can log in after log out
    registerWorker(fullName, email, signupRole);

    const newRegisteredUser = {
      id: `usr-reg-${Date.now()}`,
      email: email,
      full_name: fullName,
      role: signupRole,
      permissions: signupRole === "Manager" ? ["Manager", "Viewer"] : signupRole === "Worker" ? ["Worker", "Viewer"] : ["Viewer"],
      is_active: true,
      created_at: new Date().toISOString(),
      position: signupRole === "Manager" ? "Predictive Maintenance Engineer" : signupRole === "Worker" ? "Field Operations Specialist" : "Standard Floor Observer",
      work_description: "Registered online. Credentials validated under HIPAA-OSHA secure gateway protocols."
    };

    // Save in Zustand and local history
    setUser(newRegisteredUser);
    setShowVerificationModal(false);
  };

  // 4. PASSWORD RESET REQUEST / COMPLETION
  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!resetEmail) {
      setError("RECOVERY ERROR: Target address required.");
      return;
    }

    if (!isResetEmailValid) {
      setError(resetEmailValidationError || "RECOVERY ERROR: Email format is invalid.");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);

    setInfoMessage("DECRYPTION LINK DISPATCHED: Check diagnostic console (PIN token is: '991-884')");
    addForensicLog(`RECOVERY: ISSUED SYMMETRIC AES RESET TOKEN (PIN: 991884) FOR <${resetEmail.toUpperCase()}>`);
  };

  const handleResetPasswordCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (resetCode.replace("-", "").trim() !== "991884") {
      setError("RECOVERY ERROR: Recovery token does not correlate with active memory segment.");
      return;
    }

    if (!newPassword || newPassword !== newPasswordConfirm) {
      setError("RECOVERY ERROR: Confirm codes do not match or are vacant.");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setLoading(false);

    setFormMode("login");
    setInfoMessage("DECRYPTION PROTOCOL COMPLETED: Password updated successfully. Authenticate with new code.");
    addForensicLog(`SUCCESS: RE-CONFIGURED HANDSHAKE PASSWORDS FOR USER <${resetEmail.toUpperCase()}>`);
  };

  // 5. OAUTH HANDSHAKE HANDLER
  const handleOauthHandshake = async (provider: "google" | "github") => {
    if (lockoutTimer > 0) return;
    setError(null);
    setInfoMessage(null);
    setOauthLoading(provider);
    
    const steps = [
      "DIALING CRYPTOGRAPHIC SIGNATURE ENDPOINTS...",
      "EXCHANGING SECURE JWT ACCESS PARAMS...",
      "COMMITTING CERTIFICATE HANDSHAKE PROTOCOLS...",
      "VALIDATING TENANT IDENTIFIER CLAIMS...",
      "OAUTH HANDSHAKE SIGNED."
    ];

    for (let i = 0; i < steps.length; i++) {
      setOauthStatusText(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 450));
    }

    setOauthLoading(null);
    
    // Auto-login with an elegant OAuth profile
    const oauthProfile = {
      id: `usr-oauth-${Date.now()}`,
      email: `${provider}-operator@factorygpt.lan`,
      full_name: `${provider === "google" ? "Google G-Suite Identity" : "GitHub Security-Key"} Operator`,
      role: "Viewer" as const,
      permissions: ["Viewer"],
      is_active: true,
      created_at: new Date().toISOString(),
      position: "SECURE_OAUTH_LINK",
      work_description: `Linked via secure ${provider.toUpperCase()} single-sign-on protocol. Audit compliance logged.`
    };

    setUser(oauthProfile);
  };

  const activeLevel = clearanceLevels[selectedRole];

  return (
    <div id="login-layout-wrapper" className="min-h-screen bg-bg-machina flex flex-col justify-center items-center px-4 py-8 relative select-none font-mono">
      {/* Dynamic structural framing background lines */}
      <div className="absolute inset-0 grid grid-cols-6 opacity-[0.03] pointer-events-none">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="border-r border-text-primary h-full"></div>
        ))}
      </div>

      <div className="w-full max-w-xl bg-card-machina border-2 border-border-machina p-8 relative z-10 rounded-[4px] shadow-[0_16px_48px_rgba(0,0,0,0.8)]">
        {/* Machine Screw Decors representing a heavy metallic plate enclosure */}
        <div className="screw screw-tl"></div>
        <div className="screw screw-tr"></div>
        <div className="screw screw-bl"></div>
        <div className="screw screw-br"></div>

        {/* Dynamic Handshake / OAuth Loading overlay */}
        {oauthLoading && (
          <div className="absolute inset-0 bg-[#0B0B0A]/95 z-50 flex flex-col items-center justify-center p-6 text-center rounded-[3px]">
            <div className="p-4 bg-accent-machina/10 border border-accent-machina/40 rounded-full animate-spin duration-3000 mb-4">
              <Loader2 size={36} className="text-accent-machina animate-spin" />
            </div>
            <span className="text-[10px] font-black tracking-widest text-accent-machina uppercase animate-pulse mb-2">
              [ {oauthLoading.toUpperCase()} OAUTH INITIALIZATION ]
            </span>
            <div className="h-4 overflow-hidden max-w-xs">
              <p className="text-[9.5px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                {oauthStatusText}
              </p>
            </div>
          </div>
        )}

        {/* Header Title */}
        <div className="flex flex-col text-center items-center mb-6 border-b-2 border-border-machina pb-5 relative">
          <div className="absolute top-0 right-0 text-[8px] text-text-secondary font-bold uppercase">
            SEC_GATEWAY_V2.5
          </div>
          
          <div className="flex items-center gap-2 text-accent-machina mb-2">
            <Lock size={14} className="stroke-[2.5]" />
            <span className="text-[10px] font-black tracking-[0.25em] uppercase">
              SECURITY GATEWAY INGRESS
            </span>
          </div>
          
          <h1 className="font-bebas text-5xl tracking-[0.08em] uppercase text-text-primary leading-none mt-1">
            FACTORY<span className="text-accent-machina">GPT</span> CORE
          </h1>
          <p className="text-[9.5px] text-text-secondary tracking-widest mt-2 uppercase font-bold">
            {formMode === "login" && "PROVISION COMPLIANT CREDENTIALS TO ENGAGE OVERRIDE"}
            {formMode === "signup" && "ENROLL NEW OPERATOR OR SPECIALIST DEVICE TARGET"}
            {formMode === "verifyEmail" && "OSHA DUAL-FACTOR COGNITIVE SIGNATURE COMPLIANCE"}
            {formMode === "forgotPassword" && "DECRYPTION VECTOR KEY RETRIEVAL STAGE"}
          </p>
        </div>

        {/* Global Informational & Status Banners */}
        {infoMessage && (
          <div className="mb-5 bg-zinc-950 border border-accent-machina text-accent-machina p-4 text-[10.5px] leading-relaxed flex gap-2.5 items-start rounded-[3px]">
            <ShieldCheck size={14} className="shrink-0 mt-0.5 animate-bounce" />
            <span className="font-bold uppercase leading-normal">{infoMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-5 bg-[#120807] border border-danger-machina text-danger-machina p-4 text-[10.5px] leading-relaxed flex gap-2.5 items-start rounded-[3px]">
            <ShieldAlert size={14} className="shrink-0 mt-0.5" />
            <span className="font-bold uppercase leading-normal">{error}</span>
          </div>
        )}

        {/* LOCKOUT ACTIVE DISPLAY */}
        {lockoutTimer > 0 && (
          <div className="mb-6 p-4 bg-red-950/20 border-2 border-danger-machina rounded-[3px] text-center space-y-2">
            <AlertTriangle className="mx-auto text-danger-machina animate-pulse" size={24} />
            <h3 className="text-xs font-black text-danger-machina tracking-wider uppercase">
              [ TERMINAL LOCKDOWN ENGAGED ]
            </h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase leading-relaxed max-w-sm mx-auto">
              Brute-force mitigation in progress. Keypad vectors isolated. Input capability will automatically restore in:
            </p>
            <div className="text-3xl font-black text-danger-machina tracking-widest font-sans animate-pulse">
              00:{lockoutTimer < 10 ? `0${lockoutTimer}` : lockoutTimer}
            </div>
            <p className="text-[8px] text-zinc-500 uppercase font-black">
              OSHA SECURITY SPEC 1910-A COMPLIANT RATE-LIMIT
            </p>
          </div>
        )}

        {/* ----------------- MODE A: LOGIN ----------------- */}
        {formMode === "login" && lockoutTimer === 0 && (
          <>
            {/* Presets Grid */}
            <div className="mb-5">
              <label className="block text-[9px] tracking-[0.18em] text-text-secondary uppercase mb-2 font-black text-center">
                [ SELECT ACCESS LEVEL GATEWAY PRESENTS ]
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                {(["Admin", "Manager", "Worker", "Viewer"] as const).map((role) => {
                  const isActive = selectedRole === role;
                  return (
                    <button
                      id={`tab-role-select-${role.toLowerCase()}`}
                      key={role}
                      type="button"
                      onClick={() => handleRoleTabChange(role)}
                      className={`py-1.5 px-0.5 text-center text-[9.5px] uppercase font-black transition-all cursor-pointer border tracking-wider rounded-[2px] ${
                        isActive
                          ? "bg-hover-machina border-accent-machina text-accent-machina shadow-[0_0_8px_rgba(235,166,42,0.15)]"
                          : "bg-zinc-950/75 border-border-machina text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Presets Abilities details */}
            <div className={`p-3.5 border mb-5 rounded-[2px] text-left transition-all duration-150 ${activeLevel.colorClass}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10.5px] font-black tracking-wider text-text-primary uppercase flex items-center gap-1.5">
                  <Shield size={11} style={{ color: activeLevel.accentColor }} />
                  {activeLevel.title}
                </span>
                <span className="font-bold text-[8.5px] tracking-wider border border-border-machina px-1.5 py-0.5 bg-bg-machina text-text-primary">
                  {activeLevel.badge}
                </span>
              </div>
              <p className="text-[9px] leading-relaxed text-text-secondary font-bold uppercase mb-2.5">
                {activeLevel.desc}
              </p>

              <div className="border-t border-border-machina/20 pt-2 text-[8.5px] text-text-primary font-bold space-y-1">
                <span className="block text-[7.5px] tracking-wider text-text-secondary font-black uppercase mb-1">
                  // PRIVILEGED OVERRIDES GRANTED:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-0.5">
                  {activeLevel.abilities.map((ability, idx) => (
                    <div key={idx} className="flex items-center gap-1 uppercase tracking-wide truncate">
                      <span className="text-accent-machina font-black">✓</span>
                      <span className="truncate">{ability}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Inputs & Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[9.5px] uppercase tracking-[0.18em] text-text-secondary mb-1 font-black">
                  SECURE PORT ENTRY ACCESS (E-MAIL ADDRESS)
                </label>
                <input
                  id="input-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-machina border border-border-machina px-3.5 py-2.5 text-xs text-text-primary focus:border-accent-machina focus:outline-none font-bold rounded-[3px]"
                  placeholder={activeLevel.email}
                  required
                />
                {email && !isEmailValid && (
                  <p className="mt-1 text-[8.5px] text-danger-machina font-bold uppercase tracking-wider">
                    {emailValidationError}
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[9.5px] uppercase tracking-[0.18em] text-text-secondary font-black">
                    GATEWAY SYMMETRIC CODE (PASSWORD)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode("forgotPassword");
                      setResetEmail("");
                      setResetCode("");
                      setNewPassword("");
                      setNewPasswordConfirm("");
                      setError(null);
                      setInfoMessage(null);
                    }}
                    className="text-[8.5px] text-accent-machina hover:underline font-black uppercase cursor-pointer"
                  >
                    Lost Recovery Key?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="input-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-bg-machina border border-border-machina pl-3.5 pr-10 py-2.5 text-xs text-text-primary focus:border-accent-machina focus:outline-none font-bold rounded-[3px]"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-secondary hover:text-accent-machina cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-accent-machina hover:bg-white text-bg-machina text-[10.5px] tracking-[0.2em] uppercase font-black cursor-pointer text-center flex items-center justify-center gap-2 rounded-[3px]"
                style={{ backgroundColor: activeLevel.accentColor, color: selectedRole === "Viewer" ? "var(--color-bg-machina)" : "inherit" }}
              >
                <KeyRound size={13} strokeWidth={2.5} />
                {loading ? "VERIFYING TELEMETRY HANDSHAKE..." : "STRIKE COMPLIANT AUTH HANDSHAKE"}
              </button>
            </form>

            {/* Switch to Signup */}
            <div className="mt-4 text-center">
              <span className="text-[10px] text-text-secondary uppercase font-bold">New Operator personnel? </span>
              <button
                type="button"
                onClick={() => {
                  setFormMode("signup");
                  setFullName("");
                  setEmail("");
                  setSignupPassword("");
                  setSignupConfirmPassword("");
                  setError(null);
                  setInfoMessage(null);
                }}
                className="text-[10px] text-accent-machina hover:underline font-black uppercase cursor-pointer"
              >
                Enroll New Unit Contract
              </button>
            </div>
          </>
        )}

        {/* ----------------- MODE B: SIGNUP ----------------- */}
        {formMode === "signup" && lockoutTimer === 0 && (
          <form onSubmit={handleSignup} className="space-y-4 text-left">
            <div className="flex items-center gap-2 text-[10.5px] font-black text-text-primary border-b border-border-machina pb-2 mb-2 uppercase">
              <UserPlus size={14} className="text-accent-machina" />
              <span>REGISTRATION CONTRACT DATA ENTRY</span>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-[0.18em] text-text-secondary mb-1 font-black">
                OPERATOR LEGAL NAME (FULL NAME)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-bg-machina border border-border-machina px-3 py-2 text-xs text-text-primary focus:border-accent-machina focus:outline-none font-bold rounded-[3px]"
                placeholder="Technician Jane Doe"
                required
              />
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-[0.18em] text-text-secondary mb-1 font-black">
                OPERATIVE SIGNAL ENDPOINT (E-MAIL ADDRESS)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-machina border border-border-machina px-3 py-2 text-xs text-text-primary focus:border-accent-machina focus:outline-none font-bold rounded-[3px]"
                placeholder="doe@factorygpt.lan"
                required
              />
              {email && !isEmailValid && (
                <p className="mt-1 text-[8.5px] text-danger-machina font-bold uppercase tracking-wider">
                  {emailValidationError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] uppercase tracking-[0.18em] text-text-secondary mb-1 font-black">
                  SYMMETRIC CODE (PASS)
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full bg-bg-machina border border-border-machina pl-3 pr-10 py-2 text-xs text-text-primary focus:border-accent-machina focus:outline-none font-bold rounded-[3px]"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-secondary hover:text-accent-machina cursor-pointer"
                  >
                    {showSignupPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-[0.18em] text-text-secondary mb-1 font-black">
                  CONFIRM SYMMETRIC CODE
                </label>
                <div className="relative">
                  <input
                    type={showSignupConfirmPassword ? "text" : "password"}
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="w-full bg-bg-machina border border-border-machina pl-3 pr-10 py-2 text-xs text-text-primary focus:border-accent-machina focus:outline-none font-bold rounded-[3px]"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-secondary hover:text-accent-machina cursor-pointer"
                  >
                    {showSignupConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-[0.18em] text-text-secondary mb-1.5 font-black">
                ASSIGN OPERATIONAL HIERARCHY LIMIT
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["Manager", "Worker", "Viewer"] as const).map((role) => {
                  const isSelected = selectedRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`py-2 text-center text-[9.5px] font-black uppercase rounded-[2px] cursor-pointer border ${
                        isSelected 
                          ? "bg-hover-machina border-accent-machina text-accent-machina" 
                          : "bg-bg-machina border-border-machina text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent-machina hover:bg-white text-bg-machina text-[10.5px] tracking-[0.2em] uppercase font-black cursor-pointer text-center flex items-center justify-center gap-2 rounded-[3px]"
            >
              <UserPlus size={13} />
              {loading ? "INITIALIZING SECURE PROTOCOL..." : "TRANSMIT ENROLLMENT CONTRACT"}
            </button>

            <button
              type="button"
              onClick={() => {
                setFormMode("login");
                setError(null);
                setInfoMessage(null);
              }}
              className="w-full py-2 border border-border-machina hover:bg-zinc-900 text-text-secondary text-[9px] uppercase font-bold cursor-pointer text-center flex items-center justify-center gap-1.5 rounded-[2px]"
            >
              <ArrowLeft size={12} />
              Abort Registration and Return to Dial
            </button>
          </form>
        )}



        {/* ----------------- MODE D: FORGOT PASSWORD ----------------- */}
        {formMode === "forgotPassword" && (
          <div className="space-y-5 text-left">
            <div className="flex items-center gap-2 text-[10.5px] font-black text-text-primary border-b border-border-machina pb-2 uppercase">
              <RefreshCw size={14} className="text-accent-machina animate-spin-slow" />
              <span>DECRYPTION VECTOR KEY RECOVERY</span>
            </div>

            {!infoMessage ? (
              // Stage 1: Request code
              <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                <p className="text-[10px] text-text-secondary leading-normal uppercase font-bold">
                  Enter your registered operator address. We will transmit an AES-256 decryption payload vector containing recovery codes to reset access keys.
                </p>

                <div>
                  <label className="block text-[9px] uppercase tracking-[0.18em] text-text-secondary mb-1 font-black">
                    REGISTERED ADDR (E-MAIL)
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-bg-machina border border-border-machina px-3 py-2.5 text-xs text-text-primary focus:border-accent-machina focus:outline-none font-bold rounded-[3px]"
                    placeholder="operator@factorygpt.lan"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-accent-machina hover:bg-white text-bg-machina text-[10.5px] tracking-[0.2em] uppercase font-black cursor-pointer text-center flex items-center justify-center gap-2 rounded-[3px]"
                >
                  <Fingerprint size={13} />
                  {loading ? "COMPUTING AES KEY VECTOR..." : "REQUEST DECRYPTION KEY"}
                </button>
              </form>
            ) : (
              // Stage 2: Verify code and commit password reset
              <form onSubmit={handleResetPasswordCommit} className="space-y-4">
                <div className="p-3 bg-zinc-950 border border-dashed border-border-machina text-[9.5px] uppercase font-bold text-text-secondary">
                  Decrypt token received! Enter token PIN and define new access gateway handshake.
                  <span className="block mt-1.5 text-accent-machina font-black">
                    [ PIN RECOVERY TOKEN HIERARCHY: "991-884" ]
                  </span>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-[0.18em] text-text-secondary mb-1 font-black">
                    RECOVERY TOKEN (6-DIGIT PIN)
                  </label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full bg-bg-machina border border-border-machina px-3 py-2 text-xs text-text-primary focus:border-accent-machina focus:outline-none uppercase font-bold text-center tracking-widest rounded-[3px]"
                    placeholder="991-884"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-[0.18em] text-text-secondary mb-1 font-black">
                      NEW SYMMETRIC CODE
                    </label>
                    <div className="relative">
                      <input
                        type={showResetPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-bg-machina border border-border-machina pl-3 pr-10 py-2 text-xs text-text-primary focus:border-accent-machina focus:outline-none font-bold rounded-[3px]"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-secondary hover:text-accent-machina cursor-pointer"
                      >
                        {showResetPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-[0.18em] text-text-secondary mb-1 font-black">
                      CONFIRM NEW CODE
                    </label>
                    <div className="relative">
                      <input
                        type={showResetPasswordConfirm ? "text" : "password"}
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        className="w-full bg-bg-machina border border-border-machina pl-3 pr-10 py-2 text-xs text-text-primary focus:border-accent-machina focus:outline-none font-bold rounded-[3px]"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPasswordConfirm(!showResetPasswordConfirm)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-secondary hover:text-accent-machina cursor-pointer"
                      >
                        {showResetPasswordConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-accent-machina hover:bg-white text-bg-machina text-[10.5px] tracking-[0.2em] uppercase font-black cursor-pointer text-center flex items-center justify-center gap-2 rounded-[3px]"
                >
                  <ShieldCheck size={13} />
                  {loading ? "MUTATING SECURITY CODES..." : "COMMIT KEY REPLACEMENT"}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setFormMode("login");
                setError(null);
                setInfoMessage(null);
              }}
              className="w-full py-2 border border-border-machina hover:bg-zinc-900 text-text-secondary text-[9px] uppercase font-bold cursor-pointer text-center flex items-center justify-center gap-1 rounded-[2px]"
            >
              <ArrowLeft size={12} />
              Return to Keypad login Entry
            </button>
          </div>
        )}

        {/* ----------------- OAUTH SOCIAL HANDSHAKES SECTION ----------------- */}
        {formMode === "login" && lockoutTimer === 0 && (
          <div className="mt-5 pt-4 border-t border-dashed border-border-machina/40 space-y-3">
            <span className="block text-[8.5px] text-text-secondary tracking-[0.2em] uppercase text-center font-black">
              [ SECURE THIRD-PARTY AUTH Handshake ]
            </span>
            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => handleOauthHandshake("google")}
                className="py-2.5 px-3 bg-zinc-950 hover:bg-zinc-900 border border-border-machina text-text-primary text-[9.5px] uppercase font-bold tracking-wider rounded-[2px] cursor-pointer flex items-center justify-center gap-2 transition-colors"
              >
                {/* Simulated Google Logo using high-fidelity circle and arc style */}
                <Globe size={12} className="text-sky-400 shrink-0" />
                <span>Google Secure ID</span>
              </button>

              <button
                type="button"
                onClick={() => handleOauthHandshake("github")}
                className="py-2.5 px-3 bg-zinc-950 hover:bg-zinc-900 border border-border-machina text-text-primary text-[9.5px] uppercase font-bold tracking-wider rounded-[2px] cursor-pointer flex items-center justify-center gap-2 transition-colors"
              >
                <Cpu size={12} className="text-purple-400 shrink-0 animate-pulse-slow" />
                <span>GitHub Keylink</span>
              </button>
            </div>
          </div>
        )}

        {/* Legal and Compliance Links */}
        <div className="mt-6 pt-3.5 border-t border-dashed border-border-machina/40 flex justify-center gap-4 text-[9px] font-mono text-zinc-500 font-bold uppercase select-none">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("factorygpt-open-privacy"))}
            className="hover:text-accent-machina transition-colors cursor-pointer"
          >
            🔒 Privacy Policy
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("factorygpt-open-terms"))}
            className="hover:text-accent-machina transition-colors cursor-pointer"
          >
            ⚖️ Terms of Service
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("factorygpt-open-preferences"))}
            className="hover:text-accent-machina transition-colors cursor-pointer"
          >
            🍪 Cookie Settings
          </button>
        </div>

        {/* Technical ledger metadata footing with Anti-Brute-Force ticks */}
        <div className="mt-4 pt-4 border-t border-border-machina/50 text-[9px] font-mono text-text-secondary flex flex-col gap-2 select-none">
          <div className="flex justify-between uppercase font-bold items-center">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full bg-accent-machina ${lockoutTimer > 0 ? "bg-danger-machina animate-ping" : "animate-pulse-slow"}`}></span>
              PORT ACCESS LINK: 3000
            </span>
            <span>ENVIRONMENT DESCRIPTOR: {mode.toUpperCase()}</span>
          </div>

          {/* Scrolling Real-time OSHA/Gate Forensic logs */}
          {forensicLogs.length > 0 && (
            <div className="bg-zinc-950/90 border border-border-machina p-2 font-mono text-[8px] text-zinc-500 rounded-[2px] text-left uppercase space-y-0.5 mt-1 overflow-y-auto max-h-16">
              <span className="text-text-secondary font-black text-[7.5px] block border-b border-border-machina/40 pb-0.5 mb-1 tracking-wider">
                [ SEC_MONITOR INGRESS LEDGER FORENSICS ]
              </span>
              {forensicLogs.map((log, idx) => (
                <div key={idx} className={log.includes("ALERT") ? "text-danger-machina font-bold" : log.includes("WARNING") ? "text-warning-machina font-bold" : ""}>
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ----------------- OTP VERIFICATION OVERLAY MODAL ----------------- */}
      {showVerificationModal && (
        <div id="otp-verification-modal" className="fixed inset-0 z-50 bg-[#070707]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card-machina border-2 border-accent-machina/60 p-6 relative rounded-[4px] shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-4">
            {/* Machine Screw Decors representing a heavy metallic plate enclosure */}
            <div className="screw screw-tl"></div>
            <div className="screw screw-tr"></div>
            <div className="screw screw-bl"></div>
            <div className="screw screw-br"></div>

            <div className="flex items-center gap-2 text-[10.5px] font-black text-text-primary border-b border-border-machina pb-3 mb-1 uppercase">
              <Mail size={14} className="text-accent-machina animate-pulse" />
              <span className="tracking-wider">OSHA DUAL-FACTOR AUTHENTICATION</span>
            </div>

            <div className="space-y-3 text-left">
              <p className="text-[10px] text-text-secondary leading-normal uppercase font-bold bg-[#0D0D0C] p-3.5 border border-dashed border-border-machina/60">
                A secure login authorization request is pending. Complete validation to activate device profiles.
                <span className="block mt-1.5 text-accent-machina font-black">
                  [ DIAGNOSTIC CONSOLE: PIN TOKEN IS "551-923" ]
                </span>
              </p>

              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider bg-bg-machina p-2.5 border border-border-machina">
                <span className="text-text-secondary">// INBOUND ROUTE:</span>{" "}
                <span className="text-text-primary text-xs tracking-normal select-text lowercase">{email}</span>
              </div>

              {error && (
                <div className="bg-[#120807] border border-danger-machina text-danger-machina p-3 text-[9.5px] leading-relaxed flex gap-2 items-start rounded-[2px] uppercase">
                  <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                  <span className="font-bold">{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block text-[9.5px] uppercase tracking-[0.18em] text-text-secondary mb-1.5 font-black text-center">
                    ENTER SECURE TRANSMISSION CODE
                  </label>
                  <input
                    type="text"
                    maxLength={7}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full bg-bg-machina border border-border-machina px-4 py-3 text-center text-xl font-mono tracking-widest text-text-primary focus:border-accent-machina focus:outline-none uppercase font-black rounded-[3px]"
                    placeholder="551-923"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVerificationModal(false);
                      setError(null);
                      setInfoMessage(null);
                    }}
                    className="py-2.5 border border-border-machina hover:bg-zinc-900 text-text-secondary text-[9px] uppercase font-bold cursor-pointer text-center flex items-center justify-center gap-1.5 rounded-[2px]"
                  >
                    <ArrowLeft size={12} />
                    Abort
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 bg-accent-machina hover:bg-white text-bg-machina text-[9.5px] tracking-[0.15em] uppercase font-black cursor-pointer text-center flex items-center justify-center gap-1.5 rounded-[3px]"
                  >
                    {loading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ShieldCheck size={12} />
                    )}
                    Verify & Join
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
