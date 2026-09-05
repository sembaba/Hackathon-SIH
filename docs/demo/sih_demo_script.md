# VERTI-CAD: Smart India Hackathon Demonstration Script

This document details the exact end-to-end evaluation flow for hackathon judges and evaluators.

---

### Step 1: Open Executive Dashboard
1. Navigate to `http://localhost:5173/`.
2. Inspect the **Executive Cadastral Overview** showing KPIs: Total Parcels, 3D Buildings, 32 Volumetric Properties, 4 Subsurface Assets, and Active Topology Conflicts.
3. Observe the Government / Research Disclaimer banner: *"STATE CADASTRAL INNOVATION DEMO: Prototype 3D ULPIN and vertical land administration research system"*.

### Step 2: Switch to 3D Globe
1. Click **"Launch 3D Cadastre Globe"** or click **"3D Globe & Cadastre"** on the sidebar.
2. The viewer loads the real interactive 3D Cesium globe and automatically positions the camera over Haridwar, Uttarakhand (`29.9457° N, 78.1642° E`).

### Step 3: Inspect Cadastral Parcel Boundaries
1. Observe the cyan boundary outlining Cadastral Parcel `#001245` ($3,600\text{ m}^2$).

### Step 4: Inspect 3D Building Envelope
1. Observe **VERTI Tower Demo (`B07`)** rising $21\text{m}$ above ground with multi-storey volumetric extrusion.

### Step 5: Engage the Vertical Floor Explorer
1. Locate the **Vertical Explorer** HUD floating on the bottom-left.
2. Observe the floor stack: Basement -2, Basement -1, Ground, Floor 1 through Floor 6.
3. Move the **Vertical Z Elevation Slider** from $0\text{m}$ up to $+21\text{m}$ and down to $-20\text{m}$.

### Step 6: Isolate Floor 5
1. Click **"F05 - Floor 5"** in the Vertical Floor Explorer.
2. The 3D map highlights Floor 5, fading out other floors into subtle ghost volumes.
3. Observe the four delineated apartments: `501`, `502`, `503`, and `504`.

### Step 7: Inspect Apartment 503
1. Click on **Apartment 503** in the 3D viewport.
2. The property volume glows in amber/rose outline and opens the **Property Details Drawer** on the top-right.
3. Verify attributes:
   - **Prototype 3D ULPIN:** `IN-UT-HW-001245-B07-F05-U503`
   - **Unit Number:** `503`
   - **Floor:** `Floor 5`
   - **Owner:** `Devendra Negi`
   - **Horizontal Area:** `125.0 m²`
   - **Vertical Range:** `15.0m to 18.0m (ΔZ = 3.0m)`
   - **3D Volume:** `375.0 m³`
   - **Status:** `Conflict Flagged`

### Step 8: Review Active 3D Conflict
1. Observe the warning badge on the drawer: *"3D VERTICAL CONFLICT DETECTED"*.
2. Click **"Conflict Validation"** on the sidebar or click **"Review Active Conflicts"**.
3. View the issue flagged by the Topology Validation Engine:
   > *"3D Vertical overlap detected between Unit 503 (15.0m–18.0m) and Unit 504 (17.0m–20.0m). Vertical conflict zone: 17.0m to 18.0m (Overlapping depth: 1.0m)."*

### Step 9: Re-execute Topology Engine in Real-Time
1. On the Validation Center page, click **"Run Validation Engine"**.
2. Watch the engine re-run Shapely 2D polygon intersection and 3D vertical interval intersection calculations on the backend and confirm the conflict status live.

### Step 10: Subsurface / Underground Assets
1. Return to the 3D Map and toggle **"Underground"** on the floating toolbar or the floor explorer.
2. The terrain becomes semi-transparent.
3. Observe the subsurface networks:
   - Basement -1 ($Z = -1\text{m}$ to $-5\text{m}$)
   - Basement -2 ($Z = -5\text{m}$ to $-9\text{m}$)
   - Potable Water Main ($Z = -3.5\text{m}$ to $-4.2\text{m}$)
   - Municipal Sewer Conduit ($Z = -5.0\text{m}$ to $-6.2\text{m}$)
   - High-Voltage 33kV Power Duct ($Z = -2.0\text{m}$ to $-2.8\text{m}$)
   - Haridwar Metro Rapid Transit Tube ($Z = -12.0\text{m}$ to $-17.5\text{m}$)

### Step 11: 2D Cadastral Map View
1. Click **"2D Cadastral Map"** on the sidebar or the toolbar.
2. Inspect the Leaflet / OpenStreetMap 2D cadastre showing the same parcel, building footprint, property unit partitions, and subsurface line conduits.

### Step 12: Global ULPIN Search
1. In the top navbar, type `IN-UT-HW-001245-B07-F05-U503` or simply `503` and press Enter.
2. The system locates the unit, redirects to the 3D map, flies the camera directly to Unit 503, isolates Floor 5, and opens the property details panel!
