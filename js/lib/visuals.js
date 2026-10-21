// Teaching illustrations as inline SVG: chord boxes, strum patterns, tab, fretboard
// shapes, instrument anatomy, hands, rhythm grids and theory diagrams.
// Colours come from CSS variables so every theme (light/dark) works.

import { h } from './ui.js';
import { TUNINGS, SCALES, noteIndex, noteName, pc, intervalLabel, keyChords } from './music.js';

// frets: low E → high e; -1 = muted, 0 = open. fingers: 0 = none. barre: { fret, from, to } (string indexes).
export const CHORD_SHAPES = {
  'A': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'D': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  'E': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  'Em': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  'Am': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  'Dm': { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  'C': { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  'G': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  'F (mini)': { frets: [-1, -1, 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1], barre: { fret: 1, from: 4, to: 5 } },
  'E5': { frets: [0, 2, -1, -1, -1, -1], fingers: [0, 1, 0, 0, 0, 0] },
  'A5': { frets: [-1, 0, 2, -1, -1, -1], fingers: [0, 0, 1, 0, 0, 0] },
  'G5': { frets: [3, 5, 5, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0] },
  'C5': { frets: [-1, 3, 5, 5, -1, -1], fingers: [0, 1, 3, 4, 0, 0] },
  'Cadd9': { frets: [-1, 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4] },
  'G (anchor)': { frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4] },
  'Dsus4': { frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4] },
  'Dsus2': { frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0] },
  'Em7': { frets: [0, 2, 2, 0, 3, 3], fingers: [0, 1, 2, 0, 3, 4] },
  'Asus2': { frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
  'Asus4': { frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'A7': { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  'D7': { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  'E7': { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  'G7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  'C7': { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  'B7': { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  'F (barre)': { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 1, from: 0, to: 5 } },
  'G (barre)': { frets: [3, 5, 5, 4, 3, 3], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 3, from: 0, to: 5 } },
  'Gm (barre)': { frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 3, from: 0, to: 5 } },
  'Bb (barre)': { frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 3, 3, 3, 1], barre: { fret: 1, from: 1, to: 5 } },
  'C (barre)': { frets: [-1, 3, 5, 5, 5, 3], fingers: [0, 1, 3, 3, 3, 1], barre: { fret: 3, from: 1, to: 5 } },
  'Bm (barre)': { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 2, from: 1, to: 5 } },
};

const fig = (svg, caption, cls = '') => {
  const f = h('figure', { class: `vis ${cls}` });
  f.innerHTML = svg;
  if (caption) f.append(h('figcaption', {}, caption));
  return f;
};

// ── Chord box ────────────────────────────────────────────────────
export function chordSVG(name, { size = 1, title = true } = {}) {
  const c = CHORD_SHAPES[name];
  if (!c) return '';
  const fretted = c.frets.filter(f => f > 0);
  const maxF = Math.max(0, ...fretted);
  const minF = fretted.length ? Math.min(...fretted) : 1;
  const base = maxF > 4 ? minF : 1;
  const sx = i => 18 + i * 15, top = title ? 38 : 22, fh = 20, nF = 4;
  const W = 112, H = top + fh * nF + 14;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W * size}" height="${H * size}" class="chord-svg" role="img" aria-label="${name} chord diagram">`;
  if (title) s += `<text x="${W / 2}" y="13" class="v-title">${name.replace(/ \(.*\)/, '')}</text>`;
  if (base === 1) s += `<rect x="${sx(0) - 1}" y="${top - 4}" width="${sx(5) - sx(0) + 2}" height="4" class="v-nut"/>`;
  else s += `<text x="${sx(5) + 7}" y="${top + fh * 0.65}" class="v-small" text-anchor="start">${base}fr</text>`;
  for (let f = 0; f <= nF; f++) s += `<line x1="${sx(0)}" x2="${sx(5)}" y1="${top + f * fh}" y2="${top + f * fh}" class="v-line"/>`;
  for (let i = 0; i < 6; i++) s += `<line x1="${sx(i)}" x2="${sx(i)}" y1="${top}" y2="${top + nF * fh}" class="v-line"/>`;
  c.frets.forEach((f, i) => {
    if (f === -1) s += `<text x="${sx(i)}" y="${top - 9}" class="v-small">×</text>`;
    else if (f === 0) s += `<circle cx="${sx(i)}" cy="${top - 12}" r="3.6" class="v-open"/>`;
  });
  if (c.barre) {
    const y = top + (c.barre.fret - base + 0.5) * fh;
    s += `<rect x="${sx(c.barre.from) - 6}" y="${y - 6}" width="${sx(c.barre.to) - sx(c.barre.from) + 12}" height="12" rx="6" class="v-dot"/>`;
  }
  c.frets.forEach((f, i) => {
    if (f <= 0) return;
    if (c.barre && f === c.barre.fret && i >= c.barre.from && i <= c.barre.to && c.fingers[i] === 1) return;
    const y = top + (f - base + 0.5) * fh;
    s += `<circle cx="${sx(i)}" cy="${y}" r="6.5" class="v-dot"/>`;
    if (c.fingers[i]) s += `<text x="${sx(i)}" y="${y + 3.3}" class="v-dot-text">${c.fingers[i]}</text>`;
  });
  if (c.barre) s += `<text x="${(sx(c.barre.from) + sx(c.barre.to)) / 2}" y="${top + (c.barre.fret - base + 0.5) * fh + 3.3}" class="v-dot-text">1</text>`;
  ['E', 'A', 'D', 'G', 'B', 'e'].forEach((l, i) => { s += `<text x="${sx(i)}" y="${H - 2}" class="v-tiny">${l}</text>`; });
  s += '</svg>';
  return s;
}

