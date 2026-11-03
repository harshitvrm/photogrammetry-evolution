import { store, escapeHTML as h } from './store.js';
import { openEvent } from './nav.js';

const root = document.getElementById('view-technology');
const W = 1200, LEFT = 150, RIGHT = 20, ROW = 24, GAP = 4, Y0 = 40;
const START = 1845, END = 2027;

export function renderTechnology() {
  const tech = store.technology;
  const xs = window.d3.scaleLinear().domain([START, 1900, 1950, 2000, 2010, 2020, END]).range([0, 0.15, 0.31, 0.52, 0.67, 0.84, 1].map(f => LEFT + f * (W - LEFT - RIGHT))).clamp(true);
  const x = (y) => xs(y);

  // Greedy row packing per track
  const layout = new Map();
  let y = Y0;
  const trackBoxes = [];
  for (const track of tech.tracks) {
    const items = tech.items.filter(i => i.track === track.id).sort((a, b) => a.start - b.start);
    const rowsEnd = [];
    items.forEach(it => {
      const labelW = it.label.length * 5.9 + 14;
      const x0 = x(it.start), xe = x(it.end), right = W - RIGHT;
      const labelLeft = xe - x0 < labelW && x0 + labelW > right; // label would overflow the right edge
      const occ0 = labelLeft ? Math.min(x0, xe - labelW) : x0;
      const occ1 = labelLeft ? xe : Math.max(xe, x0 + labelW);
      let r = rowsEnd.findIndex(e => e + 6 < occ0);
      if (r === -1) { r = rowsEnd.length; rowsEnd.push(0); }
      rowsEnd[r] = occ1;
      layout.set(it.id, { it, x0, x1: xe, w: xe - x0, labelW, labelLeft, row: r });
    });
    const h0 = y + 20;
    items.forEach(it => { const L = layout.get(it.id); L.y = h0 + L.row * (ROW + GAP); });
    const height = 20 + rowsEnd.length * (ROW + GAP) + 18;
    trackBoxes.push({ track, y, height });
    y += height;
  }
  const H = y + 26;

  const ticks = [1850, 1875, 1900, 1925, 1950, 1975, 2000, 2010, 2015, 2020, 2025];
  const axis = ticks.map(t => `<line x1="${x(t)}" x2="${x(t)}" y1="${Y0 - 6}" y2="${H - 26}"/><text x="${x(t)}" y="${Y0 - 12}" text-anchor="middle">${t}</text><text x="${x(t)}" y="${H - 10}" text-anchor="middle">${t}</text>`).join('');

  const tracksSVG = trackBoxes.map(({ track, y, height }, i) => `
    <rect x="0" y="${y}" width="${W}" height="${height}" fill="${i % 2 ? 'transparent' : 'rgba(217,230,223,0.28)'}"/>
    <text class="tech-track-label" x="14" y="${y + 24}">${h(track.label)}</text>
    <foreignObject x="14" y="${y + 30}" width="${LEFT - 24}" height="60"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:10.5px;color:var(--muted);line-height:1.3">${h(track.description)}</div></foreignObject>`).join('');

  const bars = [...layout.values()].map(({ it, x0, w, y, labelLeft }) => `
    <g class="tech-bar ${it.track} ${it.emerging ? 'emerging' : ''}" data-item="${it.id}" tabindex="0" role="button" aria-label="${h(it.label)}, from ${it.start}">
      <rect x="${x0}" y="${y}" width="${Math.max(w, 6)}" height="${ROW}" rx="1"/>
      ${labelLeft ? `<text x="${x0 + Math.max(w, 6) - 6}" y="${y + 16}" text-anchor="end">${h(it.label)}</text>` : `<text x="${x0 + 6}" y="${y + 16}">${h(it.label)}</text>`}
    </g>`).join('');

  const couples = tech.couplings.map((c, i) => {
    const a = layout.get(c.from), b = layout.get(c.to);
    if (!a || !b) return '';
    const reverse = trackOrder(a.it.track) > trackOrder(b.it.track);
    const xa = Math.min(Math.max(x(b.it.start) + 4, a.x0 + 4), a.x0 + Math.max(a.w, 8) - 4);
    const xb = b.x0 + 6;
    const ya = reverse ? a.y : a.y + ROW, yb = reverse ? b.y + ROW : b.y;
    const my = (ya + yb) / 2;
    return `<path class="tech-couple ${reverse ? 'reverse' : ''}" data-couple="${i}" d="M${xa},${ya} C${xa},${my} ${xb},${my} ${xb},${yb}"><title>${h(c.text)}</title></path>`;
  }).join('');

  root.innerHTML = `
    <div class="wrap">
      <header class="view-head">
        <div class="eyebrow">View C · Technological evolution</div>
        <h1>Instruments, computation and representation</h1>
        <p>${h(tech.intro)}</p>
      </header>
      <div class="tech-frame">
        <svg class="tech-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Parallel timelines of capture, computation and representation technologies with influence links">
          <g class="tech-axis">${axis}</g>
          ${tracksSVG}
          <g>${couples}</g>
          <g>${bars}</g>
        </svg>
      </div>
      <div class="tech-detail" id="tech-detail" aria-live="polite">
        <p class="muted">Select a technology bar or an influence link to see how acquisition and representation shaped each other. Solid links run from capture or computation to representation; dashed terracotta links mark reverse influence, where a new representation changed how people capture.</p>
      </div>
      <div class="coupling-list">
        <h3>Couplings between capture and representation</h3>
        ${tech.couplings.map((c, i) => {
          const a = layout.get(c.from)?.it, b = layout.get(c.to)?.it;
          const reverse = a && b && trackOrder(a.track) > trackOrder(b.track);
          return `<div class="coupling-item ${reverse ? 'reverse' : ''}" data-couple="${i}" tabindex="0"><div class="ci-head">${h(a?.label)}<span class="arrow">${reverse ? '⟲' : '→'}</span>${h(b?.label)}</div><div>${h(c.text)}</div></div>`;
        }).join('')}
      </div>
    </div>`;

  const svg = root.querySelector('.tech-svg');
  const detail = root.querySelector('#tech-detail');

  function clear() { svg.classList.remove('has-active'); root.querySelectorAll('.active, .linked').forEach(el => el.classList.remove('active', 'linked')); }

  function selectItem(id) {
    clear();
    const it = layout.get(id)?.it; if (!it) return;
    svg.classList.add('has-active');
    root.querySelector(`.tech-bar[data-item="${id}"]`).classList.add('active');
    tech.couplings.forEach((c, i) => {
      if (c.from === id || c.to === id) {
        root.querySelectorAll(`[data-couple="${i}"]`).forEach(el => el.classList.add('active'));
        root.querySelector(`.tech-bar[data-item="${c.from === id ? c.to : c.from}"]`)?.classList.add('linked');
      }
    });
    const track = tech.tracks.find(t => t.id === it.track);
    detail.innerHTML = `<h3>${h(it.label)}</h3><div class="td-meta">${h(track.label)} · from ${it.start}${it.end < 2027 ? ` to c. ${it.end}` : ' to present'}${it.emerging ? ' · emerging' : ''}</div><p>${h(it.text)}</p>
      ${it.events.length ? `<div class="td-links"><span class="muted">Related milestones:</span>${it.events.map(eid => { const ev = store.byId.get(eid); return ev ? `<button class="linklike" data-event="${eid}">${h(ev.title)}</button>` : ''; }).join('')}</div>` : ''}`;
  }

  function selectCouple(i) {
    clear();
    const c = tech.couplings[i];
    svg.classList.add('has-active');
    root.querySelectorAll(`[data-couple="${i}"]`).forEach(el => el.classList.add('active'));
    [c.from, c.to].forEach(id => root.querySelector(`.tech-bar[data-item="${id}"]`)?.classList.add('linked'));
    const a = layout.get(c.from).it, b = layout.get(c.to).it;
    const evs = [...new Set([...a.events, ...b.events])];
    detail.innerHTML = `<h3>${h(a.label)} → ${h(b.label)}</h3><p>${h(c.text)}</p>
      <div class="td-links"><span class="muted">Related milestones:</span>${evs.map(eid => { const ev = store.byId.get(eid); return ev ? `<button class="linklike" data-event="${eid}">${h(ev.title)}</button>` : ''; }).join('')}</div>`;
  }

  root.addEventListener('click', (e) => {
    const evb = e.target.closest('[data-event]'); if (evb) { openEvent(evb.dataset.event); return; }
    const bar = e.target.closest('[data-item]'); if (bar) { selectItem(bar.dataset.item); return; }
    const cp = e.target.closest('[data-couple]'); if (cp) { selectCouple(+cp.dataset.couple); if (cp.classList.contains('coupling-item')) root.querySelector('.tech-frame').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (e.target.closest('.tech-svg')) clear();
  });
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const bar = e.target.closest('[data-item]'); if (bar) { e.preventDefault(); selectItem(bar.dataset.item); }
    const cp = e.target.closest('.coupling-item'); if (cp) { e.preventDefault(); selectCouple(+cp.dataset.couple); }
  });
}

function trackOrder(id) { return { capture: 0, compute: 1, representation: 2 }[id] ?? 0; }
