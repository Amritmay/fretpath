import { h, clear, segmented } from '../lib/ui.js';
import { pluck } from '../lib/audio.js';
import { TUNINGS, NOTES, SCALES, noteName, noteIndex, intervalLabel, pc } from '../lib/music.js';

const FRETS = 15;
const INLAYS = [3, 5, 7, 9, 15];

export function mount(root, opts = {}) {
  const cfg = {
    inst: opts.inst || 'guitar',
    mode: opts.mode || (opts.scale ? 'scales' : 'explore'),
    root: opts.root || 'A',
    scale: opts.scale || 'minPent',
    labels: 'notes',
    strings: opts.strings || [0, 1],
  };
  const quiz = { kind: 'find', target: null, pos: null, start: 0, right: 0, total: 0, times: [], feedback: '' };

  const board = h('div', { class: 'fb-scroll' });
  const controls = h('div', { class: 'fb-controls' });
  const status = h('div', { class: 'fb-status', 'aria-live': 'polite' });

  function geometry() {
    const t = TUNINGS[cfg.inst];
    const W = 980, nutX = 44, rowH = cfg.inst === 'bass' ? 34 : 28, top = 18;
    const scaleLen = (W - nutX) / (1 - Math.pow(2, -(FRETS + 0.6) / 12));
    const fx = n => nutX + scaleLen * (1 - Math.pow(2, -n / 12));
    const n = t.strings.length;
    const H = top * 2 + rowH * (n - 1);
    // Draw high string at top (like tab).
    const sy = i => top + (n - 1 - i) * rowH;
    return { t, W, H, nutX, fx, sy, n, rowH };
  }

  function marks() {
    const g = geometry();
    const out = [];
    if (cfg.mode === 'scales') {
      const r = noteIndex(cfg.root);
      const steps = SCALES[cfg.scale].steps;
      g.t.strings.forEach((open, si) => {
        for (let f = 0; f <= FRETS; f++) {
          const semis = pc(open + f - r);
          if (steps.includes(semis) || (cfg.scale === 'octave' && semis === 0)) {
            out.push({ si, f, root: semis === 0, label: cfg.labels === 'notes' ? noteName(open + f) : intervalLabel(semis) });
          }
        }
      });
    }
    if (cfg.mode === 'quiz' && quiz.kind === 'name' && quiz.pos) out.push({ ...quiz.pos, root: true, label: '?' });
    if (cfg.mode === 'quiz' && quiz.reveal) out.push(...quiz.reveal);
    return out;
  }

  function render() {
    const g = geometry();
    let s = `<svg class="fb-svg" viewBox="0 0 ${g.W + 10} ${g.H + 22}" width="${g.W + 10}" height="${g.H + 22}" role="img" aria-label="${g.t.name} fretboard">`;
    s += `<rect x="${g.nutX}" y="${g.sy(g.n - 1) - 12}" width="${g.fx(FRETS) - g.nutX + 8}" height="${g.H - 12}" rx="4" class="fb-wood"/>`;
    for (const f of INLAYS) s += `<circle cx="${(g.fx(f - 1) + g.fx(f)) / 2}" cy="${g.H / 2}" r="5" class="fb-inlay"/>`;
    const f12 = (g.fx(11) + g.fx(12)) / 2;
    s += `<circle cx="${f12}" cy="${g.H / 2 - g.rowH * 0.9}" r="5" class="fb-inlay"/><circle cx="${f12}" cy="${g.H / 2 + g.rowH * 0.9}" r="5" class="fb-inlay"/>`;
    for (let f = 1; f <= FRETS; f++) s += `<line x1="${g.fx(f)}" x2="${g.fx(f)}" y1="${g.sy(g.n - 1) - 12}" y2="${g.sy(0) + 12}" class="fb-fret"/>`;
    s += `<rect x="${g.nutX - 4}" y="${g.sy(g.n - 1) - 12}" width="6" height="${g.H - 12}" class="fb-nut"/>`;
    g.t.strings.forEach((m, i) => {
      const active = cfg.mode !== 'quiz' || cfg.strings.includes(i);
      s += `<line x1="${g.nutX}" x2="${g.fx(FRETS) + 8}" y1="${g.sy(i)}" y2="${g.sy(i)}" class="fb-string ${active ? '' : 'dim'}" stroke-width="${1 + (g.n - i) * (cfg.inst === 'bass' ? 0.7 : 0.35)}"/>`;
      s += `<text x="14" y="${g.sy(i) + 4}" class="fb-label">${g.t.labels[i]}</text>`;
    });
    for (let f = 1; f <= FRETS; f++) s += `<text x="${(g.fx(f - 1) + g.fx(f)) / 2}" y="${g.H + 16}" class="fb-num">${f}</text>`;
    // Hit targets
    g.t.strings.forEach((m, i) => {
      for (let f = 0; f <= FRETS; f++) {
        const x0 = f === 0 ? 20 : g.fx(f - 1), x1 = f === 0 ? g.nutX : g.fx(f);
        s += `<rect x="${x0}" y="${g.sy(i) - g.rowH / 2}" width="${x1 - x0}" height="${g.rowH}" class="fb-hit" data-s="${i}" data-f="${f}"><title>${noteName(m + f)}</title></rect>`;
      }
    });
    for (const mk of marks()) {
      const x = mk.f === 0 ? g.nutX - 16 : (g.fx(mk.f - 1) + g.fx(mk.f)) / 2;
      const y = g.sy(mk.si);
      s += `<g class="fb-mark ${mk.root ? 'root' : ''} ${mk.cls || ''}" pointer-events="none"><circle cx="${x}" cy="${y}" r="11"/><text x="${x}" y="${y + 4}">${mk.label}</text></g>`;
    }
    s += '</svg>';
    board.innerHTML = s;
  }

  board.addEventListener('click', e => {
    const hit = e.target.closest('.fb-hit');
    if (!hit) return;
    const si = +hit.dataset.s, f = +hit.dataset.f;
    const midi = TUNINGS[cfg.inst].strings[si] + f;
    pluck(midi + (cfg.inst === 'bass' ? 12 : 0), 0, { gain: 0.5 });
    if (cfg.mode === 'explore') {
      status.textContent = `${TUNINGS[cfg.inst].labels[si]} string, fret ${f}: ${noteName(midi)}${noteName(midi) !== noteName(midi, true) ? ' / ' + noteName(midi, true) : ''}`;
      flash(si, f, noteName(midi));
    } else if (cfg.mode === 'quiz' && quiz.kind === 'find') {
      if (!cfg.strings.includes(si)) { status.textContent = 'Use the highlighted strings.'; return; }
      answer(pc(midi) === quiz.target, { si, f });
    } else if (cfg.mode === 'scales') {
      status.textContent = `${noteName(midi)} — ${intervalLabel(midi - noteIndex(cfg.root))} of ${cfg.root}`;
    }
  });

  function flash(si, f, label) {
    render();
    const g = geometry();
    const x = f === 0 ? g.nutX - 16 : (g.fx(f - 1) + g.fx(f)) / 2;
    const svg = board.querySelector('svg');
    svg.insertAdjacentHTML('beforeend', `<g class="fb-mark root pop" pointer-events="none"><circle cx="${x}" cy="${g.sy(si)}" r="11"/><text x="${x}" y="${g.sy(si) + 4}">${label}</text></g>`);
  }

  // ── Quiz ──
  function nextQuestion() {
    quiz.reveal = null;
    const allowed = cfg.strings.length ? cfg.strings : [0];
    if (quiz.kind === 'find') {
      quiz.target = Math.floor(Math.random() * 12);
      status.innerHTML = '';
      status.append(h('span', { class: 'quiz-prompt' }, 'Find ', h('strong', {}, NOTES[quiz.target])), h('span', { class: 'muted' }, ` on the highlighted string${allowed.length > 1 ? 's' : ''}`));
    } else {
      const si = allowed[Math.floor(Math.random() * allowed.length)];
      const f = Math.floor(Math.random() * 13);
      quiz.pos = { si, f };
      quiz.target = pc(TUNINGS[cfg.inst].strings[si] + f);
      status.innerHTML = '';
      status.append(h('span', { class: 'quiz-prompt' }, 'Name the note at ', h('strong', {}, '?')));
    }
    quiz.start = performance.now();
    render();
    renderControls();
  }

  function answer(correct, pos) {
    const secs = (performance.now() - quiz.start) / 1000;
    quiz.total++;
    if (correct) { quiz.right++; quiz.times.push(secs); }
    if (pos) quiz.reveal = [{ ...pos, label: noteName(TUNINGS[cfg.inst].strings[pos.si] + pos.f), cls: correct ? 'good' : 'bad' }];
    quiz.feedback = correct ? `✓ ${secs.toFixed(1)}s` : `✗ That was ${pos ? noteName(TUNINGS[cfg.inst].strings[pos.si] + pos.f) : '—'}. Answer: ${NOTES[quiz.target]}`;
    render();
    renderControls();
    setTimeout(nextQuestion, correct ? 650 : 1500);
  }

  function renderControls() {
    clear(controls);
    controls.append(
      segmented([['guitar', '🎸 Guitar'], ['bass', '🎵 Bass']], cfg.inst, v => { cfg.inst = v; cfg.strings = cfg.strings.filter(i => i < TUNINGS[v].strings.length); if (!cfg.strings.length) cfg.strings = [0]; render(); renderControls(); }),
      segmented([['explore', 'Explore'], ['scales', 'Scales'], ['quiz', 'Note finder']], cfg.mode, v => { cfg.mode = v; status.textContent = ''; if (v === 'quiz') nextQuestion(); else { render(); renderControls(); } }),
    );
    if (cfg.mode === 'scales') {
      controls.append(h('div', { class: 'row gap wrap' },
        h('select', { 'aria-label': 'Root note', onchange: e => { cfg.root = e.target.value; render(); } }, ...NOTES.map(n => h('option', { value: n, selected: n === cfg.root }, n))),
        h('select', { 'aria-label': 'Scale', onchange: e => { cfg.scale = e.target.value; render(); } }, ...Object.entries(SCALES).map(([k, v]) => h('option', { value: k, selected: k === cfg.scale }, v.name))),
        segmented([['notes', 'Note names'], ['degrees', 'Degrees']], cfg.labels, v => { cfg.labels = v; render(); })));
    }
    if (cfg.mode === 'quiz') {
      const labels = TUNINGS[cfg.inst].labels;
      controls.append(h('div', { class: 'row gap wrap' },
        segmented([['find', 'Find it'], ['name', 'Name it']], quiz.kind, v => { quiz.kind = v; nextQuestion(); }),
        h('div', { class: 'row gap' }, h('span', { class: 'muted small' }, 'Strings:'), ...labels.map((l, i) =>
          h('button', { class: `pill ${cfg.strings.includes(i) ? 'on' : ''}`, 'aria-pressed': String(cfg.strings.includes(i)), onclick: () => {
            cfg.strings = cfg.strings.includes(i) ? cfg.strings.filter(x => x !== i) : [...cfg.strings, i];
            if (!cfg.strings.length) cfg.strings = [i];
            nextQuestion();
          } }, l)))));
      const avg = quiz.times.length ? quiz.times.reduce((a, b) => a + b, 0) / quiz.times.length : 0;
      controls.append(h('div', { class: 'row gap wrap quiz-stats' },
        h('span', {}, `Score ${quiz.right}/${quiz.total}`),
        avg ? h('span', { class: avg < 2 ? 'good' : 'muted' }, `Avg ${avg.toFixed(1)}s ${avg < 2 ? '— under 2s! 🎯' : '(goal: under 2s)'}`) : null,
        quiz.feedback ? h('span', { class: quiz.feedback.startsWith('✓') ? 'good' : 'bad' }, quiz.feedback) : null));
      if (quiz.kind === 'name') {
        controls.append(h('div', { class: 'note-pad' }, ...NOTES.map((n, i) =>
          h('button', { class: 'btn', onclick: () => answer(i === quiz.target, quiz.pos) }, n))));
      }
    }
  }

  renderControls();
  if (cfg.mode === 'quiz') nextQuestion(); else render();
  root.append(h('div', { class: 'fretboard' }, controls, board, status,
    h('p', { class: 'muted small' }, 'Tap any fret to hear it. Bass strings E-A-D-G are the same notes as the guitar\'s lowest four strings — an octave lower.')));
  // Start scrolled to the nut.
  return () => {};
}
