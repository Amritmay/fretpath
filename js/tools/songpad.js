import { h, icon, clear, segmented, toast, fmtDate } from '../lib/ui.js';
import { Sequencer, strum, pluck, GROOVES, playGroove } from '../lib/audio.js';
import { NOTES, keyChords, PRESET_PROGRESSIONS, voiceChord, noteName, CHORD_TYPES } from '../lib/music.js';
import { getState, todayISO } from '../lib/store.js';
import { saveIdea, deleteIdea } from '../lib/actions.js';

const OBJECTS = ['an old pair of shoes', 'a train platform at night', 'your phone at 3am', 'a kitchen on a Sunday morning', 'the last bus home', 'a broken umbrella', 'a rooftop in summer', 'a hospital waiting room', 'a cassette tape', 'monsoon rain on a window', 'a school bench', 'a voice note you never sent', 'a city from a plane', 'your favourite mug', 'a closing shop'];
const TITLES = ['Halfway There', 'Static', 'Paper Planes', 'Before the Lights', 'Second Chances', 'Glass Hours', 'Low Battery', 'Northbound', 'Ten Minutes Late', 'Echo Street', 'Weightless', 'Copper Sky'];
const CONSTRAINTS = ['Only 3 chords.', 'The chorus starts on the vi chord.', 'Every line has exactly 6 syllables.', 'Write the chorus first.', 'Use one word from the title in every line.', 'Make the bass line the hook.', 'Verse in a minor key, chorus in its relative major.', 'Half-time feel in the chorus.', 'No rhymes allowed.', 'Start with a riff, not chords.'];

