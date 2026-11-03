import { store, matchesFilters, neighbours, escapeHTML as h } from './store.js';
import { openEvent } from './nav.js';

const root = document.getElementById('view-lineage');
const d3 = window.d3;

let W = 1200, LEFT = 190, LANE = 56, FW = 1200, FH = 800;
const RIGHT = 40, TOP = 64, BOTTOM = 30;
const YEAR_DOMAIN = [1000, 1600, 1850, 1900, 1960, 2000, 2020, 2026.6];
const RANGE_FRAC = [0, 0.045, 0.12, 0.215, 0.36, 0.56, 0.745, 1];
const BANDS = [
  { from: 1000, to: 1850, n: 1, label: 'Foundations' },
  { from: 1850, to: 1900, n: 2, label: 'Birth' },
  { from: 1900, to: 1955, n: 3, label: 'Analog' },
  { from: 1955, to: 2000, n: 4, label: 'Analytical & digital' },
  { from: 2000, to: 2020, n: 5, label: 'Automated 3D' },
  { from: 2020, to: 2026.6, n: 6, label: 'Neural & dynamic' },
];


let H = 800;
let svg, gZoom, zoom, nodesSel, edgesSel, laneLabels, frame, tooltip, xScale, laneY, nodes, links;
let focusId = null, showAll = false;

