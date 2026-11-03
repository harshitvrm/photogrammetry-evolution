// Original schematic diagrams (SVG), one per concept. They act as
// explanatory figures and as fallbacks wherever no licensed image is used.
// Coordinate system: viewBox 0 0 160 100. Colours come from CSS classes.

const L = (d, c = 'd-line') => `<path class="${c}" d="${d}"/>`;
const C = (x, y, r, c = 'd-fill') => `<circle class="${c}" cx="${x}" cy="${y}" r="${r}"/>`;
const T = (x, y, s, a = 'start') => `<text x="${x}" y="${y}" text-anchor="${a}">${s}</text>`;
const E = (x, y, rx, ry, rot = 0) => `<ellipse class="d-gauss" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})"/>`;

function camera(x, y, rot = 0, s = 1) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path class="d-line" d="M-6 -4 H6 V4 H-6 Z"/><path class="d-line" d="M6 -2 L10 -4 V4 L6 2"/></g>`;
}

// deterministic pseudo-random for point clouds
function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

const D = {
  pinhole: () => [
    L('M10 20 L40 20 L40 80 L10 80'), // object (arrow)
    L('M25 25 V75', 'd-accent'), L('M20 30 L25 25 L30 30', 'd-accent'),
    L('M80 10 V44 M80 56 V90'), C(80, 50, 1.6, 'd-afill'),
    L('M25 25 L135 72', 'd-thin'), L('M25 75 L135 28', 'd-thin'),
    L('M135 15 V85'), L('M135 72 V28', 'd-accent'), L('M130 67 L135 72 L140 67', 'd-accent'),
    T(80, 98, 'projection centre', 'middle'), T(135, 12, 'image', 'middle'),
  ].join(''),
  perspective: () => [
    L('M5 45 H155', 'd-thin'), C(110, 45, 2, 'd-afill'), T(112, 40, 'vanishing point'),
    L('M10 95 L110 45'), L('M60 95 L110 45'), L('M120 95 L110 45', 'd-thin'),
    L('M25 87.5 H70 M40 80 H82 M55 72.5 H94 M70 65 H99 M85 57.5 H104', 'd-thin'),
    T(6, 41, 'horizon'),
  ].join(''),
  frame: () => [
    L('M20 10 V90'), C(20, 50, 2, 'd-afill'), T(10, 98, 'eye point'),
    L('M70 20 H100 V80 H70 Z'), L('M70 40 H100 M70 60 H100 M80 20 V80 M90 20 V80', 'd-thin'),
    L('M120 70 L140 35 L155 70 Z'), L('M20 50 L140 35', 'd-accent'), C(87.5, 41.5, 1.8, 'd-afill'),
    T(85, 92, 'frame', 'middle'),
  ].join(''),
  projective: () => [
    C(15, 50, 2, 'd-afill'),
    L('M15 50 L150 15 M15 50 L150 40 M15 50 L150 65 M15 50 L150 90', 'd-thin'),
    L('M60 10 L60 90'), L('M120 5 L95 95'),
    ...[[60, 38.3], [60, 46.7], [60, 55], [60, 63.4]].map(([x, y]) => C(x, y, 1.6)),
    ...[[111, 27], [106, 45], [101.5, 60], [97, 76]].map(([x, y]) => C(x, y, 1.6)),
    T(60, 98, 'cross-ratio preserved', 'middle'),
  ].join(''),
  resection: () => [
    C(80, 82, 2.2, 'd-afill'), T(86, 90, 'unknown station'),
    C(20, 18, 2), C(80, 10, 2), C(145, 25, 2),
    L('M80 82 L20 18 M80 82 L80 10 M80 82 L145 25', 'd-thin'),
    L('M20 18 L80 10 L145 25', 'd-line'),
    `<path class="d-accent" d="M70 70 A15 15 0 0 1 90 70"/>`,
    T(20, 12, 'P₁', 'middle'), T(80, 6, 'P₂', 'middle'), T(145, 19, 'P₃', 'middle'),
  ].join(''),
  leastsquares: () => {
    const pts = [[15, 78], [30, 66], [45, 64], [60, 52], [75, 50], [90, 36], [105, 38], [120, 24], [135, 22], [150, 12]];
    return [L('M10 80 L155 12', 'd-accent'),
      ...pts.map(([x, y]) => { const yl = 80 - (x - 10) * (68 / 145); return L(`M${x} ${y} V${yl.toFixed(1)}`, 'd-thin') + C(x, y, 1.8); }),
      L('M8 92 H155 M8 92 V5', 'd-thin'), T(150, 98, 'min Σv²', 'end')].join('');
  },
  stereo: () => [
    camera(35, 85, -90), camera(125, 85, -90),
    C(80, 18, 2.2, 'd-afill'),
    L('M35 80 L80 18 L125 80', 'd-thin'),
    L('M35 85 H125', 'd-accent'), T(80, 96, 'baseline B', 'middle'),
    L('M20 70 H50 M110 70 H140'),
    C(46, 70, 1.4), C(112, 70, 1.4), T(80, 14, 'depth ∝ B·f / parallax', 'middle'),
  ].join(''),
  camera: () => [
    L('M30 30 H100 V80 H30 Z'), L('M100 42 L130 30 V80 L100 68'),
    L('M45 30 V22 H70 V30'), L('M38 55 H92', 'd-thin'), L('M65 35 V75', 'd-thin'),
    C(140, 55, 1.6, 'd-afill'), L('M130 55 H150', 'd-thin'), T(65, 92, 'image plane', 'middle'), T(140, 46, 'lens', 'middle'),
  ].join(''),
  intersection: () => [
    `<path class="d-soft" d="M10 90 L40 55 L70 75 L100 40 L150 70 L150 92 L10 92 Z"/>`,
    camera(25, 15, 60), camera(135, 15, 120),
    L('M25 15 L100 40 M135 15 L100 40', 'd-accent'),
    L('M25 15 L70 75 M135 15 L40 55', 'd-thin'),
    C(100, 40, 2.2, 'd-afill'), T(25, 7, 'station A', 'middle'), T(135, 7, 'station B', 'middle'),
  ].join(''),
  facade: () => [
    L('M30 90 V35 L80 12 L130 35 V90 Z'),
    L('M45 50 h14 v18 h-14 z M101 50 h14 v18 h-14 z M70 60 h20 v30 h-20 z', 'd-thin'),
    L('M30 35 H130', 'd-thin'),
    C(10, 96, 1.6, 'd-afill'), C(150, 96, 1.6, 'd-afill'),
    L('M10 96 L80 12 M10 96 L130 35 M150 96 L80 12 M150 96 L30 35', 'd-thin'),
  ].join(''),
  aerial: () => [
    camera(40, 12, 90, 0.9), camera(80, 12, 90, 0.9), camera(120, 12, 90, 0.9),
    L('M40 16 L15 80 M40 16 L65 80 M80 16 L55 80 M80 16 L105 80 M120 16 L95 80 M120 16 L145 80', 'd-thin'),
    `<path class="d-soft" d="M55 80 H65 V88 H55 Z M95 80 H105 V88 H95 Z"/>`,
    L('M5 80 C30 72 50 86 80 78 S130 70 155 82'), L('M30 6 H130', 'd-accent'), T(80, 97, 'overlap → stereo models', 'middle'),
  ].join(''),
  plotter: () => [
    L('M20 15 H65 M95 15 H140'), C(42, 15, 2, 'd-afill'), C(118, 15, 2, 'd-afill'),
    L('M42 15 L80 70 M118 15 L80 70', 'd-accent'),
    L('M30 15 L66 72 M54 15 L82 85 M106 15 L78 85 M130 15 L94 72', 'd-thin'),
    C(80, 70, 2.2), L('M20 88 C50 70 70 94 100 80 S140 76 150 84'),
    T(80, 98, 'optical model', 'middle'), T(42, 9, 'projector', 'middle'), T(118, 9, 'projector', 'middle'),
  ].join(''),
  epipolar: () => [
    L('M10 30 L60 20 L60 75 L10 85 Z'), L('M100 20 L150 30 L150 85 L100 75 Z'),
    C(25, 62, 1.8, 'd-afill'), C(135, 62, 1.8, 'd-afill'),
    C(80, 6, 2.2), L('M25 62 L80 6 L135 62', 'd-thin'), L('M25 62 L135 62', 'd-accent'),
    L('M103 48 L148 58', 'd-accent'), C(46, 55, 1.5), C(118, 53, 1.5),
    L('M46 55 L80 6 M118 53 L80 6', 'd-thin'), T(80, 96, 'x′ᵀ E x = 0', 'middle'),
  ].join(''),
  collinearity: () => [
    L('M20 20 L20 80'), C(20, 50, 0.1), C(60, 50, 2, 'd-afill'),
    L('M150 18 L20 70', 'd-accent'), C(150, 18, 2.4), C(20, 70, 1.8),
    L('M60 50 H150', 'd-thin'), T(150, 12, 'X (object)', 'middle'), T(60, 60, 'O', 'middle'), T(26, 84, 'x (image)'),
    T(100, 96, 'x = π(K, R, t; X)', 'middle'),
  ].join(''),
  bundle: () => {
    const cams = [[20, 20, 35], [60, 8, 80], [110, 10, 100], [145, 30, 140]];
    const pts = [[45, 80], [75, 72], [100, 86], [125, 74], [60, 92]];
    return [...cams.map(([x, y, r]) => camera(x, y, r, 0.8)),
      ...cams.flatMap(([cx, cy]) => pts.map(([px, py]) => L(`M${cx} ${cy} L${px} ${py}`, 'd-thin'))),
      ...pts.map(([x, y]) => C(x, y, 2, 'd-afill'))].join('');
  },
  grid: () => {
    const lines = [];
    for (let i = 0; i <= 8; i++) {
      const pts = []; for (let j = 0; j <= 10; j++) { const x = 15 + j * 13 + i * 2; const y = 30 + i * 7 - 14 * Math.sin((j + i * 0.6) / 2.2) * Math.cos(i / 3); pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`); }
      lines.push(L('M' + pts.join(' L'), i % 4 === 0 ? 'd-line' : 'd-thin'));
    }
    return lines.join('') + T(80, 98, 'z = f(x, y)', 'middle');
  },
  blocks: () => [
    L('M30 70 L30 40 L60 30 L90 40 L90 70 L60 80 Z'), L('M30 40 L60 50 L90 40 M60 50 V80'),
    L('M100 75 L100 55 L120 48 L140 55 L140 75 L120 82 Z', 'd-thin'), L('M100 55 L120 62 L140 55 M120 62 V82', 'd-thin'),
    L('M60 30 L60 50', 'd-accent'), T(80, 96, 'edges → polyhedral model', 'middle'),
  ].join(''),
  distortion: () => {
    const out = [];
    for (let i = -3; i <= 3; i++) {
      const v = [], h = [];
      for (let j = -3; j <= 3; j++) {
        const f = (x, y) => { const r2 = (x * x + y * y) / 18; const k = 1 + 0.12 * r2; return [80 + x * 12 * k, 50 + y * 12 * k]; };
        v.push(f(i, j).map(n => n.toFixed(1)).join(' ')); h.push(f(j, i).map(n => n.toFixed(1)).join(' '));
      }
      out.push(L('M' + v.join(' L'), 'd-accent'), L('M' + h.join(' L'), 'd-accent'));
      out.push(L(`M${80 + i * 12} 14 V86`, 'd-thin'), L(`M44 ${50 + i * 12} H116`, 'd-thin'));
    }
    return out.join('') + T(80, 99, 'Δr = k₁r³ + k₂r⁵ + …', 'middle');
  },
  features: () => {
    const r = rng(7); const out = [L('M10 10 H150 V90 H10 Z', 'd-thin')];
    for (let i = 0; i < 14; i++) {
      const x = 20 + r() * 120, y = 18 + r() * 64, s = 3 + r() * 9, a = r() * Math.PI * 2;
      out.push(`<circle class="d-accent" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(1)}"/>`);
      out.push(L(`M${x.toFixed(1)} ${y.toFixed(1)} l${(Math.cos(a) * s).toFixed(1)} ${(Math.sin(a) * s).toFixed(1)}`));
    }
    return out.join('');
  },
  matching: () => {
    const out = [L('M5 15 H72 V85 H5 Z'), L('M88 15 H155 V85 H88 Z')];
    const pts = [[20, 30, 104, 34], [40, 50, 120, 52], [55, 70, 140, 68], [30, 72, 110, 75], [60, 28, 142, 30]];
    pts.forEach(([a, b, c, d], i) => { out.push(C(a, b, 1.6), C(c, d, 1.6), L(`M${a} ${b} L${c} ${d}`, i === 1 ? 'd-accent' : 'd-thin')); });
    out.push(L('M34 44 h12 v12 h-12 z', 'd-accent'), L('M114 46 h12 v12 h-12 z', 'd-accent'));
    return out.join('');
  },
  ransac: () => {
    const r = rng(3); const out = [L('M10 85 L150 20', 'd-accent')];
    for (let i = 0; i < 18; i++) { const x = 15 + i * 7.5; const y = 85 - (x - 10) * (65 / 140) + (r() - 0.5) * 6; out.push(C(x, y, 1.6)); }
    for (let i = 0; i < 7; i++) { out.push(`<circle class="d-line" cx="${(20 + r() * 120).toFixed(1)}" cy="${(10 + r() * 80).toFixed(1)}" r="1.8"/>`); }
    return out.join('') + T(150, 98, 'inliers vs outliers', 'end');
  },
  volume: () => {
    const out = [camera(12, 50, 0), L('M18 50 H155', 'd-thin')];
    const ws = [0.05, 0.08, 0.15, 0.4, 0.9, 0.6, 0.2, 0.08];
    ws.forEach((w, i) => { const x = 50 + i * 12; out.push(`<rect class="d-afill" x="${x - 2}" y="${50 - w * 30}" width="4" height="${w * 30}" opacity="${0.35 + w * 0.6}"/>`, C(x, 50, 1.3)); });
    out.push(`<path class="d-soft" d="M90 50 C100 20 120 20 130 50 C120 80 100 80 90 50 Z" opacity="0.6"/>`);
    out.push(T(90, 92, 'C = Σ Tᵢ αᵢ cᵢ', 'middle'));
    return out.join('');
  },
  voxel: () => {
    const out = [];
    for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) {
      const x = 20 + i * 15, y = 8 + j * 14; const d = Math.hypot(i - 3.5, j - 2.5) - 2.2;
      out.push(`<rect x="${x}" y="${y}" width="15" height="14" class="d-thin"/>`);
      if (Math.abs(d) < 0.8) out.push(`<rect x="${x + 1}" y="${y + 1}" width="13" height="12" class="d-afill" opacity="${(0.8 - Math.abs(d)) * 0.7}"/>`);
    }
    out.push(`<ellipse class="d-line" cx="80" cy="50" rx="33" ry="31"/>`);
    return out.join('') + T(80, 99, 'signed distance = 0', 'middle');
  },
  workstation: () => [
    L('M20 15 H140 V70 H20 Z'), L('M70 70 L65 84 H95 L90 70'),
    L('M28 22 H78 V62 H28 Z M82 22 H132 V62 H82 Z', 'd-thin'),
    C(53, 42, 1.6, 'd-afill'), C(105, 42, 1.6, 'd-afill'), L('M53 42 L105 42', 'd-accent'),
    L('M30 92 H130', 'd-thin'), T(80, 99, 'softcopy stereo + matching', 'middle'),
  ].join(''),
  satellite: () => [
    L('M20 15 h12 v6 h-12 z M36 15 h12 v6 h-12 z'), L('M32 18 h4'),
    L('M120 10 h12 v6 h-12 z M136 10 h12 v6 h-12 z'), L('M132 13 h4'),
    camera(80, 60, 90), L('M34 21 L80 54 M134 16 L80 54', 'd-thin'),
    `<circle class="d-accent" cx="80" cy="60" r="16"/>`, T(100, 84, 'GNSS + IMU → pose'),
    L('M10 92 H150', 'd-thin'),
  ].join(''),
  lightfield: () => [
    L('M20 15 L50 25 L50 85 L20 75 Z'), L('M110 15 L140 25 L140 85 L110 75 Z'),
    L('M30 35 L125 60 M35 50 L120 35 M40 70 L130 45 M28 55 L118 72', 'd-accent'),
    T(35, 96, '(u, v)', 'middle'), T(125, 96, '(s, t)', 'middle'),
  ].join(''),
  dome: () => {
    const out = [`<path class="d-thin" d="M15 85 A65 65 0 0 1 145 85"/>`, L('M10 85 H150', 'd-thin')];
    for (let i = 0; i <= 8; i++) { const a = Math.PI * (i / 8); const x = 80 - Math.cos(a) * 65, y = 85 - Math.sin(a) * 65; out.push(C(x, y, 2.2, 'd-afill'), L(`M${x.toFixed(1)} ${y.toFixed(1)} L80 62`, 'd-thin')); }
    out.push(L('M80 50 V78 M72 60 H88 M80 78 L74 88 M80 78 L86 88'), C(80, 46, 4, 'd-line'));
    return out.join('');
  },
  sparsity: () => {
    const out = [L('M20 10 H120 V90 H20 Z', 'd-thin')];
    for (let i = 0; i < 4; i++) out.push(`<rect class="d-afill" x="${20 + i * 10}" y="${10 + i * 10}" width="10" height="10"/>`);
    out.push(`<rect class="d-soft" x="60" y="50" width="60" height="40"/>`);
    for (let i = 0; i < 6; i++) out.push(`<rect class="d-fill" x="${60 + i * 10}" y="${50 + (i % 4) * 10}" width="10" height="10" opacity="0.7"/>`);
    const r = rng(11);
    for (let k = 0; k < 10; k++) { const i = Math.floor(r() * 4), j = Math.floor(r() * 6); out.push(`<rect class="d-fill" x="${60 + j * 10}" y="${10 + i * 10}" width="10" height="10" opacity="0.35"/>`, `<rect class="d-fill" x="${20 + i * 10}" y="${50 + j * 6.6}" width="10" height="6.6" opacity="0.35"/>`); }
    out.push(T(140, 30, 'cameras'), T(140, 72, 'points'));
    return out.join('');
  },
  sfm: () => {
    const r = rng(5); const out = [];
    for (let i = 0; i < 70; i++) { const a = r() * Math.PI * 2, d = r() * 22; out.push(C(80 + Math.cos(a) * d * 1.4, 55 + Math.sin(a) * d * 0.8, 0.9)); }
    for (let i = 0; i < 7; i++) { const a = Math.PI * 1.05 + i * 0.27; const x = 80 + Math.cos(a) * 62, y = 55 + Math.sin(a) * 42; const rot = (a * 180 / Math.PI) + 180; out.push(`<g class="${i < 5 ? '' : 'pending'}">${camera(x, y, rot, 0.8)}</g>`); if (i < 5) out.push(L(`M${x.toFixed(1)} ${y.toFixed(1)} L80 55`, 'd-thin')); }
    out.push(L('M24 74 Q20 50 38 26', 'd-accent'));
    return out.join('');
  },
  pointcloud: () => {
    const r = rng(9); const out = [];
    for (let i = 0; i < 380; i++) { const x = 15 + r() * 130; const base = 70 - 25 * Math.exp(-((x - 80) ** 2) / 700); const y = base - r() * (base < 60 ? 18 : 5); out.push(`<circle class="d-fill" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="0.7" opacity="${0.4 + r() * 0.5}"/>`); }
    return out.join('') + T(80, 92, 'dense point cloud', 'middle');
  },
  mesh: () => {
    const pts = [[20, 75], [45, 50], [70, 30], [95, 28], [120, 45], [140, 72], [40, 85], [75, 70], [110, 82], [62, 52], [92, 55]];
    const tris = [[0, 1, 6], [1, 9, 7], [1, 2, 9], [2, 3, 9], [9, 3, 10], [3, 4, 10], [4, 5, 8], [10, 4, 8], [7, 10, 8], [6, 1, 7], [9, 10, 7]];
    return tris.map(([a, b, c]) => `<path class="d-line" d="M${pts[a]} L${pts[b]} L${pts[c]} Z" fill="var(--sage)" fill-opacity="0.5"/>`).join('') + pts.map(([x, y]) => C(x, y, 1.4, 'd-afill')).join('');
  },
  radiance: () => {
    const out = [camera(14, 50, 0), L('M20 50 L155 30', 'd-thin'), L('M20 50 L155 70', 'd-thin'), L('M20 50 L155 50', 'd-accent')];
    for (let i = 0; i < 9; i++) out.push(C(50 + i * 11, 50, 1.4));
    out.push(`<rect x="62" y="20" width="56" height="60" class="d-thin"/>`);
    out.push(T(90, 15, 'F(x, d) → (σ, c)', 'middle'), T(90, 94, 'volume rendering', 'middle'));
    return out.join('');
  },
  gaussians: () => {
    const r = rng(13); const out = [];
    for (let i = 0; i < 26; i++) { const x = 20 + r() * 120, y = 18 + r() * 62; out.push(E(x.toFixed(1), y.toFixed(1), (3 + r() * 14).toFixed(1), (1.5 + r() * 5).toFixed(1), (r() * 180).toFixed(0))); }
    return out.join('') + T(80, 97, 'μ, Σ, α, SH', 'middle');
  },
  surfels: () => {
    const out = [L('M10 72 C40 40 80 40 100 55 S140 80 155 50', 'd-thin')];
    const pts = [[22, 60, -40], [38, 50, -25], [55, 45, -8], [72, 45, 8], [88, 50, 20], [104, 58, 20], [120, 64, 5], [136, 62, -25], [148, 54, -45]];
    pts.forEach(([x, y, a]) => out.push(E(x, y, 9, 1.6, a)));
    return out.join('') + T(80, 92, 'surface-aligned splats', 'middle');
  },
  hierarchy: () => {
    const out = [E(80, 18, 26, 9, 0)];
    [[45, 50], [115, 50]].forEach(([x, y]) => { out.push(E(x, y, 16, 6, 10), L(`M80 27 L${x} ${y - 6}`, 'd-thin')); });
    [[25, 82], [55, 82], [100, 82], [130, 82]].forEach(([x, y], i) => { out.push(E(x, y, 9, 4, -15), L(`M${i < 2 ? 45 : 115} 56 L${x} ${y - 4}`, 'd-thin')); });
    return out.join('');
  },
  slam: () => {
    const out = [L('M15 80 C40 60 50 30 80 25 S130 40 140 70 S90 92 40 82', 'd-accent')];
    [[15, 80], [45, 46], [80, 25], [120, 36], [140, 70], [100, 86]].forEach(([x, y]) => out.push(C(x, y, 2.2)));
    const r = rng(17); for (let i = 0; i < 40; i++) out.push(C((10 + r() * 140).toFixed(1), (10 + r() * 80).toFixed(1), 0.8, 'd-fill'));
    out.push(L('M40 82 Q28 82 15 80', 'd-thin'), T(30, 95, 'loop closure', 'middle'));
    return out.join('');
  },
  cone: () => [
    camera(14, 50, 0), L('M20 50 L155 22 M20 50 L155 78', 'd-line'),
    E(60, 50, 4, 8, 0), E(95, 50, 6, 14, 0), E(130, 50, 8, 20, 0),
    L('M20 50 H155', 'd-thin'), T(90, 96, 'integrated positional encoding', 'middle'),
  ].join(''),
  hashgrid: () => {
    const out = [];
    [[10, 4], [16, 8], [24, 12]].forEach(([s, n], k) => { const x0 = 10 + k * 48, size = 40; for (let i = 0; i <= n; i++) { out.push(L(`M${x0 + i * size / n} 20 V60 M${x0} ${20 + i * 40 / n} H${x0 + size}`, 'd-thin')); } out.push(C(x0 + 17, 37, 1.8, 'd-afill')); });
    out.push(L('M27 37 L58 72 M75 37 L80 72 M123 37 L100 72', 'd-accent'));
    out.push(`<rect class="d-line" x="40" y="72" width="80" height="12"/>`, T(80, 95, 'hash tables → tiny MLP', 'middle'));
    return out.join('');
  },
  deformation: () => [
    E(40, 50, 22, 10, -20), E(40, 50, 6, 18, 30),
    `<path class="d-accent" d="M68 50 C85 30 100 30 112 45"/>`, L('M108 40 L112 45 L106 47', 'd-accent'),
    E(125, 55, 22, 9, 15), E(125, 55, 6, 16, 50),
    T(40, 90, 'canonical', 'middle'), T(125, 90, 'time t', 'middle'), T(90, 24, 'Ψ(x, t)', 'middle'),
  ].join(''),
  dynamic: () => {
    const out = [];
    [[20, 70, 60, 30, 140, 40], [20, 50, 70, 60, 140, 20], [25, 85, 80, 80, 140, 65]].forEach(([a, b, c, d, e, f]) => {
      out.push(L(`M${a} ${b} Q${c} ${d} ${e} ${f}`, 'd-thin'));
      [0, 0.33, 0.66, 1].forEach(t => { const x = (1 - t) ** 2 * a + 2 * (1 - t) * t * c + t * t * e, y = (1 - t) ** 2 * b + 2 * (1 - t) * t * d + t * t * f; out.push(E(x.toFixed(1), y.toFixed(1), 6, 3, 30 * t)); });
    });
    return out.join('') + T(80, 98, 't →', 'middle');
  },
  hyperslice: () => [
    L('M20 80 L60 20 L140 20 L100 80 Z', 'd-thin'), L('M30 65 L130 35', 'd-accent'), L('M40 75 L120 25', 'd-accent'),
    `<path class="d-line" d="M50 60 C70 30 90 70 110 40"/>`, T(80, 94, 'slices through 3D + ambient dims', 'middle'),
  ].join(''),
  planes: () => [
    L('M20 20 h35 v25 h-35 z M62 20 h35 v25 h-35 z M104 20 h35 v25 h-35 z'),
    L('M20 55 h35 v25 h-35 z M62 55 h35 v25 h-35 z M104 55 h35 v25 h-35 z', 'd-accent'),
    T(37, 15, 'xy', 'middle'), T(79, 15, 'xz', 'middle'), T(121, 15, 'yz', 'middle'),
    T(37, 92, 'xt', 'middle'), T(79, 92, 'yt', 'middle'), T(121, 92, 'zt', 'middle'),
  ].join(''),
  spacetime: () => [
    L('M15 85 H150 M15 85 V8', 'd-thin'), T(150, 95, 't', 'end'), T(8, 12, 'x'),
    E(80, 46, 50, 16, -28), L('M95 10 V88', 'd-accent'), E(95, 40, 3, 9, 0), T(98, 96, 'slice at t'),
  ].join(''),
  transformer: () => {
    const out = [L('M8 20 h28 v24 h-28 z M8 56 h28 v24 h-28 z')];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) out.push(`<rect class="d-thin" x="${52 + i * 9}" y="${24 + j * 13}" width="7" height="10"/>`);
    out.push(L('M36 32 L52 32 M36 68 L52 68', 'd-thin'), L('M106 50 L118 50', 'd-accent'));
    const r = rng(21); for (let i = 0; i < 60; i++) out.push(C((125 + r() * 28).toFixed(1), (25 + r() * 50).toFixed(1), 0.8, 'd-afill'));
    out.push(T(22, 92, 'images', 'middle'), T(79, 92, 'attention', 'middle'), T(139, 92, 'pointmaps', 'middle'));
    return out.join('');
  },
  state: () => [
    L('M10 30 h22 v18 h-22 z M10 58 h22 v18 h-22 z', 'd-thin'), T(21, 90, 'frames', 'middle'),
    `<rect class="d-soft" x="60" y="30" width="44" height="40"/>`, L('M60 30 h44 v40 h-44 z'),
    L('M32 40 L60 45 M32 66 L60 58', 'd-accent'), `<path class="d-accent" d="M104 42 C125 30 125 70 104 58"/>`,
    T(82, 82, 'persistent state', 'middle'), L('M104 50 H150', 'd-thin'), T(150, 46, 'query', 'end'),
  ].join(''),
  physics: () => {
    const out = [L('M10 85 H150', 'd-line')];
    const r = rng(23);
    for (let i = 0; i < 14; i++) { const x = 30 + (i % 7) * 9, y = 40 + Math.floor(i / 7) * 9; out.push(E(x, y, 4, 4, 0)); }
    for (let i = 0; i < 12; i++) { const x = 95 + r() * 45, y = 75 + r() * 8; out.push(E(x.toFixed(1), y.toFixed(1), 4.5, 2.5, (r() * 40 - 20).toFixed(0))); }
    out.push(`<path class="d-accent" d="M88 45 C100 45 105 55 108 66"/>`, L('M104 62 L108 66 L110 60', 'd-accent'), T(80, 97, 'render = simulate', 'middle'));
    return out.join('');
  },
  world: () => [
    `<circle class="d-line" cx="40" cy="50" r="18"/>`, T(40, 82, 'latent state', 'middle'),
    L('M58 50 H90', 'd-accent'), L('M86 46 L90 50 L86 54', 'd-accent'), T(74, 44, 'action', 'middle'),
    L('M95 30 h45 v40 h-45 z'), L('M100 60 L112 45 L122 55 L135 38', 'd-thin'), T(118, 82, 'predicted view', 'middle'),
    `<path class="d-thin" d="M118 30 C110 10 60 10 48 33"/>`,
  ].join(''),
  network: () => {
    const r = rng(29); const pts = Array.from({ length: 14 }, () => [15 + r() * 130, 12 + r() * 76]);
    const out = [];
    pts.forEach((p, i) => pts.slice(i + 1).forEach(q => { if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 42) out.push(L(`M${p[0].toFixed(1)} ${p[1].toFixed(1)} L${q[0].toFixed(1)} ${q[1].toFixed(1)}`, 'd-thin')); }));
    pts.forEach(([x, y], i) => out.push(C(x.toFixed(1), y.toFixed(1), i % 4 ? 1.8 : 2.6, i % 4 ? 'd-fill' : 'd-afill')));
    return out.join('');
  },
};

export function diagramSVG(name, title = '') {
  const fn = D[name] || D.network;
  return `<div class="diagram"><svg viewBox="0 0 160 100" role="img" aria-label="${title ? title.replace(/"/g, '') + ' — ' : ''}schematic diagram" preserveAspectRatio="xMidYMid meet">${fn()}</svg></div>`;
}

export const diagramNames = Object.keys(D);
