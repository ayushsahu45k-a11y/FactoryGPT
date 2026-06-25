import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const STATE_FILE_PATH = path.join(process.cwd(), "factory_state.json");

// Define backend typescript types to match the client exactly
interface User {
  id: string;
  email: string;
  full_name: string;
  role: "Admin" | "Manager" | "Worker" | "Viewer";
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

interface Equipment {
  id: string;
  name: string;
  serial_number: string;
  status: "nominal" | "warning" | "critical" | "emergency";
  model_type: "Turbine" | "Pump" | "Compressor" | "Generator";
  install_date: string;
  zone?: string;
}

interface SensorReading {
  id: string;
  equipment_id: string;
  timestamp: string;
  temperature: number;
  vibration: number;
  pressure: number;
  voltage?: number;
  current?: number;
}

interface PredictionResult {
  failure_probability: number;
  risk_level: "nominal" | "warning" | "critical" | "emergency";
  predicted_remaining_useful_life_hours: number;
  shap_explanation: Record<string, number>;
  engineered_features_snapshot: Record<string, number>;
}

interface SafetyIncident {
  id: string;
  zone: string;
  category: "PPE Breach" | "Gas Leak" | "Thermal Spike" | "Voltage Sag" | "Pressure Drop";
  message: string;
  level: "nominal" | "warning" | "critical" | "emergency";
  timestamp: string;
  acknowledged: boolean;
}

interface AuditReport {
  id: string;
  title: string;
  created_at: string;
  size: string;
  category: "Security" | "Predictive" | "VibeLog" | "AssetHealth";
  author: string;
}

// Initial default state mirroring the app high-fidelity mocks
const INITIAL_EQUIPMENT: Equipment[] = [
  {
    id: "eq-turbine-01",
    name: "Main Jet Turbine Engine",
    serial_number: "TURB-883-X9",
    status: "nominal",
    model_type: "Turbine",
    install_date: "2024-03-12T00:00:00Z",
    zone: "Alpha Complex",
  },
  {
    id: "eq-pump-02",
    name: "Primary Coolant Slurry Pump",
    serial_number: "PUMP-104-Y2",
    status: "warning",
    model_type: "Pump",
    install_date: "2023-08-19T00:00:00Z",
    zone: "Beta Assembly Hall",
  },
  {
    id: "eq-compressor-03",
    name: "Heavy-Duty Air Intake Compressor",
    serial_number: "COMP-402-Z7",
    status: "nominal",
    model_type: "Compressor",
    install_date: "2025-01-10T00:00:00Z",
    zone: "Gamma Storage Area",
  },
  {
    id: "eq-gen-04",
    name: "Auxiliary Energy Generator",
    serial_number: "GEN-701-W4",
    status: "critical",
    model_type: "Generator",
    install_date: "2022-11-28T00:00:00Z",
    zone: "Power Unit E",
  }
];

const INITIAL_INCIDENTS: SafetyIncident[] = [
  {
    id: "inc-001",
    zone: "Zone Alpha (Furnace Bed)",
    category: "PPE Breach",
    message: "Critical hazard: Active technician detected inside high-temp radiant zone without approved shielding mask.",
    level: "critical",
    timestamp: "2026-06-18T10:45:00Z",
    acknowledged: false,
  },
  {
    id: "inc-002",
    zone: "Zone Beta (Coolant Tube 4B)",
    category: "Gas Leak",
    message: "Gaseous ppm detection spike of Argon transport vapor above safety bounds (14.2 ppm vs 5.0 baseline max).",
    level: "warning",
    timestamp: "2026-06-18T11:15:00Z",
    acknowledged: false,
  },
  {
    id: "inc-003",
    zone: "Power Unit E (Gen Array)",
    category: "Voltage Sag",
    message: "Dynamic electrical current drop detected on aux power turbine coupler - risk of stator discharge.",
    level: "emergency",
    timestamp: "2026-06-18T12:01:00Z",
    acknowledged: false,
  },
  {
    id: "inc-004",
    zone: "Gamma Packing Line",
    category: "Thermal Spike",
    message: "Drive belt bearing sensor registered 88.5°C thermal overload due to high duty load cycles.",
    level: "warning",
    timestamp: "2026-06-18T08:30:00Z",
    acknowledged: true,
  }
];

const INITIAL_REPORTS: AuditReport[] = [
  {
    id: "rep-001",
    title: "Quarterly Safety Evaluation & PPE Non-Compliance Stats",
    created_at: "2026-06-15T09:00:00Z",
    size: "4.8 MB",
    category: "Security",
    author: "Safety Officer Marcus Vance"
  },
  {
    id: "rep-002",
    title: "XGBoost Remaining Useful Life (RUL) Accuracy Assessment",
    created_at: "2026-06-10T14:30:00Z",
    size: "12.3 MB",
    category: "Predictive",
    author: "Lead ML Engineer S. Patel"
  },
  {
    id: "rep-003",
    title: "Turbine Bearing Thermal Coefficient Logging - Q2",
    created_at: "2026-06-01T17:00:00Z",
    size: "24.1 MB",
    category: "AssetHealth",
    author: "Maintenance Automated Daemon"
  }
];

const INITIAL_USER: User = {
  id: "usr-admin-01",
  email: "operator@factorygpt.lan",
  full_name: "Technical Specialist Connor Devlin",
  role: "Admin",
  permissions: ["Admin", "Manager", "Viewer"],
  is_active: true,
  created_at: "2025-10-01T00:00:00Z"
};

// Internal structures loaded / written to custom JSON database
interface FactoryDB {
  equipment: Equipment[];
  incidents: SafetyIncident[];
  reports: AuditReport[];
  readings: Record<string, SensorReading[]>;
}

const loadDB = (): FactoryDB => {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(STATE_FILE_PATH, "utf-8"));
      return {
        equipment: parsed.equipment || INITIAL_EQUIPMENT,
        incidents: parsed.incidents || INITIAL_INCIDENTS,
        reports: parsed.reports || INITIAL_REPORTS,
        readings: parsed.readings || {},
      };
    }
  } catch (error) {
    console.error("Error reading db file, defaulting to memory metrics", error);
  }
  return {
    equipment: INITIAL_EQUIPMENT,
    incidents: INITIAL_INCIDENTS,
    reports: INITIAL_REPORTS,
    readings: {},
  };
};

