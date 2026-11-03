import { store, matchesFilters, escapeHTML as h } from './store.js';
import { diagramSVG } from './diagrams.js';
import { openEvent } from './nav.js';

const root = document.getElementById('view-timeline');
let observer = null;

export function renderTimeline() {
  const { meta, periods, events } = store;
  const counts = {
    events: events.length,
    refs: events.reduce((n, e) => n + e.references.length, 0),
    people: new Set(events.flatMap(e => e.researchers)).size,
    emerging: events.filter(e => e.status === 'emerging').length,
  };

  root.innerHTML = `
    <div class="wrap">
      <header class="hero">
        <div class="eyebrow">An interactive historical &amp; scientific atlas</div>
        <h1>How did we move from <em>measuring space</em> with photographs to reconstructing dynamic three-dimensional reality?</h1>
        <p class="hero-lede">This atlas traces image-based 3D reconstruction across six periods — not as a chain of replacements, but as overlapping lineages in geometry, photogrammetry, computer vision and graphics that repeatedly rediscover, borrow from and reinterpret one another.</p>
        <div class="hero-grid">
          <div><strong>${counts.events}</strong><span>milestones</span></div>
          <div><strong>${counts.refs}</strong><span>primary &amp; authoritative references</span></div>
          <div><strong>${counts.people}</strong><span>researchers &amp; inventors</span></div>
          <div><strong>${counts.emerging}</strong><span>marked as emerging research</span></div>
        </div>
      </header>
      <div class="timeline-layout">
        <nav class="minimap" aria-label="Chronological overview">
          <div class="minimap-title">Chronological overview</div>
          <ol class="minimap-list">
            ${periods.map(p => `
              <li data-period="${p.id}">
                <a href="#/timeline" data-jump="${p.id}">${p.number}. ${h(p.label)}<span class="mm-range">${h(p.range)}</span></a>
                <div class="mm-ticks">${events.filter(e => e.period === p.id).map(e => `<i data-tick="${e.id}" title="${h(e.yearLabel)} — ${h(e.title)}"></i>`).join('')}</div>
              </li>`).join('')}
          </ol>
          <div class="minimap-progress" id="mm-progress"></div>
        </nav>
        <div class="timeline-body">
          ${periods.map(p => periodSection(p)).join('')}
          <section class="open-questions" id="open-questions">
            <div class="eyebrow">Unresolved challenges</div>
            <h2>What remains open</h2>
            <p class="muted" style="max-width:760px">The history above is not finished. These are the questions on which the photogrammetric, computer-vision and neural-rendering traditions currently meet — and sometimes disagree.</p>
            <div class="oq-grid">
              ${meta.openQuestions.map((q, i) => `<article><div class="oq-num">${String(i + 1).padStart(2, '0')}</div><h3>${h(q.title)}</h3><p>${h(q.text)}</p></article>`).join('')}
            </div>
          </section>
        </div>
      </div>
    </div>`;

  bind();
  applyTimelineFilters();
}

function periodSection(p) {
  const evs = store.events.filter(e => e.period === p.id);
  let body;
  if (p.id === 'neural-dynamic') {
    body = store.threads.map(t => {
      const list = evs.filter(e => e.thread === t.id);
      return `<div class="thread" data-thread="${t.id}"><div class="thread-head"><h3>${h(t.label)}</h3><span>${list.length} milestones</span></div><ol class="events">${list.map(eventItem).join('')}</ol></div>`;
    }).join('');
  } else {
    body = `<ol class="events">${evs.map(eventItem).join('')}</ol>`;
  }
  return `
    <section class="period" id="period-${p.id}" data-period="${p.id}" aria-labelledby="ph-${p.id}">
      <header class="period-head">
        <div class="period-num">${String(p.number).padStart(2, '0')}</div>
        <div>
          <h2 id="ph-${p.id}">${h(p.label)}</h2>
          <div class="period-range">${h(p.range)} · ${evs.length} milestones</div>
          <p class="period-question">${h(p.question)}</p>
          <p class="period-intro">${h(p.intro)}</p>
        </div>
      </header>
      ${body}
      <p class="period-empty" hidden>No milestones in this period match the current filters.</p>
    </section>`;
}

