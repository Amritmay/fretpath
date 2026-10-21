// State transitions: finishing sessions, advancing units, songs, spaced review, badges.

import { update, getState, todayISO, addDays, weekStart, daysBetween, parseISO } from './store.js';
import { trackUnits, unitById, PHASES } from '../data/curriculum.js';
import { allSongs, isPracticeDay } from './scheduler.js';

const INTERVALS = [1, 3, 7, 14, 30, 60];

export function scheduleReview(s, id, kind, track, rating = 'solid') {
  const cur = s.review[id];
  const idx = cur ? INTERVALS.indexOf(cur.interval) : -1;
  let nextIdx;
  if (rating === 'lost') nextIdx = 0;
  else if (rating === 'shaky') nextIdx = Math.max(0, idx);
  else nextIdx = Math.min(INTERVALS.length - 1, idx + 1);
  const interval = INTERVALS[nextIdx];
  s.review[id] = { kind, track, interval, due: addDays(todayISO(), interval) };
}

export function rateReview(id, rating) {
  update(s => {
    const r = s.review[id];
    if (r) scheduleReview(s, id, r.kind, r.track, rating);
  });
}

// Rating of the main technique task: 'nailed' | 'getting' | 'struggled'
// Returns true if the unit is ready to advance.
export function recordUnitAttempt(track, unitId, rating) {
  let ready = false;
  update(s => {
    const list = trackUnits(track);
    const cur = list[s.progress[track].unit];
    if (!cur || cur.id !== unitId) return;
    s.progress[track].sessionsOnUnit += 1;
    s.progress[track].lastRating = rating;
    ready = rating === 'nailed' && s.progress[track].sessionsOnUnit >= cur.min;
  });
  return ready;
}

export function advanceUnit(track) {
  update(s => {
    const list = trackUnits(track);
    const cur = list[s.progress[track].unit];
    if (!cur) return;
    scheduleReview(s, cur.id, 'unit', track, 'solid');
    s.progress[track].unit = Math.min(list.length, s.progress[track].unit + 1);
    s.progress[track].sessionsOnUnit = 0;
    s.progress[track].lastRating = null;
    const next = list[s.progress[track].unit];
    if (next && next.phase > cur.phase) award(s, `phase-${track}-${cur.phase}`);
  });
}

export function jumpToUnit(track, unitId) {
  update(s => {
    const list = trackUnits(track);
    const idx = list.findIndex(u => u.id === unitId);
    if (idx < 0) return;
    // Units skipped over get queued for light review so they still come back.
    for (let i = s.progress[track].unit; i < idx; i++) {
      if (!s.review[list[i].id]) scheduleReview(s, list[i].id, 'unit', track, 'solid');
    }
    s.progress[track].unit = idx;
    s.progress[track].sessionsOnUnit = 0;
  });
}

export function setSongStatus(songId, status) {
  update(s => {
    const song = allSongs(s).find(x => x.id === songId);
    if (!song) return;
    if (status === null) { delete s.songs[songId]; delete s.review[songId]; return; }
    const prev = s.songs[songId];
    s.songs[songId] = { status, since: todayISO(), sessions: prev?.sessions || 0 };
    if (status === 'learning') {
      // Only one song in progress per instrument.
      for (const other of allSongs(s)) {
        if (other.inst === song.inst && other.id !== songId && s.songs[other.id]?.status === 'learning') delete s.songs[other.id];
      }
    }
    if (status === 'learned') {
      scheduleReview(s, songId, 'song', song.inst, 'solid');
      const learned = allSongs(s).filter(x => s.songs[x.id]?.status === 'learned');
      award(s, `song-${song.inst}`);
      if (learned.length >= 5) award(s, 'songs-5');
      if (learned.length >= 15) award(s, 'songs-15');
    }
  });
}

export function addCustomSong({ inst, title, artist }) {
  const id = 'c' + Date.now().toString(36);
  update(s => {
    s.customSongs.push({ id, inst, title, artist: artist || '', skill: 'Your pick' });
  });
  return id;
}

export function removeCustomSong(id) {
  update(s => {
    s.customSongs = s.customSongs.filter(c => c.id !== id);
    delete s.songs[id];
    delete s.review[id];
  });
}

export function logBpm(exerciseId, bpm) {
  update(s => {
    (s.bpm[exerciseId] ||= []).push({ date: todayISO(), bpm: Number(bpm) });
    const best = Math.max(...s.bpm[exerciseId].map(e => e.bpm));
    if (s.bpm[exerciseId].length >= 2 && Number(bpm) >= best) award(s, 'tempo-record');
  });
}

export function logChanges(pair, count) {
  update(s => {
    (s.changes[pair] ||= []).push({ date: todayISO(), count });
    if (count >= 30) award(s, 'changes-30');
    if (count >= 60) award(s, 'changes-60');
  });
}