export function renderLineage() {
  const { events, disciplines } = store;

  root.innerHTML = `
    <div class="wrap">
      <header class="view-head">
        <div class="eyebrow">View B · Research lineage map</div>
        <h1>The intellectual evolution of reconstruction</h1>
        <p>Each node is a milestone from the same database as the timeline, placed by date (horizontal, compressed for earlier centuries) and research discipline (rows). Arrows show how one development provided foundations for, extended, automated or reinterpreted another. Click a node to trace its neighbourhood and read its record.</p>
      </header>
      <div class="lineage-toolbar">
        <button type="button" class="btn" id="lin-labels" aria-pressed="false">Show all labels</button>
        <button type="button" class="btn" id="lin-spine" aria-pressed="false">Highlight the central spine</button>
        <span class="muted" style="font-size:13px">Scroll or pinch to zoom · drag to pan · <kbd>Esc</kbd> clears selection</span>
      </div>
      <p class="lineage-mobile-hint">Tip: the map opens on the modern era. Drag left to travel back in time.</p>
      <div class="lineage-frame" id="lin-frame">
        <div class="lin-controls">
          <button class="icon-btn" id="lin-zoom-in" aria-label="Zoom in">+</button>
          <button class="icon-btn" id="lin-zoom-out" aria-label="Zoom out">&minus;</button>
          <button class="icon-btn" id="lin-reset" aria-label="Reset view" title="Reset view">&#8634;</button>
        </div>
        <div class="lin-tooltip" id="lin-tooltip" hidden></div>
      </div>
      <div class="legend" id="lin-legend"></div>
      <p class="lineage-note"><strong>Reading note.</strong> These links are illustrative, curated relationships — intellectual influence, shared mathematics or practical enabling — not a claim that every method descends directly from its predecessor. Photogrammetry, computer vision and graphics developed partly in parallel; dashed links mark such parallel rediscoveries and convergences.</p>
    </div>`;

  frame = root.querySelector('#lin-frame');
  tooltip = root.querySelector('#lin-tooltip');
  FW = frame.clientWidth || 1100; FH = frame.clientHeight || 700;
  const narrow = FW < 760;
  LEFT = narrow ? 118 : 176;
  W = Math.max(FW, 1150);
  LANE = Math.max(40, (FH - TOP - BOTTOM) / disciplines.length);
  H = TOP + disciplines.length * LANE + BOTTOM;
  xScale = d3.scaleLinear().domain(YEAR_DOMAIN).range(RANGE_FRAC.map(f => LEFT + 12 + f * (W - LEFT - 12 - RIGHT))).clamp(true);
  laneY = new Map(disciplines.map((d, i) => [d.id, TOP + i * LANE + LANE / 2]));

  nodes = events.map(ev => {
    const deg = ev.enabledDevelopments.length + (store.incoming.get(ev.id)?.length ?? 0);
    return { id: ev.id, ev, deg, r: 4.5 + Math.sqrt(deg) * 1.9, x: xScale(ev.year), y: laneY.get(ev.category), tx: xScale(ev.year), ty: laneY.get(ev.category) };
  });
  const byId = new Map(nodes.map(n => [n.id, n]));
  links = [];
  events.forEach(ev => ev.enabledDevelopments.forEach(e => { if (byId.has(e.id)) links.push({ source: byId.get(ev.id), target: byId.get(e.id), relation: e.relation }); }));

  const sim = d3.forceSimulation(nodes)
    .force('x', d3.forceX(d => d.tx).strength(0.85))
    .force('y', d3.forceY(d => d.ty).strength(0.35))
    .force('collide', d3.forceCollide(d => d.r + 7).iterations(2))
    .stop();
  for (let i = 0; i < 320; i++) sim.tick();
  nodes.forEach(n => { const lim = LANE / 2 - n.r - 3; n.y = Math.max(n.ty - lim, Math.min(n.ty + lim, n.y)); });

  svg = d3.select(frame).append('svg').attr('viewBox', `0 0 ${FW} ${FH}`).attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('role', 'img').attr('aria-label', 'Network graph of relationships between reconstruction milestones');

  const defs = svg.append('defs');
  [['arrow', 'var(--primary-soft)'], ['arrow-hot', 'var(--accent)']].forEach(([id, c]) => {
    defs.append('marker').attr('id', id).attr('viewBox', '0 -4 8 8').attr('refX', 7).attr('refY', 0).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-3.5L8,0L0,3.5').attr('fill', c).attr('opacity', id === 'arrow' ? 0.55 : 1);
  });

  gZoom = svg.append('g');
  const gBg = gZoom.append('g');
  BANDS.forEach((b, i) => {
    gBg.append('rect').attr('class', `lin-period ${i % 2 ? 'alt' : ''}`).attr('x', xScale(b.from)).attr('y', TOP - 8).attr('width', xScale(b.to) - xScale(b.from)).attr('height', H - TOP - BOTTOM + 16).attr('opacity', 0.55);
    gBg.append('text').attr('class', 'lin-period-label').attr('x', xScale(b.from) + 8).attr('y', 22).text(`${b.n} ${b.label}`);
  });
  store.disciplines.forEach((d, i) => gBg.append('line').attr('class', 'lin-lane').attr('x1', LEFT - 10).attr('x2', W - RIGHT).attr('y1', TOP + i * LANE).attr('y2', TOP + i * LANE));
  const ticks = [1500, 1700, 1850, 1875, 1900, 1930, 1960, 1980, 2000, 2010, 2020, 2023, 2026];
  const axis = gBg.append('g').attr('class', 'lin-axis');
  ticks.forEach(t => {
    axis.append('line').attr('x1', xScale(t)).attr('x2', xScale(t)).attr('y1', 34).attr('y2', 40);
    axis.append('text').attr('x', xScale(t)).attr('y', 50).attr('text-anchor', 'middle').text(t);
  });

  edgesSel = gZoom.append('g').selectAll('path').data(links).join('path')
    .attr('class', d => `lin-edge rel-${d.relation}`)
    .attr('marker-end', 'url(#arrow)')
    .attr('d', edgePath);

  nodesSel = gZoom.append('g').selectAll('g').data(nodes).join('g')
    .attr('class', d => `lin-node ${d.ev.status === 'emerging' ? 'emerging' : ''} ${d.deg >= 6 ? 'labelled' : ''}`)
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .attr('tabindex', 0).attr('role', 'button').attr('aria-label', d => `${d.ev.title}, ${d.ev.yearLabel}`);
  nodesSel.append('path').attr('class', 'shape').attr('d', d => shapePath(d.ev.type, d.r)).attr('fill', d => store.disciplineById.get(d.ev.category)?.color);
  nodesSel.filter(d => d.ev.type === 'research-paper').append('circle').attr('r', d => d.r * 0.38).attr('fill', 'var(--bg-raised)').attr('pointer-events', 'none');
  nodesSel.append('text').attr('class', 'lbl').attr('x', d => d.r + 4).attr('y', 3.5).text(d => d.ev.title.length > 38 ? d.ev.title.slice(0, 36) + '…' : d.ev.title);

  laneLabels = svg.append('g');
  laneLabels.append('rect').attr('x', 0).attr('y', 0).attr('width', LEFT - 14).attr('height', H).attr('fill', 'var(--bg-raised)').attr('opacity', 0.92);
  laneLabels.selectAll('text').data(store.disciplines).join('text').attr('class', 'lin-lane-label').attr('x', 12)
    .each(function (d) { wrapLabel(d3.select(this), d.label, narrow ? 16 : 24); });

  zoom = d3.zoom().scaleExtent([0.5, 6]).translateExtent([[-120, -80], [W + 120, H + 80]]).on('zoom', onZoom);
  svg.call(zoom).on('dblclick.zoom', null);
  svg.on('click', (e) => { if (e.target === svg.node() || e.target.closest('.lin-period, .lin-lane')) setFocus(null); });

  nodesSel
    .on('click', (e, d) => { e.stopPropagation(); setFocus(d.id); openEvent(d.id); })
    .on('keydown', (e, d) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFocus(d.id); openEvent(d.id); } })
    .on('mouseenter', (e, d) => showTip(e, d))
    .on('mousemove', (e, d) => showTip(e, d))
    .on('mouseleave', () => { tooltip.hidden = true; });

  root.querySelector('#lin-reset').addEventListener('click', resetView);
  root.querySelector('#lin-zoom-in').addEventListener('click', () => svg.transition().duration(250).call(zoom.scaleBy, 1.5));
  root.querySelector('#lin-zoom-out').addEventListener('click', () => svg.transition().duration(250).call(zoom.scaleBy, 1 / 1.5));
  root.querySelector('#lin-labels').addEventListener('click', (e) => {
    showAll = !showAll; e.currentTarget.setAttribute('aria-pressed', String(showAll));
    e.currentTarget.textContent = showAll ? 'Hide minor labels' : 'Show all labels';
    updateLabels(d3.zoomTransform(svg.node()).k);
  });
  root.querySelector('#lin-spine').addEventListener('click', (e) => {
    const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(on));
    highlightSpine(on);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !document.getElementById('drawer').classList.contains('open')) setFocus(null); });

  renderLegend();
  resetView(false);
  applyLineageFilters();
}