// ── Mini fretboard (horizontal) for shapes and scale boxes ──────
function miniBoard({ inst = 'guitar', from = 0, to = 5, dots = [], title = '' }) {
  const t = TUNINGS[inst];
  const n = t.strings.length;
  const cols = to - from + 1;
  const cw = 34, rh = 18, left = 26, top = title ? 26 : 12;
  const W = left + cols * cw + 10, H = top + (n - 1) * rh + 26;
  const sy = i => top + (n - 1 - i) * rh;
  const fx = f => left + (f - from + 0.5) * cw;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="board-svg" role="img" aria-label="${title || 'fretboard diagram'}">`;
  if (title) s += `<text x="${W / 2}" y="14" class="v-title">${title}</text>`;
  for (let f = from; f <= to + 1; f++) {
    const x = left + (f - from) * cw;
    s += `<line x1="${x}" x2="${x}" y1="${sy(n - 1)}" y2="${sy(0)}" class="${f === 0 ? 'v-nut-line' : 'v-line'}"/>`;
  }
  for (let i = 0; i < n; i++) {
    s += `<line x1="${left}" x2="${left + cols * cw}" y1="${sy(i)}" y2="${sy(i)}" class="v-string"/>`;
    s += `<text x="10" y="${sy(i) + 4}" class="v-tiny">${t.labels[i]}</text>`;
  }
  for (let f = from; f <= to; f++) if (f > 0) s += `<text x="${fx(f) - cw / 2 + cw / 2}" y="${H - 6}" class="v-tiny">${f}</text>`;
  for (const d of dots) {
    const x = d.f === 0 ? left - 2 : fx(d.f) - cw / 2 + cw / 2;
    s += `<circle cx="${x}" cy="${sy(d.s)}" r="8" class="${d.root ? 'v-root' : 'v-dot'}"/>`;
    if (d.label) s += `<text x="${x}" y="${sy(d.s) + 3.5}" class="v-dot-text">${d.label}</text>`;
  }
  s += '</svg>';
  return s;
}

export function scaleSVG({ inst = 'guitar', root = 'A', scale = 'minPent', from = 5, to = 8, labels = 'degrees' }) {
  const r = noteIndex(root);
  const steps = SCALES[scale].steps;
  const dots = [];
  TUNINGS[inst].strings.forEach((open, s) => {
    for (let f = from; f <= to; f++) {
      const semis = pc(open + f - r);
      if (steps.includes(semis)) dots.push({ s, f, root: semis === 0, label: labels === 'notes' ? noteName(open + f) : intervalLabel(semis) });
    }
  });
  return miniBoard({ inst, from: Math.max(0, from), to, dots, title: `${root} ${SCALES[scale].name.toLowerCase()}` });
}

const SHAPES = {
  octave: { name: 'Octave shape', dots: [{ s: 0, f: 3, root: true, label: 'R' }, { s: 2, f: 5, label: '8' }], from: 2, to: 6 },
  fifth: { name: 'Root + 5th', dots: [{ s: 0, f: 3, root: true, label: 'R' }, { s: 1, f: 5, label: '5' }], from: 2, to: 6 },
  rfo: { name: 'Root – 5th – octave', dots: [{ s: 0, f: 3, root: true, label: 'R' }, { s: 1, f: 5, label: '5' }, { s: 2, f: 5, label: '8' }], from: 2, to: 6 },
  power: { name: 'Power chord (G5)', dots: [{ s: 0, f: 3, root: true, label: '1' }, { s: 1, f: 5, label: '3' }, { s: 2, f: 5, label: '4' }], from: 2, to: 6 },
  approach: { name: 'Approach note → next root', dots: [{ s: 0, f: 3, root: true, label: 'G' }, { s: 1, f: 2, label: '→' }, { s: 1, f: 3, root: true, label: 'C' }], from: 1, to: 5 },
  spider: { name: 'One finger per fret', dots: [0, 1, 2, 3].flatMap(s => [1, 2, 3, 4].map(f => ({ s, f, label: String(f) }))), from: 1, to: 4 },
};
export function shapeSVG(inst, shape) {
  const sh = SHAPES[shape];
  return miniBoard({ inst, from: sh.from, to: sh.to, dots: sh.dots, title: sh.name });
}

// ── Tab ──────────────────────────────────────────────────────────
// notes: array of columns; each column is [[string (0 = lowest), fret], ...] or null for a rest.
export function tabSVG({ inst = 'guitar', notes = [], title = '' }) {
  const t = TUNINGS[inst];
  const n = t.strings.length;
  const cw = 26, rh = 13, left = 26, top = title ? 26 : 12;
  const W = left + notes.length * cw + 16, H = top + (n - 1) * rh + 14;
  const sy = i => top + (n - 1 - i) * rh;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="tab-svg" role="img" aria-label="tab: ${title}">`;
  if (title) s += `<text x="${W / 2}" y="14" class="v-title">${title}</text>`;
  for (let i = 0; i < n; i++) {
    s += `<line x1="${left - 4}" x2="${W - 8}" y1="${sy(i)}" y2="${sy(i)}" class="v-string"/>`;
    s += `<text x="10" y="${sy(i) + 4}" class="v-tiny">${t.labels[i]}</text>`;
  }
  s += `<line x1="${left - 4}" x2="${left - 4}" y1="${sy(n - 1)}" y2="${sy(0)}" class="v-line"/><line x1="${W - 8}" x2="${W - 8}" y1="${sy(n - 1)}" y2="${sy(0)}" class="v-line"/>`;
  notes.forEach((col, ci) => {
    if (!col) return;
    const x = left + ci * cw + cw / 2;
    for (const [str, fret] of col) {
      s += `<rect x="${x - 8}" y="${sy(str) - 6}" width="16" height="12" class="v-bg"/>`;
      s += `<text x="${x}" y="${sy(str) + 4}" class="v-tab">${fret}</text>`;
    }
  });
  s += '</svg>';
  return s;
}