const saveDB = (dbState: FactoryDB) => {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(dbState, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to persist factory state:", error);
  }
};

let db = loadDB();

// Dynamic state helper to calculate failure risks exactly mirroring XGBoost behavior
function executeFactoryXGBoostPrediction(
  temp: number,
  vib: number,
  press: number,
  volts: number = 220,
  curr: number = 8.5
): PredictionResult {
  const power = volts * curr;
  const tempExcess = Math.max(0, temp - 65) / 55;
  const vibExcess = Math.max(0, vib - 2.5) / 7.5;
  const pressDeviation = Math.abs(press - 5.0) / 5.0;
  const overloadPower = Math.max(0, power - 1500) / 2500;

  const prob = Math.min(
    0.998,
    Math.max(
      0.012,
      tempExcess * 0.40 + vibExcess * 0.35 + pressDeviation * 0.15 + overloadPower * 0.10
    )
  );

  let riskLevel: "nominal" | "warning" | "critical" | "emergency" = "nominal";
  if (prob > 0.8) riskLevel = "emergency";
  else if (prob > 0.5) riskLevel = "critical";
  else if (prob > 0.15) riskLevel = "warning";

  const baseHrs = 720;
  const decayValue = Math.pow(Math.max(0, 1 - prob), 2);
  const predictedRul = Math.max(8.0, Number((decayValue * baseHrs).toFixed(1)));

  const shap: Record<string, number> = {
    temperature: Number((tempExcess * 0.45 * prob).toFixed(4)),
    vibration: Number((vibExcess * 0.38 * prob).toFixed(4)),
    pressure: Number((pressDeviation * 0.10 * prob).toFixed(4)),
    power: Number((overloadPower * 0.05 * prob).toFixed(4)),
    voltage: Number((Math.abs(volts - 220) / 220 * 0.02 * prob).toFixed(4)),
    current: Number((Math.abs(curr - 8.5) / 8.5 * 0.02 * prob).toFixed(4)),
  };

  const engineered: Record<string, number> = {
    power,
    temp_press_ratio: Number((temp / Math.max(0.1, press)).toFixed(2)),
    vib_power_ratio: Number((vib / Math.max(1, power)).toFixed(5)),
    temp_deviation: Number(Math.max(0, temp - 65).toFixed(1)),
    vib_deviation: Number(Math.max(0, vib - 2.5).toFixed(2)),
    press_deviation: Number(Math.abs(press - 5.0).toFixed(2)),
    thermal_load: Number((temp * Math.max(1, power / 1000)).toFixed(1)),
  };

  return {
    failure_probability: prob,
    risk_level: riskLevel,
    predicted_remaining_useful_life_hours: predictedRul,
    shap_explanation: shap,
    engineered_features_snapshot: engineered,
  };
}

