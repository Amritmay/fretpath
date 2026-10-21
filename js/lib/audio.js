// Web Audio engine: plucked strings (Karplus–Strong), synthesized drums,
// metronome clicks and a look-ahead step sequencer shared by every tool.

import { midiToFreq } from './music.js';

let ctx = null;
let master = null;

export function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
const out = () => { audio(); return master; };

// ── Plucked string ──────────────────────────────────────────────
const pluckCache = new Map();
function pluckBuffer(midi, seconds) {
  const c = audio();
  const key = `${midi}:${seconds}`;
  if (pluckCache.has(key)) return pluckCache.get(key);
  const sr = c.sampleRate;
  const f = midiToFreq(midi);
  const len = Math.floor(sr * seconds);
  const buf = c.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  // Averaging filter adds ~0.5 sample delay, so compensate.
  const N = Math.max(2, Math.round(sr / f - 0.5));
  const decay = midi < 40 ? 0.998 : midi < 55 ? 0.996 : 0.994;
  const ring = new Float32Array(N);
  let prev = 0;
  for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; prev = 0.6 * r + 0.4 * prev; ring[i] = prev; }
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const next = (idx + 1) % N;
    const v = ring[idx];
    d[i] = v;
    ring[idx] = decay * 0.5 * (v + ring[next]);
    idx = next;
  }
  // Soft attack & fade out to avoid clicks.
  for (let i = 0; i < 64 && i < len; i++) d[i] *= i / 64;
  const fade = Math.min(len, Math.floor(sr * 0.05));
  for (let i = 0; i < fade; i++) d[len - 1 - i] *= i / fade;
  pluckCache.set(key, buf);
  return buf;
}

export function pluck(midi, when = 0, { gain = 0.45, dur = 1.6 } = {}) {
  const c = audio();
  const t = Math.max(c.currentTime, when || c.currentTime);
  const src = c.createBufferSource();
  src.buffer = pluckBuffer(midi, dur);
  const g = c.createGain();
  g.gain.value = gain;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = midi < 45 ? 1800 : 5000;
  src.connect(lp).connect(g).connect(out());
  src.start(t);
  return t;
}

export function strum(midis, when = 0, { spread = 0.018, gain = 0.32, dur = 1.8 } = {}) {
  const c = audio();
  const t0 = Math.max(c.currentTime, when || c.currentTime);
  midis.forEach((m, i) => pluck(m, t0 + i * spread, { gain, dur }));
}

// ── Drums ───────────────────────────────────────────────────────
let noiseBuf = null;
function noise() {
  const c = audio();
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  return s;
}

export function kick(t, vol = 1) {
  const c = audio();
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.95 * vol, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  o.connect(g).connect(out());
  o.start(t); o.stop(t + 0.4);
}

export function snare(t, vol = 1) {
  const c = audio();
  const n = noise();
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5 * vol, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  n.connect(hp).connect(g).connect(out());
  n.start(t); n.stop(t + 0.2);
  const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = 190;
  const og = c.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.35 * vol, t + 0.003);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  o.connect(og).connect(out());
  o.start(t); o.stop(t + 0.1);
}

export function hat(t, vol = 1, open = false) {
  const c = audio();
  const n = noise();
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7500;
  const g = c.createGain();
  const len = open ? 0.25 : 0.045;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.22 * vol, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  n.connect(hp).connect(g).connect(out());
  n.start(t); n.stop(t + len + 0.02);
}

export function click(t, accent = false, sound = 'click') {
  const c = audio();
  const o = c.createOscillator();
  const g = c.createGain();
  if (sound === 'wood') {
    o.type = 'sine';
    o.frequency.value = accent ? 1250 : 850;
  } else {
    o.type = 'square';
    o.frequency.value = accent ? 1760 : 1100;
  }
  const peak = sound === 'wood' ? 0.7 : 0.25;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(accent ? peak : peak * 0.6, t + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g).connect(out());
  o.start(t); o.stop(t + 0.06);
}