// ── Strum pattern ────────────────────────────────────────────────
// pattern: 8 chars, D / U / _ (miss) on "1 & 2 & 3 & 4 &" (or 16 for 16ths).
export function strumSVG(pattern) {
  const p = pattern.split('');
  const sixteen = p.length === 16;
  const counts = sixteen ? ['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a'] : ['1', '&', '2', '&', '3', '&', '4', '&'];
  const cw = sixteen ? 22 : 36, W = p.length * cw + 12, H = 82;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="strum-svg" role="img" aria-label="strum pattern ${pattern}">`;
  p.forEach((c, i) => {
    const x = 6 + i * cw + cw / 2;
    const on = c === 'D' || c === 'U';
    const cls = on ? (i % (sixteen ? 4 : 2) === 0 ? 'v-arrow' : 'v-arrow alt') : 'v-arrow ghost';
    const dir = c === 'U' || (c === '_' && i % 2 === 1) ? 'up' : 'down';
    const y1 = 12, y2 = 52;
    if (dir === 'down') s += `<path d="M${x} ${y1} V${y2} M${x - 7} ${y2 - 9} L${x} ${y2} L${x + 7} ${y2 - 9}" class="${cls}"/>`;
    else s += `<path d="M${x} ${y2} V${y1} M${x - 7} ${y1 + 9} L${x} ${y1} L${x + 7} ${y1 + 9}" class="${cls}"/>`;
    s += `<text x="${x}" y="${H - 8}" class="${i % (sixteen ? 4 : 2) === 0 ? 'v-count' : 'v-count off'}">${counts[i]}</text>`;
  });
  s += '</svg>';
  return s;
}

// ── Rhythm grid ──────────────────────────────────────────────────
export function rhythmSVG(sub = 2, hits = null) {
  const counts = { 1: ['1', '2', '3', '4'], 2: ['1', '&', '2', '&', '3', '&', '4', '&'], 3: ['1', 'tri', 'plet', '2', 'tri', 'plet', '3', 'tri', 'plet', '4', 'tri', 'plet'], 4: '1 e & a 2 e & a 3 e & a 4 e & a'.split(' ') }[sub];
  const on = hits || counts.map(() => true);
  const cw = sub === 4 || sub === 3 ? 20 : sub === 2 ? 34 : 60, W = counts.length * cw + 8, H = 60;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="rhythm-svg" role="img" aria-label="rhythm grid">`;
  counts.forEach((c, i) => {
    const x = 4 + i * cw;
    const beat = i % sub === 0;
    s += `<rect x="${x + 2}" y="8" width="${cw - 4}" height="22" rx="5" class="${on[i] ? (beat ? 'v-hit' : 'v-hit alt') : 'v-cell'}"/>`;
    s += `<text x="${x + cw / 2}" y="48" class="${beat ? 'v-count' : 'v-count off'}">${c}</text>`;
  });
  s += '</svg>';
  return s;
}

