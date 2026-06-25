import { create } from "zustand";
import { User, Equipment, SafetyIncident, ChatMessage, AuditReport, SensorReading, PredictionResult, AttendanceRecord, HistoryRecord } from "../types";
import { MOCK_EQUIPMENT, MOCK_INCIDENTS, MOCK_REPORTS, MOCK_CHATS, computeLocalPredictiveMaintenance } from "../lib/api";

interface StoreState {
  user: User | null;
  activeTab: string;
  mode: "connected" | "demo";
  equipment: Equipment[];
  incidents: SafetyIncident[];
  messages: ChatMessage[];
  roleMessages: Record<string, ChatMessage[]>;
  reports: AuditReport[];
  // Map of equipment_id -> historic readings
  readings: Record<string, SensorReading[]>;
  // Map of equipment_id -> historic prediction outcomes
  predictions: Record<string, PredictionResult[]>;
  notificationsCount: number;
  attendance: AttendanceRecord[];
  history: HistoryRecord[];
  registeredWorkers: User[];

  setUser: (user: User | null) => void;
  setActiveTab: (tab: string) => void;
  setMode: (mode: "connected" | "demo") => void;
  setEquipment: (eq: Equipment[]) => void;
  addEquipment: (item: Equipment) => void;
  updateEquipmentStatus: (id: string, status: Equipment["status"]) => void;
  acknowledgeIncident: (id: string) => void;
  addIncident: (inc: SafetyIncident) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  addReadingAndPrediction: (eqId: string, reading: SensorReading, pred: PredictionResult) => void;
  resetNotificationsCount: () => void;
  triggerEmergencySimulation: (eqId: string) => void;
  addAuditReport: (report: AuditReport) => void;
  acknowledgeAllIncidents: () => void;

