
# RoadWatch HP

**AI-Powered Crowdsourced Road Hazard Detection and Monitoring Platform for Himachal Pradesh**

RoadWatch HP aims to provide a centralized platform for reporting, detecting, monitoring and visualizing road hazards across Himachal Pradesh.

## Project Modules

1. Road damage detection
2. Landslide segmentation
3. Rockfall and debris detection
4. Flooding and waterlogging detection
5. GPS-enabled hazard reporting
6. AI-based severity assessment
7. Duplicate report detection
8. Interactive GIS hazard map

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| AI/ML | PyTorch, YOLO, U-Net |
| Database | PostgreSQL, PostGIS |
| Mapping | Leaflet, OpenStreetMap |
| Infrastructure | Docker, Docker Compose |
| Version Control | Git, GitHub |

## Repository Structure

```text
Roadwatch-HP/
├── ai-service/
├── backend/
├── frontend/
├── database/
├── docs/
├── tests/
├── scripts/
├── .env.example
├── .gitignore
└── README.md
```

## AI Modules

Each AI module will have an independent inference pipeline.

- Road damage: RGB image-based detection
- Landslide: Multispectral satellite image segmentation
- Rockfall and debris: Image-based hazard detection
- Flooding: Image-based hazard detection

Note: The landslide U-Net requires 14-channel multispectral input. It cannot directly process ordinary RGB photographs.

## Development Status

Current phase: System Integration and Development.

## Team

Four-member final-year engineering project team.

## Getting Started

Setup instructions will be added as the backend, frontend and AI services are implemented.

## License

To be decided.