// ── Instrument anatomy ───────────────────────────────────────────
export function partsSVG(inst = 'guitar') {
  const bass = inst === 'bass';
  const n = bass ? 4 : 6;
  const W = 660, H = 236;
  const neckX0 = 96, neckX1 = bass ? 400 : 370, neckY = 104, neckH = 30;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" class="parts-svg" role="img" aria-label="Parts of the ${inst}">`;
  // body (double cutaway, stylised)
  const bx = neckX1 - 10;
  s += `<path d="M${bx} 70 C ${bx + 40} 20, ${bx + 120} 30, ${bx + 150} 58 C ${bx + 175} 40, ${bx + 225} 50, ${bx + 225} 119 C ${bx + 225} 188, ${bx + 175} 198, ${bx + 150} 180 C ${bx + 120} 208, ${bx + 40} 218, ${bx} 168 C ${bx + 30} 150, ${bx + 30} 88, ${bx} 70 Z" class="v-body"/>`;
  // pickguard-ish
  s += `<path d="M${bx + 30} 86 C ${bx + 90} 70, ${bx + 150} 80, ${bx + 165} 112 C ${bx + 150} 150, ${bx + 90} 168, ${bx + 30} 152 Z" class="v-guard"/>`;
  // headstock
  s += `<path d="M20 ${neckY - 14} L${neckX0} ${neckY - 2} L${neckX0} ${neckY + neckH + 2} L20 ${neckY + neckH + 14} Q 10 ${neckY + neckH / 2} 20 ${neckY - 14} Z" class="v-head"/>`;
  // pegs
  const pegs = bass ? [[34, -1], [64, -1], [34, 1], [64, 1]] : [[30, -1], [52, -1], [74, -1], [30, 1], [52, 1], [74, 1]];
  for (const [x, side] of pegs) s += `<circle cx="${x}" cy="${side < 0 ? neckY - 20 : neckY + neckH + 20}" r="7" class="v-peg"/><line x1="${x}" x2="${x}" y1="${side < 0 ? neckY - 13 : neckY + neckH + 13}" y2="${side < 0 ? neckY - 4 : neckY + neckH + 4}" class="v-line"/>`;
  // neck
  s += `<rect x="${neckX0}" y="${neckY}" width="${neckX1 - neckX0 + 40}" height="${neckH}" class="v-neck"/>`;
  s += `<rect x="${neckX0}" y="${neckY}" width="4" height="${neckH}" class="v-nut"/>`;
  const len = neckX1 - neckX0 + 40;
  for (let f = 1; f <= 14; f++) { const x = neckX0 + len * (1 - Math.pow(2, -f / 14)) * 1.25; if (x < neckX1 + 38) s += `<line x1="${x}" x2="${x}" y1="${neckY}" y2="${neckY + neckH}" class="v-fret"/>`; }
  // pickups, bridge, knobs, jack
  const pk = bass ? [bx + 70, bx + 120] : [bx + 70, bx + 108];
  for (const x of pk) s += `<rect x="${x}" y="${neckY - 6}" width="${bass ? 22 : 16}" height="${neckH + 12}" rx="3" class="v-pickup"/>`;
  s += `<rect x="${bx + 150}" y="${neckY - 4}" width="14" height="${neckH + 8}" rx="2" class="v-bridge"/>`;
  const knobs = bass ? [[bx + 150, 160], [bx + 180, 152]] : [[bx + 140, 160], [bx + 168, 154], [bx + 194, 144]];
  for (const [x, y] of knobs) s += `<circle cx="${x}" cy="${y}" r="7" class="v-knob"/>`;
  if (!bass) s += `<line x1="${bx + 118}" y1="72" x2="${bx + 128}" y2="62" class="v-switch"/><circle cx="${bx + 128}" cy="62" r="3.5" class="v-knob"/>`;
  s += `<circle cx="${bx + 214}" cy="${neckY + neckH / 2 + 30}" r="5" class="v-jack"/>`;
  // strings
  for (let i = 0; i < n; i++) {
    const y = neckY + 4 + i * ((neckH - 8) / (n - 1));
    s += `<line x1="${neckX0}" x2="${bx + 164}" y1="${y}" y2="${y}" class="v-string thin"/>`;
  }
  // labels
  const L = (x, y, tx, ty, text) => { s += `<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}" class="v-leader"/><text x="${tx}" y="${ty + (ty < y ? -4 : 12)}" class="v-label">${text}</text>`; };
  L(52, neckY - 20, 52, 26, 'Tuning pegs');
  L(30, neckY + neckH, 30, 210, 'Headstock');
  L(neckX0 + 2, neckY + neckH, neckX0 + 10, 186, 'Nut');
  L(neckX0 + 120, neckY, neckX0 + 120, 46, 'Frets');
  L(neckX0 + 200, neckY + neckH, neckX0 + 190, 200, 'Neck');
  L(pk[0] + 8, neckY - 6, pk[0] - 24, 30, 'Pickups');
  L(bx + 157, neckY - 4, bx + 206, 40, 'Bridge');
  L(knobs[0][0], knobs[0][1] + 7, knobs[0][0] - 50, 222, bass ? 'Volume / tone' : 'Volume & tone');
  if (!bass) L(bx + 128, 58, bx + 120, 14, 'Pickup selector');
  L(bx + 214, neckY + neckH / 2 + 35, bx + 214, 214, 'Output jack');
  s += '</svg>';
  return s;
}

