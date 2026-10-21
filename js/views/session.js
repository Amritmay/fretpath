import { h, icon, clear, chip, sheet, toast, confetti, ring, segmented, TRACK_META } from '../lib/ui.js';
import { getState, update } from '../lib/store.js';
import { beep } from '../lib/audio.js';
import { recordUnitAttempt, advanceUnit, rateReview, setSongStatus, completeSession, logBpm, BADGES } from '../lib/actions.js';
import { allSongs, buildSession, currentUnit } from '../lib/scheduler.js';
import { unitById, ytSearch, songLinks } from '../data/curriculum.js';
import { TOOLS } from '../tools/index.js';
import { VISUALS } from '../data/extras.js';
import { visualsBlock } from '../lib/visuals.js';

export function startSession(plan) {
  update(s => {
    s.run = { plan, idx: 0, startedAt: Date.now(), blockStart: Date.now(), pausedAt: null, pausedTotal: 0, blockPaused: 0, results: {}, ticks: {} };
  });
  location.hash = '#/session';
}

export function openTool(id, opts = {}) {
  const t = TOOLS[id];
  if (!t) return;
  sheet(t.name, body => t.mod.mount(body, opts), { wide: true });
}

export function renderSession(root, go) {
  const s = getState();
  const run = s.run;
  if (!run) { go('#/today'); return () => {}; }
  let timer = null;
  let beeped = false;

  const block = () => run.plan.blocks[run.idx];
  const elapsed = () => {
    const now = run.pausedAt || Date.now();
    return Math.max(0, (now - run.blockStart - run.blockPaused) / 1000);
  };

  function persist() { update(st => { st.run = run; }); }

  function render() {
    clear(root);
    const b = block();
    const meta = TRACK_META[b.track] || TRACK_META.shared;
    const total = b.minutes * 60;
    const left = Math.max(0, total - elapsed());

    const timeText = h('div', { class: 'timer-text' }, fmt(left));
    const timerRing = ring(total - left, total, { size: 132, stroke: 9, cls: meta.cls });
    timerRing.append(timeText);

    const header = h('div', { class: 'run-head' },
      h('button', { class: 'icon-btn', 'aria-label': 'Leave session', onclick: () => { if (confirm('Leave this session? Your place is saved — you can resume from Today.')) go('#/today'); } }, icon('back')),
      h('div', { class: 'run-steps', 'aria-label': `Step ${run.idx + 1} of ${run.plan.blocks.length}` },
        ...run.plan.blocks.map((bb, i) => h('span', { class: `${i < run.idx ? 'done' : ''} ${i === run.idx ? 'now' : ''} ${(TRACK_META[bb.track] || TRACK_META.shared).cls}`, style: { flex: bb.minutes } }))),
      h('span', { class: 'muted small' }, `${run.idx + 1}/${run.plan.blocks.length}`));

    const content = h('div', { class: `run-card ${meta.cls}` });
    if (b.kind === 'log') renderLog(content);
    else renderBlock(content, b, timerRing, timeText);

    root.append(h('div', { class: 'run' }, header, content));

    clearInterval(timer);
    if (b.kind !== 'log') {
      timer = setInterval(() => {
        const l = Math.max(0, total - elapsed());
        timeText.textContent = fmt(l);
        const c = timerRing.querySelectorAll('circle')[1];
        if (c) { const r = +c.getAttribute('r'); const circ = 2 * Math.PI * r; c.setAttribute('stroke-dashoffset', circ * (l / total)); }
        if (l <= 0 && !beeped) { beeped = true; beep(880, 0.2); setTimeout(() => beep(1175, 0.3), 220); timerRing.classList.add('up'); }
      }, 500);
    }
  }

  function renderBlock(c, b, timerRing, timeText) {
    const meta = TRACK_META[b.track] || TRACK_META.shared;
    const ticks = run.ticks[run.idx] || [];
    const kindLabel = { warmup: 'Warm-up', technique: 'Technique', review: 'Review', song: b.review ? 'Song review' : 'Song', apply: 'Apply it', shared: 'Ears · Fretboard · Theory', create: 'Create', break: 'Break', studio: 'Studio' }[b.kind] || '';

    c.append(
      h('div', { class: 'row between wrap gap' }, chip(b.track, `${meta.emoji} ${kindLabel}`), h('span', { class: 'muted small' }, `${b.minutes} min`)),
      h('h1', { class: 'run-title' }, b.title),
      b.artist ? h('div', { class: 'muted' }, b.artist) : null,
      h('p', { class: 'run-goal' }, b.goal),
      b.note ? h('p', { class: 'warn small' }, '⚠️ ', b.note) : null,
      h('div', { class: 'run-timer' },
        timerRing,
        h('div', { class: 'row gap center' },
          h('button', { class: 'btn ghost', onclick: togglePause }, icon(run.pausedAt ? 'play' : 'pause'), run.pausedAt ? ' Resume' : ' Pause'),
          h('button', { class: 'btn ghost', onclick: () => { run.blockStart = Date.now(); run.blockPaused = 0; run.pausedAt = null; beeped = false; persist(); render(); } }, icon('replay'), ' Restart'))),
      visualsBlock(blockVisuals(b)),
      b.steps?.length ? h('ol', { class: 'checklist' }, ...b.steps.map((st, i) =>
        h('li', { class: ticks.includes(i) ? 'ticked' : '', onclick: () => {
          const t = new Set(run.ticks[run.idx] || []);
          t.has(i) ? t.delete(i) : t.add(i);
          run.ticks[run.idx] = [...t];
          persist();
          render();
        } }, h('span', { class: 'tick' }, icon('check', 14)), h('span', {}, st)))) : null,
      b.bpm ? h('p', { class: 'muted small' }, `Tempo goal: start ~${b.bpm[0]} BPM → aim for ${b.bpm[1]} BPM over the coming sessions. Only speed up after 3 clean reps.`) : null,
      h('div', { class: 'row gap wrap' },
        b.tool ? h('button', { class: 'btn', onclick: () => openTool(b.tool.id, { ...b.tool.opts, exercise: b.bpm ? b.unitId : undefined }) }, icon(TOOLS[b.tool.id]?.icon || 'tools'), ` Open ${TOOLS[b.tool.id]?.name}`) : null,
        b.bpm && !b.tool ? h('button', { class: 'btn', onclick: () => openTool('metronome', { bpm: b.bpm[0], exercise: b.unitId }) }, icon('metronome'), ' Metronome') : null,
        b.learn ? h('a', { class: 'btn ghost', href: ytSearch(b.learn), target: '_blank', rel: 'noopener' }, icon('ext'), ' Watch a free lesson') : null,
        b.songId ? songLinks(allSongs(getState()).find(x => x.id === b.songId) || { title: b.title, artist: b.artist || '', inst: b.track }).map(l => h('a', { class: 'btn ghost', href: l.url, target: '_blank', rel: 'noopener' }, icon('ext'), ' ', l.label)) : null),
      h('div', { class: 'run-actions' }, ...finishButtons(b)));
  }

  function finishButtons(b) {
    if (b.kind === 'technique' || b.kind === 'shared') {
      return [
        h('p', { class: 'muted small' }, 'How did it go?'),
        h('div', { class: 'rate-row' },
          rateBtn('😬', 'Struggled', () => rateUnit(b, 'struggled')),
          rateBtn('🙂', 'Getting there', () => rateUnit(b, 'getting')),
          rateBtn('🤩', 'Nailed it', () => rateUnit(b, 'nailed'))),
      ];
    }
    if (b.kind === 'review' || (b.kind === 'song' && b.review)) {
      return [
        h('p', { class: 'muted small' }, 'How solid is it?'),
        h('div', { class: 'rate-row' },
          rateBtn('🫠', 'Lost it', () => { rateReview(b.reviewId || b.songId, 'lost'); next(); }),
          rateBtn('🤔', 'Shaky', () => { rateReview(b.reviewId || b.songId, 'shaky'); next(); }),
          rateBtn('💪', 'Solid', () => { rateReview(b.reviewId || b.songId, 'solid'); next(); })),
      ];
    }
    if (b.kind === 'song') {
      return [
        h('div', { class: 'rate-row' },
          rateBtn('🔁', 'Swap song', () => { setSongStatus(b.songId, 'skipped'); toast('Song skipped — you can bring it back from Path.'); next(); }),
          rateBtn('📖', 'Still learning', () => { if (!getState().songs[b.songId]) setSongStatus(b.songId, 'learning'); next(); }),
          rateBtn('🎉', 'Can play it all!', () => { setSongStatus(b.songId, 'learned'); confetti(); toast(`"${b.title}" added to your songs! 🎉`); next(); })),
      ];
    }
    return [h('button', { class: 'btn primary wide big', onclick: next }, 'Done', ' ', icon('chevron'))];
  }

  function rateBtn(emoji, label, fn) {
    return h('button', { class: 'rate', onclick: fn }, h('span', { class: 'emoji' }, emoji), h('span', {}, label));
  }

  function rateUnit(b, rating) {
    const ready = recordUnitAttempt(b.track, b.unitId, rating);
    run.results[run.idx] = rating;
    if (ready) {
      const u = unitById[b.unitId];
      sheet('Ready to move on? 🎯', (body, close) => {
        const list = getState().progress[b.track];
        body.append(
          h('p', {}, `You've practised "${u.title}" ${list.sessionsOnUnit} times and nailed it today.`),
          h('p', { class: 'muted' }, 'It will come back for review in a few days so it sticks.'),
          h('div', { class: 'row gap wrap' },
            h('button', { class: 'btn primary', onclick: () => {
              advanceUnit(b.track);
              const nu = currentUnit(getState(), b.track);
              toast(`Next up: ${nu.title}`);
              close(); next();
            } }, 'Yes, next skill'),
            h('button', { class: 'btn ghost', onclick: () => { close(); next(); } }, 'One more session')));
      });
    } else next();
  }

  function togglePause() {
    if (run.pausedAt) { run.blockPaused += Date.now() - run.pausedAt; run.pausedTotal += Date.now() - run.pausedAt; run.pausedAt = null; }
    else run.pausedAt = Date.now();
    persist();
    render();
  }

  function next() {
    if (run.pausedAt) togglePause();
    run.idx = Math.min(run.plan.blocks.length - 1, run.idx + 1);
    run.blockStart = Date.now();
    run.blockPaused = 0;
    beeped = false;
    persist();
    render();
    root.scrollTo?.(0, 0);
    window.scrollTo(0, 0);
  }

  function renderLog(c) {
    const bpmBlocks = run.plan.blocks.filter(b => b.bpm && b.unitId);
    const j = { broke: '', tomorrow: '', pain: 'none' };
    const bpmInputs = {};
    c.append(
      chip('shared', '📝 Log & reflect'),
      h('h1', { class: 'run-title' }, 'Nice work. Lock it in.'),
      h('p', { class: 'muted' }, 'Thirty seconds of reflection makes tomorrow\'s practice sharper.'),
      ...bpmBlocks.map(b => h('label', { class: 'field' }, h('span', {}, `Clean tempo today — ${b.title} (BPM)`),
        bpmInputs[b.unitId] = h('input', { type: 'number', inputMode: 'numeric', min: 30, max: 260, placeholder: `e.g. ${b.bpm[0]}` }))),
      h('label', { class: 'field' }, h('span', {}, 'What broke? (the exact spot)'),
        h('input', { type: 'text', placeholder: 'e.g. the change from C to G', oninput: e => { j.broke = e.target.value; } })),
      h('label', { class: 'field' }, h('span', {}, "Tomorrow's target"),
        h('input', { type: 'text', placeholder: 'e.g. C→G clean at 70 BPM', oninput: e => { j.tomorrow = e.target.value; } })),
      h('div', { class: 'field' }, h('span', {}, 'Any pain?'),
        segmented([['none', 'None'], ['sore', 'Sore fingertips'], ['sharp', 'Sharp / wrist pain']], 'none', v => { j.pain = v; painNote.hidden = v !== 'sharp'; })),
      painNote,
      h('button', { class: 'btn primary wide big', onclick: () => finish(j, bpmInputs) }, icon('check'), ' Finish session'));
  }
  const painNote = h('p', { class: 'warn small', hidden: true }, 'Stop for today. Sharp pain, tingling or a wrist/forearm ache isn\'t normal — your next session will be shorter. If it continues, see a doctor or physio.');

  function finish(j, bpmInputs) {
    for (const [id, input] of Object.entries(bpmInputs)) if (+input.value >= 30) logBpm(id, +input.value);
    const real = (Date.now() - run.startedAt - run.pausedTotal) / 60000;
    const plan = run.plan;
    const minutesDone = Math.max(1, Math.min(plan.minutes * 1.5, real));
    const journal = (j.broke || j.tomorrow || j.pain !== 'none') ? { target: '', broke: j.broke, tomorrow: j.tomorrow, pain: j.pain === 'none' ? null : j.pain } : null;
    const earned = completeSession(plan, { minutesDone, journal });
    clearInterval(timer);
    celebrate(plan, Math.round(minutesDone), earned);
  }

  function celebrate(plan, minutes, earned) {
    confetti();
    clear(root);
    const st = getState();
    const nextPlan = buildSession(st);
    root.append(h('div', { class: 'run done-screen' },
      h('div', { class: 'big-emoji' }, plan.mini ? '🌱' : '🎉'),
      h('h1', {}, plan.mini ? 'Habit kept alive!' : 'Session complete!'),
      h('p', { class: 'lead' }, `${minutes} minute${minutes === 1 ? '' : 's'} of focused practice. ${plan.mini ? 'Two minutes beats zero every time.' : 'Practise, then sleep on it — tomorrow often feels easier.'}`),
      earned.length ? h('div', { class: 'badges-earned' }, ...earned.map(id => BADGES[id] ? h('div', { class: 'badge-card pop' }, h('span', { class: 'badge-icon' }, BADGES[id].icon), h('strong', {}, BADGES[id].name), h('span', { class: 'muted small' }, BADGES[id].desc)) : null)) : null,
      h('div', { class: 'card soft' }, h('span', { class: 'muted small' }, 'Next session'), h('div', { class: 'row gap' }, chip(nextPlan.focus), h('strong', {}, `${nextPlan.minutes} min`))),
      h('button', { class: 'btn primary big', onclick: () => go('#/today') }, 'Back to Today')));
  }

  render();
  return () => clearInterval(timer);
}

function blockVisuals(b) {
  if (b.unitId && VISUALS[b.unitId]) return VISUALS[b.unitId];
  if (b.kind === 'warmup' && b.track === 'guitar') return [{ t: 'hand' }];
  if (b.kind === 'warmup' && b.track === 'bass') return [{ t: 'shape', inst: 'bass', shape: 'spider' }];
  if (b.kind === 'studio' && b.track === 'bass') return [{ t: 'shape', inst: 'bass', shape: 'rfo' }];
  if (b.kind === 'studio' && b.title === 'Write the progression') return [{ t: 'diatonic', key: 'G' }];
  if (b.kind === 'studio' && b.title.startsWith('Melody')) return [{ t: 'form', parts: ['V', 'C', 'V', 'C'] }];
  return [];
}

const fmt = secs => { const m = Math.floor(secs / 60), s = Math.floor(secs % 60); return `${m}:${String(s).padStart(2, '0')}`; };
