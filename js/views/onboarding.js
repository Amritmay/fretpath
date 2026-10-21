import { h, clear, icon, DAY_SHORT } from '../lib/ui.js';
import { update, todayISO } from '../lib/store.js';
import { describePlan } from '../lib/scheduler.js';

export const SUGGESTED_DAYS = { 1: [6], 2: [1, 4], 3: [1, 3, 5], 4: [1, 3, 5, 6], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6] };
export const MINUTE_OPTIONS = [10, 15, 20, 30, 45, 60];
const ANCHORS = ['finish dinner', 'get home', 'make my morning coffee', 'finish work', 'brush my teeth at night'];

export function renderOnboarding(root, done, existing = null) {
  const data = existing
    ? { ...existing, days: [...existing.days] }
    : { name: '', count: 5, days: SUGGESTED_DAYS[5], minutes: 20, anchor: 'finish dinner' };
  if (existing) data.count = existing.days.length;
  let step = existing ? 1 : 0;

  const steps = [welcome, howMany, whichDays, howLong, anchor, summary];

  function render() {
    clear(root);
    const card = h('div', { class: 'onb-card' });
    root.append(h('div', { class: 'onb' },
      h('div', { class: 'onb-progress' }, ...steps.map((_, i) => h('span', { class: i <= step ? 'on' : '' }))),
      card));
    steps[step](card);
    card.querySelector('input,button.primary')?.focus?.({ preventScroll: true });
  }

  const nav = (canNext = true, label = 'Next') => h('div', { class: 'onb-nav' },
    step > (existing ? 1 : 0) ? h('button', { class: 'btn ghost', onclick: () => { step--; render(); } }, icon('back'), ' Back') : h('span'),
    h('button', { class: 'btn primary', disabled: !canNext, onclick: () => { step++; render(); } }, label, ' ', icon('chevron')));

  function welcome(c) {
    c.append(
      h('div', { class: 'onb-hero' }, h('div', { class: 'logo-big' }, '🎸', h('span', {}, '🎵'))),
      h('h1', {}, 'Welcome to FretPath'),
      h('p', { class: 'lead' }, 'A daily practice coach for electric guitar and bass. Every day you get a short, specific plan — technique, a real song, ear training and a little songwriting — so you improve steadily without wondering what to practise.'),
      h('label', { class: 'field' }, h('span', {}, 'What should I call you?'),
        h('input', { type: 'text', value: data.name, placeholder: 'Your name (optional)', autocomplete: 'given-name', oninput: e => { data.name = e.target.value.trim(); }, onkeydown: e => { if (e.key === 'Enter') { step++; render(); } } })),
      nav(true, "Let's build your plan"));
  }

  function howMany(c) {
    c.append(
      h('h2', {}, 'How many days a week do you want to practise?'),
      h('p', { class: 'muted' }, 'Be realistic — 5 short days beat 2 long ones. One day of slack is built in every week, so a single miss never breaks your progress.'),
      h('div', { class: 'big-choices' }, ...[2, 3, 4, 5, 6, 7].map(n =>
        h('button', { class: `big-choice ${data.count === n ? 'on' : ''}`, onclick: () => { data.count = n; data.days = [...SUGGESTED_DAYS[n]]; render(); } },
          h('strong', {}, n), h('span', { class: 'small' }, n === 7 ? 'every day' : 'days')))),
      nav());
  }

  function whichDays(c) {
    const order = [1, 2, 3, 4, 5, 6, 0];
    c.append(
      h('h2', {}, 'Which days?'),
      h('p', { class: 'muted' }, `I've spread ${data.count} days across the week so your hands get recovery time. Tap to change.`),
      h('div', { class: 'day-picker' }, ...order.map(d =>
        h('button', { class: `day ${data.days.includes(d) ? 'on' : ''}`, 'aria-pressed': String(data.days.includes(d)), onclick: () => {
          data.days = data.days.includes(d) ? data.days.filter(x => x !== d) : [...data.days, d];
          data.count = data.days.length;
          render();
        } }, DAY_SHORT[d]))),
      h('p', { class: 'muted small' }, `${data.days.length} day${data.days.length === 1 ? '' : 's'} selected. The other days are rest days (you can still practise if you feel like it).`),
      nav(data.days.length > 0));
  }

  function howLong(c) {
    c.append(
      h('h2', {}, 'How long per session?'),
      h('p', { class: 'muted' }, 'Pick what you can do on a normal day, once you\'re settled in. The app starts shorter while your fingertips toughen up (max 15 min for weeks 1–4, 25 min until week 12), then grows to this.'),
      h('div', { class: 'big-choices' }, ...MINUTE_OPTIONS.map(m =>
        h('button', { class: `big-choice ${data.minutes === m ? 'on' : ''}`, onclick: () => { data.minutes = m; render(); } },
          h('strong', {}, m), h('span', { class: 'small' }, 'min')))),
      h('div', { class: 'card soft' }, h('strong', {}, 'How this splits your time'), h('ul', {}, ...describePlan(data.days.length, data.minutes).map(l => h('li', {}, l)))),
      nav());
  }

  function anchor(c) {
    c.append(
      h('h2', {}, 'Anchor it to your routine'),
      h('p', { class: 'muted' }, 'Habits stick when they follow something you already do. Research shows specific "after X, I do Y" plans make you much more likely to follow through.'),
      h('div', { class: 'anchor-sentence' }, 'After I ',
        h('input', { type: 'text', value: data.anchor, 'aria-label': 'Anchor routine', oninput: e => { data.anchor = e.target.value; } }),
        ', I\'ll pick up my instrument.'),
      h('div', { class: 'row gap wrap' }, ...ANCHORS.map(a => h('button', { class: `pill ${a === data.anchor ? 'on' : ''}`, onclick: () => { data.anchor = a; render(); } }, a))),
      h('p', { class: 'muted small' }, 'Tip: keep the guitar and bass out of their cases, on a stand, where you\'ll see them.'),
      nav());
  }

  function summary(c) {
    const names = [1, 2, 3, 4, 5, 6, 0].filter(d => data.days.includes(d)).map(d => DAY_SHORT[d]).join(', ');
    c.append(
      h('h2', {}, existing ? 'Update your plan' : 'Your plan'),
      h('div', { class: 'summary-grid' },
        h('div', { class: 'stat' }, h('strong', {}, data.days.length), h('span', { class: 'muted small' }, 'days / week')),
        h('div', { class: 'stat' }, h('strong', {}, data.minutes), h('span', { class: 'muted small' }, 'min / session')),
        h('div', { class: 'stat' }, h('strong', {}, '50 / 50'), h('span', { class: 'muted small' }, 'guitar / bass'))),
      h('p', {}, h('strong', {}, 'Days: '), names),
      h('ul', { class: 'plan-list' }, ...describePlan(data.days.length, data.minutes).map(l => h('li', {}, l))),
      existing ? null : h('p', { class: 'muted' }, 'Your first sessions are about 12–15 minutes: tuning, posture, your first chord and steady bass plucking. Sore fingertips in week 1 are normal and fade in 2–4 weeks.'),
      h('div', { class: 'onb-nav' },
        h('button', { class: 'btn ghost', onclick: () => { step--; render(); } }, icon('back'), ' Back'),
        h('button', { class: 'btn primary', onclick: finish }, existing ? 'Save plan' : 'Start learning 🎸')));
  }

  function finish() {
    update(s => {
      s.profile = {
        name: data.name || '',
        start: existing?.start || todayISO(),
        days: [...data.days].sort(),
        minutes: data.minutes,
        anchor: data.anchor || '',
      };
    });
    done();
  }

  render();
}
