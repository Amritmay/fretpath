import { h, icon, clear } from '../lib/ui.js';
import { Sequencer, GROOVES, playGroove } from '../lib/audio.js';

export function mount(root, opts = {}) {
  let key = opts.groove && GROOVES[opts.groove] ? opts.groove : 'rock';
  let bpm = opts.bpm || 80;
  let kickOnly = false;
  const mute = { k: false, s: false, h: false };

  const grid = h('div', { class: 'drum-grid', 'aria-hidden': 'true' });
  const bpmLabel = h('strong', {}, bpm);
  const playBtn = h('button', { class: 'btn primary big round', 'aria-label': 'Start groove', onclick: toggle }, icon('play', 28));

  const seq = new Sequencer({
    bpm, stepsPerBeat: GROOVES[key].stepsPerBeat,
    onStep: (step, t) => playGroove(GROOVES[key], step, t, { kickOnly, mute }),
    onVisual: step => {
      const i = step % GROOVES[key].steps;
      grid.querySelectorAll('.col').forEach((c, j) => c.classList.toggle('on', j === i));
    },
  });

  function renderGrid() {
    clear(grid);
    const g = GROOVES[key];
    for (let i = 0; i < g.steps; i++) {
      grid.append(h('div', { class: `col ${i % g.stepsPerBeat === 0 ? 'beat' : ''}` },
        h('span', { class: g.h.includes(i) || g.o?.includes(i) ? 'hit h' : '' }),
        h('span', { class: g.s.includes(i) ? 'hit s' : g.ghost?.includes(i) ? 'hit s ghost' : '' }),
        h('span', { class: g.k.includes(i) ? 'hit k' : '' })));
    }
  }

  function toggle() {
    if (seq.running) { seq.stop(); playBtn.replaceChildren(icon('play', 28)); grid.querySelectorAll('.col').forEach(c => c.classList.remove('on')); }
    else { seq.stepsPerBeat = GROOVES[key].stepsPerBeat; seq.start(); playBtn.replaceChildren(icon('pause', 28)); }
  }

  function setGroove(k) {
    key = k;
    const was = seq.running;
    if (was) seq.stop();
    seq.stepsPerBeat = GROOVES[key].stepsPerBeat;
    renderGrid();
    if (was) seq.start();
    root.querySelectorAll('.groove-btn').forEach(b => b.classList.toggle('on', b.dataset.k === k));
  }

  renderGrid();

  root.append(h('div', { class: 'drums' },
    h('div', { class: 'groove-list' }, ...Object.entries(GROOVES).map(([k, g]) =>
      h('button', { class: `groove-btn ${k === key ? 'on' : ''}`, 'data-k': k, onclick: () => setGroove(k) }, g.name))),
    h('div', { class: 'drum-legend muted small' }, h('span', {}, 'Hi-hat'), h('span', {}, 'Snare'), h('span', {}, 'Kick')),
    grid,
    h('div', { class: 'row center gap' },
      h('button', { class: 'btn ghost', onclick: () => setBpm(bpm - 5) }, '−5'),
      playBtn,
      h('button', { class: 'btn ghost', onclick: () => setBpm(bpm + 5) }, '+5')),
    h('div', { class: 'row center gap muted' }, bpmLabel, ' BPM'),
    h('input', { type: 'range', class: 'slider', min: 40, max: 200, value: bpm, 'aria-label': 'Tempo', oninput: e => setBpm(+e.target.value) }),
    h('div', { class: 'row gap wrap' },
      toggleBtn('Kick only (bass drill)', v => { kickOnly = v; }),
      toggleBtn('Mute hat', v => { mute.h = v; }),
      toggleBtn('Mute snare', v => { mute.s = v; })),
    h('p', { class: 'muted small' }, 'Bass players: lock your notes to the kick drum. Guitarists: feel the snare on 2 and 4.')));

  function setBpm(v) {
    bpm = Math.max(40, Math.min(200, Math.round(v)));
    seq.bpm = bpm;
    bpmLabel.textContent = bpm;
    const s = root.querySelector('.slider'); if (s) s.value = bpm;
  }

  return () => seq.stop();
}

function toggleBtn(label, onChange) {
  let on = false;
  const b = h('button', { class: 'pill', 'aria-pressed': 'false', onclick: () => { on = !on; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); onChange(on); } }, label);
  return b;
}
