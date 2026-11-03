#!/usr/bin/env node
// Validates the atlas database: required fields, unique ids, known
// periods/disciplines/types/relations, and that every link resolves.
// Usage: node scripts/validate-data.mjs   (exit code 1 on errors)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const meta = read('data/index.json');
const errors = [];
const warnings = [];
const periods = new Set(meta.periods.map(p => p.id));
const disciplines = new Set(meta.disciplines.map(d => d.id));
const types = new Set(meta.types.map(t => t.id));
const relations = new Set(meta.relations.map(r => r.id));
const threads = new Set(meta.threads.map(t => t.id));
const REQUIRED = ['id', 'year', 'title', 'period', 'category', 'type', 'summary', 'context', 'contribution', 'technicalExplanation', 'historicalSignificance', 'references', 'media'];

const events = [];
for (const file of meta.eventFiles) {
  for (const ev of read(file)) { ev.__file = file; events.push(ev); }
}
const ids = new Map();
for (const ev of events) {
  const where = `${ev.__file} → ${ev.id ?? '(no id)'}`;
  for (const k of REQUIRED) if (ev[k] === undefined || ev[k] === '') errors.push(`${where}: missing "${k}"`);
  if (ids.has(ev.id)) errors.push(`${where}: duplicate id (also in ${ids.get(ev.id)})`);
  ids.set(ev.id, ev.__file);
  if (!/^[a-z0-9-]+$/.test(ev.id)) errors.push(`${where}: id must be kebab-case`);
  if (!periods.has(ev.period)) errors.push(`${where}: unknown period "${ev.period}"`);
  if (!disciplines.has(ev.category)) errors.push(`${where}: unknown category "${ev.category}"`);
  if (!types.has(ev.type)) errors.push(`${where}: unknown type "${ev.type}"`);
  if (ev.thread && !threads.has(ev.thread)) errors.push(`${where}: unknown thread "${ev.thread}"`);
  if (ev.period === 'neural-dynamic' && !ev.thread) errors.push(`${where}: period 6 events need a "thread"`);
  if (!['established', 'emerging'].includes(ev.status ?? 'established')) errors.push(`${where}: status must be established|emerging`);
  if (!Array.isArray(ev.references) || ev.references.length === 0) errors.push(`${where}: at least one reference required`);
  for (const r of ev.references ?? []) {
    if (!r.title) errors.push(`${where}: reference without title`);
    if (r.url && !/^https?:\/\//.test(r.url)) errors.push(`${where}: bad reference url "${r.url}"`);
  }
  if (!(ev.references ?? []).some(r => r.url)) warnings.push(`${where}: no reference has an online link`);
}
for (const ev of events) {
  const where = `${ev.__file} → ${ev.id}`;
  for (const e of ev.enabledDevelopments ?? []) {
    const id = typeof e === 'string' ? e : e.id;
    if (!ids.has(id)) errors.push(`${where}: enabledDevelopments → unknown id "${id}"`);
    if (typeof e === 'object' && e.relation && !relations.has(e.relation)) errors.push(`${where}: unknown relation "${e.relation}"`);
    if (id === ev.id) errors.push(`${where}: self-link`);
  }
  for (const id of ev.relatedEvents ?? []) if (!ids.has(id)) errors.push(`${where}: relatedEvents → unknown id "${id}"`);
}

const tech = read('data/technology.json');
const techIds = new Set(tech.items.map(i => i.id));
for (const it of tech.items) for (const id of it.events) if (!ids.has(id)) errors.push(`technology ${it.id}: unknown event "${id}"`);
for (const c of tech.couplings) for (const id of [c.from, c.to]) if (!techIds.has(id)) errors.push(`technology coupling: unknown item "${id}"`);

const cmp = read('data/comparisons.json');
for (const c of cmp.comparisons) for (const col of c.columns) for (const id of col.events) if (!ids.has(id)) errors.push(`comparison ${c.id}: unknown event "${id}"`);

warnings.forEach(w => console.warn('warn ', w));
if (errors.length) { errors.forEach(e => console.error('error', e)); console.error(`\n${errors.length} error(s).`); process.exit(1); }
const links = events.reduce((n, e) => n + (e.enabledDevelopments?.length ?? 0), 0);
const refs = events.reduce((n, e) => n + e.references.length, 0);
console.log(`OK — ${events.length} events, ${links} lineage links, ${refs} references, ${tech.items.length} technology items, ${cmp.comparisons.length} comparisons.`);
