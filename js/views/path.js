import { h, icon, clear, chip, sheet, toast, TRACK_META } from '../lib/ui.js';
import { getState } from '../lib/store.js';
import { PHASES, UNITS, trackUnits, ytSearch, songLinks } from '../data/curriculum.js';
import { currentPhase, allSongs, currentSong, unitDoneIds } from '../lib/scheduler.js';
import { toggleCheck, jumpToUnit, setSongStatus, addCustomSong, removeCustomSong } from '../lib/actions.js';
import { openTool } from './session.js';
import { TOOLS } from '../tools/index.js';
import { VISUALS } from '../data/extras.js';
import { visualsBlock } from '../lib/visuals.js';

export function renderPath(root) {
  const el = h('div', { class: 'path' });
  let open = null;

  function render() {
    clear(el);
    const s = getState();
    const cur = currentPhase(s);
    if (open === null) open = cur;
    const done = unitDoneIds(s);
    const curIds = new Set(['guitar', 'bass', 'shared'].map(t => trackUnits(t)[s.progress[t].unit]?.id));

    el.append(h('header', { class: 'page-head' }, h('div', {},
      h('p', { class: 'muted small' }, 'Your learning path'),
      h('h1', {}, `Phase ${cur}: ${PHASES[cur].name}`))));

    el.append(h('p', { class: 'muted' }, 'Three tracks move forward together. You advance a skill when you\'ve practised it enough times and rate it "Nailed it". Already know something? Tap it to skip ahead.'));

    const timeline = h('div', { class: 'timeline' });
    for (const ph of PHASES) {
      const units = UNITS.filter(u => u.phase === ph.n);
      const nDone = units.filter(u => done.has(u.id)).length;
      const pct = units.length ? Math.round((nDone / units.length) * 100) : 0;
      const state = ph.n < cur ? 'past' : ph.n === cur ? 'now' : 'future';
      const isOpen = open === ph.n;
      const item = h('div', { class: `phase ${state} ${isOpen ? 'open' : ''}` },
        h('button', { class: 'phase-head', 'aria-expanded': String(isOpen), onclick: () => { open = isOpen ? -1 : ph.n; render(); } },
          h('span', { class: 'phase-node' }, ph.n < cur || pct === 100 ? icon('check', 16) : ph.n),
          h('span', { class: 'grow' },
            h('strong', {}, ph.name), h('span', { class: 'muted small' }, ` · ${ph.when}`),
            h('span', { class: 'phase-bar' }, h('span', { style: { width: pct + '%' } }))),
          icon('chevron', 18, 'chev')));
      if (isOpen) {
        item.append(h('div', { class: 'phase-body' },
          h('p', { class: 'muted' }, ph.blurb),
          h('div', { class: 'tracks' }, ...['guitar', 'bass', 'shared'].map(t => {
            const list = units.filter(u => u.track === t);
            if (!list.length) return null;
            return h('div', { class: `track-col ${TRACK_META[t].cls}` },
              h('h4', {}, `${TRACK_META[t].emoji} ${TRACK_META[t].label}`),
              h('ul', { class: 'unit-list' }, ...list.map(u => {
                const st = done.has(u.id) ? 'done' : curIds.has(u.id) ? 'current' : 'locked';
                return h('li', {}, h('button', { class: `unit ${st}`, onclick: () => unitSheet(u, st, render) },
                  h('span', { class: 'u-dot' }, st === 'done' ? icon('check', 12) : ''),
                  h('span', { class: 'grow' }, u.title),
                  st === 'current' ? h('span', { class: 'chip tiny' }, 'now') : null));
              })));
          })),
          h('div', { class: 'checkpoints' },
            h('h4', {}, '✅ Checkpoint — tick when you can do these'),
            ...ph.checks.map((c, i) => {
              const k = `${ph.n}:${i}`;
              return h('label', { class: 'check-row' },
                h('input', { type: 'checkbox', checked: !!s.checks[k], onchange: () => { toggleCheck(ph.n, i); } }),
                h('span', {}, c));
            }))));
      }
      timeline.append(item);
    }
    el.append(timeline);

    // Songs
    el.append(h('h2', { class: 'section-title' }, 'Song ladder'));
    el.append(h('p', { class: 'muted' }, 'Songs unlock as you learn the skills they need. Add any song you love — that\'s how you get to "play any song".'));
    el.append(h('div', { class: 'songs-grid' }, songColumn('guitar', render), songColumn('bass', render)));
    el.append(h('div', { class: 'card soft' },
      h('h3', {}, 'Add your own song'),
      addSongForm(render)));
  }

  render();
  root.append(el);
}

