# Multi-Sensor Contrail Observation Framework — Design Notes

_Session date: 2026-06-09_

## Problem

Contrails substantially contribute to aviation's climate impact. Persistent contrails form in ice-supersaturated regions (ISSRs) and can last several hours. Contrail avoidance — vertically deviating flights around ISSRs — is an operational mitigation today, but requires confident atmospheric knowledge and observational verification. Existing observational datasets have gaps: inconsistencies across models, difficulty confirming absence, and resolution trade-offs.

## Goal

Combine multiple observational platforms in 4D (lat/lon/altitude/time) to: identify contrails, link them across platforms via flight attribution, track them over time, and evaluate contrail predictions with greater rigor.

---

## Sensors

| Sensor | Type | Coverage | Resolution |
|--------|------|----------|------------|
| GOES ABI (MCAST detections) | Geostationary satellite imager | CONUS continuous | 5 min temporal |
| Ground cameras (GNM) | Fixed hemispherical cameras | Point sensors, fixed locations | Highest temporal resolution |
| WindBorne radiosondes | Drifting long-duration balloons | Sparse, global | Vertical profiles, drifting (lat/lon/alt/time tuples) |
| EarthCARE ATLID | Low-Earth orbit lidar | Episodic overpass, ~1 km swath | L1b attenuated backscatter |

_Traditional NWS radiosondes (IGRA/BUFR) may be added alongside WindBorne using the same schema._

---

## Core Design Decisions

### 1. Data Model: Sensor-Native with Lazy Alignment

Each sensor stores data in its native format and coordinate system. No forced projection onto a common grid at ingest time. Cross-sensor alignment happens at query time via spatiotemporal joins.

- **GOES / EarthCARE raster and curtain data:** Zarr (chunked, cloud-native)
- **Observation records, event metadata, linking tables, radiosonde profiles:** Parquet + DuckDB (SQL spatiotemporal queries, no server required)
- **Technology stack:** Python, Xarray for raster data, DuckDB with spatial extension for tabular queries

### 2. Spatial Domain

Fixed regions of interest anchored to camera FOV locations, within CONUS. Long-term target is full CONUS. Initial work uses a small number of camera-anchored regions.

### 3. Event Trigger

**GOES/MCAST is the primary event trigger.** A contrail detection in MCAST within the spatial extent of a camera region fires a multi-sensor query. The framework then asks: what do other sensors tell us about this airmass, within the advection validity window?

EarthCARE and radiosonde observations serve as corroborating evidence. Ground camera detections (from GNM, already projected to geographic coordinates using ADS-B altitude from flight attribution) are a secondary trigger candidate for future work.

The framework looks for **positive multi-sensor agreement** — corroborating detections across sensors. Negative detections (no contrail observed) are not the focus for this first pass.

### 4. Flight Attribution and Contrail Identity

- The **callsign** from flight attribution is the contrail identifier linking observations across platforms and time.
- Attribution runs as a **post-processing step** after detection — detections are stored and queryable without attribution.
- Each detection stores the **top-3 candidate flights** as `(callsign, confidence)` pairs. No single best-guess-only commitment.
- Attribution comes from a separate attribution pipeline; attribution uncertainty propagates through the linking table.

### 5. Radiosonde Schema

All radiosonde data (WindBorne and traditional) stored as sequences of:

```
(lat, lon, altitude, time, RH, T, u, v)
```

This unifies drifting long-duration balloons (WindBorne) and fixed-launch NWS sondes in a single schema. Launch point is stored as metadata only.

### 6. ISSR Advection

- **Wind field source:** HRRR (primary, ~3 km, near-real-time, CONUS) with ERA5 as optional retrospective backend
- **Maximum advection window:** ±2 hours
- Each advected observation stores advection metadata: wind source, advection duration, estimated position uncertainty
- Both forward and backward advection are supported

### 7. EarthCARE Integration

- **Product level:** L1b attenuated backscatter (own contrail detection algorithm to be developed)
- **Overpass scheduling:** the framework pre-computes upcoming EarthCARE overpasses over camera regions and flags them as high-value coincidence windows

---

## Open Questions

- **WindBorne data access:** access mechanism and format TBD (API vs. bulk download, JSON vs. NetCDF/CSV). Schema is defined; ingestion pipeline pending.
- **Traditional radiosondes:** whether to ingest NWS operational soundings alongside WindBorne from the start.
- **Multi-sensor agreement definition:** what quantitatively constitutes "agreement" across sensors (spatial tolerance, confidence thresholds).
- **Camera region bounding box sizes:** exact spatial extents around each camera FOV.
- **GNM interface schema:** exact fields expected from the GNM partner (coordinates, timestamp, confidence, pre-attribution or raw?).
