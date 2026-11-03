# The Evolution of Photogrammetry

**An interactive historical and scientific atlas of image-based 3D reconstruction** — from perspective geometry and the first photographic surveys to bundle adjustment, Structure from Motion, Neural Radiance Fields, 3D Gaussian Splatting and dynamic 4D reconstruction.

> *From measuring the physical world through photographs to reconstructing, representing, and experiencing the physical world in space and time.*

## Views

| View | What it shows |
|---|---|
| **Timeline** (`#/timeline`) | Six periods, 81 milestones with expandable cards, a chronological minimap with active-period tracking, Period 6 subdivided into five research threads, and a closing section on open problems. |
| **Lineage map** (`#/lineage`) | D3 network of the same events, placed by date (compressed scale) and discipline (rows). Node shape = type, colour = discipline, edge style = relation. Zoom, pan, reset, neighbourhood highlighting, "central spine" highlight, filter-aware. |
| **Technology** (`#/technology`) | Parallel tracks for capture, computation and representation, with curated couplings (including reverse influences). |
| **Compare** (`#/compare/<id>`) | Six side-by-side comparisons, e.g. NeRF vs 3DGS, COLMAP vs VGGT, deformation-field vs native 4D Gaussians. |
| **About** (`#/about`) | Purpose, dating conventions, source policy, data model, statistics. |

Global features: full-text search (title, people, institutions, reference titles, technical text; press `/`), period / discipline / status filters, a detail drawer with dating table (invention · first publication · adoption · improvements), uncertainty notes, incoming and outgoing lineage, related events and references, prev/next navigation and deep links (`#/timeline?e=3dgs`).

## Stack

Plain HTML, CSS and ES modules — no build step. D3 v7.9.0 is vendored in `vendor/` (ISC licence). No backend, database, API keys or external runtime dependencies; fonts are system stacks. Hash routing means refreshes and deep links work under any GitHub Pages sub-path without 404 handling.

```
index.html
css/style.css
js/            main.js (router, filters) · store.js (data + state) · timeline.js · lineage.js
               technology.js · compare.js · about.js · detail.js · search.js · diagrams.js · nav.js
data/index.json          periods, threads, disciplines, types, relations, open questions
data/events/*.json       the event database (one file per period)
data/technology.json     capture / computation / representation items and couplings
data/comparisons.json    comparison tables
scripts/validate-data.mjs
.github/workflows/pages.yml
```

## Run locally

Browsers block `fetch()` from `file://`, so serve the folder:

```bash
python3 -m http.server 8080      # or: npm start
# open http://localhost:8080
```

## Deploy to GitHub Pages

1. Create a repository (e.g. `photogrammetry-evolution`) and push this folder to the `main` branch:
   ```bash
   git init && git add . && git commit -m "Initial atlas"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPOSITORY.git
   git push -u origin main
   ```
2. Make sure the workflow sits at `.github/workflows/pages.yml` (if you received `deploy-pages-workflow.yml` at the project root, move it there: `mkdir -p .github/workflows && mv deploy-pages-workflow.yml .github/workflows/pages.yml`).
3. In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. The included workflow validates the data and publishes the site. It will be available at `https://USERNAME.github.io/REPOSITORY/`.

*Alternative without Actions:* Settings → Pages → Source: *Deploy from a branch* → `main` / root. All paths are relative, so this works too (the `.nojekyll` file is included).

## Adding or editing milestones

1. Add an object to the relevant `data/events/*.json` file (schema below; see the About view).
2. Link it with `enabledDevelopments: [{ "id": "...", "relation": "foundation|extends|automates|reinterprets|enables|parallel" }]` and `relatedEvents: [...]`.
3. Choose a `media.diagram` from `js/diagrams.js` (or add a new schematic function there).
4. Run `npm run validate` — it checks ids, required fields, categories, link targets and references.

```json
{
  "id": "kebab-case-id", "year": 2023, "yearLabel": "2023",
  "title": "", "period": "neural-dynamic", "thread": "gaussian",
  "category": "point-based", "type": "research-paper", "status": "established",
  "researchers": [], "institutions": [],
  "summary": "", "context": "", "contribution": "", "technicalExplanation": "",
  "historicalSignificance": "", "limitations": "",
  "dates": { "invention": "", "publication": "", "adoption": "", "improvements": "" },
  "uncertainty": "",
  "enabledDevelopments": [], "relatedEvents": [],
  "references": [{ "title": "", "authors": "", "year": 2023, "venue": "", "url": "", "type": "research-paper" }],
  "media": { "type": "diagram", "diagram": "gaussians", "caption": "" }
}
```

`status: "emerging"` marks recent work whose long-term significance is not yet settled (dashed outlines; filterable).

## Content and accuracy notes

- References favour primary publications, DOIs, arXiv, official project pages and repositories. Pre-1900 sources are cited bibliographically, often without links. Please verify bibliographic details against the primary source before formal citation, and open an issue for corrections.
- Disputed priorities (e.g. Gauss vs Legendre, Pulfrich vs Fourcade, the coinage of "Photogrammetrie") are flagged in each record's uncertainty note.
- All figures are original schematic SVG diagrams generated in `js/diagrams.js`; no third-party images are included. If you add historical images, record licence and attribution in `media`.

## Licences

Code: MIT. D3: ISC (see `vendor/d3.LICENSE.txt`). Choose a content licence (e.g. CC BY 4.0) for the text in `data/` before publishing.
