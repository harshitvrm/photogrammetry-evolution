// Data loading, indexing and shared filter state.
// All views read from the same event database (data/events/*.json).

const listeners = new Set();

export const store = {
  meta: null,
  events: [],          // chronologically sorted
  byId: new Map(),
  incoming: new Map(), // id -> [{ id, relation }]
  periods: [],
  periodById: new Map(),
  disciplines: [],
  disciplineById: new Map(),
  types: [],
  typeById: new Map(),
  relationById: new Map(),
  threads: [],
  technology: null,
  comparisons: null,
  filters: { periods: new Set(), disciplines: new Set(), status: 'all' },
};

async function getJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
  return res.json();
}

export async function loadData() {
  const meta = await getJSON('data/index.json');
  const [eventLists, technology, comparisons] = await Promise.all([
    Promise.all(meta.eventFiles.map(getJSON)),
    getJSON('data/technology.json'),
    getJSON('data/comparisons.json'),
  ]);

  store.meta = meta;
  store.periods = meta.periods;
  store.disciplines = meta.disciplines;
  store.types = meta.types;
  store.threads = meta.threads;
  meta.periods.forEach(p => store.periodById.set(p.id, p));
  meta.disciplines.forEach(d => store.disciplineById.set(d.id, d));
  meta.types.forEach(t => store.typeById.set(t.id, t));
  meta.relations.forEach(r => store.relationById.set(r.id, r));

  let order = 0;
  const all = [];
  for (const list of eventLists) for (const ev of list) { ev._order = order++; all.push(normalise(ev)); }
  const periodIndex = new Map(meta.periods.map((p, i) => [p.id, i]));
  all.sort((a, b) => (periodIndex.get(a.period) - periodIndex.get(b.period)) || (a.year - b.year) || (a._order - b._order));
  all.forEach((ev, i) => { ev._index = i; store.byId.set(ev.id, ev); });
  store.events = all;

  for (const ev of all) {
    for (const edge of ev.enabledDevelopments) {
      if (!store.byId.has(edge.id)) { console.warn(`Unknown enabledDevelopments id "${edge.id}" in ${ev.id}`); continue; }
      if (!store.incoming.has(edge.id)) store.incoming.set(edge.id, []);
      store.incoming.get(edge.id).push({ id: ev.id, relation: edge.relation });
    }
    ev._search = buildSearchText(ev);
  }

  store.technology = technology;
  store.comparisons = comparisons;
  return store;
}

function normalise(ev) {
  ev.researchers ??= [];
  ev.institutions ??= [];
  ev.relatedEvents ??= [];
  ev.references ??= [];
  ev.dates ??= {};
  ev.status ??= 'established';
  ev.enabledDevelopments = (ev.enabledDevelopments ?? []).map(e => typeof e === 'string' ? { id: e, relation: 'enables' } : e);
  return ev;
}

function buildSearchText(ev) {
  const parts = [
    ev.title, ev.yearLabel, String(ev.year), ev.summary, ev.context, ev.contribution,
    ev.technicalExplanation, ev.historicalSignificance,
    ev.researchers.join(' '), ev.institutions.join(' '),
    ...ev.references.map(r => `${r.title} ${r.authors} ${r.venue ?? ''} ${r.year}`),
    store.disciplineById.get(ev.category)?.label, store.periodById.get(ev.period)?.label,
  ];
  return parts.filter(Boolean).join('   ').toLowerCase();
}

// ---------- filters ----------
export function matchesFilters(ev, f = store.filters) {
  if (f.periods.size && !f.periods.has(ev.period)) return false;
  if (f.disciplines.size && !f.disciplines.has(ev.category)) return false;
  if (f.status !== 'all' && ev.status !== f.status) return false;
  return true;
}

export function filtersActive() {
  const f = store.filters;
  return f.periods.size > 0 || f.disciplines.size > 0 || f.status !== 'all';
}

export function setFilter(kind, value) {
  const f = store.filters;
  if (kind === 'status') f.status = value;
  else {
    const set = f[kind];
    set.has(value) ? set.delete(value) : set.add(value);
  }
  emit();
}

export function resetFilters() {
  store.filters.periods.clear();
  store.filters.disciplines.clear();
  store.filters.status = 'all';
  emit();
}

export function onFiltersChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { listeners.forEach(fn => fn(store.filters)); }

// ---------- helpers ----------
export function neighbours(id) {
  const ev = store.byId.get(id);
  const out = ev ? ev.enabledDevelopments.map(e => e.id) : [];
  const inc = (store.incoming.get(id) ?? []).map(e => e.id);
  return new Set([...out, ...inc]);
}

export function escapeHTML(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
