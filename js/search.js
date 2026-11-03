import { store, escapeHTML as h } from './store.js';
import { openEvent } from './nav.js';

const input = document.getElementById('search-input');
const list = document.getElementById('search-results');
let results = [];
let sel = -1;

export function initSearch() {
  input.addEventListener('input', () => run(input.value));
  input.addEventListener('focus', () => { if (input.value.trim().length >= 2) run(input.value); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(sel >= 0 ? sel : 0); }
    else if (e.key === 'Escape') { close(); input.blur(); }
  });
  list.addEventListener('mousedown', (e) => {
    const li = e.target.closest('[data-idx]');
    if (li) { e.preventDefault(); choose(+li.dataset.idx); }
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !e.target.matches('input, textarea, [contenteditable]')) { e.preventDefault(); input.focus(); input.select(); }
  });
}

function score(ev, terms) {
  let s = 0;
  const title = ev.title.toLowerCase();
  const people = (ev.researchers.join(' ') + ' ' + ev.institutions.join(' ')).toLowerCase();
  for (const t of terms) {
    if (!ev._search.includes(t)) return 0;
    if (title.includes(t)) s += title.startsWith(t) ? 12 : 8;
    if (people.includes(t)) s += 5;
    if (ev.references.some(r => r.title.toLowerCase().includes(t))) s += 3;
    s += 1;
  }
  return s;
}

function snippet(ev, terms) {
  const fields = [
    ['Researchers', ev.researchers.join(', ')],
    ['Reference', ev.references.map(r => r.title).join(' · ')],
    ['', ev.summary], ['', ev.contribution], ['', ev.technicalExplanation], ['', ev.context],
  ];
  for (const [label, text] of fields) {
    const low = (text || '').toLowerCase();
    const t = terms.find(t => low.includes(t));
    if (!t) continue;
    const i = low.indexOf(t);
    const start = Math.max(0, i - 40), end = Math.min(text.length, i + t.length + 60);
    const pre = (start > 0 ? '…' : '') + text.slice(start, i), hit = text.slice(i, i + t.length), post = text.slice(i + t.length, end) + (end < text.length ? '…' : '');
    return `${label ? `<b>${label}:</b> ` : ''}${h(pre)}<mark>${h(hit)}</mark>${h(post)}`;
  }
  return h(ev.summary.slice(0, 110)) + '…';
}

function run(q) {
  const terms = q.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
  if (!terms.length || q.trim().length < 2) { close(); return; }
  results = store.events.map(ev => ({ ev, s: score(ev, terms) })).filter(r => r.s > 0).sort((a, b) => b.s - a.s || a.ev.year - b.ev.year).slice(0, 12);
  sel = results.length ? 0 : -1;
  list.innerHTML = results.length
    ? results.map((r, i) => `<li role="option" data-idx="${i}" aria-selected="${i === sel}"><div class="sr-title">${h(r.ev.title)}</div><div class="sr-meta">${h(r.ev.yearLabel)} · ${h(store.disciplineById.get(r.ev.category)?.label)}${r.ev.status === 'emerging' ? ' · emerging' : ''}</div><div class="sr-hit">${snippet(r.ev, terms)}</div></li>`).join('')
    : `<li class="sr-empty">No milestones match “${h(q)}”.</li>`;
  list.hidden = false;
  input.setAttribute('aria-expanded', 'true');
}

function move(d) {
  if (!results.length) return;
  sel = (sel + d + results.length) % results.length;
  list.querySelectorAll('[data-idx]').forEach((li, i) => li.setAttribute('aria-selected', String(i === sel)));
  list.querySelector(`[data-idx="${sel}"]`)?.scrollIntoView({ block: 'nearest' });
}

function choose(i) {
  const r = results[i]; if (!r) return;
  close(); input.blur();
  openEvent(r.ev.id);
}

function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); }
