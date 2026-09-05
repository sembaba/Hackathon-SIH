# VERTI-CAD AI/ML Geospatial Processing Pipeline

"Smart Delineation from Pixels to Volumetric 3D Cadastre"

## Overview
The VERTI-CAD AI pipeline converts high-resolution drone photogrammetry and satellite orthomosaics into initial 3D volumetric cadastre property models.

## Pipeline Architecture
```
Drone/Satellite Image (RGB) + DSM/DEM Surface Models
                       │
                       ▼
         [Step 1: Building Footprint Extraction]
         - Semantic Segmentation (ResNet-101 / Mask R-CNN / YOLOv8-seg)
         - Regularized orthogonal polygonal boundary extraction
                       │
                       ▼
         [Step 2: Elevation & Height Estimation]
         - Differential Surface Analysis: Height = DSM - DEM
         - Shadow-length triangulation fallback
                       │
                       ▼
         [Step 3: Floor Disaggregation & Vertical Slicing]
         - Urban code floor height modeling (default 3.0m per residential floor)
         - Basement subterranean floor identification
                       │
                       ▼
         [Step 4: 3D Volumetric Property Delineation]
         - Extrusion into 3D bounding volumes (Xmin, Xmax, Ymin, Ymax, Zmin, Zmax)
         - Prototype 3D ULPIN candidate assignment
                       │
                       ▼
         [Step 5: Verification & Human-in-the-loop Approval]
         - Status: AI_GENERATED ➔ SURVEY_VERIFIED ➔ ADMIN_APPROVED
```

## Authority Disclaimer
AI-generated cadastral outputs are decision-support aids designed to reduce manual digitizing time by 80%. All features are provisional (`AI_GENERATED`) until physically verified by a licensed cadastral surveyor and approved by a Land Administrator.