export function logEar(mode, correct, level) {
  let leveledUp = false;
  update(s => {
    const e = (s.ear[mode] ||= { level: 1, history: [], total: 0, correct: 0 });
    e.history.push(correct ? 1 : 0);
    if (e.history.length > 20) e.history.shift();
    e.total += 1;
    if (correct) e.correct += 1;
    const acc = e.history.reduce((a, b) => a + b, 0) / e.history.length;
    if (e.history.length >= 20 && acc >= 0.8 && e.level < level.max) {
      e.level += 1;
      e.history = [];
      leveledUp = true;
      award(s, 'ear-level');
    }
  });
  return leveledUp;
}

export function setEarLevel(mode, level) {
  update(s => {
    const e = (s.ear[mode] ||= { level: 1, history: [], total: 0, correct: 0 });
    e.level = level;
    e.history = [];
  });
}

export function saveIdea(idea) {
  update(s => {
    const i = s.ideas.findIndex(x => x.id === idea.id);
    if (i >= 0) s.ideas[i] = idea; else s.ideas.unshift(idea);
    award(s, 'first-idea');
    if (s.ideas.length >= 10) award(s, 'ideas-10');
  });
}

export function deleteIdea(id) {
  update(s => { s.ideas = s.ideas.filter(x => x.id !== id); });
}

export function toggleCheck(phase, idx) {
  update(s => {
    const k = `${phase}:${idx}`;
    if (s.checks[k]) delete s.checks[k]; else s.checks[k] = todayISO();
  });
}

// Finish a session (full or mini). Returns newly earned badge ids.
export function completeSession(plan, { minutesDone, journal }) {
  let earned = [];
  update(s => {
    const before = new Set(Object.keys(s.badges));
    const date = todayISO();
    const focusMinutes = { guitar: 0, bass: 0 };
    for (const b of plan.blocks) {
      if (b.track === 'guitar' || b.track === 'bass') focusMinutes[b.track] += b.minutes;
      else if (b.kind !== 'log' && b.kind !== 'break') {
        if (plan.focus === 'guitar' || plan.focus === 'bass') focusMinutes[plan.focus] += b.minutes;
        else { focusMinutes.guitar += b.minutes / 2; focusMinutes.bass += b.minutes / 2; }
      }
    }
    const scale = plan.minutes ? Math.min(1, minutesDone / plan.minutes) : 1;
    s.minutesBy.guitar += Math.round(focusMinutes.guitar * scale);
    s.minutesBy.bass += Math.round(focusMinutes.bass * scale);
    const items = [...new Set(plan.blocks.flatMap(b => [b.unitId, b.songId, b.reviewId]).filter(Boolean))];
    s.sessions.push({ date, type: plan.focus, minutes: Math.round(minutesDone), planned: plan.minutes, mini: !!plan.mini, items });
    if (plan.focus === 'guitar' || plan.focus === 'bass') s.lastFocus = plan.focus;
    if (journal) {
      s.journal.unshift({ date, ...journal });
      if (journal.pain) s.pain = { date, level: journal.pain };
    }
    // Song sessions counter
    for (const b of plan.blocks) if (b.songId && s.songs[b.songId]) s.songs[b.songId].sessions += 1;

    // Badges
    const full = s.sessions.filter(x => !x.mini);
    award(s, 'first-session');
    if (full.length >= 10) award(s, 'sessions-10');
    if (full.length >= 14) award(s, 'calluses');
    if (full.length >= 50) award(s, 'sessions-50');
    if (full.length >= 100) award(s, 'sessions-100');
    if (plan.focus === 'studio') award(s, 'studio');
    if (plan.mini) award(s, 'mini');
    const weeks = weeksKept(s);
    if (weeks.current >= 1) award(s, 'week-1');
    if (weeks.current >= 4) award(s, 'week-4');
    if (weeks.current >= 12) award(s, 'week-12');
    s.run = null;
    earned = Object.keys(s.badges).filter(k => !before.has(k));
  });
  return earned;
}

// Result of the recall warm-up game. Missed skills come back for review tomorrow.
export function recordRecall(date, score, total, missedUnitIds) {
  let earned = [];
  update(s => {
    const before = new Set(Object.keys(s.badges));
    s.recall[date] = { score, total };
    for (const id of missedUnitIds) {
      const u = unitById[id];
      if (!u) continue;
      if (s.review[id]) scheduleReview(s, id, 'unit', u.track, 'lost');
      else s.review[id] = { kind: 'unit', track: u.track, interval: 1, due: addDays(todayISO(), 1) };
    }
    award(s, 'recall-first');
    if (score === total) award(s, 'recall-perfect');
    if (Object.keys(s.recall).length >= 7) award(s, 'recall-7');
    earned = Object.keys(s.badges).filter(k => !before.has(k));
  });
  return earned;
}

function award(s, id) { if (!s.badges[id]) s.badges[id] = todayISO(); }