  addHistory: (category: HistoryRecord["category"], title: string, description: string, userOverride?: any) => void;
  registerWorker: (fullName: string, email: string, role: "Worker" | "Viewer" | "Manager") => void;
  fireWorker: (email: string) => void;
  punchInWorker: (email: string, name: string) => void;
  punchOutWorker: (email: string) => void;
  setSafetyCleared: (email: string, cleared: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  updateUser: (updatedFields: Partial<User>) => void;
  trackUserEvent: (title: string, description: string) => void;
}

// Hydrate the equipment readings with some nice historical curves
const generateInitialHistory = (eqList: Equipment[]) => {
  const readingsMap: Record<string, SensorReading[]> = {};
  const predictionsMap: Record<string, PredictionResult[]> = {};

  eqList.forEach((eq) => {
    const readings: SensorReading[] = [];
    const predictions: PredictionResult[] = [];
    const now = new Date();

    // Generate 12 past data points (e.g. 1 per hour)
    for (let i = 12; i >= 0; i--) {
      const logTime = new Date(now.getTime() - i * 3600000).toISOString();
      
      // Determine baseline metrics depending on model type
      let temp = 55 + Math.sin(i * 0.5) * 5 + (eq.status !== "nominal" ? 18 : 0);
      let vib = 1.2 + Math.cos(i * 0.6) * 0.3 + (eq.status === "critical" ? 2.5 : eq.status === "warning" ? 1.0 : 0);
      let press = 4.8 + Math.sin(i * 0.8) * 0.4 + (eq.status === "emergency" ? -1.8 : 0);
      let volts = 220 + Math.sin(i * 0.2) * 4;
      let curr = 8.5 + Math.cos(i * 0.3) * 0.5 + (eq.status === "critical" ? 4.0 : 0);

      // Add a high stress failure simulation point for critical/emergency systems
      if (i === 0) {
        if (eq.status === "warning") {
          temp += 8;
          vib += 0.8;
        } else if (eq.status === "critical") {
          temp += 20;
          vib += 2.5;
          press += 1.5;
        } else if (eq.status === "emergency") {
          temp += 35;
          vib += 4.5;
          press -= 2.2;
        }
      }

      const reading: SensorReading = {
        id: `r-${eq.id}-${i}`,
        equipment_id: eq.id,
        timestamp: logTime,
        temperature: Number(temp.toFixed(1)),
        vibration: Number(vib.toFixed(2)),
        pressure: Number(press.toFixed(2)),
        voltage: Number(volts.toFixed(1)),
        current: Number(curr.toFixed(2))
      };

      const pred = computeLocalPredictiveMaintenance(
        reading.temperature,
        reading.vibration,
        reading.pressure,
        reading.voltage,
        reading.current
      );

      readings.push(reading);
      predictions.push(pred);
    }

    readingsMap[eq.id] = readings;
    predictionsMap[eq.id] = predictions;
  });

  return { readingsMap, predictionsMap };
};

const initialEq = [...MOCK_EQUIPMENT];
const { readingsMap, predictionsMap } = generateInitialHistory(initialEq);

// Pre-seeded multi-role industrial user matrices (Manager, Worker, Viewer)
const MOCK_REGISTERED_WORKERS: User[] = [
  {
    id: "usr-admin-01",
    email: "operator@factorygpt.lan",
    full_name: "Technical Specialist Connor Devlin",
    role: "Admin",
    permissions: ["Admin", "Manager", "Viewer"],
    is_active: true,
    created_at: "2025-10-01T00:00:00Z",
    work_description: "Administers factory PLC control kernels and predictive telemetry databases.",
    position: "Technical Specialist & Lead Admin"
  },
  {
    id: "usr-manager-01",
    email: "robert.vance@factorygpt.lan",
    full_name: "Operations Manager Robert Vance",
    role: "Manager",
    permissions: ["Manager", "Viewer"],
    is_active: true,
    created_at: "2025-05-10T07:30:00Z",
    work_description: "Coordinates production goals and signs off on heavy mechanical overhauls.",
    position: "Operations Manager"
  },
  {
    id: "usr-manager-02",
    email: "arthur.vance@factorygpt.lan",
    full_name: "Quality Systems Manager Arthur Vance",
    role: "Manager",
    permissions: ["Manager", "Viewer"],
    is_active: true,
    created_at: "2026-01-15T08:30:00Z",
    work_description: "Monitors overall efficiency KPIs and implements continuous process enhancements.",
    position: "Quality Systems Manager"
  },
  {
    id: "usr-manager-03",
    email: "evelyn.sinclair@factorygpt.lan",
    full_name: "Senior Supervisor Evelyn Sinclair",
    role: "Manager",
    permissions: ["Manager", "Viewer"],
    is_active: true,
    created_at: "2026-02-20T09:00:00Z",
    work_description: "Audits operator safety compliance and authorizes hazard warning siren clearances.",
    position: "Senior Control Center Supervisor"
  },
  {
    id: "usr-worker-01",
    email: "carter@factorygpt.lan",
    full_name: "Technician S. Carter",
    role: "Worker",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2025-11-12T08:00:00Z",
    work_description: "Maintains reactor core GA cryogenic seals and supervises nitrogen cooling loops.",
    position: "Senior Technician"
  },
  {
    id: "usr-worker-02",
    email: "sarah.riggs@factorygpt.lan",
    full_name: "Operator Sarah Riggs",
    role: "Worker",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2025-12-01T09:15:00Z",
    work_description: "Calibrates robotic articulated hinges and controls welder conveyor feeds.",
    position: "Operations Operator"
  },
  {
    id: "usr-worker-03",
    email: "marcus.brody@factorygpt.lan",
    full_name: "Technician Marcus Brody",
    role: "Worker",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2026-03-01T08:00:00Z",
    work_description: "Optimizes 6-axis kinematics and welds alignment parameters.",
    position: "Automation Assembly Technician"
  },
  {
    id: "usr-worker-04",
    email: "elena.rostova@factorygpt.lan",
    full_name: "Inspector Elena Rostova",
    role: "Worker",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2026-03-05T08:15:00Z",
    work_description: "Monitors geothermal steam vent backpressure and logs acid scrubber levels.",
    position: "High-Pressure Vent Inspector"
  },
  {
    id: "usr-worker-05",
    email: "david.chen@factorygpt.lan",
    full_name: "Technician David Chen",
    role: "Worker",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2026-03-10T08:30:00Z",
    work_description: "Calibrates high-speed liquid flow pumps and inspects dry pipe relief gates.",
    position: "Cryogenic Cooling Specialist"
  },
  {
    id: "usr-worker-06",
    email: "sarah.jenkins@factorygpt.lan",
    full_name: "Operator Sarah Jenkins",
    role: "Worker",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2026-03-15T09:00:00Z",
    work_description: "Monitors factory neural supercomputer thermal outputs for training pipelines.",
    position: "GPU Diagnostics Operator"
  },
  {
    id: "usr-worker-07",
    email: "jack.reynolds@factorygpt.lan",
    full_name: "Technician Jack Reynolds",
    role: "Worker",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2026-03-20T08:00:00Z",
    work_description: "Conducts heavy gear friction inspections and replaces micro-bearing housings.",
    position: "Mechanical Integration Journeyman"
  },
  {
    id: "usr-worker-08",
    email: "priya.sharma@factorygpt.lan",
    full_name: "Technician Priya Sharma",
    role: "Worker",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2026-03-25T08:10:00Z",
    work_description: "Balances phase-load shifts across gas expansion cogeneration feeders.",
    position: "Electrical Grid Specialist"
  },
  {
    id: "usr-worker-09",
    email: "liam.patterson@factorygpt.lan",
    full_name: "Technician Liam Patterson",
    role: "Worker",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2026-03-28T08:20:00Z",
    work_description: "Maintains solenoid valves, pilot air manifolds, and actuators.",
    position: "Pneumatic Controls Mechanic"
  },
  {
    id: "usr-worker-10",
    email: "chloe.dubois@factorygpt.lan",
    full_name: "Operator Chloe Dubois",
    role: "Worker",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2026-04-01T08:30:00Z",
    work_description: "Samples sub-micron hazardous particles and validates argon gas sensors.",
    position: "Aerosol Detection Technician"
  },
  {
    id: "usr-worker-11",
    email: "samuel.okoro@factorygpt.lan",
    full_name: "Operator Samuel Okoro",
    role: "Worker",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2026-04-05T08:45:00Z",
    work_description: "Performs real-time spectral analyzer tests on bearing outer rings.",
    position: "Vibration Diagnostics Operator"
  },
  {
    id: "usr-worker-12",
    email: "natalie.voight@factorygpt.lan",
    full_name: "Technician Natalie Voight",
    role: "Worker",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2026-04-10T09:00:00Z",
    work_description: "Maintains turbine hydraulic feed systems and filters oil residue.",
    position: "Scavenger Loop Mechanic"
  },
  {
    id: "usr-viewer-01",
    email: "emily.watson@factorygpt.lan",
    full_name: "Auditor Emily Watson",
    role: "Viewer",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2026-04-15T09:30:00Z",
    work_description: "Observes facility emissions indicators and safety compliance trends.",
    position: "Environmental Auditor"
  },
  {
    id: "usr-viewer-02",
    email: "kenji.takahashi@factorygpt.lan",
    full_name: "Observer Kenji Takahashi",
    role: "Viewer",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2026-04-20T10:00:00Z",
    work_description: "Monitors real-time factory productivity metrics and layout streams.",
    position: "Venture Operations Observer"
  },
  {
    id: "usr-viewer-03",
    email: "sofia.martinez@factorygpt.lan",
    full_name: "Supervisor Sofia Martinez",
    role: "Viewer",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2026-04-25T11:00:00Z",
    work_description: "Observes floor hazard scan events and registers non-compliant incidents.",
    position: "Safety Board Supervisor"
  },
  {
    id: "usr-viewer-04",
    email: "christian.lind@factorygpt.lan",
    full_name: "Officer Christian Lind",
    role: "Viewer",
    permissions: ["Viewer"],
    is_active: true,
    created_at: "2026-05-01T11:30:00Z",
    work_description: "Observes floor layout operations and maps digital twin locator nodes.",
    position: "Systems Trainee Officer"
  }
];

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "att-01",
    userEmail: "carter@factorygpt.lan",
    workerName: "Technician S. Carter",
    punchIn: "2026-06-18T08:00:00Z",
    punchOut: "2026-06-18T16:00:00Z",
    status: "completed",
    safetyCleared: true
  },
  {
    id: "att-02",
    userEmail: "sarah.riggs@factorygpt.lan",
    workerName: "Operator Sarah Riggs",
    punchIn: "2026-06-18T13:45:00Z",
    status: "active",
    safetyCleared: false
  }
];