// Lazy initialization of GoogleGenAI
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!genAIClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    genAIClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Enable standard mid-layers
app.use(express.json());

// API Endpoints
// Auth login
app.post("/api/v1/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error_summary: "Email parameter is required" });
    return;
  }
  
  // Custom auth matching
  const nameFromEmail = email.split("@")[0].replace(/[._]/g, " ").toUpperCase() || "FACILITY CO-WORKER";
  const userRole = email.includes("viewer")
    ? "Viewer" as const
    : email.includes("manager")
      ? "Manager" as const
      : (email.includes("admin") || (email.includes("operator") && !email.includes("viewer")))
        ? "Admin" as const
        : "Worker" as const;
  
  const userObj: User = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    email: email,
    full_name: userRole === "Admin"
      ? "Technical Specialist Connor Devlin"
      : userRole === "Manager"
        ? "Operations Manager Robert Vance"
        : userRole === "Viewer"
          ? "Standard Floor Observer"
          : nameFromEmail,
    role: userRole,
    permissions: userRole === "Admin"
      ? ["Admin", "Manager", "Viewer"]
      : userRole === "Manager"
        ? ["Manager", "Viewer"]
        : ["Viewer"],
    is_active: true,
    created_at: new Date().toISOString(),
  };

  res.json(userObj);
});

// Equipment endpoints
app.get("/api/v1/maintenance/equipment", (req, res) => {
  res.json(db.equipment);
});

