import { store, loadData, setFilter, resetFilters, onFiltersChange, filtersActive, matchesFilters, escapeHTML as h } from './store.js';
import { parseHash } from './nav.js';
import { initDrawer, renderDrawer } from './detail.js';
import { initSearch } from './search.js';
import { renderTimeline, applyTimelineFilters, focusEvent } from './timeline.js';
import { renderLineage, applyLineageFilters, setFocus } from './lineage.js';
import { renderTechnology } from './technology.js';
import { renderCompare } from './compare.js';
import { renderAbout } from './about.js';

const rendered = new Set();
let currentView = null;
let currentSub = null;

async function boot() {
  try {
    await loadData();
  } catch (err) {
    console.error(err);
    document.getElementById('loading').innerHTML = `The atlas data could not be loaded.<br><small>${h(err.message)}. If you opened <code>index.html</code> directly from disk, serve the folder with a local web server instead (see README), because browsers block <code>fetch()</code> on <code>file://</code> URLs.</small>`;
    return;
  }
  document.getElementById('loading').remove();
  buildFilterUI();
  initDrawer();
  initSearch();
  onFiltersChange(() => { syncFilterUI(); applyTimelineFilters(); applyLineageFilters(); });
  window.addEventListener('hashchange', route);
  window.addEventListener('resize', updateStickyOffset);
  route();
}

function ensureRendered(view, sub) {
  if (view === 'compare') { if (!rendered.has('compare') || sub !== currentSub) renderCompare(sub); rendered.add('compare'); return; }
  if (rendered.has(view)) return;
  ({ timeline: renderTimeline, lineage: renderLineage, technology: renderTechnology, about: renderAbout })[view]();
  rendered.add(view);
}

function route() {
  const r = parseHash();
  const viewChanged = r.view !== currentView;
  if (viewChanged || (r.view === 'compare' && r.sub !== currentSub)) {
    document.querySelectorAll('main > .view').forEach(sec => { sec.hidden = sec.dataset.view !== r.view; });
    ensureRendered(r.view, r.sub);
    document.querySelectorAll('.main-nav a').forEach(a => { if (a.dataset.view === r.view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.getElementById('filter-bar').hidden = !['timeline', 'lineage'].includes(r.view);
    if (viewChanged && !r.e) window.scrollTo({ top: 0, behavior: 'auto' });
    document.title = `${{ timeline: 'Timeline', lineage: 'Lineage map', technology: 'Technological evolution', compare: 'Compare', about: 'About' }[r.view]} — The Evolution of Photogrammetry`;
    currentView = r.view;
    currentSub = r.sub;
    updateStickyOffset();
  }

  renderDrawer(r.e);
  if (r.e && store.byId.has(r.e)) {
    if (r.view === 'timeline') {
      const ev = store.byId.get(r.e);
      if (!matchesFilters(ev) && filtersActive()) resetFilters();
      requestAnimationFrame(() => focusEvent(r.e));
    }
    if (r.view === 'lineage') setFocus(r.e, viewChanged);
  }
}

// ---------- Filter UI ----------
function buildFilterUI() {
  const pf = document.getElementById('period-filters');
  pf.innerHTML = store.periods.map(p => `<button type="button" class="chip" data-period="${p.id}" aria-pressed="false" title="${h(p.label)} · ${h(p.range)}"><span class="chip-num">${p.number}</span>${h(p.short || p.label)}</button>`).join('');
  const df = document.getElementById('discipline-filters');
  df.innerHTML = store.disciplines.map(d => `<button type="button" class="chip" data-discipline="${d.id}" aria-pressed="false"><span class="swatch" style="background:${d.color}"></span>${h(d.label)} <span class="chip-num">${store.events.filter(e => e.category === d.id).length}</span></button>`).join('');

  pf.addEventListener('click', e => { const b = e.target.closest('[data-period]'); if (b) setFilter('periods', b.dataset.period); });
  df.addEventListener('click', e => { const b = e.target.closest('[data-discipline]'); if (b) setFilter('disciplines', b.dataset.discipline); });
  document.getElementById('status-filters').addEventListener('click', e => { const b = e.target.closest('[data-status]'); if (b) setFilter('status', b.dataset.status); });
  document.getElementById('filter-reset').addEventListener('click', resetFilters);
  const toggle = document.getElementById('discipline-toggle');
  const panel = document.getElementById('discipline-panel');
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    updateStickyOffset();
  });
  syncFilterUI();
}

function syncFilterUI() {
  const f = store.filters;
  document.querySelectorAll('[data-period].chip').forEach(b => b.setAttribute('aria-pressed', String(f.periods.has(b.dataset.period))));
  document.querySelectorAll('[data-discipline].chip').forEach(b => b.setAttribute('aria-pressed', String(f.disciplines.has(b.dataset.discipline))));
  document.querySelectorAll('#status-filters [data-status]').forEach(b => b.setAttribute('aria-pressed', String(f.status === b.dataset.status)));
  document.getElementById('discipline-count').textContent = f.disciplines.size ? `(${f.disciplines.size})` : '';
  const n = store.events.filter(e => matchesFilters(e)).length;
  document.getElementById('filter-count').textContent = filtersActive() ? `${n} of ${store.events.length}` : `${store.events.length} milestones`;
  document.getElementById('filter-reset').hidden = !filtersActive();
}

function updateStickyOffset() {
  const hdr = document.querySelector('.site-header');
  const sticky = getComputedStyle(hdr).position === 'sticky';
  document.documentElement.style.setProperty('--sticky-offset', `${sticky ? hdr.offsetHeight : 0}px`);
}

boot();
