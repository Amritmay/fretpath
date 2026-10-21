import { h, icon, clear, toast, confetti, sparkline } from '../lib/ui.js';
import { beep } from '../lib/audio.js';
import { getState } from '../lib/store.js';
import { logChanges } from '../lib/actions.js';

export const CHORD_PAIRS = ['A–D', 'E–A', 'E–D', 'Em–Am', 'Am–E', 'Dm–Am', 'D–Dm', 'C–Am', 'G–C', 'G–D', 'C–G', 'Em–G', 'D–Em', 'Am–C', 'F–C', 'G–Em', 'C–D', 'A–E', 'F(barre)–C', 'F(barre)–G'];

export function mount(root, opts = {}) {
  let pair = opts.pair || (Object.keys(getState().changes).slice(-1)[0]) || 'A–D';
  let count = 0, left = 60, timer = null, phase = 'idle';

  const area = h('div', { class: 'omc' });

  function render() {
    clear(area);
    const hist = (getState().changes[pair] || []).map(e => e.count);
    const best = hist.length ? Math.max(...hist) : 0;
    area.append(
      h('div', { class: 'row gap wrap' },
        h('label', { class: 'field grow' }, h('span', {}, 'Chord pair'),
          h('select', { disabled: phase !== 'idle', onchange: e => { pair = e.target.value; render(); } },
            ...CHORD_PAIRS.map(p => h('option', { value: p, selected: p === pair }, p)))),
        h('div', { class: 'stat' }, h('span', { class: 'muted small' }, 'Best'), h('strong', {}, best || '–')),
        hist.length > 1 ? h('div', { class: 't-guitar' }, sparkline(hist.slice(-15))) : null),
      phase === 'idle'
        ? h('div', { class: 'omc-idle' },
            h('p', {}, 'Strum each chord once, then change. Count only ', h('strong', {}, 'clean'), ' changes. Tap the big button every time you land a chord.'),
            h('button', { class: 'btn primary big', onclick: start }, icon('play'), ` Start 60 seconds`),
            h('p', { class: 'muted small' }, 'First tries are usually 6–9. Aim for 30 to move on; 60 is the long-term goal.'))
        : phase === 'count'
          ? h('div', { class: 'omc-run' },
              timeEl = h('div', { class: 'omc-time' }, timeText()),
              tapBtn = h('button', { class: 'omc-tap', disabled: left > 60, onpointerdown: e => { e.preventDefault(); if (left <= 60) { count++; tapEl.textContent = count; } } },
                h('span', { class: 'muted small' }, pair), tapEl = h('strong', {}, count), h('span', { class: 'muted small' }, 'tap per clean change')),
              h('button', { class: 'btn ghost', onclick: stop }, 'Cancel'))
          : h('div', { class: 'omc-done' },
              h('div', { class: 'omc-result' }, h('strong', {}, count), h('span', {}, 'changes')),
              h('div', { class: 'row gap center' },
                h('button', { class: 'btn', onclick: () => { count = Math.max(0, count - 1); render(); } }, icon('minus')),
                h('button', { class: 'btn', onclick: () => { count++; render(); } }, icon('plus'))),
              h('div', { class: 'row gap center mt' },
                h('button', { class: 'btn primary', onclick: saveIt }, icon('check'), ' Save'),
                h('button', { class: 'btn ghost', onclick: () => { phase = 'idle'; render(); } }, 'Discard'))));
  }
  let tapEl, timeEl, tapBtn;
  const timeText = () => left > 60 ? `Get ready… ${left - 60}` : `${left}s`;

  function start() {
    count = 0; left = 63; phase = 'count';
    render();
    beep(660, 0.12);
    timer = setInterval(() => {
      left--;
      if (left > 60) beep(660, 0.12);
      else if (left === 60) beep(1320, 0.3);
      if (left <= 0) { clearInterval(timer); timer = null; beep(1320, 0.5); phase = 'done'; render(); return; }
      timeEl.textContent = timeText();
      tapBtn.disabled = left > 60;
    }, 1000);
  }

  function stop() { clearInterval(timer); timer = null; phase = 'idle'; render(); }

  function saveIt() {
    const prevBest = Math.max(0, ...(getState().changes[pair] || []).map(e => e.count));
    logChanges(pair, count);
    if (count > prevBest && prevBest > 0) { confetti(); toast(`New best on ${pair}: ${count}! 🎉`); }
    else toast(`Saved ${count} changes on ${pair}`);
    phase = 'idle';
    render();
  }

  render();
  root.append(area);
  return () => clearInterval(timer);
}
