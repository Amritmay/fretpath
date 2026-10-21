import { h, icon, chip, ring, TRACK_META, DAY_LETTER, fmtDate } from '../lib/ui.js';
import { getState, todayISO, update, daysBetween } from '../lib/store.js';
import { buildSession, buildMini, isPracticeDay, weekPreview, rampInfo, currentUnit, currentSong, currentPhase, nextFocus } from '../lib/scheduler.js';
import { weekStats, weeksKept, missedYesterday } from '../lib/actions.js';
import { PHASES } from '../data/curriculum.js';
import { startSession, openTool } from './session.js';
import { recallAvailable } from './recall.js';

export function renderToday(root, go) {
  const s = getState();
  const date = todayISO();
  const p = s.profile;
  const doneToday = s.sessions.filter(x => x.date === date);
  const fullDone = doneToday.some(x => !x.mini);
  const practiceDay = isPracticeDay(s, date);
  const ws = weekStats(s);
  const wk = weeksKept(s);
  const phase = PHASES[currentPhase(s)];
  const hour = new Date().getHours();
  const greet = hour < 5 ? 'Late night jam' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dayNum = daysBetween(p.start, date) + 1;
  const recallDone = s.recall?.[date];
  const canRecall = recallAvailable(s, date);

  const el = h('div', { class: 'today' });

  el.append(h('header', { class: 'page-head' },
    h('div', {},
      h('p', { class: 'muted small' }, new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }), ` · Day ${dayNum}`),
      h('h1', {}, `${greet}${p.name ? ', ' + p.name : ''}`)),
    h('button', { class: 'icon-btn', 'aria-label': 'Settings', onclick: () => go('#/settings') }, icon('settings'))));

  // Week strip
  const preview = weekPreview(s, date);
  el.append(h('div', { class: 'week-strip', 'aria-label': 'This week' }, ...preview.map(d => {
    const isToday = d.date === date;
    const did = d.done?.length > 0;
    const f = d.focus || d.done?.find(x => !x.mini)?.type;
    const m = f ? TRACK_META[f] : null;
    return h('div', { class: `wday ${isToday ? 'today' : ''} ${did ? 'did' : ''} ${d.rest ? 'rest' : ''} ${d.past && !did && d.planned ? 'missed' : ''}` },
      h('span', { class: 'wl' }, DAY_LETTER[new Date(d.date + 'T12:00').getDay()]),
      h('span', { class: `wdot ${m ? m.cls : ''}` }, did ? icon('check', 14) : d.rest ? '·' : m ? m.emoji.slice(0, 2) : ''),
      isToday ? h('span', { class: 'wl small' }, 'today') : null);
  })));

  // Banners
  if (s.run) {
    el.append(h('div', { class: 'banner accent' },
      h('div', {}, h('strong', {}, 'Session in progress'), h('div', { class: 'small' }, `Step ${s.run.idx + 1} of ${s.run.plan.blocks.length}: ${s.run.plan.blocks[s.run.idx].title}`)),
      h('div', { class: 'row gap' },
        h('button', { class: 'btn primary', onclick: () => go('#/session') }, 'Resume'),
        h('button', { class: 'btn ghost', onclick: () => { if (confirm('Discard this session?')) { update(st => { st.run = null; }); go('#/today'); } } }, 'Discard'))));
  } else if (s.pain?.level === 'sharp' && daysBetween(s.pain.date, date) <= 2) {
    el.append(h('div', { class: 'banner warn' }, '🩹 You reported pain recently, so today\'s session is shorter and gentler. Stop if it hurts — rest is part of training.'));
  } else if (!fullDone && missedYesterday(s)) {
    el.append(h('div', { class: 'banner soft' }, h('strong', {}, 'Missed yesterday? No problem. '), 'The rule is "never miss twice". Even the 2-minute version keeps the habit alive.'));
  }

  // Main card
  const main = h('section', { class: 'card hero-card' });
  if (fullDone) {
    const last = doneToday.filter(x => !x.mini).slice(-1)[0];
    main.append(
      h('div', { class: 'row gap' }, chip(last.type), h('span', { class: 'muted small' }, `${last.minutes} min`)),
      h('h2', {}, 'Today\'s session is done ✓'),
      h('p', { class: 'muted' }, 'Great work. Want a little more? Play something you love, or do a quick ear game. Otherwise — rest; your brain keeps working on it overnight.'),
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn', onclick: () => openTool('ear', {}) }, icon('ear'), ' Ear game'),
        canRecall && !recallDone ? h('button', { class: 'btn', onclick: () => go('#/recall') }, '🧠 Recall game') : null,
        h('button', { class: 'btn ghost', onclick: () => startSession(buildSession(getState(), date)) }, icon('plus'), ' Bonus session')));
  } else if (!practiceDay) {
    main.append(
      h('div', { class: 'row gap' }, chip('shared', '🌙 Rest day')),
      h('h2', {}, 'Rest day'),
      h('p', { class: 'muted' }, 'Recovery is part of the plan — fingers and brain consolidate on rest days. Feel like playing anyway? Go for it.'),
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn', onclick: () => startSession(buildSession(getState(), date)) }, icon('play'), ' Practise anyway'),
        canRecall && !recallDone ? h('button', { class: 'btn ghost', onclick: () => go('#/recall') }, '🧠 1-min recall game') : null,
        h('button', { class: 'btn ghost', onclick: () => openTool('ear', {}) }, icon('ear'), ' 5-min ear game')));
  } else {
    const plan = buildSession(s, date);
    const ramp = rampInfo(s, date);
    const meta = TRACK_META[plan.focus];
    main.classList.add(meta.cls);
    main.append(
      h('div', { class: 'row between gap wrap' },
        h('div', { class: 'row gap' }, chip(plan.focus), h('span', { class: 'muted small' }, `${plan.minutes} min · ${plan.blocks.length} steps`)),
        swapControl(plan.focus)),
      h('h2', {}, sessionHeadline(plan)),
      ramp ? h('p', { class: 'muted small' }, `${ramp.reason}: sessions are capped at ${ramp.cap} min until ${fmtDate(ramp.until)}, then grow to your ${p.minutes} min.`) : null,
      h('ol', { class: 'block-list' }, ...plan.blocks.map(b => h('li', { class: (TRACK_META[b.track] || TRACK_META.shared).cls },
        h('span', { class: 'bl-dot' }), h('span', { class: 'grow' }, b.title), h('span', { class: 'muted small' }, `${b.minutes}m`)))),
      canRecall && !recallDone ? h('div', { class: 'recall-teaser' },
        h('span', { class: 'rt-icon' }, '🧠'),
        h('div', { class: 'grow' }, h('strong', {}, 'First: 1-minute recall game'), h('div', { class: 'muted small' }, '5 quick questions on your last session. It warms up your memory before you play.'))) : null,
      recallDone ? h('p', { class: 'muted small' }, `🧠 Recall done: ${recallDone.score}/${recallDone.total}`) : null,
      h('div', { class: 'row gap wrap' },
        canRecall && !recallDone
          ? h('button', { class: 'btn primary big', onclick: () => go('#/recall') }, icon('play'), ' Start with recall')
          : h('button', { class: 'btn primary big', onclick: () => startSession(buildSession(getState(), date, override)) }, icon('play'), ' Start session'),
        canRecall && !recallDone ? h('button', { class: 'btn ghost', onclick: () => startSession(buildSession(getState(), date, override)) }, 'Skip to session') : null,
        h('button', { class: 'btn ghost', onclick: () => startSession(buildMini(getState(), date)) }, icon('timer'), ' Only 2 minutes')),
      p.anchor ? h('p', { class: 'muted small' }, `Your cue: after you ${p.anchor}.`) : null);
  }
  el.append(main);

  // Consistency
  const goalRing = ring(ws.practiced, ws.target, { size: 64, stroke: 7, cls: 't-accent' });
  goalRing.append(h('span', { class: 'ring-label' }, `${ws.practiced}/${ws.target}`));
  el.append(h('section', { class: 'card row gap' },
    goalRing,
    h('div', { class: 'grow' },
      h('strong', {}, ws.practiced >= ws.needed ? 'Week kept ✓' : `${Math.max(0, ws.needed - ws.practiced)} more day${ws.needed - ws.practiced === 1 ? '' : 's'} to keep this week`),
      h('div', { class: 'muted small' }, `One day of slack built in. Weeks kept in a row: ${wk.current}${wk.best > wk.current ? ` (best ${wk.best})` : ''}.`))));

  // Current focus overview
  const gU = currentUnit(s, 'guitar'), bU = currentUnit(s, 'bass'), sU = currentUnit(s, 'shared');
  const gS = currentSong(s, 'guitar'), bS = currentSong(s, 'bass');
  el.append(h('h3', { class: 'section-title' }, 'Where you are ', h('span', { class: 'muted small' }, `Phase ${phase.n}: ${phase.name}`)));
  el.append(h('div', { class: 'focus-grid' },
    focusCard('guitar', gU, gS, go),
    focusCard('bass', bU, bS, go),
    focusCard('shared', sU, null, go)));

  const due = Object.values(s.review).filter(r => r.due <= date).length;
  if (due) el.append(h('p', { class: 'muted small center' }, `🔁 ${due} item${due === 1 ? '' : 's'} due for review — they'll appear inside your sessions.`));

  root.append(el);

  let override = null;
  function swapControl(focus) {
    if (focus !== 'guitar' && focus !== 'bass') return null;
    const other = focus === 'guitar' ? 'bass' : 'guitar';
    return h('button', { class: 'pill', onclick: () => {
      override = other;
      const plan = buildSession(getState(), date, other);
      startSession(plan);
    } }, `Do ${TRACK_META[other].label} instead`);
  }
}

function sessionHeadline(plan) {
  const tech = plan.blocks.find(b => b.kind === 'technique');
  if (plan.focus === 'studio') return 'Studio Day: write & record';
  if (plan.focus === 'dual') return `Guitar + Bass: ${plan.blocks.filter(b => b.kind === 'technique').map(b => b.title).join(' · ')}`;
  return tech ? tech.title : 'Today\'s practice';
}

function focusCard(track, unit, song, go) {
  const m = TRACK_META[track];
  return h('button', { class: `focus-card ${m.cls}`, onclick: () => go('#/path') },
    h('span', { class: 'fc-label' }, `${m.emoji} ${m.label}`),
    h('strong', {}, unit.title),
    song ? h('span', { class: 'muted small' }, `Song: ${song.title}`) : h('span', { class: 'muted small' }, unit.goal));
}

export { nextFocus };