function eventItem(ev) {
  const disc = store.disciplineById.get(ev.category);
  const type = store.typeById.get(ev.type);
  const people = ev.researchers.slice(0, 4).join(', ') + (ev.researchers.length > 4 ? ' et al.' : '');
  const rel = ev.enabledDevelopments.length + (store.incoming.get(ev.id)?.length ?? 0);
  return `
    <li class="event ${ev.status === 'emerging' ? 'emerging' : ''}" id="ev-${ev.id}" data-id="${ev.id}" style="--dot:${disc?.color}">
      <div class="event-year">${h(shortYear(ev))}</div>
      <span class="event-dot" aria-hidden="true"></span>
      <article class="card">
        <div class="card-meta">
          <span class="disc"><span class="swatch" style="background:${disc?.color}"></span>${h(disc?.label)}</span>
          <span class="badge type">${h(type?.label ?? ev.type)}</span>
          ${ev.status === 'emerging' ? '<span class="badge emerging">Emerging</span>' : ''}
        </div>
        <h3><button type="button" data-open="${ev.id}">${h(ev.title)}</button></h3>
        <div class="card-date">${h(ev.yearLabel)}</div>
        <p class="card-summary">${h(ev.summary)}</p>
        ${people ? `<div class="card-people">${h(people)}</div>` : ''}
        <div class="card-expand" id="cx-${ev.id}" hidden>
          <div>
            <h4>Scientific contribution</h4><p>${h(ev.contribution)}</p>
            <h4>Why it mattered</h4><p>${h(ev.historicalSignificance)}</p>
          </div>
          ${diagramSVG(ev.media?.diagram, ev.title)}
        </div>
        <div class="card-actions">
          <button type="button" data-expand="${ev.id}" aria-expanded="false" aria-controls="cx-${ev.id}">Expand</button>
          <button type="button" data-open="${ev.id}">Full record &amp; references</button>
          <span class="rel-count">${rel} lineage links · ${ev.references.length} refs</span>
        </div>
      </article>
    </li>`;
}

function shortYear(ev) {
  if (ev.year < 0) return `${-ev.year} BCE`;
  if (ev.year < 1400) return 'pre-1600';
  return String(ev.year);
}

function bind() {
  root.addEventListener('click', (e) => {
    const open = e.target.closest('[data-open]');
    if (open) { openEvent(open.dataset.open); return; }
    const exp = e.target.closest('[data-expand]');
    if (exp) {
      const panel = document.getElementById(`cx-${exp.dataset.expand}`);
      const isOpen = !panel.hidden;
      panel.hidden = isOpen;
      exp.setAttribute('aria-expanded', String(!isOpen));
      exp.textContent = isOpen ? 'Expand' : 'Collapse';
      return;
    }
    const jump = e.target.closest('[data-jump]');
    if (jump) { e.preventDefault(); document.getElementById(`period-${jump.dataset.jump}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const tick = e.target.closest('[data-tick]');
    if (tick) focusEvent(tick.dataset.tick);
  });

  observer?.disconnect();
  const items = [...root.querySelectorAll('.minimap-list li')];
  const visible = new Map();
  observer = new IntersectionObserver((entries) => {
    entries.forEach(en => visible.set(en.target.dataset.period, en.isIntersecting ? en.intersectionRatio : 0));
    // Choose the top-most visible period
    let active = null;
    for (const p of store.periods) { if ((visible.get(p.id) ?? 0) > 0) { active = p.id; break; } }
    if (active) items.forEach(li => li.classList.toggle('active', li.dataset.period === active));
  }, { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.01] });
  root.querySelectorAll('.period').forEach(sec => observer.observe(sec));
  items[0]?.classList.add('active');
}

export function applyTimelineFilters() {
  let shown = 0;
  for (const ev of store.events) {
    const li = document.getElementById(`ev-${ev.id}`);
    if (!li) continue;
    const ok = matchesFilters(ev);
    li.hidden = !ok;
    if (ok) shown++;
    root.querySelector(`[data-tick="${ev.id}"]`)?.classList.toggle('on', ok);
  }
  root.querySelectorAll('.period').forEach(sec => {
    const any = sec.querySelector('.event:not([hidden])');
    sec.querySelector('.period-empty').hidden = !!any;
    sec.querySelectorAll('.thread').forEach(t => { t.hidden = !t.querySelector('.event:not([hidden])'); });
  });
  const prog = document.getElementById('mm-progress');
  if (prog) prog.textContent = `${shown} / ${store.events.length} milestones shown`;
  return shown;
}

export function focusEvent(id) {
  const li = document.getElementById(`ev-${id}`);
  if (!li || li.hidden) return;
  li.scrollIntoView({ behavior: document.getElementById('drawer').classList.contains('open') ? 'auto' : 'smooth', block: 'center' });
  li.classList.remove('flash');
  void li.offsetWidth;
  li.classList.add('flash');
  setTimeout(() => li.classList.remove('flash'), 1800);
}