// ── Hands & technique ────────────────────────────────────────────
export function handSVG() {
  const fingers = [[60, 70, 1], [92, 50, 2], [124, 56, 3], [154, 80, 4]];
  let s = `<svg viewBox="0 0 230 232" width="230" height="232" class="hand-svg" role="img" aria-label="Fretting hand finger numbers">`;
  s += `<path d="M44 140 Q40 200 110 204 Q178 204 176 140 L176 118 L44 118 Z" class="v-skin"/>`;
  for (const [x, top, n] of fingers) {
    s += `<rect x="${x - 13}" y="${top}" width="26" height="${140 - top}" rx="13" class="v-skin"/>`;
    s += `<circle cx="${x}" cy="${top + 16}" r="11" class="v-dot"/><text x="${x}" y="${top + 20}" class="v-dot-text">${n}</text>`;
  }
  s += `<rect x="168" y="118" width="26" height="70" rx="13" transform="rotate(-40 180 150)" class="v-skin"/>`;
  s += `<circle cx="203" cy="132" r="11" class="v-root"/><text x="203" y="136" class="v-dot-text">T</text>`;
  s += `<text x="115" y="226" class="v-label">1 index · 2 middle · 3 ring · 4 pinky · T thumb</text>`;
  s += '</svg>';
  return s;
}

export function pickSVG() {
  return `<svg viewBox="0 0 320 160" width="320" height="160" class="pick-svg" role="img" aria-label="How to hold a pick">
    <rect x="20" y="86" width="170" height="30" rx="15" class="v-skin"/>
    <path d="M150 74 Q 172 62 194 76 L 246 100 L 194 124 Q 172 138 150 126 Q 138 100 150 74 Z" class="v-pick"/>
    <ellipse cx="168" cy="86" rx="44" ry="19" class="v-skin dim"/>
    <line x1="160" y1="66" x2="130" y2="34" class="v-leader"/><text x="18" y="28" class="v-label start">thumb pad presses on top</text>
    <line x1="80" y1="116" x2="60" y2="136" class="v-leader"/><text x="18" y="150" class="v-label start">side of the index finger underneath</text>
    <line x1="246" y1="100" x2="262" y2="74" class="v-leader"/><text x="236" y="66" class="v-label start">tip: 2–3 mm</text>
  </svg>`;
}