const MOCK_HISTORY: HistoryRecord[] = [
  {
    id: "hist-01",
    timestamp: "2026-06-18T08:00:00Z",
    userEmail: "carter@factorygpt.lan",
    workerName: "Technician S. Carter",
    role: "Worker",
    category: "AUTHENTICATION",
    title: "OPERATIVE SESSION STACK OPEN",
    description: "Technician S. Carter established login session on Terminal Node Alpha."
  },
  {
    id: "hist-02",
    timestamp: "2026-06-18T08:05:00Z",
    userEmail: "carter@factorygpt.lan",
    workerName: "Technician S. Carter",
    role: "Worker",
    category: "SAFETY_SCAN",
    title: "COMPUTER VISION COMPLIANCE APPROVED",
    description: "Helmet, Suit, and Gloves scanning routine evaluated with maximum safety clearances (👍 Approved)."
  },
  {
    id: "hist-03",
    timestamp: "2026-06-18T10:45:00Z",
    userEmail: "operator@factorygpt.lan",
    workerName: "Technical Specialist Connor Devlin",
    role: "Admin",
    category: "ALARM_CLEARANCE",
    title: "CRITICAL HAZARD MUTED",
    description: "Admin Connor Devlin manually squelched sound alert for Active Technician mask breach."
  }
];