export function mount(root, opts = {}) {
  const blank = () => ({ id: 'i' + Date.now().toString(36), title: '', key: opts.key || 'G', mode: 'major', bpm: 90, prog: ['I', 'V', 'vi', 'IV'], notes: '', groove: 'rock', date: todayISO() });
  let idea = blank();
  let playing = null;
  let pos = -1;

  const el = h('div', { class: 'songpad' });

  function chordsMap() {
    const k = keyChords(idea.key, idea.mode);
    const all = [...k.diatonic, ...k.borrowed];
    return { k, find: r => all.find(c => c.roman === r) };
  }

  function stop() { playing?.stop(); playing = null; pos = -1; }

  function play() {
    if (playing) { stop(); render(); return; }
    const { find } = chordsMap();
    const g = GROOVES[idea.groove] || GROOVES.rock;
    const spb = g.stepsPerBeat;
    const barSteps = spb * 4;
    playing = new Sequencer({
      bpm: idea.bpm, stepsPerBeat: spb,
      onStep: (step, t) => {
        if (!idea.prog.length) return;
        const barIdx = Math.floor(step / barSteps) % idea.prog.length;
        const inBar = step % barSteps;
        const c = find(idea.prog[barIdx]);
        if (!c) return;
        const v = voiceChord(c.rootPc, c.type, 52);
        if (inBar === 0) { strum([v.bass, ...v.notes], t, { gain: 0.28 }); }
        else if (inBar === spb * 2) { strum(v.notes, t, { gain: 0.2 }); }
        else if (inBar === spb * 3 + Math.floor(spb / 2)) { strum([...v.notes].reverse(), t, { gain: 0.14, spread: 0.01 }); }
        if (inBar === spb * 2) pluck(v.bass, t, { gain: 0.5 });
        if (idea.groove !== 'none') playGroove(g, step, t);
      },
      onVisual: step => {
        const p = Math.floor(step / barSteps) % Math.max(1, idea.prog.length);
        if (p !== pos) { pos = p; el.querySelectorAll('.slot').forEach((s, i) => s.classList.toggle('now', i === p)); }
      },
    });
    playing.start();
    render();
  }

  function addChord(roman) {
    if (idea.prog.length >= 8) { toast('Max 8 chords — tap a chord in the progression to remove it.'); return; }
    idea.prog.push(roman);
    const { find } = chordsMap();
    const c = find(roman);
    if (c && !playing) { const v = voiceChord(c.rootPc, c.type, 52); strum([v.bass, ...v.notes]); }
    render();
  }

  function render() {
    clear(el);
    const { k, find } = chordsMap();
    const flat = idea.prog.map(find).filter(Boolean);

    el.append(
      h('div', { class: 'row gap wrap' },
        h('label', { class: 'field' }, h('span', {}, 'Key'),
          h('select', { onchange: e => { idea.key = e.target.value; restart(); } }, ...NOTES.map(n => h('option', { value: n, selected: n === idea.key }, n)))),
        h('div', { class: 'field' }, h('span', {}, 'Mode'),
          segmented([['major', 'Major'], ['minor', 'Minor']], idea.mode, v => { idea.mode = v; idea.prog = v === 'minor' ? ['i', 'VI', 'III', 'VII'] : ['I', 'V', 'vi', 'IV']; restart(); })),
        h('label', { class: 'field' }, h('span', {}, `Tempo ${idea.bpm}`),
          h('input', { type: 'range', min: 50, max: 180, value: idea.bpm, class: 'slider', oninput: e => { idea.bpm = +e.target.value; if (playing) playing.bpm = idea.bpm; e.target.previousSibling.textContent = `Tempo ${idea.bpm}`; } })),
        h('label', { class: 'field' }, h('span', {}, 'Drums'),
          h('select', { onchange: e => { idea.groove = e.target.value; restart(); } },
            h('option', { value: 'none', selected: idea.groove === 'none' }, 'No drums'),
            ...Object.entries(GROOVES).map(([g, v]) => h('option', { value: g, selected: g === idea.groove }, v.name))))),

      h('h3', { class: 'mt' }, 'Chords in ', `${idea.key} ${idea.mode}`),
      h('div', { class: 'chord-row' }, ...k.diatonic.map(c => chordBtn(c))),
      h('div', { class: 'muted small mt' }, 'Borrowed / colour chords'),
      h('div', { class: 'chord-row small' }, ...k.borrowed.map(c => chordBtn(c))),

      h('h3', { class: 'mt' }, 'Your progression ', h('span', { class: 'muted small' }, '(1 bar each — tap to remove)')),
      h('div', { class: 'prog' }, ...(idea.prog.length ? idea.prog.map((r, i) => {
        const c = find(r);
        return h('button', { class: `slot ${i === pos ? 'now' : ''}`, onclick: () => { idea.prog.splice(i, 1); render(); } },
          h('strong', {}, c?.name || '?'), h('span', { class: 'muted small' }, r));
      }) : [h('p', { class: 'muted' }, 'Tap chords above to build a progression.')])),
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn primary', onclick: play, disabled: !idea.prog.length }, icon(playing ? 'pause' : 'play'), playing ? ' Stop' : ' Play loop'),
        h('select', { class: 'grow', 'aria-label': 'Preset progressions', onchange: e => { if (!e.target.value) return; idea.mode = 'major'; idea.prog = e.target.value.split(','); restart(); } },
          h('option', { value: '' }, 'Presets…'),
          ...PRESET_PROGRESSIONS.map(p => h('option', { value: p.romans.join(',') }, `${p.name}: ${p.romans.join(' – ')}`)))),

      flat.length ? h('details', { class: 'card soft mt' },
        h('summary', {}, h('strong', {}, '🎵 Bass line ideas')),
        h('div', { class: 'bass-ideas' },
          ideaLine('Roots (8ths)', flat.map(c => `${noteName(c.rootPc)} ×8`)),
          ideaLine('Root – 5th', flat.map(c => `${noteName(c.rootPc)} ${noteName(c.rootPc + 7)}`)),
          ideaLine('Root – 5th – octave', flat.map(c => `${noteName(c.rootPc)} ${noteName(c.rootPc + 7)} ${noteName(c.rootPc)}'`)),
          ideaLine('Arpeggio', flat.map(c => CHORD_TYPES[c.type].tones.slice(0, 3).map(t => noteName(c.rootPc + t)).join(' '))),
          ideaLine('Approach into next', flat.map((c, i) => { const n = flat[(i + 1) % flat.length]; return `${noteName(c.rootPc)} … ${noteName(n.rootPc - 1)}→`; })))) : null,

      h('details', { class: 'card soft mt' },
        h('summary', {}, h('strong', {}, '💡 Writing prompt')),
        h('div', { class: 'prompt-box' }, promptText()),
        h('button', { class: 'btn ghost', onclick: e => { e.target.closest('details').querySelector('.prompt-box').replaceChildren(promptText()); } }, icon('dice'), ' Another')),

      h('h3', { class: 'mt' }, 'Save this idea'),
      h('label', { class: 'field' }, h('span', {}, 'Title'), h('input', { type: 'text', value: idea.title, placeholder: 'Untitled idea', oninput: e => { idea.title = e.target.value; } })),
      h('label', { class: 'field' }, h('span', {}, 'Lyrics, melody notes, what to try next'),
        h('textarea', { rows: 4, value: idea.notes, placeholder: 'Hum it into Voice Memos, jot the words here.', oninput: e => { idea.notes = e.target.value; } })),
      h('div', { class: 'row gap' },
        h('button', { class: 'btn primary', onclick: () => { saveIdea({ ...idea, title: idea.title || 'Untitled idea', prog: [...idea.prog], date: todayISO() }); toast('Idea saved 💡'); render(); } }, icon('check'), ' Save idea'),
        h('button', { class: 'btn ghost', onclick: () => { stop(); idea = blank(); render(); } }, 'New')),

      ideasList());
  }

  function restart() { const was = !!playing; stop(); if (was) play(); else render(); }

  function chordBtn(c) {
    return h('button', { class: `chord-btn q-${c.type}`, onclick: () => addChord(c.roman) },
      h('strong', {}, c.name), h('span', { class: 'small' }, c.roman));
  }

  function ideaLine(label, parts) {
    return h('div', { class: 'idea-line' }, h('span', { class: 'muted small' }, label), h('code', {}, parts.join('  |  ')));
  }

  function promptText() {
    const r = a => a[Math.floor(Math.random() * a.length)];
    return h('p', {}, h('strong', {}, 'Title: '), `"${r(TITLES)}". `, h('strong', {}, 'Object writing: '), `${r(OBJECTS)} — 5 minutes, all senses. `, h('strong', {}, 'Constraint: '), r(CONSTRAINTS));
  }

  function ideasList() {
    const ideas = getState().ideas;
    if (!ideas.length) return h('p', { class: 'muted small mt' }, 'Saved ideas appear here. Bad songs count — every finished idea makes the next one better.');
    return h('div', { class: 'mt' }, h('h3', {}, `Your songbook (${ideas.length})`),
      h('div', { class: 'list' }, ...ideas.map(i => h('div', { class: 'list-item' },
        h('div', { class: 'grow' }, h('strong', {}, i.title), h('div', { class: 'muted small' }, `${i.key} ${i.mode} · ${i.prog.join(' – ')} · ${fmtDate(i.date)}`)),
        h('button', { class: 'icon-btn', 'aria-label': `Open ${i.title}`, onclick: () => { stop(); idea = { ...i, prog: [...i.prog] }; render(); el.scrollIntoView({ behavior: 'smooth' }); } }, icon('edit')),
        h('button', { class: 'icon-btn', 'aria-label': `Delete ${i.title}`, onclick: () => { if (confirm(`Delete "${i.title}"?`)) { deleteIdea(i.id); render(); } } }, icon('trash'))))));
  }

  render();
  root.append(el);
  return stop;
}
