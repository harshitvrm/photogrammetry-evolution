import { store, escapeHTML as h } from './store.js';
import { go, openEvent } from './nav.js';

const root = document.getElementById('view-compare');
let bound = false;

export function renderCompare(sub) {
  const { comparisons, dimensions } = store.comparisons;
  const cmp = comparisons.find(c => c.id === sub) || comparisons[0];
  const cols = cmp.columns.length;

  root.innerHTML = `
    <div class="wrap">
      <header class="view-head">
        <div class="eyebrow">Comparison</div>
        <h1>Same problem, different principles</h1>
        <p>Compare how successive approaches represent the world, what they assume about cameras, how they estimate, and how their quality is judged. Each column links back to the milestones in the database.</p>
      </header>
      <div class="compare-picker" role="group" aria-label="Choose a comparison">
        ${comparisons.map(c => `<button type="button" class="chip" data-cmp="${c.id}" aria-pressed="${c.id === cmp.id}">${h(c.title)}</button>`).join('')}
      </div>
      <p class="compare-note">${h(cmp.note)}</p>
      <div class="compare-table" style="--cols:${cols}" role="table" aria-label="${h(cmp.title)}">
        <div class="ct-row ct-head" role="row">
          <div role="columnheader"></div>
          ${cmp.columns.map(col => `<div role="columnheader">${h(col.label)}<div class="ct-events">${col.events.map(id => { const ev = store.byId.get(id); return ev ? `<button class="linklike" data-event="${id}">${h(ev.title)}</button>` : ''; }).join('')}</div></div>`).join('')}
        </div>
        ${dimensions.map(d => `
          <div class="ct-row" role="row">
            <div class="ct-dim" role="rowheader">${h(d.label)}</div>
            ${cmp.columns.map(col => `<div role="cell" data-label="${h(col.label)}">${h(col.values[d.id] ?? '—')}</div>`).join('')}
          </div>`).join('')}
      </div>
    </div>`;

  if (!bound) {
    bound = true;
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cmp]'); if (b) { go({ view: 'compare', sub: b.dataset.cmp }); return; }
      const ev = e.target.closest('[data-event]'); if (ev) openEvent(ev.dataset.event);
    });
  }
}
