# FactoryGPT: Smart Factory Platform Architecture

FactoryGPT is a production-ready, industrial-grade AI-powered Smart Factory platform combining real-time computer vision (YOLOv8 PPE Detection) and dynamic physical metrics analysis (XGBoost Predictive Maintenance) to ensure maximum plant-floor safety and equipment uptime.

---

## 1. Full Folder Structure

```text
factory-gpt/
├── docker-compose.yml              # Multi-container orchestration (PostgreSQL, Redis, Celery, etc.)
├── README.md                       # Quick start and platform summary
├── nginx/
│   └── nginx.conf                  # Reverse proxy routing public requests to Frontend & FastAPI API Gateway
├── monitoring/
│   ├── prometheus.yml              # Metrics scraping configuration
│   └── grafana/
│       └── provisioning/
│           └── datasources/
│               └── datasource.yml  # Automated Prometheus datasource setup
│
├── frontend/                       # Next.js 15 Client Interface
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── src/
│   │   ├── app/                    # App Router layouts and routes
│   │   │   ├── layout.tsx          # Shell wrapper with industrial styling
│   │   │   ├── page.tsx            # Live dashboard view (KPI widgets & floor visualizer)
│   │   │   ├── safety/             # Real-time PPE streams & safety events
│   │   │   │   └── page.tsx
│   │   │   └── maintenance/        # Machine telemetry & XGBoost breakdowns
│   │   │       └── page.tsx
│   │   ├── components/             # Handcrafted UI modules
│   │   │   ├── ui/                 # Radix primitives (Button, Dialog, Badge)
│   │   │   ├── AlertFeed.tsx       # Live status indicators and anomaly logs
│   │   │   ├── MetricCard.tsx      # High-density industrial indicators
│   │   │   ├── CameraStream.tsx    # Live camera element displaying processed bounding box frames
│   │   │   └── TelemetryChart.tsx  # Optimized Recharts line/area charts for machine telemetry
│   │   └── store/                  # Zustand Global State
│   │       └── useFactoryStore.ts  # Handles live WebSocket streams and cached metadata
│
├── backend/                        # FastAPI high-performance ASGI gateway
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                     # App entrypoint and middlewares (CORS, Prometheus instrumentation)
│   ├── core/
│   │   ├── config.py               # Env settings management via Pydantic
│   │   └── database.py             # SQLAlchemy 2.0 Async Session engine configuration
│   ├── models/                     # Declarative Database Schemas (SQLAlchemy)
│   │   ├── base.py                 # Shared metadata class
│   │   ├── equipment.py            # Machine metadata and operating specs
│   │   ├── telemetry.py            # Historical time-series operating columns (temp, vibration, pressure)
│   │   └── safety_violation.py     # Logged PPE violations with image references
│   ├── api/                        # HTTP route handlers
│   │   ├── router.py               # Main root router
│   │   ├── endpoints/
│   │   │   ├── equipment.py        # Equipment inventory endpoints
│   │   │   ├── telemetry.py        # Telemetry storage & anomaly thresholding
│   │   │   └── safety.py           # Safety check queries & alerts
│   │   └── schemas/                # Pydantic schema schemas
│   │       ├── equipment.py
│   │       ├── telemetry.py
│   │       └── safety_violation.py
│   └── tasks/                      # Periodic background operations (Celery)
│       ├── worker.py               # Celery app configuration and wiring
│       └── maintenance_tasks.py    # Triggering periodic XGBoost failure runs on telemetry
│
└── ml_services/                    # Heavyweight Inference Microservices (Isolated CPU/GPU context)
    ├── Dockerfile
    ├── requirements.txt
    ├── main.py                     # Light FastAPI runner exposing model endpoints
    ├── ppe_detector/               # Computer vision analytics module
    │   ├── model.py                # YOLOv8 inference wrapper & image/video stream bounding-box builder
    │   └── weights/                # Config folder keeping yolov8x.pt weights
    └── maintenance_predictor/      # AI Failure prediction engine
        ├── model.py                # Pre-trained XGBoost pipeline wrapper for RTT (Remaining Useful Life)
        └── weights/                # Pickled XGBoost model files
```

---

## 2. Architecture Diagram

```mermaid
graph TD
    %% Clients
    User([Operations Engineer]) -->|HTTPS/WSS| Nginx[Nginx Reverse Proxy]

    %% Ingress and Gateway
    Nginx -->|Route /*| FE[Next.js 15 Frontend]
    Nginx -->|Route /api/*| BE[FastAPI Backend Gateway]

    %% Shared State and Messaging
    BE -->|Post Telemetry / Alerts| DB[(PostgreSQL Database)]
    BE -->|Queue Tasks / Publish| Redis[(Redis Broker & Cache)]
    Redis <-->|Fetch Job Payload| Celery[Celery Worker Cluster]

    %% ML Pipeline Interconnects
    Celery -->|Post Telemetry Block| ML[ML Services Model Server]
    BE -->|Post Active Image Stream| ML
    
    subgraph ML_Services [ML Inference Context]
        ML -->|CPU/GPU Pipeline| YOLO[YOLOv8 PPE Detection Engine]
        ML -->|Multivariate Scoring| XGB[XGBoost Predictor Engine]
    end

    %% Monitoring Architecture
    Prom[Prometheus Metrics Engine] -->|Scrape /metrics| BE
    Prom -->|Scrape Metrics| ML
    Grafana[Grafana Dashboard Console] -->|Query Data| Prom
```

