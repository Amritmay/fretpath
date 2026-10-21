import { h, icon, clear, toast, DAY_SHORT, applyTheme, THEMES } from '../lib/ui.js';
import { getState, update, exportJSON, importJSON, resetAll, todayISO } from '../lib/store.js';
import { describePlan } from '../lib/scheduler.js';
import { TOOLS } from '../tools/index.js';
import { RESOURCES } from '../data/curriculum.js';
import { renderOnboarding } from './onboarding.js';

export function renderTools(root, go, id, query) {
  if (id && TOOLS[id]) {
    const t = TOOLS[id];
    const body = h('div', { class: 'tool-page' });
    root.append(h('div', {},
      h('header', { class: 'page-head' },
        h('div', { class: 'row gap' },
          h('button', { class: 'icon-btn', 'aria-label': 'All tools', onclick: () => go('#/tools') }, icon('back')),
          h('h1', {}, t.name))),
      body));
    return t.mod.mount(body, query);
  }
  root.append(h('div', {},
    h('header', { class: 'page-head' }, h('div', {}, h('p', { class: 'muted small' }, 'Practice tools'), h('h1', {}, 'Your toolbox'))),
    h('div', { class: 'tool-grid' }, ...Object.entries(TOOLS).map(([k, t]) =>
      h('button', { class: 'tool-card', onclick: () => go(`#/tools/${k}`) },
        h('span', { class: 'tool-icon' }, icon(t.icon, 26)),
        h('strong', {}, t.name),
        h('span', { class: 'muted small' }, t.desc)))),
    h('p', { class: 'muted small center' }, 'Sound not playing on iPhone? Turn off silent mode (the switch on the side).')));
}

export function renderSettings(root, go) {
  const s = getState();
  const p = s.profile;
  const days = [1, 2, 3, 4, 5, 6, 0].filter(d => p.days.includes(d)).map(d => DAY_SHORT[d]).join(', ');
  const file = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: async e => {
    const f = e.target.files[0];
    if (!f) return;
    try { importJSON(await f.text()); toast('Backup restored ✓'); go('#/today'); }
    catch (err) { toast(err.message || 'Could not read that file.'); }
  } });

  root.append(h('div', { class: 'settings' },
    h('header', { class: 'page-head' }, h('div', { class: 'row gap' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: () => go('#/today') }, icon('back')),
      h('h1', {}, 'Settings'))),

    h('section', { class: 'card' },
      h('h3', {}, 'Your plan'),
      h('p', {}, h('strong', {}, `${p.days.length} days a week`), ` (${days}) · `, h('strong', {}, `${p.minutes} min`), ' per session'),
      h('ul', { class: 'plan-list muted small' }, ...describePlan(p.days.length, p.minutes).map(l => h('li', {}, l))),
      h('button', { class: 'btn', onclick: () => {
        clear(root);
        renderOnboarding(root, () => { toast('Plan updated — schedule recalculated ✓'); go('#/today'); }, p);
      } }, icon('edit'), ' Change days or session length')),

    h('section', { class: 'card' },
      h('h3', {}, 'Theme'),
      themePicker()),

    h('section', { class: 'card' },
      h('h3', {}, 'Backup & devices'),
      h('p', { class: 'muted small' }, 'Progress is saved on this device only. To move it to your phone or laptop, export a backup here and import it there.'),
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn', onclick: () => {
          const blob = new Blob([exportJSON()], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: `fretpath-backup-${todayISO()}.json` });
          document.body.append(a); a.click(); a.remove();
          toast('Backup downloaded');
        } }, icon('download'), ' Export backup'),
        h('button', { class: 'btn', onclick: () => file.click() }, icon('upload'), ' Import backup'),
        file)),

    h('section', { class: 'card' },
      h('h3', {}, 'About the method'),
      h('p', { class: 'muted small' }, 'See the research behind your daily plan.'),
      h('button', { class: 'btn ghost', onclick: () => go('#/method') }, icon('book'), ' How FretPath teaches')),

    h('section', { class: 'card danger-zone' },
      h('h3', {}, 'Start over'),
      h('p', { class: 'muted small' }, 'Erases all progress on this device. Export a backup first if you might want it back.'),
      h('button', { class: 'btn ghost danger', onclick: () => {
        if (confirm('Erase all progress and start over?') && confirm('Really? This cannot be undone.')) { resetAll(); location.hash = '#/today'; location.reload(); }
      } }, icon('trash'), ' Erase everything'))));
}

