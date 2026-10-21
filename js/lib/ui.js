// Tiny DOM helpers, icons, sheets, toasts and celebration effects.

import { getState } from './store.js';

export const THEMES = [
  { id: 'auto', name: 'Calm (auto)', desc: 'Follows your device', sw: ['#f7f7f5', '#18191b', '#2f6fde', '#6d9df2'] },
  { id: 'light', name: 'Calm light', desc: 'Quiet off-white', sw: ['#f7f7f5', '#ffffff', '#2f6fde', '#1f2328'] },
  { id: 'dark', name: 'Calm dark', desc: 'Soft charcoal', sw: ['#18191b', '#202124', '#6d9df2', '#ececea'] },
  { id: 'playful', name: 'Playful', desc: 'Bright & game-like', sw: ['#ffffff', '#58cc02', '#1cb0f6', '#ff9600'] },
  { id: 'midnight', name: 'Midnight neon', desc: 'Stage lights', sw: ['#0b0e1a', '#22d3ee', '#f472b6', '#a78bfa'] },
  { id: 'vintage', name: 'Vintage amp', desc: 'Cream & brown', sw: ['#f3ead7', '#3a2a1e', '#b5452a', '#c98a1b'] },
];

export function applyTheme() {
  const t = getState().settings.theme || 'auto';
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  const bg = { light: '#f7f7f5', dark: '#18191b', playful: '#ffffff', midnight: '#0b0e1a', vintage: '#f3ead7' }[t]
    || (matchMedia('(prefers-color-scheme: dark)').matches ? '#18191b' : '#f7f7f5');
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', bg);
}

// Let views pass `cond ? node : null` straight to el.append() without
// rendering the text "null" (native append stringifies null/false).
for (const proto of [Element.prototype, DocumentFragment.prototype]) {
  const native = proto.append;
  proto.append = function (...nodes) { return native.apply(this, nodes.flat().filter(n => n != null && n !== false)); };
}

export function h(tag, props = {}, ...children) {
  const el = tag === 'svg' || props?.svg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false || k === 'svg') continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.setAttribute('class', v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && !(el instanceof SVGElement) && k !== 'list') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export const clear = el => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

const P = {
  today: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  path: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  tools: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  progress: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  play: '<path d="M7 4v16l13-8z" fill="currentColor"/>',
  pause: '<path d="M7 4h4v16H7zM14 4h4v16h-4z" fill="currentColor"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="m15 6-6 6 6 6"/>',
  replay: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  metronome: '<path d="M9 3h6l4 18H5z"/><path d="m12 15 5-9"/>',
  tuner: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 18 4-6"/>',
  fretboard: '<rect x="2" y="7" width="20" height="10" rx="1"/><path d="M7 7v10M12 7v10M17 7v10M2 10h20M2 14h20"/>',
  ear: '<path d="M6 8.5a6 6 0 1 1 12 0c0 3.5-3 4.5-3 7.5a3 3 0 0 1-5.6 1.5"/><path d="M9 9a3 3 0 0 1 6 0c0 1.5-1.5 2-1.5 3.5"/>',
  drums: '<ellipse cx="12" cy="9" rx="8" ry="3"/><path d="M4 9v6c0 1.7 3.6 3 8 3s8-1.3 8-3V9"/><path d="m17 3-4 6M7 3l4 6"/>',
  changes: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/>',
  songpad: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4M10 2h4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  download: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>',
  upload: '<path d="M12 20V8M6 14l6-6 6 6M4 4h16"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-1 .2"/><path d="M20 4v14h-7"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/>',
};

export function icon(name, size = 20, cls = '') {
  const span = document.createElement('span');
  span.className = `icon ${cls}`;
  span.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
  return span;
}

export const TRACK_META = {
  guitar: { label: 'Guitar', emoji: '🎸', cls: 't-guitar' },
  bass: { label: 'Bass', emoji: '🎵', cls: 't-bass' },
  shared: { label: 'Ears & Theory', emoji: '👂', cls: 't-shared' },
  studio: { label: 'Studio Day', emoji: '🎛️', cls: 't-studio' },
  dual: { label: 'Guitar + Bass', emoji: '🎸🎵', cls: 't-dual' },
};

export function chip(track, text) {
  const m = TRACK_META[track] || TRACK_META.shared;
  return h('span', { class: `chip ${m.cls}` }, text ?? `${m.emoji} ${m.label}`);
}

// ── Bottom sheet / modal ────────────────────────────────────────
export function sheet(title, content, { onClose, wide = false } = {}) {
  const root = document.getElementById('overlay');
  let cleanup = null;
  const close = () => {
    wrap.classList.add('closing');
    setTimeout(() => { wrap.remove(); cleanup?.(); onClose?.(); }, 180);
    document.removeEventListener('keydown', esc);
  };
  const esc = e => { if (e.key === 'Escape') close(); };
  const body = h('div', { class: 'sheet-body' });
  const wrap = h('div', { class: 'sheet-wrap', onclick: e => { if (e.target === wrap) close(); } },
    h('div', { class: `sheet ${wide ? 'wide' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'sheet-head' },
        h('h2', {}, title),
        h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: close }, icon('x'))),
      body));
  root.append(wrap);
  document.addEventListener('keydown', esc);
  const res = typeof content === 'function' ? content(body, close) : (body.append(content), null);
  if (typeof res === 'function') cleanup = res;
  return close;
}

export function toast(msg, ms = 2600) {
  const t = h('div', { class: 'toast', role: 'status' }, msg);
  document.getElementById('overlay').append(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms);
}

export function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['var(--guitar)', 'var(--bass)', 'var(--shared)', 'var(--accent)'];
  const layer = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  for (let i = 0; i < 60; i++) {
    layer.append(h('i', { style: {
      left: Math.random() * 100 + '%',
      background: colors[i % colors.length],
      animationDelay: Math.random() * 0.4 + 's',
      animationDuration: 1.6 + Math.random() * 1.2 + 's',
      transform: `rotate(${Math.random() * 360}deg)`,
    } }));
  }
  document.getElementById('overlay').append(layer);
  setTimeout(() => layer.remove(), 3200);
}

export function ring(value, max, { size = 56, stroke = 6, cls = '' } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max ? Math.min(1, value / max) : 0;
  const wrap = h('div', { class: `ring ${cls}`, style: { width: size + 'px', height: size + 'px' } });
  wrap.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 ${size / 2} ${size / 2})" style="transition: stroke-dashoffset .6s ease"/>
  </svg>`;
  return wrap;
}

export function sparkline(values, { w = 120, hgt = 32 } = {}) {
  const el = h('span', { class: 'spark' });
  if (values.length < 2) { el.textContent = ''; return el; }
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * (w - 4) + 2},${hgt - 2 - ((v - min) / span) * (hgt - 4)}`).join(' ');
  const last = pts.split(' ').pop().split(',');
  el.innerHTML = `<svg width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${last[0]}" cy="${last[1]}" r="3" fill="currentColor"/></svg>`;
  return el;
}

export const fmtDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function segmented(options, value, onChange, { cls = '' } = {}) {
  const wrap = h('div', { class: `seg ${cls}`, role: 'radiogroup' });
  const render = v => {
    clear(wrap);
    for (const o of options) {
      const [val, label] = Array.isArray(o) ? o : [o, o];
      wrap.append(h('button', { class: `seg-btn ${val === v ? 'on' : ''}`, role: 'radio', 'aria-checked': String(val === v),
        onclick: () => { render(val); onChange(val); } }, label));
    }
  };
  render(value);
  return wrap;
}
