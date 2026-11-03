import { store, escapeHTML as h } from './store.js';

const root = document.getElementById('view-about');

export function renderAbout() {
  const { events, periods, disciplines } = store;
  const refCount = events.reduce((n, e) => n + e.references.length, 0);
  const linked = events.reduce((n, e) => n + e.references.filter(r => r.url).length, 0);

  root.innerHTML = `
    <div class="wrap">
      <header class="view-head">
        <div class="eyebrow">About this atlas</div>
        <h1>An evolution of scientific thinking</h1>
        <p>${h(store.meta.thesis)}</p>
      </header>
      <div class="about-grid">
        <div class="prose">
          <h2>Purpose</h2>
          <p>The atlas explains how we learned to extract geometry from photographs; how optical instruments became computational algorithms; how computer vision automated reconstruction; how neural representations changed the way scenes are modelled and rendered; and how the problem expanded from static 3D to dynamic 4D reconstruction.</p>
          <p>It deliberately avoids a story of simple replacement. Photogrammetry is a measurement science concerned with accuracy, reliability and traceability. Computer vision grew from artificial intelligence and robotics with goals of perception and automation. Neural rendering emerged from computer graphics with the goal of reproducing appearance. These traditions share mathematics — central projection, epipolar geometry, least squares, bundle adjustment — and have repeatedly rediscovered one another's results.</p>

          <h2>How to read a milestone</h2>
          <p>Every record distinguishes four dates that are often conflated:</p>
          <ul>
            <li><strong>Invention or initial development</strong> — when the idea or device first existed.</li>
            <li><strong>First publication</strong> — when it entered the documented record.</li>
            <li><strong>Broader adoption</strong> — when it changed practice.</li>
            <li><strong>Subsequent improvements</strong> — the refinements that made it durable.</li>
          </ul>
          <p>Where priority is disputed or dates vary between sources, the record says so in a highlighted <em>historical uncertainty</em> note. Milestones from roughly 2024 onward whose long-term significance is not yet settled are tagged <strong>emerging</strong> and drawn with dashed outlines; they can be hidden with the status filter.</p>

          <h2>Sources and verification</h2>
          <p>References prioritise original papers, historical primary works, ISPRS and ASPRS literature, DOI-linked publications, official project pages and arXiv preprints. For pre-1900 works, bibliographic citations are given even where no stable online copy exists. Links were selected for stability (DOIs, arXiv, official repositories), but readers should verify bibliographic details against the primary source before citing them in scholarly work.</p>
          <p>Diagrams are original schematic drawings made for this atlas, so no third-party image rights are involved. Historical photographs can be added through the <code>media</code> field with explicit licence and attribution.</p>
/*
          <h2>Data model</h2>
          <p>All content lives in <code>data/</code>, separate from presentation code. The timeline, lineage map, search and comparison views read the same event database. Each event follows this schema:</p>
<pre>{
  "id": "3dgs",
  "year": 2023, "yearLabel": "2023",
  "title": "3D Gaussian Splatting",
  "period": "neural-dynamic", "thread": "gaussian",
  "category": "point-based", "type": "research-paper",
  "status": "established" | "emerging",
  "researchers": [], "institutions": [],
  "summary": "", "context": "", "contribution": "",
  "technicalExplanation": "", "historicalSignificance": "",
  "limitations": "",
  "dates": { "invention": "", "publication": "",
             "adoption": "", "improvements": "" },
  "uncertainty": "",
  "enabledDevelopments": [{ "id": "...", "relation": "extends" }],
  "relatedEvents": [],
  "references": [{ "title": "", "authors": "", "year": 2023,
                   "venue": "", "url": "", "type": "research-paper" }],
  "media": { "type": "diagram", "diagram": "gaussians", "caption": "" }
}</pre>
          <p>To add a milestone, append an object to the relevant file in <code>data/events/</code> and run <code>npm run validate</code> to check identifiers, links and required fields.</p>
        </div>

*/
        <aside class="about-side">
          <h3>Database at a glance</h3>
          <table class="stat-table"><tbody>
            <tr><td>Milestones</td><td>${events.length}</td></tr>
            <tr><td>Established / emerging</td><td>${events.filter(e => e.status !== 'emerging').length} / ${events.filter(e => e.status === 'emerging').length}</td></tr>
            <tr><td>Lineage links</td><td>${events.reduce((n, e) => n + e.enabledDevelopments.length, 0)}</td></tr>
            <tr><td>References</td><td>${refCount}</td></tr>
            <tr><td>References with online link</td><td>${linked}</td></tr>
            ${periods.map(p => `<tr><td>${p.number}. ${h(p.label)}</td><td>${events.filter(e => e.period === p.id).length}</td></tr>`).join('')}
          </tbody></table>
          <h3 style="margin-top:28px">Relation types</h3>
          <dl>${[...store.relationById.values()].map(r => `<dt>${h(r.id)}</dt><dd>${h(r.label)}</dd>`).join('')}</dl>
          <h3 style="margin-top:28px">Disciplines</h3>
          <dl>${disciplines.map(d => `<dt style="color:${d.color}">●</dt><dd>${h(d.label)}</dd>`).join('')}</dl>
        </aside>
      </div>
    </div>`;
}