---

## 3. Database Tables

The data layer uses PostgreSQL optimized with indexed foreign relationships for fast historical telemetry querying.

### 1. `equipment` (Monitored Plant Machinery)
Stores the master catalog of industrial assets on the plant floor.

| Column Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, Default: gen_random_uuid() | Unique identifier for the equipment |
| `name` | VARCHAR(100) | NOT NULL | Human-readable name (e.g. "Centrifugal Pump Alpha") |
| `serial_number`| VARCHAR(100) | UNIQUE, NOT NULL | Original factory identifier |
| `status` | VARCHAR(20) | CHECK (status IN ('nominal', 'warning', 'critical', 'maintenance')) | Live operations state |
| `model_type` | VARCHAR(50) | NOT NULL | Type profile (e.g., "Turbine", "Compressor", "CNC") |
| `install_date` | TIMESTAMPTZ | NOT NULL | When the machine was placed in operation |
| `updated_at` | TIMESTAMPTZ | Default: NOW(), On Update: NOW() | Audit timestamps |

### 2. `telemetry_logs` (Machine Time-Series Sensor Stream)
Monitors high-frequency physical components for anomalous operations and feeds the predictive model.

| Column Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGSERIAL | PRIMARY KEY | Highly-scalable unique identifier |
| `equipment_id` | UUID | FOREIGN KEY -> equipment(id), ON DELETE CASCADE | Associated machine reference |
| `timestamp` | TIMESTAMPTZ | NOT NULL, DEFAULT: NOW() | Time the telemetry packet was recorded |
| `temperature` | NUMERIC(6, 2) | NOT NULL | Recorded temperature in Celsius |
| `vibration` | NUMERIC(8, 4) | NOT NULL | Recorded vibration peak amplitude (mm/s) |
| `pressure` | NUMERIC(6, 2) | NOT NULL | Recorded operating pressure (bar) |
| `failure_risk` | NUMERIC(5, 2) | NOT NULL | Model real-time calculation percentage (0.00% to 100.00%) |

### 3. `safety_violations` (YOLOv8 Computer Vision Incidents)
Captures instances where individuals enter designated dangerous zones without appropriate PPE (Personal Protective Equipment).

| Column Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, Default: gen_random_uuid()| Record identifier |
| `camera_id` | VARCHAR(50) | NOT NULL | ID of processing physical camera feed |
| `timestamp` | TIMESTAMPTZ | NOT NULL, DEFAULT: NOW() | Exact date-time of violation detect |
| `violation_type`| VARCHAR(50)| NOT NULL | Classification ("No Helmet", "No Vest", "Zone Incursion") |
| `confidence` | NUMERIC(4, 3) | NOT NULL | YOLOv8 model classification score (e.g. 0.985) |
| `snapshot_url` | VARCHAR(255) | NOT NULL | File storage location containing the annotated bounding box |
| `resolved` | BOOLEAN | DEFAULT: FALSE | Actions status by floor operators |

---

## 4. API Route List

FastAPI exposes low-latency endpoints organized securely under versioned routers.

### 🔌 Equipment Operations
* **`GET /api/v1/equipment`** — Returns an inventory profile containing sensor status cards for every machine.
* **`POST /api/v1/equipment`** — Registers a new operational machine into the PostgreSQL table registry.
* **`GET /api/v1/equipment/{id}/analytics`** — Fetches pre-compiled predictive health summaries and maintenance schedules.

### 📊 Real-Time Telemetry
* **`POST /api/v1/telemetry/record`** — Endpoint for factory gateway sensors to stream high-density readings. Automatically checks against thresholds and pushes predictive jobs to Redis/Celery.
* **`GET /api/v1/telemetry/{equipment_id}/history`** — Serves chronological data logs to render graphical timeline indices on the frontend.

### 🛡️ Vision Safety Monitoring
* **`GET /api/v1/safety/violations`** — Exposes logged PPE instances (sorted by severity and verification state).
* **`POST /api/v1/safety/ingest`** — Receives frame triggers from on-premise YOLO cameras when safety infractions are flagged.
* **`PATCH /api/v1/safety/violations/{id}/resolve`** — Updates the validation status of an active safety alarm once handled.

---

## 5. Docker Services

The stack is composed of isolated virtual environments to separate heavy machine learning processing from the data and API layers.

