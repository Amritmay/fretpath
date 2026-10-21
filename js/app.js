// App shell + hash router.
import { h, icon, clear, applyTheme } from './lib/ui.js';
import { getState } from './lib/store.js';
import { renderOnboarding } from './views/onboarding.js';
import { renderToday } from './views/today.js';
import { renderSession } from './views/session.js';
import { renderRecall } from './views/recall.js';
import { renderPath } from './views/path.js';
import { renderProgress } from './views/progress.js';
import { renderTools, renderSettings, renderMethod } from './views/misc.js';

const NAV = [
  ['today', 'Today', 'today'],
  ['path', 'Path', 'path'],
  ['tools', 'Tools', 'tools'],
  ['progress', 'Progress', 'progress'],
];

const app = document.getElementById('app');
const main = h('main', { id: 'main', tabIndex: -1 });
const nav = h('nav', { class: 'tabbar', 'aria-label': 'Main' });
let cleanup = null;

function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

function parse() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(qs || ''));
  return { view: parts[0] || 'today', id: parts[1], query };
}

function renderNav(active) {
  clear(nav);
  nav.append(h('div', { class: 'brand' }, h('span', { class: 'brand-mark' }, '◆'), h('span', {}, 'FretPath')));
  for (const [key, label, ic] of NAV) {
    nav.append(h('a', { href: `#/${key}`, class: `tab ${active === key ? 'on' : ''}`, 'aria-current': active === key ? 'page' : null },
      icon(ic, 22), h('span', {}, label)));
  }
}

function route() {
  cleanup?.();
  cleanup = null;
  clear(main);
  const s = getState();
  const { view, id, query } = parse();

  if (!s.profile) {
    document.body.classList.add('no-nav');
    renderOnboarding(main, () => go('#/today'));
    return;
  }

  const inSession = view === 'session' || view === 'recall';
  document.body.classList.toggle('no-nav', inSession);
  renderNav(['settings', 'method'].includes(view) ? 'today' : view);

  const views = {
    today: () => renderToday(main, go),
    session: () => renderSession(main, go),
    recall: () => renderRecall(main, go, query),
    path: () => renderPath(main, go),
    tools: () => renderTools(main, go, id, query),
    progress: () => renderProgress(main, go),
    settings: () => renderSettings(main, go),
    method: () => renderMethod(main, go),
  };
  const res = (views[view] || views.today)();
  if (typeof res === 'function') cleanup = res;
  if (!inSession) window.scrollTo(0, 0);
}

applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
app.append(nav, main);
window.addEventListener('hashchange', route);
route();

// Re-render Today when the date rolls over while the app stays open.
let lastDay = new Date().toDateString();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && new Date().toDateString() !== lastDay) {
    lastDay = new Date().toDateString();
    if (parse().view === 'today') route();
  }
});

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
