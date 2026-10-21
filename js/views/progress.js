import { h, icon, sparkline, ring, fmtDate, TRACK_META } from '../lib/ui.js';
import { getState, todayISO, addDays, weekStart } from '../lib/store.js';
import { weeksKept, BADGES } from '../lib/actions.js';
import { unitById } from '../data/curriculum.js';
import { allSongs } from '../lib/scheduler.js';

export function renderProgress(root) {
  const s = getState();
  const full = s.sessions.filter(x => !x.mini);
  const totalMin = s.sessions.reduce((a, x) => a + (x.minutes || 0), 0);
  const wk = weeksKept(s);
  const g = s.minutesBy.guitar || 0, b = s.minutesBy.bass || 0;
  const gPct = g + b ? Math.round((g / (g + b)) * 100) : 50;

  const el = h('div', { class: 'progress' });
  el.append(h('header', { class: 'page-head' }, h('div', {}, h('p', { class: 'muted small' }, 'Your progress'), h('h1', {}, 'Every session counts'))));

  el.append(h('div', { class: 'stats' },
    stat(s.sessions.length, 'sessions'),
    stat(totalMin >= 120 ? `${(totalMin / 60).toFixed(1)}h` : `${totalMin}m`, 'practised'),
    stat(wk.current, 'weeks kept in a row'),
    stat(allSongs(s).filter(x => s.songs[x.id]?.status === 'learned').length, 'songs learned')));

  // Balance
  el.append(h('section', { class: 'card' },
    h('div', { class: 'row between' }, h('strong', {}, 'Instrument balance'), h('span', { class: 'muted small' }, 'kept even automatically')),
    h('div', { class: 'balance' },
      h('span', { class: 'bal-g', style: { width: gPct + '%' } }),
      h('span', { class: 'bal-b', style: { width: (100 - gPct) + '%' } })),
    h('div', { class: 'row between small' },
      h('span', { class: 't-guitar' }, `🎸 Guitar ${g} min`),
      h('span', { class: 't-bass' }, `Bass ${b} min 🎵`))));

  // Calendar heatmap (last 12 weeks)
  const start = addDays(weekStart(todayISO()), -7 * 11);
  const byDay = {};
  for (const x of s.sessions) byDay[x.date] = (byDay[x.date] || 0) + (x.minutes || 1);
  const cal = h('div', { class: 'heat', role: 'img', 'aria-label': 'Practice calendar for the last 12 weeks' });
  for (let w = 0; w < 12; w++) {
    const col = h('div', { class: 'heat-col' });
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      const m = byDay[date] || 0;
      const lvl = m === 0 ? 0 : m < 10 ? 1 : m < 20 ? 2 : m < 35 ? 3 : 4;
      col.append(h('span', { class: `heat-cell l${lvl} ${date > todayISO() ? 'future' : ''}`, title: `${fmtDate(date)}: ${m} min` }));
    }
    cal.append(col);
  }
  el.append(h('section', { class: 'card' }, h('div', { class: 'row between' }, h('strong', {}, 'Last 12 weeks'), h('span', { class: 'muted small' }, `best run: ${wk.best} weeks`)), cal));

  // Tempo records
  const bpmRows = Object.entries(s.bpm).filter(([, v]) => v.length);
  el.append(h('section', { class: 'card' },
    h('strong', {}, 'Clean-tempo records'),
    bpmRows.length ? h('div', { class: 'list' }, ...bpmRows.map(([id, v]) => {
      const u = unitById[id];
      const vals = v.map(e => e.bpm);
      return h('div', { class: `list-item ${TRACK_META[u?.track]?.cls || ''}` },
        h('div', { class: 'grow' }, h('strong', {}, u?.title || id), h('div', { class: 'muted small' }, `${v.length} logs · first ${vals[0]} BPM`)),
        sparkline(vals.slice(-20)),
        h('strong', { class: 'big-num' }, Math.max(...vals)));
    })) : h('p', { class: 'muted small' }, 'Log a clean BPM at the end of a session (or in the Metronome) to see your speed grow.')));

  // Chord changes
  const ch = Object.entries(s.changes);
  if (ch.length) {
    el.append(h('section', { class: 'card' }, h('strong', {}, 'One Minute Changes'),
      h('div', { class: 'list' }, ...ch.map(([pair, v]) => {
        const vals = v.map(e => e.count);
        return h('div', { class: 'list-item t-guitar' }, h('strong', { class: 'grow' }, pair), sparkline(vals.slice(-15)), h('strong', { class: 'big-num' }, Math.max(...vals)));
      }))));
  }

  // Ear training
  const modes = { intervals: 'Intervals', chords: 'Chords', degrees: 'Scale degrees', progressions: 'Progressions' };
  const ear = Object.entries(modes).filter(([k]) => s.ear[k]);
  if (ear.length) {
    el.append(h('section', { class: 'card' }, h('strong', {}, 'Ear training'),
      h('div', { class: 'ear-stats' }, ...ear.map(([k, name]) => {
        const e = s.ear[k];
        const acc = e.total ? Math.round(100 * e.correct / e.total) : 0;
        const r = ring(acc, 100, { size: 64, stroke: 6, cls: 't-shared' });
        r.append(h('span', { class: 'ring-label' }, `${acc}%`));
        return h('div', { class: 'ear-stat' }, r, h('strong', {}, name), h('span', { class: 'muted small' }, `Level ${e.level} · ${e.total} answered`));
      }))));
  }

  // Songs
  const learned = allSongs(s).filter(x => s.songs[x.id]?.status === 'learned');
  el.append(h('section', { class: 'card' }, h('strong', {}, 'Songs I can play'),
    learned.length ? h('div', { class: 'song-chips' }, ...learned.map(x => h('span', { class: `chip ${TRACK_META[x.inst].cls}` }, `${TRACK_META[x.inst].emoji} ${x.title}`)))
      : h('p', { class: 'muted small' }, 'Your first full song is usually 4–8 weeks away. It\'s worth it.')));

  // Badges
  const earned = Object.entries(s.badges).sort((a, b) => b[1].localeCompare(a[1]));
  const upcoming = ['first-session', 'week-1', 'sessions-10', 'calluses', 'song-guitar', 'song-bass', 'changes-30', 'first-idea', 'studio', 'week-4', 'ear-level', 'songs-5', 'week-12'].filter(id => !s.badges[id]).slice(0, 4);
  el.append(h('section', { class: 'card' }, h('strong', {}, 'Milestones'),
    h('div', { class: 'badges' },
      ...earned.map(([id, date]) => BADGES[id] ? h('div', { class: 'badge-card' }, h('span', { class: 'badge-icon' }, BADGES[id].icon), h('strong', {}, BADGES[id].name), h('span', { class: 'muted small' }, fmtDate(date))) : null),
      ...upcoming.map(id => h('div', { class: 'badge-card locked' }, h('span', { class: 'badge-icon' }, BADGES[id].icon), h('strong', {}, BADGES[id].name), h('span', { class: 'muted small' }, BADGES[id].desc))))));

  // Journal
  if (s.journal.length) {
    el.append(h('section', { class: 'card' }, h('strong', {}, 'Practice journal'),
      h('div', { class: 'list' }, ...s.journal.slice(0, 15).map(j => h('div', { class: 'list-item col' },
        h('span', { class: 'muted small' }, fmtDate(j.date), j.pain ? ` · ${j.pain === 'sharp' ? '🩹 pain' : 'sore fingertips'}` : ''),
        j.broke ? h('span', {}, h('strong', {}, 'Broke: '), j.broke) : null,
        j.tomorrow ? h('span', {}, h('strong', {}, 'Next: '), j.tomorrow) : null)))));
  }

  el.append(h('section', { class: 'card soft' },
    h('strong', {}, '🎙️ Monthly "then vs now"'),
    h('p', { class: 'muted small' }, 'Once a month, record 30–60 seconds of the same riff or song on your phone. Listening back to month 1 in month 4 is the best motivation there is.')));

  root.append(el);
}

const stat = (v, label) => h('div', { class: 'stat card' }, h('strong', {}, v), h('span', { class: 'muted small' }, label));