export function restStrokeSVG() {
  return `<svg viewBox="0 0 300 140" width="300" height="140" class="rest-svg" role="img" aria-label="Bass rest stroke">
    ${['E', 'A', 'D', 'G'].map((l, i) => `<circle cx="${60 + i * 60}" cy="90" r="9" class="v-string-dot"/><text x="${60 + i * 60}" y="122" class="v-tiny">${l}</text>`).join('')}
    <path d="M190 40 Q 168 86 128 84" class="v-move"/>
    <path d="M136 76 L126 84 L137 92" class="v-move"/>
    <circle cx="190" cy="36" r="12" class="v-skin"/>
    <circle cx="124" cy="74" r="12" class="v-skin dim"/>
    <text x="206" y="30" class="v-label start">pluck D…</text>
    <text x="10" y="40" class="v-label start">…finger rests on A</text>
  </svg>`;
}

export function palmMuteSVG() {
  return `<svg viewBox="0 0 320 130" width="320" height="130" class="pm-svg" role="img" aria-label="Palm muting position">
    ${[0, 1, 2, 3, 4, 5].map(i => `<line x1="10" x2="300" y1="${34 + i * 10}" y2="${34 + i * 10}" class="v-string thin"/>`).join('')}
    <rect x="236" y="26" width="18" height="66" rx="3" class="v-bridge"/>
    <path d="M200 20 C 214 40 214 78 200 102 L 300 102 L 300 20 Z" class="v-skin dim"/>
    <line x1="208" y1="18" x2="208" y2="8" class="v-leader"/>
    <text x="150" y="122" class="v-label">edge of palm lightly on the strings, right at the bridge</text>
    <text x="10" y="16" class="v-label start">← further up the neck = muffled thud</text>
  </svg>`;
}

// ── Theory diagrams ──────────────────────────────────────────────
export function keyboardSVG() {
  const whites = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blacks = { 0: 'C#', 1: 'D#', 3: 'F#', 4: 'G#', 5: 'A#' };
  const ww = 40, W = whites.length * ww + 2;
  let s = `<svg viewBox="0 0 ${W} 150" width="${W}" height="150" class="kbd-svg" role="img" aria-label="The 12 notes">`;
  whites.forEach((n, i) => { s += `<rect x="${1 + i * ww}" y="10" width="${ww}" height="110" rx="4" class="v-white"/><text x="${1 + i * ww + ww / 2}" y="110" class="v-label" text-anchor="middle">${n}</text>`; });
  Object.entries(blacks).forEach(([i, n]) => { const x = 1 + (+i + 1) * ww - 12; s += `<rect x="${x}" y="10" width="24" height="66" rx="3" class="v-black"/><text x="${x + 12}" y="68" class="v-tiny light">${n.replace('#', '♯')}</text>`; });
  s += `<text x="${1 + 2.5 * ww + 20}" y="140" class="v-small accent" text-anchor="middle">E–F: half step</text>`;
  s += `<text x="${W - 30}" y="140" class="v-small accent" text-anchor="middle">B–C</text>`;
  s += '</svg>';
  return s;
}

export function formulaSVG() {
  const steps = ['W', 'W', 'H', 'W', 'W', 'W', 'H'];
  const notes = ['G', 'A', 'B', 'C', 'D', 'E', 'F♯', 'G'];
  const frets = [3, 5, 7, 8, 10, 12, 14, 15];
  const sx = f => 14 + (f - 3) * 28;
  const W = sx(15) + 20;
  let s = `<svg viewBox="0 0 ${W} 92" width="${W}" height="92" class="formula-svg" role="img" aria-label="Major scale formula">`;
  s += `<line x1="6" x2="${W - 6}" y1="40" y2="40" class="v-string"/>`;
  frets.forEach((f, i) => {
    s += `<circle cx="${sx(f)}" cy="40" r="11" class="${i === 0 || i === 7 ? 'v-root' : 'v-dot'}"/><text x="${sx(f)}" y="44" class="v-dot-text">${notes[i]}</text>`;
    s += `<text x="${sx(f)}" y="66" class="v-tiny">${f}</text>`;
    if (i < 7) s += `<text x="${(sx(f) + sx(frets[i + 1])) / 2}" y="20" class="${steps[i] === 'H' ? 'v-small accent' : 'v-small'}">${steps[i]}</text>`;
  });
  s += `<text x="${W / 2}" y="86" class="v-tiny">G major on the low E string (numbers = frets) · W = 2 frets, H = 1 fret</text>`;
  s += '</svg>';
  return s;
}