function themePicker() {
  const grid = h('div', { class: 'theme-grid', role: 'radiogroup', 'aria-label': 'Theme' });
  const draw = () => {
    clear(grid);
    const cur = getState().settings.theme || 'auto';
    for (const t of THEMES) {
      grid.append(h('button', { class: `theme-card ${cur === t.id ? 'on' : ''}`, role: 'radio', 'aria-checked': String(cur === t.id), onclick: () => {
        update(st => { st.settings.theme = t.id; });
        applyTheme();
        draw();
      } },
        h('span', { class: 'theme-swatch' }, ...t.sw.map(c => h('span', { style: { background: c } }))),
        h('strong', {}, t.name), h('span', { class: 'muted small' }, t.desc)));
    }
  };
  draw();
  return grid;
}

export function renderMethod(root, go) {
  const principle = (emoji, title, text) => h('div', { class: 'principle' }, h('span', { class: 'p-emoji' }, emoji), h('div', {}, h('strong', {}, title), h('p', { class: 'muted small' }, text)));
  root.append(h('div', { class: 'method' },
    h('header', { class: 'page-head' }, h('div', { class: 'row gap' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: () => history.length > 1 ? history.back() : go('#/today') }, icon('back')),
      h('h1', {}, 'How FretPath teaches'))),
    h('p', { class: 'lead' }, 'Built from teacher consensus (JustinGuitar, StudyBass, TalkingBass, BassBuzz, Andy Guitar) and research on how motor skills and habits are learned.'),
    h('div', { class: 'principles' },
      principle('🧭', 'Always know what to do next', 'Beginners mostly quit from not knowing what to practise. Your session is decided for you, in a proven order.'),
      principle('🎯', 'Accuracy beats minutes', 'Studies of skilled musicians found clean, accurate practice predicts progress; total time didn\'t. So you rate quality, track clean BPM, and only speed up after 3 clean reps.'),
      principle('⏱️', 'Short, frequent sessions', 'Spaced practice beats cramming, and much early learning happens during short rests. Sessions start at 10–15 min and grow.'),
      principle('🔀', 'Mix it up', 'Each session rotates technique, a song, ears and creativity. Learned skills come back for review after 1, 3, 7, 14 and 30 days.'),
      principle('⚖️', 'Two instruments, one brain', 'Bass E-A-D-G = guitar\'s low four strings, an octave down. Theory and ear training count for both; the scheduler keeps guitar and bass minutes equal.'),
      principle('👂', 'Ears from day one', 'Hearing notes and chords in a key is what lets you play songs by ear. A few minutes every session, starting now.'),
      principle('✍️', 'Create early', 'A chord loop in month 1, a "bad song" by month 4, Studio Days that turn guitar + bass into your own songs.'),
      principle('🌱', 'No guilt, no broken streaks', 'Broken streaks make people quit. Your goal is weekly with a day of slack, and a 2-minute session always counts.'),
      principle('🩹', 'Protect your hands', 'Always warm up, use minimum pressure, rest one day a week, and the app shortens sessions if you report pain.')),
    h('h2', { class: 'section-title' }, 'Free resources'),
    h('div', { class: 'resources' }, ...RESOURCES.map(g => h('div', { class: 'card' }, h('strong', {}, g.group),
      h('ul', {}, ...g.items.map(([n, u]) => h('li', {}, h('a', { href: u, target: '_blank', rel: 'noopener' }, n, ' ', icon('ext', 12))))))))));
}
