// Turns the user's availability (days per week + minutes) into concrete sessions,
// keeping guitar and bass balanced by minutes actually practised.

import { getState, todayISO, addDays, daysBetween, weekday, weekStart } from './store.js';
import { UNITS, trackUnits, SONGS, WARMUPS, CREATE_PROMPTS, STUDIO_STEPS, unitById } from '../data/curriculum.js';

export const DUAL_THRESHOLD = 40; // minutes at which a session covers both instruments

// Ramp-up while fingertips toughen: weeks 1–4 cap 15 min, weeks 5–12 cap 25.
export function effectiveMinutes(state = getState(), date = todayISO()) {
  const p = state.profile;
  if (!p) return 15;
  const week = Math.floor(daysBetween(p.start, date) / 7);
  let m = p.minutes;
  if (week < 4) m = Math.min(m, 15);
  else if (week < 12) m = Math.min(m, 25);
  // Recent sharp pain → halve.
  if (state.pain && state.pain.level === 'sharp' && daysBetween(state.pain.date, date) <= 2) m = Math.max(5, Math.round(m / 2));
  return m;
}

export function rampInfo(state = getState(), date = todayISO()) {
  const p = state.profile;
  if (!p) return null;
  const week = Math.floor(daysBetween(p.start, date) / 7);
  if (week < 4 && p.minutes > 15) return { cap: 15, until: addDays(p.start, 28), reason: 'Callus phase' };
  if (week < 12 && p.minutes > 25) return { cap: 25, until: addDays(p.start, 84), reason: 'Building stamina' };
  return null;
}

export const isPracticeDay = (state, date) => !!state.profile && state.profile.days.includes(weekday(date));

const fullSessions = state => state.sessions.filter(s => !s.mini);

// Decide the focus of the next session.
// Returns 'guitar' | 'bass' | 'studio' | 'dual'
export function nextFocus(state = getState(), date = todayISO(), sim = null) {
  const sessions = sim?.sessions ?? fullSessions(state);
  const minutesBy = sim?.minutesBy ?? state.minutesBy;
  const lastFocus = sim?.lastFocus ?? state.lastFocus;
  const count = sessions.length;
  const sinceStudio = (() => {
    let n = 0;
    for (let i = sessions.length - 1; i >= 0; i--) { if (sessions[i].type === 'studio') return n; n++; }
    return n;
  })();
  const pastCallusPhase = state.profile && daysBetween(state.profile.start, date) >= 28;
  if (count >= 8 && sinceStudio >= 4 && pastCallusPhase) return 'studio';
  if (effectiveMinutes(state, date) >= DUAL_THRESHOLD) return 'dual';
  const g = minutesBy.guitar || 0, b = minutesBy.bass || 0;
  if (Math.abs(g - b) >= 5) return g < b ? 'guitar' : 'bass';
  if (lastFocus === 'guitar') return 'bass';
  if (lastFocus === 'bass') return 'guitar';
  return 'guitar';
}

// Simulate the next 7 days for the week strip.
export function weekPreview(state = getState(), from = todayISO()) {
  const start = weekStart(from);
  const sim = {
    sessions: [...fullSessions(state)],
    minutesBy: { ...state.minutesBy },
    lastFocus: state.lastFocus,
  };
  const out = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    const done = state.sessions.filter(s => s.date === date);
    if (date < from) { out.push({ date, past: true, done, planned: isPracticeDay(state, date) && date >= state.profile.start }); continue; }
    if (date === from && done.some(s => !s.mini)) { out.push({ date, done, planned: isPracticeDay(state, date) }); continue; }
    if (!isPracticeDay(state, date)) { out.push({ date, rest: true, done }); continue; }
    const focus = nextFocus(state, date, sim);
    const m = effectiveMinutes(state, date);
    sim.sessions.push({ type: focus });
    if (focus === 'guitar' || focus === 'bass') sim.minutesBy[focus] += m;
    if (focus === 'dual' || focus === 'studio') { sim.minutesBy.guitar += m / 2; sim.minutesBy.bass += m / 2; }
    if (focus === 'guitar' || focus === 'bass') sim.lastFocus = focus;
    out.push({ date, focus, minutes: m, done });
  }
  return out;
}

// ── Curriculum helpers ──────────────────────────────────────────
export const currentUnit = (state, track) => {
  const list = trackUnits(track);
  return list[Math.min(state.progress[track].unit, list.length - 1)];
};
export const trackDone = (state, track) => state.progress[track].unit >= trackUnits(track).length;

export function currentPhase(state = getState()) {
  const phases = ['guitar', 'bass', 'shared'].map(t => currentUnit(state, t).phase);
  return Math.min(...phases);
}

export const allSongs = state => [...SONGS, ...state.customSongs.map(s => ({ ...s, custom: true, after: null }))];