function unitSheet(u, st, rerender) {
  sheet(u.title, (body, close) => {
    body.append(
      h('div', { class: 'row gap wrap' }, chip(u.track), h('span', { class: 'muted small' }, `Phase ${u.phase} · practise at least ${u.min} session${u.min === 1 ? '' : 's'}`)),
      h('p', { class: 'lead' }, u.goal),
      visualsBlock(VISUALS[u.id]),
      h('ol', { class: 'steps' }, ...u.steps.map(x => h('li', {}, x))),
      u.bpm ? h('p', { class: 'muted small' }, `Tempo goal: ${u.bpm[0]} → ${u.bpm[1]} BPM`) : null,
      h('div', { class: 'row gap wrap' },
        u.tool ? h('button', { class: 'btn', onclick: () => { close(); openTool(u.tool.id, u.tool.opts); } }, icon(TOOLS[u.tool.id].icon), ` ${TOOLS[u.tool.id].name}`) : null,
        u.learn ? h('a', { class: 'btn ghost', href: ytSearch(u.learn), target: '_blank', rel: 'noopener' }, icon('ext'), ' Free lesson') : null),
      h('hr'),
      st === 'current' ? h('p', { class: 'muted small' }, 'This is your current skill on this track.') : null,
      st !== 'current' ? h('button', { class: 'btn', onclick: () => { jumpToUnit(u.track, u.id); toast(`Now practising: ${u.title}`); close(); rerender(); } },
        st === 'done' ? 'Go back and practise this' : 'Skip ahead to this skill') : null,
      st === 'current' ? h('button', { class: 'btn ghost', onclick: () => {
        const list = trackUnits(u.track);
        const i = list.findIndex(x => x.id === u.id);
        if (list[i + 1]) { jumpToUnit(u.track, list[i + 1].id); toast('Marked as known — moved on.'); }
        close(); rerender();
      } }, 'I already know this — skip') : null);
  });
}

function songColumn(inst, rerender) {
  const s = getState();
  const done = unitDoneIds(s);
  const cur = currentSong(s, inst);
  const songs = allSongs(s).filter(x => x.inst === inst);
  return h('div', { class: `track-col ${TRACK_META[inst].cls}` },
    h('h4', {}, `${TRACK_META[inst].emoji} ${TRACK_META[inst].label}`),
    h('ul', { class: 'unit-list' }, ...songs.map(song => {
      const rec = s.songs[song.id];
      const unlocked = !song.after || done.has(song.after);
      const st = rec?.status === 'learned' ? 'done' : cur?.id === song.id ? 'current' : rec?.status === 'skipped' ? 'skipped' : unlocked ? 'open' : 'locked';
      return h('li', {}, h('button', { class: `unit ${st}`, onclick: () => songSheet(song, st, rerender) },
        h('span', { class: 'u-dot' }, st === 'done' ? icon('check', 12) : st === 'locked' ? icon('lock', 11) : ''),
        h('span', { class: 'grow' }, song.title, h('span', { class: 'muted small' }, ` · ${song.artist}`)),
        st === 'current' ? h('span', { class: 'chip tiny' }, 'now') : null));
    })));
}

function songSheet(song, st, rerender) {
  sheet(song.title, (body, close) => {
    const req = song.after ? UNITS.find(u => u.id === song.after) : null;
    body.append(
      h('p', { class: 'muted' }, song.artist),
      h('p', { class: 'lead' }, song.skill),
      song.note ? h('p', { class: 'warn small' }, '⚠️ ', song.note) : null,
      st === 'locked' && req ? h('p', { class: 'muted small' }, `Unlocks after: ${req.title}. You can start it now anyway.`) : null,
      h('div', { class: 'row gap wrap' }, ...songLinks(song).map(l => h('a', { class: 'btn ghost', href: l.url, target: '_blank', rel: 'noopener' }, icon('ext'), ' ', l.label))),
      h('hr'),
      h('div', { class: 'row gap wrap' },
        st !== 'current' && st !== 'done' ? h('button', { class: 'btn primary', onclick: () => { setSongStatus(song.id, 'learning'); toast(`"${song.title}" is now your ${song.inst} song`); close(); rerender(); } }, 'Learn this next') : null,
        st !== 'done' ? h('button', { class: 'btn', onclick: () => { setSongStatus(song.id, 'learned'); toast('Added to your songs 🎉'); close(); rerender(); } }, icon('check'), ' I can play it') : null,
        st === 'done' || st === 'skipped' ? h('button', { class: 'btn ghost', onclick: () => { setSongStatus(song.id, null); close(); rerender(); } }, 'Reset') : null,
        song.custom ? h('button', { class: 'btn ghost danger', onclick: () => { removeCustomSong(song.id); close(); rerender(); } }, icon('trash'), ' Remove') : null));
  });
}

function addSongForm(rerender) {
  const f = { inst: 'guitar', title: '', artist: '' };
  const title = h('input', { type: 'text', placeholder: 'Song title', oninput: e => { f.title = e.target.value; } });
  const artist = h('input', { type: 'text', placeholder: 'Artist', oninput: e => { f.artist = e.target.value; } });
  const inst = h('select', { onchange: e => { f.inst = e.target.value; } }, h('option', { value: 'guitar' }, '🎸 Guitar'), h('option', { value: 'bass' }, '🎵 Bass'));
  return h('form', { class: 'row gap wrap', onsubmit: e => {
    e.preventDefault();
    if (!f.title.trim()) { title.focus(); return; }
    const id = addCustomSong({ ...f, title: f.title.trim(), artist: f.artist.trim() });
    setSongStatus(id, 'learning');
    toast(`Added "${f.title}" — it's now your ${f.inst} song`);
    rerender();
  } }, title, artist, inst, h('button', { class: 'btn primary', type: 'submit' }, icon('plus'), ' Add'));
}
