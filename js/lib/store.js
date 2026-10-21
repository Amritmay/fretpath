// Persistent app state in localStorage, plus date helpers.

const KEY = 'fretpath:v1';

export const todayISO = (d = new Date()) => {
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
export const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return todayISO(d); };
export const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
// Weeks start on Monday.
export const weekStart = iso => { const d = parseISO(iso); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return todayISO(d); };
export const weekday = iso => parseISO(iso).getDay(); // 0 = Sunday

const defaults = () => ({
  version: 1,
  profile: null, // { name, start, days: [weekday numbers], minutes, anchor }
  progress: {
    guitar: { unit: 0, sessionsOnUnit: 0 },
    bass: { unit: 0, sessionsOnUnit: 0 },
    shared: { unit: 0, sessionsOnUnit: 0 },
  },
  songs: {},          // songId -> { status: 'learning' | 'learned', since, sessions }
  customSongs: [],    // { id, inst, title, artist, skill }
  sessions: [],       // { date, type, minutes, planned, focus: {guitar, bass}, mini? }
  review: {},         // itemId -> { kind: 'unit'|'song', track, interval, due }
  bpm: {},            // exerciseId -> [{ date, bpm }]
  changes: {},        // 'A–D' -> [{ date, count }]
  ear: {},            // mode -> { level, history: [0/1...] }
  ideas: [],          // song pad ideas
  journal: [],        // { date, target, broke, tomorrow, pain }
  badges: {},         // id -> date
  checks: {},         // 'phase:index' -> date
  recall: {},         // date -> { score, total }
  minutesBy: { guitar: 0, bass: 0 },
  lastFocus: null,
  pain: null,         // { date, level }
  run: null,          // active session runner state
  settings: { theme: 'auto', clickSound: 'click' },
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    return deepMerge(defaults(), parsed);
  } catch {
    return defaults();
  }
}

function deepMerge(base, extra) {
  for (const k of Object.keys(extra)) {
    const v = extra[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      base[k] = deepMerge(base[k], v);
    } else {
      base[k] = v;
    }
  }
  return base;
}

export const getState = () => state;

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  listeners.forEach(fn => fn(state));
}

export function update(fn) {
  fn(state);
  save();
}

export const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };

export function exportJSON() {
  return JSON.stringify({ app: 'fretpath', exported: new Date().toISOString(), state }, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  const incoming = data.state || data;
  if (!incoming || typeof incoming !== 'object' || !('progress' in incoming)) throw new Error('This file is not a FretPath backup.');
  state = deepMerge(defaults(), incoming);
  save();
}

export function resetAll() {
  state = defaults();
  save();
}