// Consistency: a week is "kept" if you practised on (target − 1) days or more.
// One day of slack every week is built in, so a single miss never breaks the chain.
// Planned practice days in a given week, counting only days on/after the start date.
function plannedInWeek(s, ws) {
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(ws, i);
    if (d >= s.profile.start && s.profile.days.includes(parseISO(d).getDay())) n++;
  }
  return n;
}

export function weekStats(s = getState(), date = todayISO()) {
  const ws = weekStart(date);
  const days = new Set(s.sessions.filter(x => x.date >= ws && x.date <= addDays(ws, 6)).map(x => x.date));
  const target = s.profile ? plannedInWeek(s, ws) : 5;
  return { practiced: days.size, target, needed: Math.max(1, target - 1) };
}

export function weeksKept(s = getState()) {
  if (!s.profile) return { current: 0, best: 0, total: 0 };
  const today = todayISO();
  const byWeek = {};
  for (const x of s.sessions) {
    const w = weekStart(x.date);
    (byWeek[w] ||= new Set()).add(x.date);
  }
  let current = 0, best = 0, run = 0, total = 0;
  let w = weekStart(s.profile.start);
  const thisWeek = weekStart(today);
  while (w <= thisWeek) {
    const n = byWeek[w]?.size || 0;
    const kept = n >= Math.max(1, plannedInWeek(s, w) - 1);
    if (kept) { run++; total++; best = Math.max(best, run); }
    else if (w !== thisWeek) run = 0; // the current week is still in progress
    w = addDays(w, 7);
  }
  current = run;
  return { current, best, total };
}

export function missedYesterday(s = getState()) {
  const y = addDays(todayISO(), -1);
  return isPracticeDay(s, y) && !s.sessions.some(x => x.date === y) && daysBetween(s.profile.start, y) >= 0;
}

export const BADGES = {
  'first-session': { icon: '🎉', name: 'First session', desc: 'You started. That\'s the hardest part.' },
  'week-1': { icon: '📅', name: 'Week kept', desc: 'Hit your weekly goal.' },
  'week-4': { icon: '🔥', name: 'Four weeks', desc: '4 weeks in a row kept.' },
  'week-12': { icon: '🏔️', name: 'Habit formed', desc: '12 weeks kept — this is who you are now.' },
  'sessions-10': { icon: '🔟', name: '10 sessions', desc: 'Ten sessions done.' },
  'calluses': { icon: '🖐️', name: 'Calluses', desc: '14 sessions — fingertips are toughening up.' },
  'sessions-50': { icon: '⭐', name: '50 sessions', desc: 'Fifty sessions of steady work.' },
  'sessions-100': { icon: '💯', name: '100 sessions', desc: 'A hundred sessions. Serious musician.' },
  'song-guitar': { icon: '🎸', name: 'First guitar song', desc: 'Played a full song on guitar.' },
  'song-bass': { icon: '🎵', name: 'First bass song', desc: 'Played a full song on bass.' },
  'songs-5': { icon: '📻', name: 'Setlist', desc: '5 songs learned.' },
  'songs-15': { icon: '🎤', name: 'Gig-ready', desc: '15 songs learned.' },
  'changes-30': { icon: '⚡', name: '30 changes', desc: '30 clean chord changes in a minute.' },
  'changes-60': { icon: '🚀', name: '60 changes', desc: 'One clean change per second!' },
  'tempo-record': { icon: '📈', name: 'Tempo record', desc: 'Beat your best clean BPM.' },
  'ear-level': { icon: '👂', name: 'Ear level-up', desc: 'Reached 80% on an ear-training level.' },
  'first-idea': { icon: '💡', name: 'First idea', desc: 'Saved your first song idea.' },
  'ideas-10': { icon: '📓', name: 'Songbook', desc: '10 song ideas saved.' },
  'studio': { icon: '🎛️', name: 'Studio day', desc: 'Wrote and recorded with both instruments.' },
  'mini': { icon: '🌱', name: 'Never miss twice', desc: 'Did a 2-minute session to keep the habit.' },
  'recall-first': { icon: '🧠', name: 'Warm memory', desc: 'Played your first recall warm-up.' },
  'recall-perfect': { icon: '🎯', name: 'Perfect recall', desc: 'Got every recall question right.' },
  'recall-7': { icon: '🗓️', name: 'Memory habit', desc: '7 recall warm-ups played.' },
  ...Object.fromEntries(['guitar', 'bass', 'shared'].flatMap(t => PHASES.map(p => [`phase-${t}-${p.n}`, {
    icon: t === 'guitar' ? '🎸' : t === 'bass' ? '🎵' : '👂',
    name: `${t === 'shared' ? 'Ears & theory' : t[0].toUpperCase() + t.slice(1)}: ${p.name}`,
    desc: `Finished phase ${p.n} (${p.name}).`,
  }]))),
};

export { unitById };