export function diatonicFig(key = 'G') {
  const k = keyChords(key, 'major').diatonic;
  return h('div', { class: 'vis diatonic' },
    h('div', { class: 'dia-row' }, ...k.map(c => h('div', { class: `dia q-${c.type}` }, h('strong', {}, c.name), h('span', {}, c.roman)))),
    h('figcaption', {}, `Chords in ${key} major: Major · minor · minor · Major · Major · minor · diminished`));
}

export function formFig(parts = ['V', 'PC', 'C', 'V', 'PC', 'C', 'B', 'C']) {
  const names = { V: 'Verse', PC: 'Pre-chorus', C: 'Chorus', B: 'Bridge', I: 'Intro', O: 'Outro' };
  return h('div', { class: 'vis form' },
    h('div', { class: 'form-row' }, ...parts.map(p => h('span', { class: `form-block f-${p}` }, h('strong', {}, p), h('small', {}, names[p])))),
    h('figcaption', {}, 'A common song form. The chorus holds the hook; the bridge brings contrast, usually once.'));
}

export function bluesFig(key = 'A') {
  const I = key, IV = { A: 'D', E: 'A', G: 'C' }[key], V = { A: 'E', E: 'B', G: 'D' }[key];
  const bars = [I, I, I, I, IV, IV, I, I, V, IV, I, V];
  return h('div', { class: 'vis blues' },
    h('div', { class: 'blues-grid' }, ...bars.map((c, i) => h('span', { class: `bar ${c === I ? 'b-i' : c === IV ? 'b-iv' : 'b-v'}` }, h('small', {}, i + 1), h('strong', {}, c)))),
    h('figcaption', {}, `12-bar blues in ${key}: I = ${I}, IV = ${IV}, V = ${V}`));
}

export function walkFig() {
  const beats = [['1', 'Root', 'b-i'], ['2', 'Chord tone', 'b-iv'], ['3', 'Chord tone', 'b-iv'], ['4', 'Approach ↗', 'b-v']];
  return h('div', { class: 'vis blues' },
    h('div', { class: 'blues-grid four' }, ...beats.map(([n, l, c]) => h('span', { class: `bar ${c}` }, h('small', {}, `beat ${n}`), h('strong', {}, l)))),
    h('figcaption', {}, 'Walking bass recipe: land the root on beat 1, approach the next root on beat 4.'));
}

export function kickFig() {
  const kick = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0];
  return h('div', { class: 'vis kick' },
    h('div', { class: 'kick-row' }, h('small', {}, 'Kick'), ...kick.map(k => h('span', { class: k ? 'on k' : '' }))),
    h('div', { class: 'kick-row' }, h('small', {}, 'Bass'), ...kick.map(k => h('span', { class: k ? 'on b' : '' }))),
    h('figcaption', {}, 'Locking in: play your notes exactly where the kick drum hits.'));
}

export function bendSVG() {
  return `<svg viewBox="0 0 260 110" width="260" height="110" class="bend-svg" role="img" aria-label="String bend">
    ${[0, 1, 2, 3, 4, 5].map(i => `<line x1="20" x2="240" y1="${20 + i * 13}" y2="${20 + i * 13}" class="v-string"/>`).join('')}
    <rect x="62" y="40" width="18" height="12" class="v-bg"/><text x="71" y="50" class="v-tab">7</text>
    <path d="M82 46 Q 120 46 128 14" class="v-move"/><path d="M122 20 L128 12 L133 21" class="v-move"/>
    <text x="134" y="12" class="v-small accent">full</text>
    <rect x="182" y="40" width="18" height="12" class="v-bg"/><text x="191" y="50" class="v-tab">9</text>
    <text x="130" y="104" class="v-tiny">bend fret 7 until it sounds like fret 9 (G string)</text>
  </svg>`;
}

export function ampSVG() {
  const knobs = [['Gain', -110], ['Bass', 0], ['Mid', 0], ['Treble', 0], ['Volume', -60]];
  let s = `<svg viewBox="0 0 330 110" width="330" height="110" class="amp-svg" role="img" aria-label="Amp starting settings">`;
  s += `<rect x="4" y="10" width="322" height="80" rx="10" class="v-amp"/>`;
  knobs.forEach(([n, a], i) => {
    const x = 40 + i * 62, y = 46;
    s += `<circle cx="${x}" cy="${y}" r="17" class="v-knob big"/><line x1="${x}" y1="${y}" x2="${x + 14 * Math.sin(a * Math.PI / 180)}" y2="${y - 14 * Math.cos(a * Math.PI / 180)}" class="v-pointer"/>`;
    s += `<text x="${x}" y="82" class="v-tiny">${n}</text>`;
  });
  s += `<text x="165" y="106" class="v-tiny">start: gain low, EQ at 12 o'clock, then change one knob at a time</text></svg>`;
  return s;
}

