// "Recall warm-up": a 5-question mini game on what you practised last session,
// played before today's session. Wrong answers bring that skill back for review sooner.

import { h, icon, clear, confetti } from '../lib/ui.js';
import { getState, todayISO, addDays } from '../lib/store.js';
import { pluck, strum, audio } from '../lib/audio.js';
import { voiceChord, INTERVALS, TUNINGS, noteName, NOTES } from '../lib/music.js';
import { unitById, trackUnits, SONGS } from '../data/curriculum.js';
import { QUIZ, VISUALS } from '../data/extras.js';
import { CHORD_SHAPES, chordSVG, visualsBlock } from '../lib/visuals.js';
import { allSongs, buildSession, isPracticeDay, unitDoneIds } from '../lib/scheduler.js';
import { recordRecall } from '../lib/actions.js';
import { startSession } from './session.js';

const QUESTIONS = 5;
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pickN = (a, n) => shuffle(a).slice(0, n);

export function lastSessionBefore(s, date) {
  return [...s.sessions].reverse().find(x => x.date < date) || null;
}

export function recallAvailable(s = getState(), date = todayISO()) {
  return !!lastSessionBefore(s, date);
}

// Which units/songs did the last session cover?
function recentItems(s, date) {
  const last = lastSessionBefore(s, date);
  let units = [], songs = [];
  if (last?.items) {
    units = last.items.filter(i => unitById[i]);
    songs = last.items.filter(i => !unitById[i]);
  } else {
    // Older sessions didn't store items: use the current and previous unit of each track.
    for (const t of ['guitar', 'bass', 'shared']) {
      const list = trackUnits(t);
      const i = s.progress[t].unit;
      [list[i], list[i - 1]].filter(Boolean).forEach(u => units.push(u.id));
    }
  }
  return { last, units: [...new Set(units)], songs: [...new Set(songs)] };
}

const CHORD_NAMES = Object.keys(CHORD_SHAPES);
const chordsInVisuals = id => (VISUALS[id] || []).flatMap(v => v.t === 'chord' ? [v.name] : v.t === 'chords' ? v.names : []);

function questionsForUnit(s, id) {
  const u = unitById[id];
  if (!u) return [];
  const out = [];
  for (const [q, a, ...wrong] of QUIZ[id] || []) {
    out.push({ kind: 'mcq', unitId: id, prompt: q, answer: a, options: shuffle([a, ...wrong]), explain: u.goal });
  }
  // Chord-diagram recognition
  const chords = chordsInVisuals(id);
  if (chords.length) {
    const learnedChords = [...unitDoneIds(s)].flatMap(chordsInVisuals);
    const name = chords[Math.floor(Math.random() * chords.length)];
    const pool = [...new Set([...learnedChords, ...CHORD_NAMES])].filter(n => n !== name);
    const opts = shuffle([name, ...pickN(pool.filter(n => !n.includes('barre') || name.includes('barre')), 3)]);
    out.push({ kind: 'chord', unitId: id, prompt: 'Which chord is this?', chord: name, answer: name, options: opts, explain: 'Picture the shape before you place your fingers — then check each string rings.' });
  }
  // Note-name drills
  const noteStrings = { s03: [0], s04: [1], s08: [0, 1, 2, 3], b06: [1], g07: [1] }[id];
  if (noteStrings) {
    for (let k = 0; k < 2; k++) {
      const si = noteStrings[Math.floor(Math.random() * noteStrings.length)];
      const f = [0, 1, 2, 3, 5, 7, 8, 10, 12][Math.floor(Math.random() * 9)];
      const midi = TUNINGS.guitar.strings[si] + f;
      const ans = noteName(midi);
      const opts = shuffle([ans, ...pickN(NOTES.filter(n => n !== ans), 3)]);
      out.push({ kind: 'note', unitId: id, prompt: `What note is fret ${f} on the ${TUNINGS.guitar.labels[si]} string?`, answer: ans, options: opts, board: { si, f }, explain: `Fret ${f} on ${TUNINGS.guitar.labels[si]} = ${ans}. Use landmarks: 0, 3, 5, 7, 12.` });
    }
  }
  // Ear questions
  if (['s05', 's07', 's14'].includes(id)) {
    const set = id === 's05' ? [7, 12] : id === 's07' ? [3, 4, 5, 7, 12] : [2, 3, 4, 5, 7, 9, 12];
    const st = set[Math.floor(Math.random() * set.length)];
    const root = 50 + Math.floor(Math.random() * 10);
    const ans = INTERVALS[st - 1].name;
    out.push({ kind: 'ear', unitId: id, prompt: 'Listen: which interval is this?', answer: ans,
      options: shuffle([ans, ...pickN(set.filter(x => x !== st).map(x => INTERVALS[x - 1].name), Math.min(3, set.length - 1))]),
      play: () => { const t = audio().currentTime + 0.05; pluck(root, t); pluck(root + st, t + 0.7); },
      explain: `${ans} — think "${INTERVALS[st - 1].ref}".` });
  }
  if (['s06', 's21', 'g10'].includes(id)) {
    const type = Math.random() < 0.5 ? 'maj' : 'min';
    const rootPc = Math.floor(Math.random() * 12);
    const ans = type === 'maj' ? 'Major' : 'Minor';
    out.push({ kind: 'ear', unitId: id, prompt: 'Listen: major or minor?', answer: ans, options: ['Major', 'Minor'],
      play: () => { const v = voiceChord(rootPc, type, 50); strum([v.bass, ...v.notes]); },
      explain: type === 'maj' ? 'Major sounds bright and settled.' : 'Minor sounds darker.' });
  }
  return out;
}