// Safe local storage helpers for persistence
const getStoredUser = (): User | null => {
  try {
    const saved = localStorage.getItem("factory_gpt_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const getStoredMode = (): "connected" | "demo" => {
  try {
    const saved = localStorage.getItem("factory_gpt_mode");
    return (saved as any) || "demo";
  } catch {
    return "demo";
  }
};

const generateUniqueId = (prefix: string): string => {
  const randomStr = Math.random().toString(36).substring(2, 11);
  return `${prefix}-${Date.now()}-${randomStr}`;
};

const getStoredHistory = (): HistoryRecord[] => {
  try {
    const saved = localStorage.getItem("factory_gpt_history");
    const raw: HistoryRecord[] = saved ? JSON.parse(saved) : MOCK_HISTORY;
    const seen = new Set<string>();
    return raw.map((item) => {
      if (!item.id || seen.has(item.id)) {
        const uniqueId = generateUniqueId("hist");
        seen.add(uniqueId);
        return { ...item, id: uniqueId };
      }
      seen.add(item.id);
      return item;
    });
  } catch {
    return MOCK_HISTORY;
  }
};

const getStoredWorkers = (): User[] => {
  try {
    const saved = localStorage.getItem("factory_gpt_workers");
    const raw: User[] = (saved && JSON.parse(saved).length >= MOCK_REGISTERED_WORKERS.length) ? JSON.parse(saved) : MOCK_REGISTERED_WORKERS;
    const seen = new Set<string>();
    return raw.map((item) => {
      if (!item.id || seen.has(item.id)) {
        const uniqueId = generateUniqueId("usr");
        seen.add(uniqueId);
        return { ...item, id: uniqueId };
      }
      seen.add(item.id);
      return item;
    });
  } catch {
    return MOCK_REGISTERED_WORKERS;
  }
};

const getStoredAttendance = (): AttendanceRecord[] => {
  try {
    const saved = localStorage.getItem("factory_gpt_attendance");
    const raw: AttendanceRecord[] = saved ? JSON.parse(saved) : MOCK_ATTENDANCE;
    const seen = new Set<string>();
    return raw.map((item) => {
      if (!item.id || seen.has(item.id)) {
        const uniqueId = generateUniqueId("att");
        seen.add(uniqueId);
        return { ...item, id: uniqueId };
      }
      seen.add(item.id);
      return item;
    });
  } catch {
    return MOCK_ATTENDANCE;
  }
};

const saveHistory = (hist: HistoryRecord[]) => {
  try {
    localStorage.setItem("factory_gpt_history", JSON.stringify(hist));
  } catch {}
};

const saveWorkers = (workers: User[]) => {
  try {
    localStorage.setItem("factory_gpt_workers", JSON.stringify(workers));
  } catch {}
};

const saveAttendance = (att: AttendanceRecord[]) => {
  try {
    localStorage.setItem("factory_gpt_attendance", JSON.stringify(att));
  } catch {}
};

const getStoredRoleMessages = (): Record<string, ChatMessage[]> => {
  try {
    const saved = localStorage.getItem("factory_gpt_role_messages");
    if (saved) return JSON.parse(saved);
  } catch {}
  
  return {
    Admin: [
      {
        id: "chat-admin-01",
        role: "assistant",
        text: "🚨 COBALT SECURE MAINFRAME: ADMINISTRATOR CHAT PORTAL ONLINE.\n\nPermissions level: SUPERUSER / ROOT. Authorized to audit personnel, query active workforces, deploy maintenance tasks, and modify physical telemetry bounds.",
        timestamp: new Date().toISOString()
      }
    ],
    Manager: [
      {
        id: "chat-manager-01",
        role: "assistant",
        text: "📋 MANAGEMENT CONTROL INTERFACE: MANAGER COPILOT LINKED.\n\nPermissions level: OPERATION CONTROL. Ready to fetch real-time attendance rosters, calculate team utilization, review maintenance logs, and manage shift schedules.",
        timestamp: new Date().toISOString()
      }
    ],
    Worker: [
      {
        id: "chat-worker-01",
        role: "assistant",
        text: "🔧 FIELD FORCE AUXILIARY: WORKER PILOT ONLINE.\n\nPermissions level: FLOOR READ-WRITE. High-stress bearing calibrations guidance, cryogenic cooling target monitoring, and preventive lubrication schedules module active.",
        timestamp: new Date().toISOString()
      }
    ],
    Viewer: [
      {
        id: "chat-viewer-01",
        role: "assistant",
        text: "👁️ AUDITING TERMINAL: READ-ONLY OBSERVATION TOWER ENGAGED.\n\nPermissions level: PUBLIC READ-ONLY. Monitoring real-time reactor metrics, current shift count, active Argon levels, and security event streams.",
        timestamp: new Date().toISOString()
      }
    ]
  };
};

const saveRoleMessages = (roleMsgs: Record<string, ChatMessage[]>) => {
  try {
    localStorage.setItem("factory_gpt_role_messages", JSON.stringify(roleMsgs));
  } catch {}
};

const initialUserForStore = getStoredUser();
const initialRoleMessages = getStoredRoleMessages();
const initialMessagesForStore = initialUserForStore 
  ? (initialRoleMessages[initialUserForStore.role] || initialRoleMessages["Viewer"])
  : initialRoleMessages["Viewer"];

export const useStore = create<StoreState>((set) => ({
  user: initialUserForStore,
  activeTab: "dashboard",
  mode: getStoredMode(),
  equipment: initialEq,
  incidents: MOCK_INCIDENTS,
  roleMessages: initialRoleMessages,
  messages: initialMessagesForStore,
  reports: MOCK_REPORTS,
  readings: readingsMap,
  predictions: predictionsMap,
  notificationsCount: MOCK_INCIDENTS.filter((x) => !x.acknowledged).length,
  attendance: getStoredAttendance(),
  history: getStoredHistory(),
  registeredWorkers: getStoredWorkers(),
  isSidebarCollapsed: false,
  setIsSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
  updateUser: (updatedFields) => set((state) => {
    if (!state.user) return {};
    const updatedUser = { ...state.user, ...updatedFields };
    localStorage.setItem("factory_gpt_user", JSON.stringify(updatedUser));
    
    // Also sync inside registeredWorkers so that they preserve their custom avatar
    const exists = state.registeredWorkers.some(w => w.email.toLowerCase() === updatedUser.email.toLowerCase());
    let updatedRegistered = [];
    if (exists) {
      updatedRegistered = state.registeredWorkers.map(w => 
        w.email.toLowerCase() === updatedUser.email.toLowerCase() ? { ...w, ...updatedFields } : w
      );
    } else {
      updatedRegistered = [...state.registeredWorkers, updatedUser];
    }
    saveWorkers(updatedRegistered);

    const activeRole = updatedUser.role || "Viewer";
    const roleMsgs = state.roleMessages || {};
    const cachedMsgs = roleMsgs[activeRole] || getStoredRoleMessages()[activeRole];

    return { 
      user: updatedUser,
      registeredWorkers: updatedRegistered,
      messages: cachedMsgs
    };
  }),

  setUser: (user) => set((state) => {
    const roleMsgs = state.roleMessages || {};
    if (user) {
      localStorage.setItem("factory_gpt_user", JSON.stringify(user));
      // Log sign on
      const logRecord: HistoryRecord = {
        id: generateUniqueId("hist"),
        timestamp: new Date().toISOString(),
        userEmail: user.email,
        workerName: user.full_name,
        role: user.role,
        category: "AUTHENTICATION",
        title: "OPERATIVE SIGN-ON COMPLETED",
        description: `User established connection session as [${user.role.toUpperCase()}] hierarchy.`
      };
      const nextHist = [logRecord, ...state.history];
      saveHistory(nextHist);

      const activeRole = user.role;
      const cachedMsgs = roleMsgs[activeRole] || getStoredRoleMessages()[activeRole];

      return { 
        user, 
        history: nextHist,
        messages: cachedMsgs
      };
    } else {
      const oldUser = state.user;
      localStorage.removeItem("factory_gpt_user");
      let nextHistory = state.history;
      if (oldUser) {
        const logRecord: HistoryRecord = {
          id: generateUniqueId("hist"),
          timestamp: new Date().toISOString(),
          userEmail: oldUser.email,
          workerName: oldUser.full_name,
          role: oldUser.role,
          category: "AUTHENTICATION",
          title: "OPERATIVE SESSION TERMINATED",
          description: `User severed active terminal tokens and logged out.`
        };
        nextHistory = [logRecord, ...state.history];
      }
      saveHistory(nextHistory);

      const cachedMsgs = roleMsgs["Viewer"] || getStoredRoleMessages()["Viewer"];

      return { 
        user: null, 
        history: nextHistory,
        messages: cachedMsgs
      };
    }
  }),

  setActiveTab: (activeTab) => set((state) => {
    if (state.activeTab === activeTab) {
      return { activeTab };
    }
    const triggerUser = state.user;
    const logRecord: HistoryRecord = {
      id: generateUniqueId("hist"),
      timestamp: new Date().toISOString(),
      userEmail: triggerUser?.email || "anonymous@factorygpt.lan",
      workerName: triggerUser?.full_name || "Anonymous Operator",
      role: triggerUser?.role || "Viewer",
      category: "PAGE_VIEW",
      title: "VIEWPORT CONSOLE TRANSITION",
      description: `User routed console terminal access to active viewport [${activeTab.toUpperCase()}].`
    };
    const nextHist = [logRecord, ...state.history];
    saveHistory(nextHist);
    return { activeTab, history: nextHist };
  }),

  setMode: (mode) => set((state) => {
    localStorage.setItem("factory_gpt_mode", mode);
    const triggerUser = state.user;
    const logRecord: HistoryRecord = {
      id: generateUniqueId("hist"),
      timestamp: new Date().toISOString(),
      userEmail: triggerUser?.email || "system@factorygpt.lan",
      workerName: triggerUser?.full_name || "System Automated Sync",
      role: triggerUser?.role || "Viewer",
      category: "SYSTEM_RESET",
      title: "CONNECTION STACK ROTATED",
      description: `Rotated connection interface layout to [${mode === "connected" ? "CONNECTED COBALT API" : "OFFLINE TELEMETRY SIMULATOR"}]. Router state restructured.`
    };
    const nextHist = [logRecord, ...state.history];
    saveHistory(nextHist);
    return { mode, history: nextHist };
  }),

  setEquipment: (equipment) => set({ equipment }),

  addEquipment: (item) => set((state) => {
    const newEquipment = [item, ...state.equipment];
    const { readingsMap: newR, predictionsMap: newP } = generateInitialHistory([item]);
    
    const triggerUser = state.user;
    const logRecord: HistoryRecord = {
      id: generateUniqueId("hist"),
      timestamp: new Date().toISOString(),
      userEmail: triggerUser?.email || "system@factorygpt.lan",
      workerName: triggerUser?.full_name || "System Automated Sync",
      role: triggerUser?.role || "Admin",
      category: "WORKER_REGISTRATION",
      title: "EQUIPMENT HARDWARE COMMITTED",
      description: `Registered and configured new physical element plate: ${item.name} (${item.serial_number}) inside ${item.zone}.`
    };

    const nextHist = [logRecord, ...state.history];
    saveHistory(nextHist);

    return {
      equipment: newEquipment,
      readings: { ...state.readings, ...newR },
      predictions: { ...state.predictions, ...newP },
      history: nextHist
    };
  }),

  updateEquipmentStatus: (id, status) => set((state) => {
    const updated = state.equipment.map((eq) =>
      eq.id === id ? { ...eq, status } : eq
    );
    return { equipment: updated };
  }),

  acknowledgeIncident: (id) => set((state) => {
    const targetInc = state.incidents.find(i => i.id === id);
    const updated = state.incidents.map((inc) =>
      inc.id === id ? { ...inc, acknowledged: true } : inc
    );
    const count = updated.filter((x) => !x.acknowledged).length;

    const triggerUser = state.user;
    let extraLogs: HistoryRecord[] = [];
    if (targetInc) {
      const logRecord: HistoryRecord = {
        id: generateUniqueId("hist"),
        timestamp: new Date().toISOString(),
        userEmail: triggerUser?.email || "system@factorygpt.lan",
        workerName: triggerUser?.full_name || "System Automated Sync",
        role: triggerUser?.role || "Viewer",
        category: "ALARM_CLEARANCE",
        title: `ALERT SQUELCHED: ${targetInc.category}`,
        description: `Resolved pending emergency for [${targetInc.zone}]: "${targetInc.message}". Code level cleared.`
      };
      extraLogs = [logRecord];
    }

    const nextHist = [...extraLogs, ...state.history];
    saveHistory(nextHist);

    return {
      incidents: updated,
      notificationsCount: count,
      history: nextHist
    };
  }),

  addIncident: (inc) => set((state) => {
    const updated = [inc, ...state.incidents];
    return {
      incidents: updated,
      notificationsCount: updated.filter((x) => !x.acknowledged).length
    };
  }),

  addChatMessage: (msg) => set((state) => {
    const triggerUser = state.user;
    const activeRole = triggerUser?.role || "Viewer";
    let extraLogs: HistoryRecord[] = [];
    if (msg.role === "user") {
      const logRecord: HistoryRecord = {
        id: generateUniqueId("hist"),
        timestamp: new Date().toISOString(),
        userEmail: triggerUser?.email || "system@factorygpt.lan",
        workerName: triggerUser?.full_name || "Factory Operator",
        role: activeRole,
        category: "COPILOT",
        title: "COGNITIVE QUERY DISPATCHED",
        description: `Sent question: "${msg.text.slice(0, 50)}${msg.text.length > 50 ? "..." : ""}" to the teletype copilot.`
      };
      extraLogs = [logRecord];
    }
    
    const roleMsgs = state.roleMessages || {};
    const currentRoleMsgs = roleMsgs[activeRole] || [];
    const updatedRoleMsgs = [...currentRoleMsgs, msg];
    
    const nextRoleMessages = {
      ...roleMsgs,
      [activeRole]: updatedRoleMsgs
    };
    saveRoleMessages(nextRoleMessages);

    return {
      roleMessages: nextRoleMessages,
      messages: updatedRoleMsgs,
      history: [...extraLogs, ...state.history]
    };
  }),

  clearChat: () => set((state) => {
    const activeRole = state.user?.role || "Viewer";
    const defaultRoleMsgs = getStoredRoleMessages()[activeRole] || [];
    const firstMsg = defaultRoleMsgs[0] || {
      id: "chat-fallback",
      role: "assistant",
      text: "FactoryGPT console reset.",
      timestamp: new Date().toISOString()
    };
    
    const roleMsgs = state.roleMessages || {};
    const nextRoleMessages = {
      ...roleMsgs,
      [activeRole]: [firstMsg]
    };
    saveRoleMessages(nextRoleMessages);

    return {
      roleMessages: nextRoleMessages,
      messages: [firstMsg]
    };
  }),

  addReadingAndPrediction: (eqId, reading, pred) => set((state) => {
    const currentReadings = state.readings[eqId] || [];
    const currentPreds = state.predictions[eqId] || [];

    // Keep history sized to trailing 30 entries to prevent over-bloating charts
    const updatedReadings = [...currentReadings, reading].slice(-30);
    const updatedPreds = [...currentPreds, pred].slice(-30);

    // Also sync master equipment array status indicator
    const updatedEquipment = state.equipment.map((eq) =>
      eq.id === eqId ? { ...eq, status: pred.risk_level } : eq
    );

    // If critical or emergency, also inject an automated incident alarm!
    let newIncident: SafetyIncident | null = null;
    if (pred.risk_level === "critical" || pred.risk_level === "emergency") {
      const eqItem = state.equipment.find((x) => x.id === eqId);
      newIncident = {
        id: generateUniqueId("inc-auto"),
        zone: eqItem?.zone || "Central Manufacturing Unit",
        category: "Thermal Spike",
        message: `Anomalous prediction spike calculated on '${eqItem?.name || "Equipment"}'. XGBoost Failure Probability hit ${(pred.failure_probability * 100).toFixed(1)}%. Triggered background alert response cascade.`,
        level: pred.risk_level,
        timestamp: new Date().toISOString(),
        acknowledged: false
      };
    }

    const updatedIncidents = newIncident ? [newIncident, ...state.incidents] : state.incidents;

    return {
      readings: { ...state.readings, [eqId]: updatedReadings },
      predictions: { ...state.predictions, [eqId]: updatedPreds },
      equipment: updatedEquipment,
      incidents: updatedIncidents,
      notificationsCount: updatedIncidents.filter((x) => !x.acknowledged).length
    };
  }),

  resetNotificationsCount: () => set({ notificationsCount: 0 }),

  addAuditReport: (report) => set((state) => ({
    reports: [report, ...state.reports]
  })),

  acknowledgeAllIncidents: () => set((state) => {
    const updated = state.incidents.map((inc) => ({ ...inc, acknowledged: true }));
    const triggerUser = state.user;
    const logRecord: HistoryRecord = {
      id: generateUniqueId("hist"),
      timestamp: new Date().toISOString(),
      userEmail: triggerUser?.email || "system@factorygpt.lan",
      workerName: triggerUser?.full_name || "System Automated Sync",
      role: triggerUser?.role || "Viewer",
      category: "ALARM_CLEARANCE",
      title: "BULK ALARM SILENCE EXECUTED",
      description: `Operator triggered bulk dismissal and acknowledged all pending alert logs.`
    };
    const nextHist = [logRecord, ...state.history];
    saveHistory(nextHist);
    return {
      incidents: updated,
      notificationsCount: 0,
      history: nextHist
    };
  }),

  triggerEmergencySimulation: (eqId) => set((state) => {
    const targetEq = state.equipment.find((x) => x.id === eqId);
    if (!targetEq) return {};

    const nowStr = new Date().toISOString();
    const abnormalReading: SensorReading = {
      id: generateUniqueId("r-abn"),
      equipment_id: eqId,
      timestamp: nowStr,
      temperature: 110.4,
      vibration: 8.8,
      pressure: 8.9,
      voltage: 190.5,
      current: 16.2
    };

    const pred = computeLocalPredictiveMaintenance(
      abnormalReading.temperature,
      abnormalReading.vibration,
      abnormalReading.pressure,
      abnormalReading.voltage,
      abnormalReading.current
    );

    const updatedReadings = [...(state.readings[eqId] || []), abnormalReading].slice(-30);
    const updatedPreds = [...(state.predictions[eqId] || []), pred].slice(-30);

    const updatedEquipment = state.equipment.map((eq) =>
      eq.id === eqId ? { ...eq, status: pred.risk_level } : eq
    );

    const alertInc: SafetyIncident = {
      id: generateUniqueId("inc-sim"),
      zone: targetEq.zone || "Main Complex",
      category: "Thermal Spike",
      message: `SIMULATION ESCALATION: '${targetEq.name}' thermal breach threshold tripped! Physical limits logs: Temp=110.4°C, Vib=8.8mm/s. Operational Status elevated to EMERGENCY.`,
      level: "emergency",
      timestamp: nowStr,
      acknowledged: false
    };

    const updatedIncidents = [alertInc, ...state.incidents];

    const triggerUser = state.user;
    const logRecord: HistoryRecord = {
      id: generateUniqueId("hist"),
      timestamp: new Date().toISOString(),
      userEmail: triggerUser?.email || "system@factorygpt.lan",
      workerName: triggerUser?.full_name || "System Automated Sync",
      role: triggerUser?.role || "Admin",
      category: "ALARM_CLEARANCE",
      title: "PHYSICAL DRILL TRIGGERED",
      description: `Wired custom emergency simulation drill on hardware item: '${targetEq.name.toUpperCase()}'.`
    };

    const nextHist = [logRecord, ...state.history];
    saveHistory(nextHist);

    return {
      readings: { ...state.readings, [eqId]: updatedReadings },
      predictions: { ...state.predictions, [eqId]: updatedPreds },
      equipment: updatedEquipment,
      incidents: updatedIncidents,
      notificationsCount: updatedIncidents.filter((x) => !x.acknowledged).length,
      history: nextHist
    };
  }),

  addHistory: (category, title, description, userOverride) => set((state) => {
    const trigger = userOverride || state.user;
    const newRecord: HistoryRecord = {
      id: generateUniqueId("hist"),
      timestamp: new Date().toISOString(),
      userEmail: trigger?.email || "anonymous@factorygpt.lan",
      workerName: trigger?.full_name || "Anonymous Operator",
      role: trigger?.role || "Viewer",
      category,
      title,
      description
    };
    const nextHist = [newRecord, ...state.history];
    saveHistory(nextHist);
    return { history: nextHist };
  }),

  registerWorker: (fullName, email, role) => set((state) => {
    const newWorker: User = {
      id: generateUniqueId("usr-reg"),
      email,
      full_name: fullName,
      role,
      permissions: role === "Manager" ? ["Viewer", "Manager"] : ["Viewer"],
      is_active: true,
      created_at: new Date().toISOString(),
      work_description: role === "Manager" ? "Coordinates localized staff tasking and signs off on shift maintenance." : role === "Worker" ? "Executes floor machinery checklists and monitors warning anomalies." : "Monitors floor layout operations and maps digital twin locator nodes.",
      position: role === "Manager" ? "Predictive Maintenance Engineer" : role === "Worker" ? "Field Operations Specialist" : "Standard Floor Observer"
    };
    const triggerUser = state.user;
    const logRecord: HistoryRecord = {
      id: generateUniqueId("hist"),
      timestamp: new Date().toISOString(),
      userEmail: triggerUser?.email || "system@factorygpt.lan",
      workerName: triggerUser?.full_name || "System Automated Sync",
      role: triggerUser?.role || "Admin",
      category: "WORKER_REGISTRATION",
      title: "NEW FACTORY STAFF ENROLLED",
      description: `Registered employee "${fullName.toUpperCase()}" with standard operational access [${role.toUpperCase()}].`
    };
    const nextWorkers = [...state.registeredWorkers, newWorker];
    const nextHist = [logRecord, ...state.history];
    saveWorkers(nextWorkers);
    saveHistory(nextHist);
    return {
      registeredWorkers: nextWorkers,
      history: nextHist
    };
  }),

  fireWorker: (email) => set((state) => {
    const firedWorker = state.registeredWorkers.find((w) => w.email === email);
    const updatedWorkers = state.registeredWorkers.filter((w) => w.email !== email);
    const triggerUser = state.user;

    const logRecord: HistoryRecord = {
      id: generateUniqueId("hist"),
      timestamp: new Date().toISOString(),
      userEmail: triggerUser?.email || "system@factorygpt.lan",
      workerName: triggerUser?.full_name || "System Automated Sync",
      role: triggerUser?.role || "Admin",
      category: "AUTHENTICATION",
      title: "FACTORY STAFF PERMANENT DISMISSAL",
      description: firedWorker
        ? `Operative "${firedWorker.full_name.toUpperCase()}" [Role: ${firedWorker.role.toUpperCase()}] was permanently discharged and security access revoked by ${triggerUser?.full_name || "SysAdmin"}.`
        : `Employee credentials corresponding to "${email}" were revoked from memory.`
    };

    const nextHist = [logRecord, ...state.history];
    saveWorkers(updatedWorkers);
    saveHistory(nextHist);

    return {
      registeredWorkers: updatedWorkers,
      history: nextHist
    };
  }),

  punchInWorker: (email, name) => set((state) => {
    const filteredAttendance = state.attendance.filter(a => !(a.userEmail === email && a.status === "active"));
    const newPunch: AttendanceRecord = {
      id: generateUniqueId("att"),
      userEmail: email,
      workerName: name,
      punchIn: new Date().toISOString(),
      status: "active",
      safetyCleared: false
    };
    const triggerUser = state.user;
    const logRecord: HistoryRecord = {
      id: generateUniqueId("hist"),
      timestamp: new Date().toISOString(),
      userEmail: email,
      workerName: name,
      role: triggerUser?.role || "Worker",
      category: "ATTENDANCE",
      title: "FIELD SHIFT SIGNED-ON (PUNCH IN)",
      description: `Technician "${name.toUpperCase()}" clocked-in for industrial-duty. Restricting shift safety scan.`
    };

    const nextAttendance = [newPunch, ...filteredAttendance];
    const nextHist = [logRecord, ...state.history];
    saveAttendance(nextAttendance);
    saveHistory(nextHist);

    return {
      attendance: nextAttendance,
      history: nextHist
    };
  }),

  punchOutWorker: (email) => set((state) => {
    let workerNameOfPunch = "";
    const updated = state.attendance.map((a) => {
      if (a.userEmail === email && a.status === "active") {
        workerNameOfPunch = a.workerName;
        return {
          ...a,
          punchOut: new Date().toISOString(),
          status: "completed" as const
        };
      }
      return a;
    });
    const triggerUser = state.user;
    const logRecord: HistoryRecord = {
      id: generateUniqueId("hist"),
      timestamp: new Date().toISOString(),
      userEmail: email,
      workerName: workerNameOfPunch || "Worker",
      role: triggerUser?.role || "Worker",
      category: "ATTENDANCE",
      title: "FIELD SHIFT SIGNED-OFF (PUNCH OUT)",
      description: `Technician terminated active shift duty. System state committed.`
    };

    const nextHist = [logRecord, ...state.history];
    saveAttendance(updated);
    saveHistory(nextHist);

    return {
      attendance: updated,
      history: nextHist
    };
  }),

  setSafetyCleared: (email, cleared) => set((state) => {
    let workerNameOfCleared = "";
    const updated = state.attendance.map((a) => {
      if (a.userEmail === email && a.status === "active") {
        workerNameOfCleared = a.workerName;
        return {
          ...a,
          safetyCleared: cleared
        };
      }
      return a;
    });
    const triggerUser = state.user;
    let extraLogs: HistoryRecord[] = [];
    if (cleared) {
      const logRecord: HistoryRecord = {
        id: generateUniqueId("hist"),
        timestamp: new Date().toISOString(),
        userEmail: email,
        workerName: workerNameOfCleared || "Worker",
        role: triggerUser?.role || "Worker",
        category: "SAFETY_SCAN",
        title: "CV COMPLIANCE APPROVAL ISSUED",
        description: `Computer Vision scanner issued biometric & PPE clearances for technician "${workerNameOfCleared}".`
      };
      extraLogs = [logRecord];
    }

    const nextHist = [...extraLogs, ...state.history];
    saveAttendance(updated);
    saveHistory(nextHist);
    return {
      attendance: updated,
      history: nextHist
    };
  }),

  trackUserEvent: (title, description) => set((state) => {
    const triggerUser = state.user;
    const logRecord: HistoryRecord = {
      id: generateUniqueId("hist"),
      timestamp: new Date().toISOString(),
      userEmail: triggerUser?.email || "anonymous@factorygpt.lan",
      workerName: triggerUser?.full_name || "Anonymous Operator",
      role: triggerUser?.role || "Viewer",
      category: "USER_EVENT",
      title,
      description
    };
    const nextHist = [logRecord, ...state.history];
    saveHistory(nextHist);
    return { history: nextHist };
  })
}));