export function stringsFig(inst = 'guitar') {
  const t = TUNINGS[inst];
  const mn = inst === 'guitar' ? 'Eddie Ate Dynamite, Good Bye Eddie' : 'Eat All Day, Gary';
  return h('div', { class: 'vis strings' },
    h('div', { class: 'string-row' }, ...t.labels.map((l, i) => h('span', { class: 'str', style: { '--w': `${(t.labels.length - i) * (inst === 'bass' ? 1.4 : 0.6) + 1}px` } }, h('strong', {}, l), h('i', {})))),
    h('figcaption', {}, `${t.name} strings, thickest → thinnest: ${t.labels.join(' ')} — "${mn}". Tighten a peg → pitch goes up.`));
}

export function intervalFig() {
  const list = [['P5', 7, 'Twinkle Twinkle'], ['P8', 12, 'Somewhere Over the Rainbow'], ['M3', 4, 'When the Saints'], ['m3', 3, 'Greensleeves'], ['P4', 5, 'Here Comes the Bride']];
  return h('div', { class: 'vis intervals' },
    h('div', { class: 'int-list' }, ...list.map(([n, st, ref]) => h('div', { class: 'int' }, h('strong', {}, n), h('span', { class: 'int-bar' }, h('i', { style: { width: `${(st / 12) * 100}%` } })), h('small', {}, `${st} frets · "${ref}"`)))),
    h('figcaption', {}, 'Interval = distance between two notes. On one string, each fret is one semitone.'));
}

// ── Spec → element ───────────────────────────────────────────────
export function renderVisual(v) {
  switch (v.t) {
    case 'chord': return fig(chordSVG(v.name), v.caption, 'chord');
    case 'chords': { const wrap = h('div', { class: 'vis-row' }); v.names.forEach(n => wrap.append(fig(chordSVG(n), null, 'chord'))); if (v.caption) wrap.append(h('figcaption', { class: 'full' }, v.caption)); return wrap; }
    case 'strum': return fig(strumSVG(v.pattern), v.caption || 'Arrows = strums. Faded arrows: keep the arm moving but miss the strings.');
    case 'rhythm': return fig(rhythmSVG(v.sub, v.hits), v.caption || 'Count out loud while you play.');
    case 'tab': return fig(tabSVG(v), v.caption || 'Tab: lines are strings (thinnest on top), numbers are frets.');
    case 'scale': return fig(scaleSVG(v), v.caption || 'Filled = root notes. Numbers show the scale degree.');
    case 'shape': return fig(shapeSVG(v.inst || 'bass', v.shape), v.caption);
    case 'parts': return fig(partsSVG(v.inst), v.caption || `Parts of the ${v.inst}`, 'wide');
    case 'strings': return stringsFig(v.inst);
    case 'hand': return fig(handSVG(), 'Chord diagrams use these finger numbers.');
    case 'pick': return fig(pickSVG(), 'Grip the pick between the thumb pad and the side of the index finger.');
    case 'rest': return fig(restStrokeSVG(), 'Rest stroke: pluck across the string, not up and away.');
    case 'palm': return fig(palmMuteSVG(), 'Palm muting gives the tight "chug" sound.');
    case 'keyboard': return fig(keyboardSVG(), '12 notes, then it repeats. No sharp between B–C and E–F.');
    case 'formula': return fig(formulaSVG(), 'Every major scale: W W H W W W H.');
    case 'diatonic': return diatonicFig(v.key);
    case 'form': return formFig(v.parts);
    case 'blues': return bluesFig(v.key);
    case 'walk': return walkFig();
    case 'kick': return kickFig();
    case 'bend': return fig(bendSVG(), 'Check your bend against the target note.');
    case 'amp': return fig(ampSVG(), 'A clean starting point for practice.');
    case 'interval': return intervalFig();
    default: return null;
  }
}

export function visualsBlock(specs = []) {
  if (!specs.length) return null;
  const wrap = h('div', { class: 'visuals' });
  for (const v of specs) { const el = renderVisual(v); if (el) wrap.append(el); }
  return wrap;
}
