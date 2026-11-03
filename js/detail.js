import { store, escapeHTML as h } from './store.js';
import { diagramSVG } from './diagrams.js';
import { go, openEvent, closeEvent, parseHash } from './nav.js';

const drawer = document.getElementById('drawer');
const content = document.getElementById('drawer-content');
const panel = drawer.querySelector('.drawer-panel');
const prevBtn = document.getElementById('drawer-prev');
const nextBtn = document.getElementById('drawer-next');
let current = null;
let lastFocus = null;

export function initDrawer() {
  drawer.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeEvent));
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  document.addEventListener('keydown', (e) => {
    if (!drawer.classList.contains('open')) return;
    if (e.key === 'Escape') closeEvent();
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowLeft' && e.altKey) step(-1);
    if (e.key === 'ArrowRight' && e.altKey) step(1);
  });
  content.addEventListener('click', (e) => {
    const link = e.target.closest('[data-event]');
    if (link) { e.preventDefault(); openEvent(link.dataset.event); return; }
    const jump = e.target.closest('[data-goto]');
    if (jump) { e.preventDefault(); go({ view: jump.dataset.goto, sub: null, e: jump.dataset.id }); }
  });
}

function step(dir) {
  if (!current) return;
  const next = store.events[current._index + dir];
  if (next) openEvent(next.id);
}

export function renderDrawer(id) {
  const ev = id && store.byId.get(id);
  if (!ev) {
    if (drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    }
    current = null;
    return;
  }
  if (!drawer.classList.contains('open')) lastFocus = document.activeElement;
  current = ev;
  content.innerHTML = template(ev);
  content.scrollTop = 0;
  prevBtn.disabled = ev._index === 0;
  nextBtn.disabled = ev._index === store.events.length - 1;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  panel.focus({ preventScroll: true });
}

function linkTo(id, rel) {
  const ev = store.byId.get(id);
  if (!ev) return '';
  const relLabel = rel ? `<span class="rel">${h(store.relationById.get(rel)?.label ?? rel)}</span>` : '';
  return `<li>${relLabel}<button class="linklike" data-event="${ev.id}">${h(ev.title)}</button><span class="yr">${h(ev.yearLabel || ev.year)}</span></li>`;
}

function refItem(r) {
  const title = r.url ? `<a href="${h(r.url)}" target="_blank" rel="noopener">${h(r.title)}</a>` : h(r.title);
  return `<li><div class="r-title">${title}</div>
    <div class="r-meta">${h(r.authors || '')}${r.year ? ` (${h(r.year)})` : ''}${r.venue ? `. ${h(r.venue)}` : ''}</div>
    <div class="r-type">${h(r.type || 'reference')}${r.url ? '' : ' · no stable online link'}</div></li>`;
}

function section(title, body, cls = '') {
  if (!body || body === '—') return '';
  return `<div class="d-section ${cls}"><h3>${title}</h3>${body}</div>`;
}

function template(ev) {
  const disc = store.disciplineById.get(ev.category);
  const period = store.periodById.get(ev.period);
  const type = store.typeById.get(ev.type);
  const thread = ev.thread ? store.threads.find(t => t.id === ev.thread) : null;
  const incoming = store.incoming.get(ev.id) ?? [];
  const route = parseHash();
  const dates = [['Invention / initial development', ev.dates.invention], ['First publication', ev.dates.publication], ['Broader adoption', ev.dates.adoption], ['Subsequent improvements', ev.dates.improvements]].filter(([, v]) => v);

  return `
    <div class="d-kicker">
      <span><span class="swatch" style="background:${disc?.color}"></span>${h(disc?.label)}</span>
      <span>Period ${period?.number} · ${h(period?.label)}</span>
      ${thread ? `<span>${h(thread.label)}</span>` : ''}
      <span class="badge type">${h(type?.label ?? ev.type)}</span>
      ${ev.status === 'emerging' ? '<span class="badge emerging">Emerging research</span>' : ''}
    </div>
    <h2 id="drawer-title">${h(ev.title)}</h2>
    <div class="d-date">${h(ev.yearLabel || ev.year)}</div>
    <p class="d-lead">${h(ev.summary)}</p>
    <div class="d-actions">
      ${route.view !== 'timeline' ? `<button class="btn" data-goto="timeline" data-id="${ev.id}">Show on timeline</button>` : ''}
      ${route.view !== 'lineage' ? `<button class="btn" data-goto="lineage" data-id="${ev.id}">Show in lineage map</button>` : ''}
    </div>
    <figure class="d-figure">
      ${diagramSVG(ev.media?.diagram, ev.title)}
      <figcaption>${h(ev.media?.caption || '')} <span class="muted">— schematic diagram drawn for this atlas.</span></figcaption>
    </figure>
    ${section('Historical context', `<p>${h(ev.context)}</p>`)}
    ${section('Scientific contribution', `<p>${h(ev.contribution)}</p>`)}
    ${section('Technical explanation', ev.technicalExplanation && ev.technicalExplanation !== '—' ? `<p class="d-tech">${h(ev.technicalExplanation)}</p>` : '')}
    ${section('Why it mattered', `<p>${h(ev.historicalSignificance)}</p>`)}
    ${ev.limitations ? section('Limitations', `<p>${h(ev.limitations)}</p>`) : ''}
    ${dates.length ? section('Dating', `<table class="d-dates"><tbody>${dates.map(([k, v]) => `<tr><th>${k}</th><td>${h(v)}</td></tr>`).join('')}</tbody></table>`) : ''}
    ${ev.uncertainty ? section('Historical uncertainty', `<p class="d-note"><strong>Note.</strong> ${h(ev.uncertainty)}</p>`) : ''}
    ${(ev.researchers.length || ev.institutions.length) ? section('Key researchers & institutions', `<div class="d-people">${ev.researchers.map(p => `<span>${h(p)}</span>`).join('')}${ev.institutions.map(p => `<span class="inst">${h(p)}</span>`).join('')}</div>`) : ''}
    ${incoming.length ? section('Built upon', `<ul class="d-links">${incoming.map(e => linkTo(e.id, e.relation)).join('')}</ul>`) : ''}
    ${ev.enabledDevelopments.length ? section('What it enabled next', `<ul class="d-links">${ev.enabledDevelopments.map(e => linkTo(e.id, e.relation)).join('')}</ul>`) : ''}
    ${ev.relatedEvents.length ? section('Related events', `<ul class="d-links">${ev.relatedEvents.map(id => linkTo(id)).join('')}</ul>`) : ''}
    ${section('References', `<ol class="d-refs">${ev.references.map(refItem).join('')}</ol>`)}
  `;
}