export function unitDoneIds(state) {
  const done = new Set();
  for (const t of ['guitar', 'bass', 'shared']) {
    trackUnits(t).slice(0, state.progress[t].unit).forEach(u => done.add(u.id));
  }
  return done;
}

export function currentSong(state, inst) {
  const done = unitDoneIds(state);
  const songs = allSongs(state).filter(s => s.inst === inst);
  // Songs the user picked explicitly come first.
  const learning = songs.find(s => state.songs[s.id]?.status === 'learning');
  if (learning) return learning;
  return songs.find(s => !state.songs[s.id] && (!s.after || done.has(s.after))) || null;
}

export function dueReview(state, track, date = todayISO()) {
  return Object.entries(state.review)
    .filter(([, r]) => r.track === track && r.due <= date)
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .map(([id, r]) => ({ id, ...r }))[0] || null;
}

// ── Session builder ─────────────────────────────────────────────
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];
const seedOf = date => date.split('-').reduce((a, n) => a * 31 + Number(n), 7);

function split(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map(w => (w / sum) * total);
  const out = raw.map(r => Math.max(1, Math.round(r)));
  let diff = total - out.reduce((a, b) => a + b, 0);
  for (let i = 0; diff !== 0 && i < 50; i++) {
    const j = out.indexOf(Math.max(...out));
    out[j] += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
  }
  return out;
}

function techniqueBlocks(state, inst, minutes, date) {
  const unit = currentUnit(state, inst);
  const review = dueReview(state, inst, date);
  const reviewUnit = review?.kind === 'unit' ? unitById[review.id] : null;
  const blocks = [];
  if (reviewUnit && minutes >= 6) {
    const [a, b] = split(minutes, [7, 3]);
    blocks.push(unitBlock(unit, inst, a));
    blocks.push({ ...unitBlock(reviewUnit, inst, b), kind: 'review', reviewId: reviewUnit.id });
  } else {
    blocks.push(unitBlock(unit, inst, minutes));
  }
  return blocks;
}

function unitBlock(unit, inst, minutes) {
  return {
    kind: 'technique', track: inst, unitId: unit.id, minutes,
    title: unit.title, goal: unit.goal, steps: unit.steps, tool: unit.tool, learn: unit.learn, bpm: unit.bpm,
  };
}

function songBlock(state, inst, minutes, date) {
  const review = dueReview(state, inst, date);
  const reviewSong = review?.kind === 'song' ? allSongs(state).find(s => s.id === review.id) : null;
  const song = currentSong(state, inst);
  if (reviewSong && (!song || seedOf(date) % 2 === 0)) {
    return { kind: 'song', track: inst, songId: reviewSong.id, review: true, minutes,
      title: `Review: ${reviewSong.title}`, goal: 'Play it start-to-finish along with the recording.',
      steps: ['Play along once without stopping — even if you miss bits.', 'Fix the one spot that broke, slowly.', 'Play along again.'] };
  }
  if (!song) {
    const unit = currentUnit(state, inst);
    if (unit.phase === 0) {
      return { kind: 'apply', track: inst, minutes,
        title: 'Play along: open strings with a drum groove', goal: 'Your first music! Keep a steady pulse with the drums — no fretting needed yet.',
        steps: inst === 'bass'
          ? ['Start the Rock groove at 70 BPM.', 'Pluck the open E string on every beat, alternating index–middle.', 'Switch to the open A string every 4 beats. Listen to the kick drum.']
          : ['Start the Rock groove at 70 BPM.', 'Strum all six open strings, one down-strum per beat.', 'Then pick only the low E string on every beat, then A, then D.'],
        tool: { id: 'drums', opts: { groove: 'rock', bpm: 70 } } };
    }
    return { kind: 'apply', track: inst, unitId: unit.id, minutes,
      title: `Apply it: ${unit.title}`, goal: 'Use today\'s skill musically — loop it, vary it, play it with a groove.',
      steps: ['Play the exercise with the drum groove instead of the click.', 'Make it musical: change the rhythm or dynamics.', 'Play it 3 times in a row with no mistakes.'],
      tool: { id: 'drums', opts: { groove: 'rock', bpm: 75 } } };
  }
  return { kind: 'song', track: inst, songId: song.id, minutes,
    title: song.title, artist: song.artist, goal: song.skill, note: song.note,
    steps: ['Listen to the original once, focusing on your part.', 'Loop the hardest bar slowly with the metronome.', 'Play along with the recording (slow it down if you need to).'] };
}

function sharedBlock(state, minutes) {
  const unit = currentUnit(state, 'shared');
  return { kind: 'shared', track: 'shared', unitId: unit.id, minutes,
    title: unit.title, goal: unit.goal, steps: unit.steps, tool: unit.tool, learn: unit.learn };
}