// The illustrative central spine from the brief
const SPINE = ['photography', 'linear-perspective', 'stereoscope', 'stereocomparator', 'analytical-photogrammetry', 'bundle-adjustment', 'sift', 'photo-tourism', 'pmvs', 'nerf', '3dgs', '4dgs-deformation', '4dgs-native', 'dynamic-3d-gaussians'];

function highlightSpine(on) {
  if (!on) { setFocus(null); return; }
  focusId = null;
  const set = new Set(SPINE);
  frame.classList.add('dimming');
  nodesSel.classed('focus', d => set.has(d.id)).classed('neighbour', false);
  edgesSel.classed('hot', d => set.has(d.source.id) && set.has(d.target.id)).attr('marker-end', d => set.has(d.source.id) && set.has(d.target.id) ? 'url(#arrow-hot)' : 'url(#arrow)');
}

function edgePath(d) {
  const sx = d.source.x, sy = d.source.y, tx = d.target.x, ty = d.target.y;
  const dx = tx - sx, dy = ty - sy, dist = Math.hypot(dx, dy) || 1;
  const ex = tx - dx / dist * (d.target.r + 3), ey = ty - dy / dist * (d.target.r + 3);
  const mx = (sx + ex) / 2;
  if (Math.abs(dx) < 30) return `M${sx},${sy} Q${sx + 40},${(sy + ey) / 2} ${ex},${ey}`;
  return `M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}`;
}

function shapePath(type, r) {
  const s = r * 1.15;
  switch (type) {
    case 'concept': return `M0,${-s * 1.15}L${s},0L0,${s * 1.15}L${-s},0Z`;
    case 'method': return `M${-s * 0.85},${-s * 0.85}H${s * 0.85}V${s * 0.85}H${-s * 0.85}Z`;
    case 'technology': return `M0,${-s * 1.1}L${s},${s * 0.75}L${-s},${s * 0.75}Z`;
    case 'institution': { const p = d3.range(6).map(i => [Math.cos(i * Math.PI / 3) * s, Math.sin(i * Math.PI / 3) * s]); return 'M' + p.join('L') + 'Z'; }
    default: return d3.symbol(d3.symbolCircle, Math.PI * r * r)();
  }
}

function wrapLabel(sel, text, max = 24) {
  const words = text.split(' '); const lines = []; let line = '';
  words.forEach(w => { if ((line + ' ' + w).trim().length > max) { lines.push(line.trim()); line = w; } else line += ' ' + w; });
  lines.push(line.trim());
  sel.selectAll('tspan').data(lines).join('tspan').attr('x', 12).attr('dy', (d, i) => i === 0 ? 0 : 13).text(d => d);
  sel.attr('data-lines', lines.length);
}

function onZoom(e) {
  const t = e.transform;
  gZoom.attr('transform', t);
  laneLabels.selectAll('text').attr('y', function (d) { const n = +this.getAttribute('data-lines') || 1; return t.applyY(laneY.get(d.id)) + 4 - (n - 1) * 6.5; });
  updateLabels(t.k);
  tooltip.hidden = true;
}

