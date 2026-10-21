import { h, clear, segmented } from '../lib/ui.js';
import { strum } from '../lib/audio.js';
import { TUNINGS } from '../lib/music.js';
import { CHORD_SHAPES, chordSVG, renderVisual } from '../lib/visuals.js';

const GROUPS = [
  ['Open major', ['A', 'C', 'D', 'E', 'G']],
  ['Open minor', ['Am', 'Dm', 'Em']],
  ['Power chords', ['E5', 'A5', 'G5', 'C5']],
  ['Easy F', ['F (mini)']],
  ['Dominant 7ths', ['A7', 'B7', 'C7', 'D7', 'E7', 'G7']],
  ['Sus & add', ['Asus2', 'Asus4', 'Dsus2', 'Dsus4', 'Cadd9', 'Em7', 'G (anchor)']],
  ['Barre chords', ['F (barre)', 'G (barre)', 'Gm (barre)', 'Bb (barre)', 'C (barre)', 'Bm (barre)']],
];

const PICTURES = {
  instruments: [{ t: 'parts', inst: 'guitar' }, { t: 'parts', inst: 'bass' }, { t: 'strings', inst: 'guitar' }, { t: 'strings', inst: 'bass' }, { t: 'amp' }],
  technique: [{ t: 'hand' }, { t: 'pick' }, { t: 'rest' }, { t: 'palm' }, { t: 'bend' }, { t: 'strum', pattern: 'D_DU_UDU' }, { t: 'strum', pattern: 'DUDUDUDU' }],
  bass: [{ t: 'shape', inst: 'bass', shape: 'spider' }, { t: 'shape', inst: 'bass', shape: 'octave' }, { t: 'shape', inst: 'bass', shape: 'fifth' }, { t: 'shape', inst: 'bass', shape: 'rfo' }, { t: 'shape', inst: 'bass', shape: 'approach' }, { t: 'kick' }, { t: 'walk' }],
  theory: [{ t: 'keyboard' }, { t: 'formula' }, { t: 'diatonic', key: 'C' }, { t: 'diatonic', key: 'G' }, { t: 'interval' }, { t: 'blues', key: 'A' }, { t: 'form' },
    { t: 'rhythm', sub: 1, caption: 'Quarter notes: 1 2 3 4' }, { t: 'rhythm', sub: 2, caption: 'Eighth notes: 1 & 2 &' }, { t: 'rhythm', sub: 4, caption: 'Sixteenth notes: 1 e & a' }],
};

export function mount(root, opts = {}) {
  let tab = opts.tab || 'chords';
  const body = h('div', { class: 'library-body' });

  function playChord(name) {
    const c = CHORD_SHAPES[name];
    const notes = c.frets.map((f, i) => (f >= 0 ? TUNINGS.guitar.strings[i] + f : null)).filter(n => n != null);
    strum(notes, 0, { spread: 0.03, gain: 0.3 });
  }

  function render() {
    clear(body);
    if (tab === 'chords') {
      body.append(h('p', { class: 'muted small' }, 'Tap a chord to hear it. Numbers are fingers (1 = index … 4 = pinky); ○ = open string, × = don\'t play.'));
      for (const [label, names] of GROUPS) {
        body.append(h('h3', { class: 'lib-group' }, label),
          h('div', { class: 'lib-grid' }, ...names.map(n => h('button', { class: 'lib-chord', onclick: () => playChord(n), 'aria-label': `Play ${n}`, html: chordSVG(n) }))));
      }
    } else {
      const wrap = h('div', { class: 'visuals stack' });
      for (const v of PICTURES[tab]) { const el = renderVisual(v); if (el) wrap.append(el); }
      body.append(wrap);
    }
  }

  root.append(h('div', { class: 'library' },
    segmented([['chords', 'Chords'], ['instruments', 'Instruments'], ['technique', 'Technique'], ['bass', 'Bass shapes'], ['theory', 'Theory']], tab, v => { tab = v; render(); }, { cls: 'scroll' }),
    body));
  render();
  return () => {};
}