function questionsForSong(s, id) {
  const song = allSongs(s).find(x => x.id === id);
  if (!song || song.custom) return [];
  const others = SONGS.filter(x => x.id !== id && x.skill !== song.skill).map(x => x.skill);
  return [{ kind: 'mcq', prompt: `"${song.title}" on ${song.inst} mainly trains…`, answer: song.skill, options: shuffle([song.skill, ...pickN(others, 3)]), explain: `${song.title}: ${song.skill}.` }];
}

export function buildRecall(s = getState(), date = todayISO()) {
  const { last, units, songs } = recentItems(s, date);
  const byUnit = units.map(id => shuffle(questionsForUnit(s, id))).filter(a => a.length);
  const songQs = songs.flatMap(id => questionsForSong(s, id));
  // Round-robin across units so every skill from last time shows up.
  const picked = [];
  let round = 0;
  while (picked.length < QUESTIONS && byUnit.some(a => a[round])) {
    for (const a of shuffle(byUnit)) if (a[round] && picked.length < QUESTIONS) picked.push(a[round]);
    round++;
  }
  if (picked.length < QUESTIONS && songQs.length) picked.push(...songQs.slice(0, QUESTIONS - picked.length));
  // Top up from earlier skills (spaced review).
  if (picked.length < QUESTIONS) {
    const earlier = shuffle([...unitDoneIds(s)].filter(id => !units.includes(id))).flatMap(id => questionsForUnit(s, id).slice(0, 1).map(q => ({ ...q, earlier: true })));
    picked.push(...earlier.slice(0, QUESTIONS - picked.length));
  }
  return { last, questions: shuffle(picked) };
}

