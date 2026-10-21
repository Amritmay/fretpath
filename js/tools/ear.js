import { h, icon, clear, segmented, toast, confetti } from '../lib/ui.js';
import { pluck, strum, audio } from '../lib/audio.js';
import { INTERVALS, CHORD_TYPES, voiceChord, noteName } from '../lib/music.js';
import { getState } from '../lib/store.js';
import { logEar, setEarLevel } from '../lib/actions.js';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];

const MODES = {
  intervals: {
    label: 'Intervals', hint: 'How far apart are the two notes?',
    levels: [[7, 12], [3, 4, 7, 12], [3, 4, 5, 7, 12], [2, 3, 4, 5, 7, 12], [2, 3, 4, 5, 7, 8, 9, 12], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]],
    options: lvl => lvl.map(s => ({ id: s, label: INTERVALS[s - 1].short, sub: INTERVALS[s - 1].name })),
    question: lvl => ({ answer: rand(lvl), root: 48 + Math.floor(Math.random() * 14) }),
    play(q, t, dir) {
      const second = q.root + (dir === 'down' ? -q.answer : q.answer);
      if (dir === 'harm') { pluck(q.root, t); pluck(second, t); }
      else { pluck(q.root, t); pluck(second, t + 0.75); }
    },
    explain: q => { const iv = INTERVALS[q.answer - 1]; return `${iv.name} — think "${iv.ref}"`; },
  },
  chords: {
    label: 'Chords', hint: 'What kind of chord is it?',
    levels: [['maj', 'min'], ['maj', 'min', 'dom7'], ['maj', 'min', 'dom7', 'dim', 'aug'], ['maj', 'min', 'dom7', 'dim', 'aug', 'maj7', 'min7']],
    options: lvl => lvl.map(k => ({ id: k, label: CHORD_TYPES[k].name })),
    question: lvl => ({ answer: rand(lvl), root: Math.floor(Math.random() * 12) }),
    play(q, t) {
      const v = voiceChord(q.root, q.answer, 50);
      v.notes.forEach((m, i) => pluck(m, t + i * 0.28, { gain: 0.35 }));
      strum([v.bass, ...v.notes], t + v.notes.length * 0.28 + 0.4);
    },
    explain: q => ({ maj: 'Major sounds bright / settled.', min: 'Minor sounds dark / sad.', dom7: 'Dominant 7 is bluesy and wants to move.', dim: 'Diminished is tense and unstable.', aug: 'Augmented sounds dreamy / unresolved.', maj7: 'Major 7 is soft and jazzy.', min7: 'Minor 7 is mellow and smooth.' })[q.answer],
  },
  degrees: {
    label: 'Scale degrees', hint: 'After the cadence, which degree of the key is the note?',
    levels: [[1, 3, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6, 7]],
    options: lvl => lvl.map(d => ({ id: d, label: String(d), sub: ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti'][d - 1] })),
    question: lvl => ({ answer: rand(lvl), key: Math.floor(Math.random() * 12) }),
    play(q, t) {
      cadence(q.key, t);
      const base = 60 + ((q.key - 0 + 12) % 12) - (q.key > 5 ? 12 : 0);
      pluck(base + MAJOR[q.answer - 1], t + 3.2, { gain: 0.55, dur: 2 });
    },
    explain: q => `Degree ${q.answer} in ${noteName(q.key)} major is ${noteName(q.key + MAJOR[q.answer - 1])}. Sing it back down to 1.`,
  },
  progressions: {
    label: 'Progressions', hint: 'Which progression did you hear?',
    levels: [['I-IV-V-I', 'I-V-vi-IV'], ['I-IV-V-I', 'I-V-vi-IV', 'vi-IV-I-V', 'I-vi-IV-V'], ['I-IV-V-I', 'I-V-vi-IV', 'vi-IV-I-V', 'I-vi-IV-V', 'ii-V-I-I', 'I-bVII-IV-I']],
    options: lvl => lvl.map(p => ({ id: p, label: p.replace(/-/g, ' – ') })),
    question: lvl => ({ answer: rand(lvl), key: Math.floor(Math.random() * 12) }),
    play(q, t) {
      const map = { I: [0, 'maj'], ii: [2, 'min'], iii: [4, 'min'], IV: [5, 'maj'], V: [7, 'maj'], vi: [9, 'min'], bVII: [10, 'maj'] };
      q.answer.split('-').forEach((r, i) => {
        const [off, type] = map[r];
        const v = voiceChord((q.key + off) % 12, type, 52);
        strum([v.bass, ...v.notes], t + i * 1.1);
        strum(v.notes, t + i * 1.1 + 0.55, { gain: 0.22 });
      });
    },
    explain: q => `${q.answer.replace(/-/g, ' – ')} in ${noteName(q.key)}. Listen for where the bass moves.`,
  },
};

function cadence(key, t) {
  [[0, 'maj'], [5, 'maj'], [7, 'maj'], [0, 'maj']].forEach(([off, type], i) => {
    const v = voiceChord((key + off) % 12, type, 52);
    strum([v.bass, ...v.notes], t + i * 0.7, { gain: 0.26 });
  });
}

const rand = arr => arr[Math.floor(Math.random() * arr.length)];

export function mount(root, opts = {}) {
  let mode = MODES[opts.mode] ? opts.mode : 'intervals';
  let dir = 'up';
  let q = null;
  let answered = false;
  let streak = 0;

  const body = h('div', { class: 'ear-body' });
  const tabs = h('div');

  function levelOf(m) { return Math.min(MODES[m].levels.length, getState().ear[m]?.level || 1); }

  function renderTabs() {
    clear(tabs);
    tabs.append(segmented(Object.entries(MODES).map(([k, v]) => [k, v.label]), mode, v => { mode = v; q = null; answered = false; render(); }, { cls: 'scroll' }));
  }

  function newQuestion() {
    const M = MODES[mode];
    const lvl = M.levels[levelOf(mode) - 1];
    let next;
    do { next = M.question(lvl); } while (q && next.answer === q.answer && lvl.length > 2 && Math.random() < 0.6);
    q = next;
    answered = false;
    play();
    render();
  }

  function play() {
    if (!q) return;
    const t = audio().currentTime + 0.05;
    MODES[mode].play(q, t, dir);
  }

  function choose(id) {
    if (!q || answered) return;
    answered = true;
    const correct = id === q.answer;
    streak = correct ? streak + 1 : 0;
    const leveled = logEar(mode, correct, { max: MODES[mode].levels.length });
    if (leveled) { confetti(); toast(`Level up! ${MODES[mode].label} level ${levelOf(mode)} unlocked 🎉`); }
    render(id, correct);
    if (correct) setTimeout(() => { if (answered) newQuestion(); }, 1400);
  }

  function render(chosen = null, correct = null) {
    clear(body);
    const M = MODES[mode];
    const lvlN = levelOf(mode);
    const lvl = M.levels[lvlN - 1];
    const e = getState().ear[mode];
    const hist = e?.history || [];
    const acc = hist.length ? Math.round(100 * hist.reduce((a, b) => a + b, 0) / hist.length) : null;

    body.append(
      h('div', { class: 'row between wrap gap' },
        h('div', { class: 'row gap' },
          h('span', { class: 'muted small' }, 'Level'),
          h('select', { 'aria-label': 'Level', onchange: ev => { setEarLevel(mode, +ev.target.value); q = null; answered = false; render(); } },
            ...M.levels.map((_, i) => h('option', { value: i + 1, selected: i + 1 === lvlN }, `${i + 1} of ${M.levels.length}`)))),
        h('div', { class: 'row gap small' },
          acc != null ? h('span', { class: acc >= 80 ? 'good' : 'muted' }, `${acc}% (last ${hist.length})`) : h('span', { class: 'muted' }, 'Get 80% over 20 to level up'),
          streak > 1 ? h('span', { class: 'chip t-shared' }, `🔥 ${streak}`) : null)),
      h('p', { class: 'muted' }, M.hint),
      mode === 'intervals' ? segmented([['up', 'Ascending'], ['down', 'Descending'], ['harm', 'Together']], dir, v => { dir = v; }) : null,
      h('div', { class: 'row center gap mt' },
        q
          ? h('button', { class: 'btn big', onclick: play }, icon('replay'), ' Replay')
          : h('button', { class: 'btn primary big', onclick: newQuestion }, icon('play'), ' Start')),
      q ? h('div', { class: 'answer-grid' }, ...M.options(lvl).map(o => {
        let cls = 'answer';
        if (answered && o.id === q.answer) cls += ' good';
        else if (answered && o.id === chosen && !correct) cls += ' bad';
        return h('button', { class: cls, onclick: () => choose(o.id), disabled: answered && correct },
          h('strong', {}, o.label), o.sub ? h('span', { class: 'muted small' }, o.sub) : null);
      })) : null,
      answered && q ? h('div', { class: `feedback ${correct ? 'good' : 'bad'}` },
        h('strong', {}, correct ? 'Yes! ' : 'Not quite. '), M.explain(q),
        !correct ? h('div', { class: 'row gap mt' },
          h('button', { class: 'btn', onclick: play }, icon('replay'), ' Hear it again'),
          h('button', { class: 'btn primary', onclick: newQuestion }, 'Next')) : null) : null,
      h('p', { class: 'muted small mt' }, 'Sing along! Humming the notes connects your ear, voice and hands — that\'s how you start playing by ear.'));
  }

  renderTabs();
  render();
  root.append(h('div', { class: 'ear' }, tabs, body));
  return () => { q = null; };
}
