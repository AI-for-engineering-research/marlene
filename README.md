# Multi-Sensor Framework for Enhanced Contrail Observation Capabilities

**Marlene V. Euchenhofer** · PhD Student · MIT AeroAstro · Laboratory for Aviation and the Environment

---

## About

This is the project website for my AI for Research Pilot (Summer 2026). It documents my research on building a multi-sensor framework that fuses observational data from geostationary satellites, low-Earth orbit imagers, ground cameras, lidars, and radiosondes into a unified 4D dataset for contrail observation and attribution.

## Structure

```
multi_sensor_obs/
├── index.html                  # Main site
├── updates.html                # Full updates & reflections log
├── style.css                   # Styles
├── script.js                   # Interactions, animations, easter eggs
├── .gitignore
├── README.md
└── assets/
    ├── content/
    │   ├── about.md
    │   ├── project.md
    │   ├── timeline.md
    │   ├── updates/            # Weekly project update notes (.md)
    │   └── reflections/        # Weekly reflection notes (.md)
    └── images/                 # Not tracked in git (too large — add manually)
        ├── marlene.jpg
        └── banner/             # Photos for the scrolling strip
```

## Running locally

```bash
cd multi_sensor_obs
python3 -m http.server 8090
```
Then open [http://localhost:8090](http://localhost:8090).

## Adding a weekly update

1. Add a new `.md` file to `assets/content/updates/` (e.g. `update_20260612.md`)
2. Add a new `.md` file to `assets/content/reflections/` if applicable
3. Add a preview card in the **Updates & Reflections** section of `index.html`
4. Add the full entry block in `updates.html`

## Images

Images are not tracked in git due to file size. After cloning, add them manually:
- `assets/images/marlene.jpg` — headshot
- `assets/images/banner/` — photos for the scrolling strip

## Easter eggs

There are a few hidden around the site — explore and find them. 🛰

---

*MIT Laboratory for Aviation and the Environment · 2026*
