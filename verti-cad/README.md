# VERTI-CAD

### 3D ULPIN Generation and Vertical Property Mapping System
> **"One Property. Every Dimension. One Unique Identity."**

[![Smart India Hackathon](https://img.shields.io/badge/Project-Smart%20India%20Hackathon-blue.svg)](https://www.sih.gov.in/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.1-092E20.svg?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![CesiumJS](https://img.shields.io/badge/CesiumJS-1.125-68A063.svg?logo=cesium&logoColor=white)](https://cesium.com/)
[![PostGIS](https://img.shields.io/badge/PostGIS-Spatial-336791.svg?logo=postgresql&logoColor=white)](https://postgis.net/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🏛️ Government & Prototype ULPIN Disclaimer
> [!IMPORTANT]
> **Prototype 3D ULPIN / Demonstration Identifier:** The volumetric ULPIN structure (`IN-[STATE]-[DISTRICT]-[PARCEL]-[BUILDING]-[LEVEL]-[UNIT]`) implemented in this platform is an academic and hackathon demonstration prototype designed to showcase multi-level vertical property demarcation. It does **not** claim to be an officially approved Government of India ULPIN format, but is structured modularly so that it can map seamlessly to emerging official cadastral standards. All property records included in the demo are synthetic for Haridwar, Uttarakhand.

---

## 🚀 The Core Problem & 3D Innovation
Traditional 2D cadastral records delineate land solely as flat $X/Y$ polygonal surface footprints. In modern cities featuring multi-storey residential towers, high-rise commercial complexes, basement parking, underground utility pipelines, and metro transit corridors, multiple distinct ownership titles exist stacked along the vertical $Z$-axis on identical horizontal coordinates.

### VERTI-CAD Volumetric Solution
Every property is represented as a distinct 3D volumetric prism:
$$\text{PropertyVolume} = (X_{\min}, X_{\max}, Y_{\min}, Y_{\max}, Z_{\min}, Z_{\max})$$

* **Apartment 503:** Footprint $X: 100-120\text{m}, Y: 200-220\text{m}$, Elevation $Z: 15\text{m} - 18\text{m}$
* **Apartment 403:** Identical horizontal footprint, Elevation $Z: 12\text{m} - 15\text{m}$

VERTI-CAD solves vertical boundary conflicts, eliminates ambiguous floor ownership, and maps subsurface utilities and rights into a unified digital twin.

---

## 🌟 Key Features

1. **Interactive 3D Cadastre Globe (CesiumJS):** Real 3D geospatial visualization with volumetric property extrusions, sun lighting, camera fly-to, and coordinate readouts.
2. **Interactive 2D Cadastral Map (Leaflet):** Synchronized 2D cadastral view with OpenStreetMap basemap, parcel polygons, and utility network lines.
3. **Vertical Floor Explorer & Z-Slider:** Dynamically isolates individual floors (Basement -2 to Floor 6) and allows slicing elevation through a $+30\text{m}$ to $-20\text{m}$ interactive slider.
4. **Subsurface & Underground Mode:** Makes terrain semi-transparent to reveal underground basements, water mains, sewerage conduits, 33kV power ducts, and metro subway tubes.
5. **Deterministic 3D ULPIN Engine:** Deterministic hashing and standardized identifier generation:
   $$\text{IN-UT-HW-001245-B07-F05-U503}$$
6. **Topology & 3D Conflict Validation Engine:** Automated detection of:
   * 3D vertical elevation overlaps ($[Z_{\min}^A, Z_{\max}^A] \cap [Z_{\min}^B, Z_{\max}^B]$)
   * 2D horizontal boundary encroachments
   * Parcel boundary containment violations
   * Subsurface foundation and utility collisions
7. **Intentional Demo Conflict:** Apartment 503 ($Z: 15-18\text{m}$) vs Apartment 504 ($Z: 17-20\text{m}$) triggers a live `VERTICAL_OVERLAP` warning in both 3D viewer and validation audits.
8. **Survey Data Ingestion:** Upload interface for GeoJSON, CSV ($X, Y, Z$ points), KML, and LiDAR/point-cloud metadata.
9. **AI Feature Extraction Architecture:** Modular pipeline from drone orthophotos $\to$ footprint extraction $\to$ DSM height estimation $\to$ floor disaggregation.
10. **Role-Based Access Control (RBAC):** Distinct roles for Citizen, Cadastral Surveyor, Land Administrator, GIS Administrator, and System Administrator.
11. **Executive Dashboard & Analytics:** High-density KPI cards and Chart.js volumetric distribution graphs.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, CesiumJS, Leaflet, Lucide React, Chart.js |
| **Backend** | Python 3.11, Django 5.1, Django REST Framework, SimpleJWT, Shapely |
| **Database** | PostgreSQL 15 + PostGIS 3.3 (Production) / SQLite Spatial Adapter (Local Dev) |
| **3D & GIS** | GeoJSON, EPSG:4326 (WGS84), UTM 44N, CesiumJS Volumetric Entities |
| **DevOps** | Docker, Docker Compose, Git |

---

## 📂 Repository Structure

```
verti-cad/
├── frontend/                # React + TypeScript + Vite + CesiumJS Frontend
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, PropertyDetailsDrawer, FloorExplorer
│   │   ├── pages/           # Dashboard, Map3D, Map2D, Parcels, Buildings, Properties, etc.
│   │   ├── map/             # CesiumMap.tsx and LeafletMap.tsx
│   │   ├── services/        # Resilient API service with offline fallback
│   │   ├── data/            # High-fidelity mock datasets for Haridwar demo
│   │   ├── types/           # TypeScript interfaces
│   │   └── styles/          # Dark blue government-tech CSS design system
│   ├── public/              # Isometric SVG Logo & assets
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                 # Django REST Framework Backend
│   ├── manage.py
│   ├── config/              # settings.py, urls.py, wsgi.py
│   ├── apps/
│   │   ├── parcels/         # Cadastral parcel models & views
│   │   ├── buildings/       # 3D building structure models & views
│   │   ├── floors/          # Floor slices and level codes
│   │   ├── properties/      # Volumetric property units (Zmin/Zmax)
│   │   ├── ulpin/           # Deterministic 3D ULPIN generator & validator
│   │   ├── infrastructure/  # Subsurface pipelines and metro lines
│   │   ├── validation/      # Shapely 2D/3D topology & conflict engine
│   │   ├── gis/             # GIS layer manager
│   │   ├── surveys/         # Survey file ingestion & parsers
│   │   ├── analytics/       # KPI aggregations & seed_demo command
│   │   └── users/           # User authentication & RBAC roles
│   └── requirements.txt
│
├── ai/                      # AI-Assisted Building Extraction & Height Estimation
│   ├── pipeline.py          # Modular Python processing pipeline
│   └── README.md
│
├── gis/                     # Spatial GeoJSON & CSV Data
│   └── sample_data/         # Haridwar parcel, 3D properties, utilities, CSVs
│
├── docs/                    # Architectural Documentation & Diagrams
│   ├── architecture/        # System architecture specification
│   ├── diagrams/            # Mermaid ER and DFD Level 0 & 1 diagrams
│   ├── api/                 # REST API reference
│   └── demo/                # Smart India Hackathon step-by-step demo script
│
├── docker/                  # Containerization
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
│
├── docker-compose.yml       # Multi-container orchestration (PostGIS + API + UI)
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start Guide (Local Setup)

### Prerequisites
* **Node.js**: v18+ (tested with v24)
* **Python**: v3.10+ (tested with v3.11)

### 1. Backend Setup
```bash
cd verti-cad/backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations users parcels buildings floors properties ulpin infrastructure validation gis surveys analytics
python manage.py migrate

# Seed realistic Haridwar demonstration dataset
python manage.py seed_demo

# Run automated tests
python manage.py test

# Start the Django API server (runs at http://127.0.0.1:8000)
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd verti-cad/frontend

# Install dependencies
npm install

# Start Vite development server (runs at http://localhost:5173)
npm run dev
```

---

## 🐳 Running with Docker Compose
To run the full stack with native PostgreSQL and PostGIS:
```bash
cd verti-cad
docker compose up --build
```
* **Frontend:** `http://localhost:5173`
* **Backend API & Swagger UI:** `http://localhost:8000/api/docs/`
* **PostgreSQL / PostGIS:** `localhost:5432`

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/parcels/` | `GET` | List all cadastral parcels with centroids & areas |
| `/api/buildings/` | `GET` | List 3D buildings with heights and floor counts |
| `/api/floors/` | `GET` | List vertical floor slices and elevation ranges |
| `/api/properties/` | `GET` | List 3D volumetric units with $Z_{\min}$, $Z_{\max}$, and volumes |
| `/api/properties/by_floor/?floor_id={id}` | `GET` | Get all units belonging to an isolated floor |
| `/api/ulpin/{ulpin}/` | `GET` | Query and decode 3D ULPIN attributes |
| `/api/ulpin/generate/` | `POST` | Deterministically generate a prototype 3D ULPIN |
| `/api/ulpin/validate/` | `POST` | Verify syntax and checksum integrity of an ULPIN |
| `/api/validation/issues/` | `GET` | Fetch active topological conflicts and overlaps |
| `/api/validation/run/` | `POST` | Trigger real-time 2D/3D spatial validation engine |
| `/api/infrastructure/` | `GET` | List subsurface utilities and transit assets |
| `/api/gis/layers/` | `GET` | Fetch GIS layer visibility and styling options |
| `/api/surveys/upload/` | `POST` | Ingest GeoJSON or CSV survey coordinates |
| `/api/analytics/` | `GET` | Aggregate executive KPIs and volumetric densification |
| `/api/docs/` | `GET` | Interactive OpenAPI / Swagger UI documentation |

---

## 🧪 Automated Testing
Run the backend test suite verifying ULPIN determinism, 3D vertical overlap collisions, boundary containment, and API responses:
```bash
cd verti-cad/backend
python manage.py test
```
*Result: 10/10 tests passing.*

Run frontend TypeScript verification and production build:
```bash
cd verti-cad/frontend
npm run build
```

---

## 🌐 Cesium Ion Token Configuration
Set `VITE_CESIUM_ION_TOKEN` in your `.env` file. If an external token is not provided, VERTI-CAD **never crashes**; it gracefully activates local 3D ellipsoidal rendering with open basemap imagery so the entire vertical property cadastre remains 100% demonstrable.

---

## 📄 License
This project is licensed under the MIT License. Developed for the Smart India Hackathon.