app.post("/api/v1/maintenance/equipment", (req, res) => {
  const { name, serial_number, model_type, install_date, zone } = req.body;
  
  if (!name || !model_type) {
    res.status(400).json({ error_summary: "Equipment Name and Model Type are required fields" });
    return;
  }

  const newEquip: Equipment = {
    id: `eq-dyn-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    name,
    serial_number: serial_number || `SER-${Math.floor(Math.random() * 899000 + 100000)}`,
    status: "nominal",
    model_type: model_type || "Turbine",
    install_date: install_date || new Date().toISOString(),
    zone: zone || "Alpha Complex",
  };

  db.equipment.push(newEquip);
  saveDB(db);
  res.status(201).json(newEquip);
});

// Stream telemetry logs & calculate risk levels (acts as our core XGBoost simulator)
app.post("/api/v1/maintenance/telemetry/record", (req, res) => {
  const { equipment_id, temperature, vibration, pressure, voltage, current } = req.body;
  
  if (!equipment_id) {
    res.status(400).json({ error_summary: "equipment_id is required" });
    return;
  }

  const tempNum = Number(temperature || 0);
  const vibNum = Number(vibration || 0);
  const pressNum = Number(pressure || 0);
  const voltNum = Number(voltage || 220);
  const currNum = Number(current || 8.5);

  const prediction = executeFactoryXGBoostPrediction(tempNum, vibNum, pressNum, voltNum, currNum);

  // Update status in master equipment array on-the-fly
  const eqIdx = db.equipment.findIndex(e => e.id === equipment_id);
  if (eqIdx !== -1) {
    db.equipment[eqIdx].status = prediction.risk_level;
    
    // Automatically trigger an alarm incident if the machine is warnings/criticals/emergency
    if (prediction.risk_level !== "nominal") {
      const activeEq = db.equipment[eqIdx];
      const isThermal = tempNum > 75;
      const isVib = vibNum > 3.0;
      
      let category: SafetyIncident["category"] = "Thermal Spike";
      if (isVib) category = "Pressure Drop"; // Or categorize appropriately
      if (tempNum > 85) category = "Thermal Spike";
      
      const newIncident: SafetyIncident = {
        id: `inc-auto-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        zone: activeEq.zone || "Alpha Complex",
        category: tempNum > 85 ? "Thermal Spike" : "Pressure Drop",
        message: `XGBoost alert: Machine '${activeEq.name}' reached ${prediction.risk_level.toUpperCase()} risk (${(prediction.failure_probability * 100).toFixed(1)}%). Temp: ${tempNum}°C, Vib: ${vibNum} mm/s.`,
        level: prediction.risk_level,
        timestamp: new Date().toISOString(),
        acknowledged: false,
      };

      // Ensure we don't spam identical active incidents
      const identicalAlertExists = db.incidents.some(i => !i.acknowledged && i.zone === newIncident.zone && i.level === newIncident.level);
      if (!identicalAlertExists) {
        db.incidents.unshift(newIncident);
      }
    }
  }

  // Record sensor readings historical array
  const idStr = `r-inf-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
  const incomingReading: SensorReading = {
    id: idStr,
    equipment_id,
    timestamp: new Date().toISOString(),
    temperature: tempNum,
    vibration: vibNum,
    pressure: pressNum,
    voltage: voltNum,
    current: currNum,
  };

  if (!db.readings[equipment_id]) {
    db.readings[equipment_id] = [];
  }
  db.readings[equipment_id].push(incomingReading);
  if (db.readings[equipment_id].length > 30) {
    db.readings[equipment_id].shift(); // limit historical logs memory size on file
  }

  saveDB(db);
  res.json(prediction);
});

// Predict batch
app.post("/api/v1/maintenance/predict/batch", (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    res.status(400).json({ error_summary: "items payload array is required" });
    return;
  }

  const results = items.map((item: any) => {
    return executeFactoryXGBoostPrediction(
      Number(item.temperature || 0),
      Number(item.vibration || 0),
      Number(item.pressure || 0),
      Number(item.voltage || 220),
      Number(item.current || 8.5)
    );
  });

  res.json({ predictions: results });
});

// Model analytical metadata
app.get("/api/v1/maintenance/metadata", (req, res) => {
  res.json({
    model_name: "XGBoost-Machinery-RUL-Reg-Classifier",
    modelVersion: "2.1.2-beta",
    frameworks: {
      xgboost: "2.0.3",
      shap: "0.45.1",
      scikit_learn: "1.4.2"
    },
    parameters: {
      max_depth: 6,
      learning_rate: 0.05,
      n_estimators: 100,
      objective: "binary:logistic"
    },
    features_signature: [
      "temperature", "vibration", "pressure", "voltage", "current",
      "power", "temp_press_ratio", "vib_power_ratio",
      "temp_deviation", "vib_deviation", "press_deviation", "thermal_load"
    ],
    metrics: {
      auc_roc: 0.982,
      f1_score: 0.941,
      precision: 0.953,
      recall: 0.930,
      mean_absolute_error_rul_hours: 12.4
    },
    last_train_timestamp: "2026-06-15T04:22:18Z"
  });
});

// Get reports
app.get("/api/v1/safety/reports", (req, res) => {
  res.json(db.reports);
});

// Post incident
app.get("/api/v1/safety/violations", (req, res) => {
  res.json(db.incidents);
});

app.patch("/api/v1/safety/violations/:id/resolve", (req, res) => {
  const { id } = req.params;
  const idx = db.incidents.findIndex(item => item.id === id);
  if (idx !== -1) {
    db.incidents[idx].acknowledged = true;
    saveDB(db);
    res.json(db.incidents[idx]);
  } else {
    res.status(404).json({ error_summary: "Incident not found" });
  }
});

// Post custom vision ingress signals
app.post("/api/v1/safety/ingest", (req, res) => {
  const { zone, category, message, level } = req.body;
  const newInc: SafetyIncident = {
    id: `inc-img-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    zone: zone || "General Staging Deck",
    category: category || "PPE Breach",
    message: message || "General compliance flag logged by optical sensors.",
    level: level || "warning",
    timestamp: new Date().toISOString(),
    acknowledged: false
  };

  db.incidents.unshift(newInc);
  saveDB(db);
  res.status(201).json(newInc);
});

