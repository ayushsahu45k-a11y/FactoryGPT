# 🏭 FactoryGPT: Real-time Smart Manufacturing Twin & AI Operations Copilot

```
███████╗ █████╗  ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗ ██████╗  ████████╗ ████████╗
██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝██╔════╝  ██║   ██║ ╚══██╔══╝
█████╗  ███████║██║        ██║   ██║   ██║██████╔╝ ╚████╔╝ ██║       ██║████║║    ██║   
██╔══╝  ██╔══██║██║        ██║   ██║   ██║██╔══██╗  ╚██╔╝  ██║  ███║ ██╔═════╝    ██║   
██║     ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║   ╚███████║╗██║          ██║   
╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝╚═╝  ╚═╝    ╚═╝    ╚═════╝ ╚══╝          ╚═╝   
```

> **Industrial-grade 3D Digital Twin, Cognitive Operator Diagnostics, and Role-Scoped Intelligence.** Adhering to extreme high-fidelity manufacturing standards, ISO safety frameworks, and enterprise-grade system telemetry.

---

## 🚀 Architectural Overview

**FactoryGPT** serves as a high-fidelity Digital Twin platform designed to connect real-time physical telemetry streams from deep-industrial machinery directly with multi-role execution models. Designed with a custom low-latency visual engine, a local predictive diagnostics solver (incorporating SHAP value game-theory mechanics for machine load attribution), and an advanced, role-isolated cognitive AI Copilot.

It mirrors actual industrial infrastructure: **40-meter exposed structural steel mezzanines**, suspended catwalk corridors, overhead high-voltage busways, and cryogenic conduits.

```
       [⚡ Physical Sensors] -> (Low-Latency Telemetry Link)
                                      |
                                      v
                        +───────────────────────────+
                        |  FactoryGPT Control Hub   |
                        +─────────────┬─────────────+
                                      |
         +────────────────────────────┼────────────────────────────+
         |                            |                            |
         v                            v                            v
┌─────────────────┐          ┌──────────────────┐         ┌─────────────────┐
│  3D Twin Engine │          │ Cognitive Engine │         │ Diagnostic Core │
│ (WebGL canvas)  │          │ (Role-Isolated)  │         │ (SHAP Attribution)│
└─────────────────┘          └──────────────────┘         └─────────────────┘
```

---

## 🔑 Enterprise Role-Scoped Intelligence

FactoryGPT completely partitions its cognition, chat persistence, and operation limits based on cryptographic user roles. Each system actor possesses an isolated Copilot terminal, ensuring that sensitive plant schematics, private operator rosters, and safety overrides are locked under authorized clearance vectors.

| Clearence Level | User Role | Copilot Terminal Authorization | Available Operational Capabilities |
| :--- | :--- | :--- | :--- |
| **Level 4** | `Admin` | `ROOT_SUPERUSER` / Full History Persistence | Re-calibrate physical system constants, reset active thermal sirens, deploy manual machinery Overrides, Register/De-register plant workers, query full attendance portfolios and active tasks rosters. |
| **Level 3** | `Manager` | `OPERATIONAL_CONTROL_L4` / Active Logs | Pull immediate process logs, export OSHA inspection dossiers, compute real-time shift utilization factors, assign technicians to failing machines, view current worker locations. |
| **Level 2** | `Worker` | `LEVEL_2_READ_WRITE` / PPE Clearances | Execute smart helmet compliance scanning, dispatch urgent fluid/oil purges, trigger physical calibrations, track structural bearing loads. |
| **Level 1** | `Viewer` | `LEVEL_1_READ_ONLY` / Read Only | Monitor visual telemetry feeds, review anonymous incident streams, audit model inference reliability, no structural overrides. |

---

## 🛠️ Key Technology Modules

### ⚙️ 1. Dynamic 3D Digital Twin Layout
- Interlock-driven visual panels depicting physical coordinates of equipment status.
- Real-time heat mapping and particle system diagnostics representing heat dispersion, cooling levels, and cryogenic vapor conduits.
- Reactive hover metrics representing three crucial variables: **Operational Temp**, **XGBoost Risk Calculations**, and **Vibration Frequency (mm/s)**.

### 🧠 2. Advanced Explainable AI (SHAP Analytics / D3.js)
- Explains model inferences under game-theory-driven SHAP (SHapley Additive exPlanations) visualizations built natively via D3.
- Isolates contribution metrics of individual machine vectors (magnetic fields, rotational RPM, cooling pressure, gas density) to explain why a predictive maintenance model flags warnings.

### 🧩 3. Role-Isolated AI Copilot
- Supports custom queries like `"Who is working today?"` or `"How many workers work today?"` and serves real-time, role-scoped roster breakdowns.
- Contextual error guidance: queries for `"What is my role?"` output custom capability guidelines tailored specifically for the authenticated operator.
- Automatically saves distinct role-based history caches to client-side localStorage (`factory_gpt_role_messages`).

---

## ⚡ Setup & Development Guidelines

Ensure Node.js is installed locally before proceeding.

### 🔧 Installation

Install base dependencies from `package.json`:
```bash
npm install
```

### 💻 Running the Development Server
Execute the application with a high-stress sandboxed dev loop at port `3000`:
```bash
npm run dev
```

### 📦 Production Build and Static Optimization
Bundle production-ready assets into static files inside `/dist` optimized for instant loading:
```bash
npm run build
```

---

## 📐 Material & System Compliance Specifications

FactoryGPT operations comply strictly with multi-national manufacturing safety protocols and structural design metrics:
* **ISO 9001**: System quality and consistent physical twin accuracy levels.
* **ISO 14001**: Gaseous emissions (Argon / Nitrogen) tracking metrics.
* **OSHA Standards**: Personnel protective safety checking and automatic gate exclusion locks.
* **PBR Mechanical Textures**: Designed with physical industrial constraints mirroring sandblasted titanium, high-strength transparent walkways, and grease-bearing interfaces.

---

> Created by Lead Systems Architect Team (FactoryGPT Engineering Services). Standard operating procedures and safety documentation are logs of corporate infrastructure. All rights reserved®