export function beep(freq = 880, dur = 0.15, when = 0) {
  const c = audio();
  const t = Math.max(c.currentTime, when || c.currentTime);
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out());
  o.start(t); o.stop(t + dur + 0.02);
}

// ── Sequencer ───────────────────────────────────────────────────
// Calls onStep(stepIndex, audioTime) for each step, scheduled slightly ahead
// of time for rock-solid timing; onVisual(stepIndex) fires in sync for UI.
export class Sequencer {
  constructor({ bpm = 80, stepsPerBeat = 1, onStep, onVisual }) {
    this.bpm = bpm;
    this.stepsPerBeat = stepsPerBeat;
    this.onStep = onStep;
    this.onVisual = onVisual;
    this.timer = null;
    this.step = 0;
    this.next = 0;
    this.visualTimeouts = [];
  }
  get stepDur() { return 60 / this.bpm / this.stepsPerBeat; }
  start() {
    if (this.timer) return;
    const c = audio();
    this.step = 0;
    this.next = c.currentTime + 0.08;
    const tick = () => {
      while (this.next < c.currentTime + 0.12) {
        const s = this.step;
        this.onStep?.(s, this.next);
        if (this.onVisual) {
          const delay = Math.max(0, (this.next - c.currentTime) * 1000);
          this.visualTimeouts.push(setTimeout(() => this.onVisual(s), delay));
          if (this.visualTimeouts.length > 64) this.visualTimeouts.splice(0, 32);
        }
        this.next += this.stepDur;
        this.step++;
      }
    };
    tick();
    this.timer = setInterval(tick, 25);
  }
  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.visualTimeouts.forEach(clearTimeout);
    this.visualTimeouts = [];
  }
  get running() { return !!this.timer; }
}

// Groove patterns: 16 steps per bar (4 per beat) unless steps given.
// k = kick, s = snare, h = hat, o = open hat.
export const GROOVES = {
  rock: { name: 'Rock 8ths', stepsPerBeat: 4, steps: 16,
    k: [0, 8, 10], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14] },
  halftime: { name: 'Half-time', stepsPerBeat: 4, steps: 16,
    k: [0, 3, 10], s: [8], h: [0, 2, 4, 6, 8, 10, 12, 14] },
  four: { name: 'Four on the floor', stepsPerBeat: 4, steps: 16,
    k: [0, 4, 8, 12], s: [4, 12], h: [2, 6, 10, 14], o: [] },
  funk: { name: 'Funk 16ths', stepsPerBeat: 4, steps: 16,
    k: [0, 3, 6, 10], s: [4, 12], h: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], ghost: [7, 9, 15] },
  shuffle: { name: 'Blues shuffle', stepsPerBeat: 3, steps: 12,
    k: [0, 6], s: [3, 9], h: [0, 2, 3, 5, 6, 8, 9, 11] },
  swing: { name: 'Swing / walking', stepsPerBeat: 3, steps: 12,
    k: [0, 6], s: [], h: [0, 3, 5, 6, 9, 11] },
  twoFeel: { name: 'Two-beat (country)', stepsPerBeat: 4, steps: 16,
    k: [0, 8], s: [4, 12], h: [0, 4, 8, 12] },
  ballad: { name: '6/8 ballad', stepsPerBeat: 3, steps: 6,
    k: [0], s: [3], h: [0, 1, 2, 3, 4, 5] },
};

export function playGroove(g, step, t, { kickOnly = false, mute = {} } = {}) {
  const i = step % g.steps;
  if (!mute.k && g.k.includes(i)) kick(t);
  if (kickOnly) return;
  if (!mute.s && g.s.includes(i)) snare(t);
  if (!mute.s && g.ghost?.includes(i)) snare(t, 0.25);
  if (!mute.h && g.h.includes(i)) hat(t, i % g.stepsPerBeat === 0 ? 1 : 0.6);
  if (!mute.h && g.o?.includes(i)) hat(t, 0.8, true);
}