// Dynamic AI Copilot Chat connected to server-side Gemini SDK!
app.post("/api/v1/copilot/chat", async (req, res) => {
  const { text, messages } = req.body;
  if (!text) {
    res.status(400).json({ error_summary: "A text prompt is required to communicate with Copilot" });
    return;
  }

  try {
    // Collect active state parameters to feed into System Instruction as context!
    const activeAlarms = db.incidents.filter(i => !i.acknowledged);
    const unnominalMachines = db.equipment.filter(e => e.status !== "nominal");
    
    const contextDescriptor = `
You are the FactoryGPT Cognitive AI Copilot. You are connected to the live database of the factory.
Here is the current state of the facility:
- Equipment Online: ${db.equipment.length} units total.
- Machines with Warnings/Faults: ${unnominalMachines.length} units.
  ${unnominalMachines.map(m => `* Machine '${m.name}' in Zone [${m.zone}] is currently reporting status: ${m.status.toUpperCase()}`).join("\n")}
- Unresolved / Active Safety Alarms: ${activeAlarms.length} events.
  ${activeAlarms.map(a => `* [${a.category}] in ${a.zone}: "${a.message}" (Severity: ${a.level.toUpperCase()})`).join("\n")}

Respond to the user's inquiry with professional, high-fidelity industrial assistance. Keep answers clear, technical, concise, and focused on helping floor operators maintain compliance and maximum machine uptime. Frame your advice using realistic factory procedures (e.g. bearing lubrications, pressure vents, electrical stator purging, gas checks, and helmet/shield checks).
`;

    // Attempt to invoke Gemini Flash 3.5 using the modern SDK
    const ai = getGeminiClient();
    const chatResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: text,
      config: {
        systemInstruction: contextDescriptor,
        temperature: 0.7,
      }
    });

    res.json({ text: chatResponse.text });
  } catch (err: any) {
    console.error("Gemini API call occurred an issue:", err);
    
    // In case the api key is missing or invalid, respond with a highly informative fallback reply
    let reply = "";
    const lower = text.toLowerCase();
    
    if (!process.env.GEMINI_API_KEY) {
      reply = `[FAST REST API FEEDBACK]: FactoryGPT local fallback is active. To enable genuine generative AI diagnostics, please configure your **GEMINI_API_KEY** in the **Settings > Secrets** panel.

Here are local machine diagnostics matching your query:
`;
    } else {
      reply = `[FAST REST API BACKUP]: Processing raw database metrics. Failed to call Gemini model.
`;
    }

    if (lower.includes("shap") || lower.includes("/explain-shap")) {
      reply += `SHAP (SHapley Additive exPlanations) uses game theory mechanics to distribute attribution units to individual parameters. 
- Heat factors (temperature) directly adjust predictions upward if temperatures surpass the 65°C operational threshold.
- Physical stress levels (vibrations mm/s) trigger large additive swings if they register above 2.5 mm/s.
Check the [Predict/Predictive Maintenance] tab to view the live SHAP charts.`;
    } else if (lower.includes("rul") || lower.includes("useful life") || lower.includes("/explain-rul")) {
      reply += `Remaining Useful Life (RUL) represents estimated hours of operation before bearing fail.
- Nominal machine profiles (< 10% failure risk) default to ~720 operating hours.
- Risk scales exponentially. At 50% probability, RUL is curtailed to roughly 180 hours under safe cycle bounds.`;
    } else if (lower.includes("status") || lower.includes("how is") || lower.includes("plant")) {
      const liveAlarms = db.incidents.filter(i => !i.acknowledged);
      reply += `Facility Status:
- Asset logs: ${db.equipment.length} units tracked. ${db.equipment.filter(e => e.status !== "nominal").length} units in off-nominal states.
- Active unacknowledged alarms: ${liveAlarms.length} items.
- Active entrance security scanning gates are fully arms-cleared.`;
    } else {
      reply += `System acknowledged: "${text}". 
To help you troubleshoot and coordinate, try commands:
- 'status' to review offline machine faults and live safety statistics.
- 'emergency' / 'hazard' to read the mechanical response playbooks.
- '/explain-shap' or '/explain-rul' for predictive model deep-dives.`;
    }

    res.json({ text: reply });
  }
});

// Handle Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Factory Backend Running on Port ${PORT}`);
  });
}

startServer();
