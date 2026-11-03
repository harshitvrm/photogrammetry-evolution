// Hash-based routing (works under any GitHub Pages sub-path, no 404s on refresh).
// Format:  #/<view>[/<sub>][?e=<eventId>]

export const VIEWS = ['timeline', 'lineage', 'technology', 'compare', 'about'];

export function parseHash(hash = location.hash) {
  const raw = hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const [view, sub] = path.split('/');
  const params = new URLSearchParams(query);
  return {
    view: VIEWS.includes(view) ? view : 'timeline',
    sub: sub ? decodeURIComponent(sub) : null,
    e: params.get('e'),
  };
}

export function buildHash({ view, sub, e }) {
  let h = `#/${view || 'timeline'}`;
  if (sub) h += `/${encodeURIComponent(sub)}`;
  if (e) h += `?e=${encodeURIComponent(e)}`;
  return h;
}

export function go(partial, { replace = false } = {}) {
  const next = { ...parseHash(), ...partial };
  const h = buildHash(next);
  if (h === location.hash) return;
  if (replace) history.replaceState(null, '', h), window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = h;
}

export const openEvent = (id) => go({ e: id });
export const closeEvent = () => go({ e: null });
