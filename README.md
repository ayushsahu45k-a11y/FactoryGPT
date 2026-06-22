# 🏭 FactoryGPT

<p align="center">

<img src="./assets/hero-banner.gif" width="100%" alt="FactoryGPT Hero"/>

</p>

<p align="center">

### Real-Time Smart Manufacturing Digital Twin & AI Operations Copilot

**Industrial 3D Visualization • Explainable AI • Predictive Maintenance • Role-Based Intelligence**

</p>

<p align="center">

![React](https://img.shields.io/badge/React-Frontend-black?style=for-the-badge\&logo=react)                    ![ThreeJS](https://img.shields.io/badge/Three.js-3D%20Engine-black?style=for-the-badge\&logo=three.js)                    ![TypeScript](https://img.shields.io/badge/TypeScript-Strong%20Typing-blue?style=for-the-badge\&logo=typescript)

![Python](https://img.shields.io/badge/Python-AI-yellow?style=for-the-badge\&logo=python)                    ![XGBoost](https://img.shields.io/badge/XGBoost-Predictive-orange?style=for-the-badge)                    ![MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

</p>

---

# 🚀 Overview

FactoryGPT is a next-generation industrial platform that creates a **living Digital Twin** of a manufacturing plant.

The system mirrors:

* Real-time machine telemetry
* Interactive 3D factory visualization
* Predictive maintenance using AI
* Explainable SHAP analytics
* Role-scoped AI Copilot
* Factory-wide operational monitoring

The goal is simple:

> Transform industrial data into a real-time intelligent factory experience.

---

# ✨ Features

### 🏭 High Fidelity Digital Twin

* Real-time 3D factory
* Structural steel mezzanines
* Overhead electrical busways
* Dynamic machine status
* Interactive machinery
* Transparent glass walkways
* Heatmap overlays
* Industrial PBR materials

---

### 🧠 Explainable AI

FactoryGPT explains every prediction.

Features:

* SHAP Explainability
* Feature Importance
* Risk Attribution
* Failure Explanation
* Real-time Inference
* Predictive Maintenance

---

### 🤖 AI Copilot

Every role has isolated intelligence.

#### Admin

* Worker Management
* Override Machinery
* Alarm Reset
* Attendance Monitoring
* Factory Configuration

---

#### Manager

* Assign Technicians
* Export Reports
* Monitor Workers
* View Shift Analytics
* Access Process Logs

---

#### Worker

* PPE Compliance
* Calibration Requests
* Oil Purge Requests
* Bearing Monitoring

---

#### Viewer

* Read-only Dashboard
* Visual Telemetry
* Incident Reports
* AI Monitoring

---

# 🎬 Living Factory Animations

FactoryGPT is designed as a **living industrial environment**.

---

## ⚙️ Moving Conveyor Belts

```text

📦 → 📦 → 📦 → 🤖 → 📦 → 📦

```

Features:

* Continuous motion
* Variable speed
* Material flow visualization
* Real-time production indicators

---

## 🤖 Robotic Arms

Animated industrial robots:

* Rotating base
* Multi-axis movement
* Pick and place
* Dynamic path planning
* Material handling

---

## 🌫️ Heat & Smoke Effects

Machines generate:

* Steam particles
* Heat distortion
* Furnace glow
* Smoke simulation
* Dynamic lighting

```text

    ♨️ ♨️ ♨️

████ Furnace ████

```

---

## ⚡ Power Grid Animation

Electricity visibly flows across:

* High-voltage busways
* Control cabinets
* Transformer stations
* Power rails

```text

════⚡════⚡════⚡════

```

---

## 👷 Walking Workers

Digital humans:

* Walking on catwalks
* Inspecting machines
* PPE equipped
* Forklift operators
* Maintenance engineers

```text

👷 ---->

🚜 moving materials

```

---

## 🎥 Cinematic Camera Flythrough

The camera automatically explores:

```text

Factory Entrance

↓

Conveyor Systems

↓

Robotic Arms

↓

Furnaces

↓

Cooling Plant

↓

AI Control Room

```

Creating a cinematic industrial experience.

---

# 🏗️ Architecture

```text

                     Physical Factory

      ┌────────────────────────────────┐

      │ Sensors • PLC • Cameras • IoT │

      └──────────────┬─────────────────┘

                     │

             Telemetry Stream

                     │

                     ▼

      ┌────────────────────────────┐

      │      FactoryGPT Core       │

      └──────────┬─────────────────┘

                 │

 ┌───────────────┼──────────────────┐

 ▼               ▼                  ▼

┌─────────┐ ┌──────────┐ ┌───────────┐

│3D Twin  │ │AICopilot │ │ SHAP AI   │

│Engine   │ │ Engine   │ │ Analytics │

└─────────┘ └──────────┘ └───────────┘

```

---

# 📊 Real-Time Machine Analytics

Every machine exposes:

| Metric      | Description                  |
| ----------- | ---------------------------- |
| Temperature | Operating Temperature        |
| RPM         | Rotational Speed             |
| Pressure    | Internal Pressure            |
| Vibration   | mm/s                         |
| Risk Score  | AI Failure Probability       |
| Status      | Running / Warning / Critical |

---

# 🔥 Explainable AI Example

```text

Machine : CNC-12

Predicted Failure Risk : 89%

+ Temperature     +31%

+ RPM             +18%

+ Pressure        +14%

- Cooling         -11%

Final Score : 89%

```

---

# 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Three.js
* React Three Fiber
* D3.js
* TailwindCSS

---

### Backend

* Node.js
* Express.js
* WebSocket

---

### AI / ML

* Python
* XGBoost
* SHAP
* Pandas
* NumPy
* Scikit-Learn

---

### Graphics

* WebGL
* GLSL Shaders
* Particle Systems
* HDR Lighting
* PBR Materials

---

# 📂 Project Structure

```bash

FactoryGPT

├── public

├── assets

│   ├── hero-banner.gif

│   ├── factory-demo.gif

│   └── screenshots

│

├── src

│

│   ├── components

│   ├── pages

│   ├── hooks

│   ├── services

│   ├── ai

│   │

│   ├── copilot

│   ├── predictive

│   └── shap

│

├── package.json

└── README.md

```

---

# ⚙️ Installation

Clone repository

```bash

git clone https://github.com/ayushsahu45k-a11y/FactoryGPT.git

```

Move into directory

```bash

cd FactoryGPT

```

Install dependencies

```bash

npm install

```

Run development server

```bash

npm run dev

```

Build production

```bash

npm run build

```

---

# 🌍 Environment Variables

Create:

```bash

.env

```

Add:

```env

VITE_API_URL= ********************************************

DATABASE_URL= postgresql/**************************/factorygpt

JWT_SECRET= f79***********************************************

REDIS_URL= redis://*************

OPENAI_API_KEY= *********************************************

```

---

# 📸 Screenshots

### 🏭 Factory Overview

![Factory](./assets/screenshots/factory.png)

---

### 🤖 AI Copilot

![AI](./assets/screenshots/copilot.png)

---

### 🔥 SHAP Explainability

![SHAP](./assets/screenshots/shap.png)

---

### ⚙️ Digital Twin

![Twin](./assets/screenshots/twin.png)

---

# 🗺️ Future Roadmap

* [ ] AR Smart Glass Integration
* [ ] Voice AI Copilot
* [ ] Drone Inspection System
* [ ] Edge AI Deployment
* [ ] Multi Factory Federation
* [ ] Reinforcement Learning Optimization
* [ ] Autonomous Maintenance Scheduling

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

---

# 📜 License

Distributed under the MIT License.

---

<p align="center">

## 🏭 FactoryGPT

### Building the Future of Intelligent Manufacturing

**Where Physical Industry Meets Artificial Intelligence**

</p>