```yaml
version: '3.8'

services:
  # 1. Reverse Proxy Gateway
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - frontend
      - backend

  # 2. Main Interface Platform
  frontend:
    build:
      context: ./frontend
    environment:
      - NEXT_ENV=production
      - API_GATEWAY_URL=http://backend:3000

  # 3. High Performance Core
  backend:
    build:
      context: ./backend
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:industrial_pass@postgres:5432/factorygpt
      - REDIS_URL=redis://redis:6379/0
      - ML_SERVICE_URL=http://ml_services:8000
    depends_on:
      - postgres
      - redis

  # 4. Celery Worker (Predictive maintenance scoring runner)
  celery_worker:
    build:
      context: ./backend
    command: celery -A tasks.worker.celery_app worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:industrial_pass@postgres:5432/factorygpt
      - REDIS_URL=redis://redis:6379/0
      - ML_SERVICE_URL=http://ml_services:8000
    depends_on:
      - redis
      - postgres

  # 5. Specialized YOLOv8 and XGBoost Runner
  ml_services:
    build:
      context: ./ml_services
    ports:
      - "8000:8000"

  # 6. Primary Relational Storage
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=factorygpt
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=industrial_pass
    volumes:
      - pgdata:/var/lib/postgresql/data

  # 7. Broker & Lock Controller
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # 8. Time-series Telemetry Monitor
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  # 9. Management and Analytics Dashboard Console
  grafana:
    image: grafana/grafana
    volumes:
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3001:3000"
    depends_on:
      - prometheus

volumes:
  pgdata:

---

## 6. Frontend Color System Specification

To achieve a highly polished, human-made aesthetic that feels like premium developer tools (such as Linear, Grafana, or Vercel), we avoid raw, high-vibrancy baseline CSS presets. Instead, the console uses a carefully tuned **Steel, Copper & Deep Sage** dark industrial canvas:

```typescript
// Core Tailwind Variable Pairings for the Handcrafted Dark Industrial Theme
const ThemePalette = {
  canvas: {
    base: "bg-zinc-950",       // Raw, deep matte charcoal obsidian slate
    pane: "bg-zinc-900",       // Solid panel container surface
    border: "border-zinc-800", // Soft wireframes (no glassmorphism, pure mechanical borders)
  },
  text: {
    primary: "text-zinc-100",    // Crisp high-contrast labeling
    secondary: "text-zinc-400",  // Muted documentation / hardware state labels
    timestamp: "text-zinc-500",  // Hardware timestamp monitoring records
  },
}
```

### 🔵 1. Steel Cobalt Blue (`#3b82f6` / `#1d4ed8`) — Diagnostics & Control State
Instead of generic bright neon blue, we employ an understated, cold Steel Cobalt. It matches developer conventions for active, calibrating, and healthy operational parameters.
* **Timeline Gauges**: Tracks continuously recorded historical data metrics (vibration peaks, physical pressures over time).
* **Network Handshaking**: Represents telemetry heartbeat statuses, active WebSocket frames, and live API endpoints.
* **Control UI Actions**: Non-disruptive active states, sidebar selections, selected diagnostic tags, and focused panel borders.

### 🟠 2. Hazard Amber & Copper (`#f59e0b` / `#b45309`) — Machine Warnings & Predictive Triggers
Instead of harsh flat orange, we utilize a rich, burning industrial copper/amber. It brings premium, eye-safe attention to systems flagged by prediction workflows.
* **XGBoost Alarm States**: Highlights telemetry parameters edging toward critical boundaries or equipment calculated to possess a `failure_risk` above 50%.
* **Predictive Windows**: Marks components queued for scheduled service downtime within the prediction ledger.
* **Minor Safety Violations**: Yellow-amber highlighting when minor PPE limits are crossed (e.g., temporary lack of safety vest in staging bays).

### 🟢 3. Muted Sage Emerald (`#10b981` / `#047857`) — Safety Compliance & Baseline Nominal state
Instead of glaring toxic lime green, we use a beautiful, natural Sage Emerald. It confirms high security, total workspace compliance, and resolved alerts cleanly.
* **YOLOv8 Active Verification**: Rendered in thin, crisp bounding boxes on video streams to confirm successful helmet/vest validation.
* **Operational Baselines**: Represents normal state machine runs and active, nominal telemetry profiles.
* **Resolved Status Logs**: Highlights alarms and safety violations that have been manually audited and resolved by a platform operator.

---

## 7. Operational Directory Justification

Each directory contains a single isolated responsibility matching our minimalist design requirements:

1. **/nginx**: Serves as the primary public proxy entrypoint. It maps standard single port configurations to multiple active containers protecting back-end application boundaries in a production setting.
2. **/monitoring**: Contains isolated configs for resource and performance tracking. Separates instrumentation collectors like *Prometheus* and visual analytics like *Grafana* from core business routes.
3. **/frontend**: Houses the *Next.js 15 App Router* layout. Organizes pages separate from application-centric UI fragments inside `/components` for simple state updates and state caches using *Zustand*.
4. **/backend**: Encapsulates the *FastAPI* core. Isolates async DB interfaces from synchronous endpoints, organizing DB tables into `/models` and schemas into `/api/schemas` with periodic worker bindings inside `/tasks` for heavy Celery items.
5. **/ml_services**: An independent runtime designed to carry resource-heavy calculations (e.g. YOLOv8 networks or NumPy/XGBoost weights) isolated from API service handlers to protect the site from operational slowdowns.