function updateLabels(k) {
  nodesSel.classed('labelled', d => showAll || k > 2.1 || d.deg >= (k > 1.4 ? 3 : 6));
  nodesSel.select('text').attr('font-size', 12 / Math.max(1, Math.sqrt(k))).attr('x', d => d.r + 4 / Math.sqrt(k));
}

function resetView(animate = true) {
  let t = d3.zoomIdentity;
  if (FW < 760) t = d3.zoomIdentity.translate(-(xScale(2006) - LEFT - 8), 0);
  (animate ? svg.transition().duration(400) : svg).call(zoom.transform, t);
}

function showTip(e, d) {
  const disc = store.disciplineById.get(d.ev.category);
  tooltip.innerHTML = `<strong>${h(d.ev.title)}</strong><span class="mono">${h(d.ev.yearLabel)}</span> · ${h(disc?.label)}<br>${h(d.ev.summary)}`;
  tooltip.hidden = false;
  const r = frame.getBoundingClientRect();
  let x = e.clientX - r.left + 14, y = e.clientY - r.top + 14;
  if (x + 290 > r.width) x = e.clientX - r.left - 294;
  if (y + tooltip.offsetHeight > r.height) y = e.clientY - r.top - tooltip.offsetHeight - 10;
  tooltip.style.left = `${Math.max(4, x)}px`; tooltip.style.top = `${Math.max(4, y)}px`;
}

export function setFocus(id, center = false) {
  focusId = id;
  root.querySelector('#lin-spine')?.setAttribute('aria-pressed', 'false');
  if (!nodesSel) return;
  if (!id) {
    frame.classList.remove('dimming');
    nodesSel.classed('focus', false).classed('neighbour', false);
    edgesSel.classed('hot', false).attr('marker-end', 'url(#arrow)');
    return;
  }
  const nb = neighbours(id);
  frame.classList.add('dimming');
  nodesSel.classed('focus', d => d.id === id).classed('neighbour', d => nb.has(d.id));
  edgesSel.classed('hot', d => d.source.id === id || d.target.id === id)
    .attr('marker-end', d => (d.source.id === id || d.target.id === id) ? 'url(#arrow-hot)' : 'url(#arrow)');
  edgesSel.filter('.hot').raise();
  if (center) {
    const n = nodes.find(n => n.id === id);
    const cur = d3.zoomTransform(svg.node());
    const k = Math.max(cur.k, 1.25);
    svg.transition().duration(450).call(zoom.transform, d3.zoomIdentity.translate((FW - LEFT > 1000 ? LEFT + (FW - LEFT - 680) / 2 : (FW + LEFT) / 2) - n.x * k, FH / 2 - n.y * k).scale(k));
  }
}

export function applyLineageFilters() {
  if (!nodesSel) return;
  const ok = new Set(store.events.filter(e => matchesFilters(e)).map(e => e.id));
  nodesSel.classed('filtered-out', d => !ok.has(d.id));
  edgesSel.classed('filtered-out', d => !ok.has(d.source.id) || !ok.has(d.target.id));
}

function renderLegend() {
  const el = root.querySelector('#lin-legend');
  const types = store.types.map(t => `<span><svg viewBox="-8 -8 16 16"><path d="${shapePath(t.id, 5)}" fill="var(--primary-soft)"/>${t.id === 'research-paper' ? '<circle r="2" fill="var(--bg)"/>' : ''}</svg>${h(t.label)}</span>`).join('');
  const rels = [['foundation', 'Foundation / enables', ''], ['parallel', 'Parallel rediscovery / convergence', '4 3'], ['reinterprets', 'Reinterpretation', '1.5 2.5']]
    .map(([id, l, dash]) => `<span><svg viewBox="0 0 18 14"><line x1="1" y1="7" x2="17" y2="7" stroke="${id === 'reinterprets' ? 'var(--accent)' : id === 'parallel' ? 'var(--faint)' : 'var(--primary-soft)'}" stroke-width="1.6" stroke-dasharray="${dash}"/></svg>${l}</span>`).join('');
  el.innerHTML = `
    <div class="legend-group"><b>Node type</b>${types}</div>
    <div class="legend-group"><b>Relation</b>${rels}<span><svg viewBox="-8 -8 16 16"><circle r="5" fill="none" stroke="var(--accent)" stroke-dasharray="2 1.5"/></svg>Emerging research</span></div>
    <div class="legend-group"><b>Colour</b><span>research discipline (row) — filter with the Disciplines control above</span></div>`;
}