export function renderRecall(root, go, query = {}) {
  const s = getState();
  const date = todayISO();
  const game = buildRecall(s, date);
  const qs = game.questions;
  let i = 0, score = 0, combo = 0, best = 0, answered = null, shown = -1;
  const missed = [];

  if (!qs.length) {
    root.append(h('div', { class: 'recall' }, h('div', { class: 'recall-card' },
      h('div', { class: 'big-emoji' }, '🧠'), h('h1', {}, 'Nothing to recall yet'),
      h('p', { class: 'muted' }, 'Finish your first session and tomorrow you\'ll get a quick warm-up game on it.'),
      h('button', { class: 'btn primary', onclick: () => go('#/today') }, 'Back to Today'))));
    return;
  }

  const wrap = h('div', { class: 'recall' });
  root.append(wrap);

  function render() {
    clear(wrap);
    const q = qs[i];
    const head = h('div', { class: 'recall-head' },
      h('button', { class: 'icon-btn', 'aria-label': 'Exit game', onclick: () => go('#/today') }, icon('x')),
      h('div', { class: 'recall-pips' }, ...qs.map((_, k) => h('span', { class: k < i ? 'done' : k === i ? 'now' : '' }))),
      h('span', { class: `combo ${combo >= 2 ? 'hot' : ''}` }, combo >= 2 ? `🔥 ${combo}` : `${score} ✓`));

    const fresh = shown !== i;
    shown = i;
    const card = h('div', { class: `recall-card ${fresh ? 'enter' : ''}` },
      h('p', { class: 'muted small' }, q.earlier ? '🔁 From earlier' : game.last ? `From your last session${game.last.date === addDays(date, -1) ? ' (yesterday)' : ''}` : ''),
      h('h2', { class: 'recall-q' }, q.prompt),
      q.kind === 'chord' ? h('div', { class: 'recall-vis', html: chordSVG(q.chord, { size: 1.35, title: !!answered }) }) : null,
      q.kind === 'note' ? noteBoard(q.board) : null,
      q.kind === 'ear' ? h('button', { class: 'btn big', onclick: q.play }, icon('play'), ' Play sound') : null,
      h('div', { class: `recall-options ${q.options.length === 2 ? 'two' : ''}` }, ...q.options.map(o => {
        let cls = 'recall-opt';
        if (answered) { if (o === q.answer) cls += ' good'; else if (o === answered) cls += ' bad'; else cls += ' dim'; }
        return h('button', { class: cls, disabled: !!answered, onclick: () => choose(o) }, o);
      })),
      answered ? h('div', { class: `feedback ${answered === q.answer ? 'good' : 'bad'}` },
        h('strong', {}, answered === q.answer ? pickPraise() : `Answer: ${q.answer}. `), q.explain) : null,
      answered && q.kind === 'mcq' && q.unitId && VISUALS[q.unitId] ? visualsBlock(VISUALS[q.unitId].slice(0, 1)) : null,
      answered ? h('button', { class: 'btn primary wide big', onclick: next }, i === qs.length - 1 ? 'See results' : 'Next', ' ', icon('chevron')) : null);

    wrap.append(head, card);
    if (q.kind === 'ear' && !answered) setTimeout(q.play, 250);
  }

  function choose(o) {
    const q = qs[i];
    answered = o;
    if (o === q.answer) { score++; combo++; best = Math.max(best, combo); pluck(76, 0, { gain: 0.25, dur: 0.6 }); pluck(83, audio().currentTime + 0.09, { gain: 0.25, dur: 0.8 }); }
    else { combo = 0; if (q.unitId) missed.push(q.unitId); pluck(45, 0, { gain: 0.3, dur: 0.5 }); }
    render();
  }

  function next() {
    answered = null;
    if (i < qs.length - 1) { i++; render(); window.scrollTo(0, 0); }
    else finish();
  }

  function finish() {
    const earned = recordRecall(date, score, qs.length, [...new Set(missed)]);
    if (score === qs.length) confetti();
    clear(wrap);
    const st = getState();
    const canSession = isPracticeDay(st, date) && !st.sessions.some(x => x.date === date && !x.mini);
    const stars = score === qs.length ? 3 : score >= qs.length - 1 ? 2 : score >= Math.ceil(qs.length / 2) ? 1 : 0;
    wrap.append(h('div', { class: 'recall-card result' },
      h('div', { class: 'stars', 'aria-label': `${stars} of 3 stars` }, ...[0, 1, 2].map(k => h('span', { class: k < stars ? 'on' : '' }, '★'))),
      h('h1', {}, `${score} / ${qs.length}`),
      h('p', { class: 'lead' }, score === qs.length ? 'Perfect recall! Your brain kept it overnight.' : score >= qs.length - 1 ? 'Great memory — nearly perfect.' : score >= 3 ? 'Solid. A quick refresh before you play.' : 'Good thing we checked — those skills come back for review.'),
      best >= 3 ? h('p', { class: 'muted small' }, `Best combo: 🔥 ${best}`) : null,
      missed.length ? h('div', { class: 'card soft' }, h('strong', {}, 'Coming back for review:'),
        h('ul', {}, ...[...new Set(missed)].map(id => h('li', {}, unitById[id]?.title || id)))) : null,
      earned.length ? h('p', { class: 'chip t-shared' }, '🏅 New badge unlocked') : null,
      h('div', { class: 'row gap wrap center mt' },
        canSession ? h('button', { class: 'btn primary big', onclick: () => startSession(buildSession(getState(), date)) }, icon('play'), ' Continue to today\'s session') : null,
        h('button', { class: `btn ${canSession ? 'ghost' : 'primary'}`, onclick: () => go('#/today') }, 'Back to Today'))));
  }

  render();
}

function noteBoard({ si, f }) {
  const from = Math.max(0, f - 2), to = Math.min(12, Math.max(f + 2, 4));
  return h('div', { class: 'recall-vis', html: miniSpot(si, f, from, to) });
}

function miniSpot(si, f, from, to) {
  const n = 6, cw = 38, rh = 16, left = 24, top = 10;
  const cols = to - from + 1;
  const W = left + cols * cw + 8, H = top + (n - 1) * rh + 24;
  const sy = i => top + (n - 1 - i) * rh;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="board-svg">`;
  for (let k = from; k <= to + 1; k++) s += `<line x1="${left + (k - from) * cw}" x2="${left + (k - from) * cw}" y1="${sy(n - 1)}" y2="${sy(0)}" class="${k === 0 ? 'v-nut-line' : 'v-line'}"/>`;
  for (let i = 0; i < n; i++) s += `<line x1="${left}" x2="${left + cols * cw}" y1="${sy(i)}" y2="${sy(i)}" class="v-string"/><text x="10" y="${sy(i) + 4}" class="v-tiny">${TUNINGS.guitar.labels[i]}</text>`;
  for (let k = from; k <= to; k++) if (k > 0) s += `<text x="${left + (k - from + 0.5) * cw}" y="${H - 4}" class="v-tiny">${k}</text>`;
  const x = f === 0 ? left - 2 : left + (f - from + 0.5) * cw;
  s += `<circle cx="${x}" cy="${sy(si)}" r="9" class="v-root"/><text x="${x}" y="${sy(si) + 4}" class="v-dot-text">?</text></svg>`;
  return s;
}

const PRAISE = ['Yes! ', 'Nailed it! ', 'Exactly. ', 'Spot on! ', 'Correct! '];
const pickPraise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

