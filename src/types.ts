export type UserRole = "Admin" | "Manager" | "Worker" | "Viewer";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  work_description?: string;
  position?: string;
  avatar_url?: string;
}

export interface Equipment {
  id: string;
  name: string;
  serial_number: string;
  status: "nominal" | "warning" | "critical" | "emergency";
  model_type: "Turbine" | "Pump" | "Compressor" | "Generator";
  install_date: string;
  zone?: string;
}

export interface SensorReading {
  id: string;
  equipment_id: string;
  timestamp: string;
  temperature: number;
  vibration: number;
  pressure: number;
  voltage?: number;
  current?: number;
}

export interface PredictionResult {
  failure_probability: number;
  risk_level: "nominal" | "warning" | "critical" | "emergency";
  predicted_remaining_useful_life_hours: number;
  shap_explanation: Record<string, number>;
  engineered_features_snapshot: Record<string, number>;
}

export interface SafetyIncident {
  id: string;
  zone: string;
  category: "PPE Breach" | "Gas Leak" | "Thermal Spike" | "Voltage Sag" | "Pressure Drop";
  message: string;
  level: "nominal" | "warning" | "critical" | "emergency";
  timestamp: string;
  acknowledged: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface AuditReport {
  id: string;
  title: string;
  created_at: string;
  size: string;
  category: "Security" | "Predictive" | "VibeLog" | "AssetHealth";
  author: string;
}

export interface AttendanceRecord {
  id: string;
  userEmail: string;
  workerName: string;
  punchIn: string;
  punchOut?: string;
  status: "completed" | "active";
  safetyCleared: boolean;
}

export interface HistoryRecord {
  id: string;
  timestamp: string;
  userEmail: string;
  workerName: string;
  role: UserRole;
  category: "AUTHENTICATION" | "SAFETY_SCAN" | "ALARM_CLEARANCE" | "EQUIPMENT_MAINTENANCE" | "WORKER_REGISTRATION" | "ATTENDANCE" | "COPILOT" | "SYSTEM_RESET" | "PAGE_VIEW" | "USER_EVENT";
  title: string;
  description: string;
}

export interface AppState {
  user: User | null;
  activeTab: string;
  mode: "connected" | "demo";
  equipment: Equipment[];
  readings: Record<string, SensorReading[]>;
  predictions: Record<string, PredictionResult[]>;
  incidents: SafetyIncident[];
  messages: ChatMessage[];
  reports: AuditReport[];
  notificationsCount: number;
  attendance: AttendanceRecord[];
  history: HistoryRecord[];
  registeredWorkers: User[];
}
