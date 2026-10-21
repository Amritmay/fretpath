import { h, icon, clear, segmented, toast, sparkline } from '../lib/ui.js';
import { Sequencer, click } from '../lib/audio.js';
import { getState, update } from '../lib/store.js';
import { logBpm } from '../lib/actions.js';
import { UNITS } from '../data/curriculum.js';

export function mount(root, opts = {}) {
  const st = getState();
  const cfg = {
    bpm: opts.bpm || st.settings.lastBpm || 80,
    beats: 4,
    sub: opts.sub || 1,
    accent: true,
    backbeat: false,
    sound: st.settings.clickSound || 'click',
    ladder: false, ladderTarget: (opts.bpm || 80) + 30, ladderStep: 4, ladderBars: 4,
  };
  const exercises = UNITS.filter(u => u.bpm);
  let exercise = opts.exercise || null;
  let taps = [];
  let bar = 0;

  const bpmNum = h('div', { class: 'bpm-num', 'aria-live': 'polite' }, cfg.bpm);
  const dots = h('div', { class: 'beat-dots' });
  const ladderInfo = h('div', { class: 'muted small' });
  const playBtn = h('button', { class: 'btn primary big round', 'aria-label': 'Start metronome', onclick: toggle }, icon('play', 28));

  const seq = new Sequencer({
    bpm: cfg.bpm, stepsPerBeat: cfg.sub,
    onStep: (step, t) => {
      const perBar = cfg.beats * cfg.sub;
      const i = step % perBar;
      const beat = Math.floor(i / cfg.sub);
      const onBeat = i % cfg.sub === 0;
      if (cfg.backbeat) {
        if (onBeat && (beat % 2 === 1)) click(t, false, cfg.sound);
      } else if (onBeat) {
        click(t, cfg.accent && beat === 0, cfg.sound);
      } else {
        // quieter subdivision tick
        click(t, false, cfg.sound === 'wood' ? 'wood' : 'click');
      }
      if (i === perBar - 1) {
        bar++;
        if (cfg.ladder && bar % cfg.ladderBars === 0 && seq.bpm < cfg.ladderTarget) {
          setBpm(Math.min(cfg.ladderTarget, seq.bpm + cfg.ladderStep), false);
        }
      }
    },
    onVisual: step => {
      const i = step % (cfg.beats * cfg.sub);
      if (i % cfg.sub !== 0) return;
      const beat = i / cfg.sub;
      [...dots.children].forEach((d, j) => d.classList.toggle('on', j === beat));
    },
  });

  function renderDots() {
    clear(dots);
    for (let i = 0; i < cfg.beats; i++) dots.append(h('span', { class: i === 0 && cfg.accent && !cfg.backbeat ? 'accent' : '' }));
  }

  function setBpm(v, persist = true) {
    cfg.bpm = Math.max(30, Math.min(260, Math.round(v)));
    seq.bpm = cfg.bpm;
    bpmNum.textContent = cfg.bpm;
    slider.value = cfg.bpm;
    if (persist) update(s => { s.settings.lastBpm = cfg.bpm; });
    renderLadder();
  }

  function toggle() {
    if (seq.running) { seq.stop(); playBtn.replaceChildren(icon('play', 28)); playBtn.setAttribute('aria-label', 'Start metronome'); [...dots.children].forEach(d => d.classList.remove('on')); }
    else { bar = 0; seq.stepsPerBeat = cfg.sub; seq.start(); playBtn.replaceChildren(icon('pause', 28)); playBtn.setAttribute('aria-label', 'Stop metronome'); }
  }

  function tap() {
    const now = performance.now();
    taps = taps.filter(t => now - t < 2500);
    taps.push(now);
    if (taps.length >= 3) {
      const gaps = taps.slice(1).map((t, i) => t - taps[i]);
      setBpm(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length));
    }
  }

  function renderLadder() {
    ladderInfo.textContent = cfg.ladder
      ? `Ladder: +${cfg.ladderStep} BPM every ${cfg.ladderBars} bars until ${cfg.ladderTarget}.`
      : 'Tip: find the fastest tempo you can play 3 times cleanly. Go up 4–8 BPM after a clean set; drop back 10–20% after mistakes.';
  }

  const slider = h('input', { type: 'range', min: 30, max: 260, value: cfg.bpm, 'aria-label': 'Tempo', class: 'slider', oninput: e => setBpm(+e.target.value) });

  const logArea = h('div', { class: 'card soft' });
  function renderLog() {
    clear(logArea);
    const sel = h('select', { 'aria-label': 'Exercise', onchange: e => { exercise = e.target.value || null; renderLog(); } },
      h('option', { value: '' }, 'Choose an exercise to log…'),
      ...exercises.map(u => h('option', { value: u.id, selected: u.id === exercise }, `${u.track === 'guitar' ? '🎸' : '🎵'} ${u.title}`)));
    logArea.append(h('div', { class: 'row gap wrap' }, h('strong', {}, 'Log a clean tempo'), sel));
    if (exercise) {
      const hist = (getState().bpm[exercise] || []).map(e => e.bpm);
      const best = hist.length ? Math.max(...hist) : null;
      logArea.append(h('div', { class: 'row gap wrap mt' },
        h('button', { class: 'btn', onclick: () => { logBpm(exercise, cfg.bpm); toast(`Logged ${cfg.bpm} BPM ✓`); renderLog(); } }, icon('check'), ` I played it clean at ${cfg.bpm}`),
        best ? h('span', { class: 'muted' }, `Best: ${best} BPM`) : null,
        hist.length > 1 ? h('span', { class: 't-guitar' }, sparkline(hist.slice(-20))) : null));
    }
  }

  renderDots();
  renderLadder();
  renderLog();

  root.append(
    h('div', { class: 'metro' },
      h('div', { class: 'metro-top' },
        h('button', { class: 'icon-btn lg', 'aria-label': 'Slower by 1', onclick: () => setBpm(cfg.bpm - 1) }, icon('minus', 22)),
        h('div', { class: 'bpm-wrap' }, bpmNum, h('div', { class: 'muted small' }, 'BPM')),
        h('button', { class: 'icon-btn lg', 'aria-label': 'Faster by 1', onclick: () => setBpm(cfg.bpm + 1) }, icon('plus', 22))),
      slider,
      h('div', { class: 'row center gap' },
        h('button', { class: 'btn ghost', onclick: () => setBpm(cfg.bpm - 5) }, '−5'),
        playBtn,
        h('button', { class: 'btn ghost', onclick: () => setBpm(cfg.bpm + 5) }, '+5')),
      dots,
      h('button', { class: 'btn ghost wide', onclick: tap }, 'Tap tempo'),
      h('div', { class: 'grid2' },
        h('div', { class: 'field' }, h('span', {}, 'Beats per bar'),
          segmented([2, 3, 4, 5, 6, 7], cfg.beats, v => { cfg.beats = v; renderDots(); })),
        h('div', { class: 'field' }, h('span', {}, 'Subdivision'),
          segmented([[1, 'Quarter'], [2, '8ths'], [3, 'Triplets'], [4, '16ths']], cfg.sub, v => { cfg.sub = v; seq.stepsPerBeat = v; if (seq.running) { seq.stop(); seq.start(); } })),
        h('div', { class: 'field' }, h('span', {}, 'Click on'),
          segmented([['all', 'Every beat'], ['24', '2 & 4']], cfg.backbeat ? '24' : 'all', v => { cfg.backbeat = v === '24'; renderDots(); })),
        h('div', { class: 'field' }, h('span', {}, 'Sound'),
          segmented([['click', 'Click'], ['wood', 'Wood']], cfg.sound, v => { cfg.sound = v; update(s => { s.settings.clickSound = v; }); }))),
      h('details', { class: 'card soft' },
        h('summary', {}, h('strong', {}, 'Tempo ladder'), h('span', { class: 'muted' }, ' — speeds up automatically')),
        h('div', { class: 'grid3 mt' },
          numField('Target BPM', cfg.ladderTarget, v => { cfg.ladderTarget = v; renderLadder(); }),
          numField('Step (BPM)', cfg.ladderStep, v => { cfg.ladderStep = v; renderLadder(); }),
          numField('Bars per step', cfg.ladderBars, v => { cfg.ladderBars = v; renderLadder(); })),
        h('label', { class: 'switch mt' }, h('input', { type: 'checkbox', onchange: e => { cfg.ladder = e.target.checked; renderLadder(); } }), h('span', {}, 'Ladder on'))),
      ladderInfo,
      logArea));

  return () => seq.stop();
}

function numField(label, value, onChange) {
  return h('label', { class: 'field' }, h('span', {}, label),
    h('input', { type: 'number', inputMode: 'numeric', value, min: 1, max: 260, onchange: e => onChange(+e.target.value) }));
}