function warmBlock(inst, minutes) {
  const steps = inst === 'dual' ? [WARMUPS.guitar[0], WARMUPS.guitar[1], WARMUPS.bass[1]] : WARMUPS[inst];
  return { kind: 'warmup', track: inst === 'dual' ? 'shared' : inst, minutes, title: 'Warm-up', goal: 'Loosen up. Light pressure, relaxed hands.', steps };
}

function createBlock(minutes, date) {
  return { kind: 'create', track: 'shared', minutes, title: 'Create', goal: 'Make something of your own — tiny is fine.', steps: [pick(CREATE_PROMPTS, seedOf(date))], tool: { id: 'songpad', opts: {} } };
}

const logBlock = () => ({ kind: 'log', track: 'shared', minutes: 1, title: 'Log & reflect', goal: 'Lock in what you learned.', steps: [] });
const breakBlock = m => ({ kind: 'break', track: 'shared', minutes: m, title: 'Short break', goal: 'Rest your hands. Your brain keeps learning during breaks.', steps: ['Put the instrument down, shake out your hands, drink some water.'] });

export function buildSession(state = getState(), date = todayISO(), focusOverride = null) {
  const focus = focusOverride || nextFocus(state, date);
  const M = effectiveMinutes(state, date);
  const week = Math.floor(daysBetween(state.profile.start, date) / 7);
  const withCreate = week >= 2 || M >= 20;
  const body = M - 1; // log takes 1
  let blocks = [];

  if (focus === 'guitar' || focus === 'bass') {
    const w = withCreate ? [12, 32, 32, 14, 10] : [14, 38, 34, 14];
    const [wu, tech, song, shared, create] = split(body, w);
    blocks = [warmBlock(focus, wu), ...techniqueBlocks(state, focus, tech, date), songBlock(state, focus, song, date), sharedBlock(state, shared)];
    if (withCreate) blocks.push(createBlock(create, date));
  } else if (focus === 'dual') {
    const brk = 3;
    const [wu, gT, gS, bT, bS, shared, create] = split(body - brk, [5, 13, 12, 13, 12, 9, 6]);
    const flip = (state.sessions.filter(s => s.type === 'dual').length % 2) === 1;
    const g = [...techniqueBlocks(state, 'guitar', gT, date), songBlock(state, 'guitar', gS, date)];
    const b = [...techniqueBlocks(state, 'bass', bT, date), songBlock(state, 'bass', bS, date)];
    blocks = [warmBlock('dual', wu), ...(flip ? b : g), breakBlock(brk), ...(flip ? g : b), sharedBlock(state, shared), createBlock(create, date)];
  } else if (focus === 'studio') {
    const [wu, prog, gt, bs, mel] = split(body, [10, 22, 22, 26, 20]);
    blocks = [
      warmBlock('dual', wu),
      { kind: 'studio', track: 'shared', minutes: prog, ...STUDIO_STEPS.progression },
      { kind: 'studio', track: 'guitar', minutes: gt, ...STUDIO_STEPS.guitar },
      { kind: 'studio', track: 'bass', minutes: bs, ...STUDIO_STEPS.bass },
      { kind: 'studio', track: 'shared', minutes: mel, ...STUDIO_STEPS.melody },
    ];
  }
  blocks.push(logBlock());
  return { date, focus, minutes: M, blocks };
}

export function buildMini(state = getState(), date = todayISO()) {
  const focus = nextFocus(state, date);
  const inst = focus === 'bass' ? 'bass' : 'guitar';
  const unit = currentUnit(state, inst);
  return {
    date, focus: inst, minutes: 2, mini: true,
    blocks: [
      { kind: 'technique', track: inst, unitId: unit.id, minutes: 2, title: `2-minute version: ${unit.title}`, goal: 'Just pick it up. Two minutes keeps the habit alive.', steps: unit.steps.slice(0, 2), tool: unit.tool },
      logBlock(),
    ],
  };
}

// How the user's availability maps to a balanced plan (for onboarding & settings).
export function describePlan(days, minutes) {
  const dual = minutes >= DUAL_THRESHOLD;
  const perWeek = days;
  const lines = [];
  if (dual) {
    lines.push(`Every session covers both instruments (${Math.round(minutes * 0.4)} min guitar + ${Math.round(minutes * 0.4)} min bass + shared skills), once you're past the ramp-up weeks.`);
  } else {
    lines.push(`Each session focuses on one instrument. The app always picks whichever has had fewer minutes, so over two weeks you get ~${perWeek} guitar and ~${perWeek} bass sessions.`);
  }
  lines.push('From week 5, about every 5th session is a Studio Day: write a progression, record guitar, add a bass line, hum a melody.');
  lines.push('Ear training, fretboard and theory appear in every session and count for both instruments.');
  return lines;
}

// Unit list for reference elsewhere.
export { UNITS };
