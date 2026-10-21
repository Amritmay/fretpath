import { h, icon, segmented, clear } from '../lib/ui.js';
import { audio, pluck } from '../lib/audio.js';
import { TUNINGS, noteName, freqToMidi, midiToFreq } from '../lib/music.js';

// Autocorrelation pitch detection (ACF2+ style).
function detectPitch(buf, sr, minF = 30) {
  let size = buf.length;
  let rms = 0;
  for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / size);
  if (rms < 0.008) return -1;
  // Trim quiet edges.
  let r1 = 0, r2 = size - 1;
  const thr = 0.2;
  for (let i = 0; i < size / 2; i++) if (Math.abs(buf[i]) < thr) { r1 = i; break; }
  for (let i = 1; i < size / 2; i++) if (Math.abs(buf[size - i]) < thr) { r2 = size - i; break; }
  const b = buf.slice(r1, r2);
  size = b.length;
  const maxLag = Math.min(size - 1, Math.floor(sr / minF));
  const c = new Float32Array(maxLag);
  for (let lag = 0; lag < maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < size - lag; i++) sum += b[i] * b[i + lag];
    c[lag] = sum;
  }
  let d = 0;
  while (d < maxLag - 1 && c[d] > c[d + 1]) d++;
  let maxV = -1, maxP = -1;
  for (let i = d; i < maxLag; i++) if (c[i] > maxV) { maxV = c[i]; maxP = i; }
  if (maxP <= 0) return -1;
  // Prefer the shortest lag whose peak is close to the max (avoids octave errors).
  for (let i = d; i < maxP; i++) {
    if (c[i] > 0.9 * maxV && c[i] >= c[i - 1] && c[i] >= c[i + 1]) { maxP = i; break; }
  }
  const x1 = c[maxP - 1], x2 = c[maxP], x3 = c[maxP + 1] ?? x2;
  const a = (x1 + x3 - 2 * x2) / 2, bb = (x3 - x1) / 2;
  const T0 = a ? maxP - bb / (2 * a) : maxP;
  return sr / T0;
}

export function mount(root, opts = {}) {
  let inst = opts.inst || 'guitar';
  let stream = null, raf = null, analyser = null, data = null;
  const recent = [];

  const noteEl = h('div', { class: 'tuner-note' }, '–');
  const freqEl = h('div', { class: 'muted small' }, 'Tap "Start" and play one string');
  const needle = h('div', { class: 'needle' });
  const centsEl = h('div', { class: 'tuner-cents' }, '');
  const strings = h('div', { class: 'tuner-strings' });
  const startBtn = h('button', { class: 'btn primary', onclick: toggle }, icon('tuner'), ' Start tuner');
  const err = h('p', { class: 'warn small', hidden: true });

  function renderStrings(activeMidi = null) {
    clear(strings);
    const t = TUNINGS[inst];
    t.strings.forEach((m, i) => {
      strings.append(h('button', {
        class: `string-btn ${activeMidi === m ? 'on' : ''}`,
        title: `Play reference ${noteName(m)}`,
        onclick: () => pluck(m + (inst === 'bass' ? 12 : 0), 0, { gain: 0.6, dur: 2.5 }),
      }, h('strong', {}, t.labels[i]), h('span', { class: 'muted small' }, `${midiToFreq(m).toFixed(1)} Hz`)));
    });
  }

  async function toggle() {
    if (stream) return stop();
    err.hidden = true;
    try {
      const c = audio();
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const src = c.createMediaStreamSource(stream);
      analyser = c.createAnalyser();
      analyser.fftSize = inst === 'bass' ? 8192 : 4096;
      data = new Float32Array(analyser.fftSize);
      src.connect(analyser);
      startBtn.replaceChildren(icon('pause'), ' Stop');
      loop();
    } catch (e) {
      stream = null;
      err.hidden = false;
      err.textContent = 'Microphone not available. Allow microphone access for this site (it needs https or localhost), then try again.';
    }
  }

  function stop() {
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach(t => t.stop());
    stream = null;
    startBtn.replaceChildren(icon('tuner'), ' Start tuner');
  }

  let lastUpdate = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    if (now - lastUpdate < 60) return;
    lastUpdate = now;
    analyser.getFloatTimeDomainData(data);
    const lo = inst === 'bass' ? 35 : 70, hi = inst === 'bass' ? 420 : 1100;
    const f = detectPitch(data, audio().sampleRate, lo * 0.9);
    if (f < lo || f > hi) return;
    recent.push(f);
    if (recent.length > 5) recent.shift();
    const sorted = [...recent].sort((a, b) => a - b);
    const freq = sorted[Math.floor(sorted.length / 2)];
    const midiF = freqToMidi(freq);
    const midi = Math.round(midiF);
    const cents = Math.round((midiF - midi) * 100);
    noteEl.textContent = noteName(midi);
    freqEl.textContent = `${freq.toFixed(1)} Hz`;
    centsEl.textContent = Math.abs(cents) <= 5 ? 'In tune ✓' : cents < 0 ? `${cents}¢  flat — tighten` : `+${cents}¢  sharp — loosen`;
    const inTune = Math.abs(cents) <= 5;
    root.querySelector('.tuner-dial')?.classList.toggle('good', inTune);
    needle.style.transform = `translateX(-50%) rotate(${Math.max(-50, Math.min(50, cents)) * 0.9}deg)`;
    // Highlight the closest open string.
    const t = TUNINGS[inst];
    const closest = t.strings.reduce((a, b) => Math.abs(b - midiF) < Math.abs(a - midiF) ? b : a);
    strings.querySelectorAll('.string-btn').forEach((b, i) => b.classList.toggle('on', t.strings[i] === closest && Math.abs(closest - midiF) < 1.5));
  }

  renderStrings();
  root.append(h('div', { class: 'tuner' },
    segmented([['guitar', '🎸 Guitar'], ['bass', '🎵 Bass']], inst, v => { inst = v; renderStrings(); if (stream) { stop(); toggle(); } }),
    h('div', { class: 'tuner-dial' },
      h('div', { class: 'tuner-ticks' }, ...[-50, -25, 0, 25, 50].map(c => h('span', { style: { transform: `translateX(-50%) rotate(${c * 0.9}deg)` } }))),
      h('div', { class: 'tuner-scale' }, h('span', {}, '♭ flat'), h('span', {}, 'sharp ♯')),
      needle, h('div', { class: 'hub' })),
    h('div', { class: 'tuner-readout' }, noteEl, freqEl, centsEl),
    startBtn, err,
    h('p', { class: 'muted small' }, 'Tap a string to hear its reference note. Tune UP to the note (loosen below it first) — strings stay in tune longer.'),
    strings));

  return stop;
}
