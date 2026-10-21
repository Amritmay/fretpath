// Small music-theory helpers shared by the fretboard, ear trainer and song pad.

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NAMES = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
const FLAT_KEYS = new Set(['F', 'A#', 'D#', 'G#', 'C#']);

export const TUNINGS = {
  guitar: { name: 'Guitar', strings: [40, 45, 50, 55, 59, 64], labels: ['E', 'A', 'D', 'G', 'B', 'e'] },
  bass: { name: 'Bass', strings: [28, 33, 38, 43], labels: ['E', 'A', 'D', 'G'] },
};

export const pc = midi => ((midi % 12) + 12) % 12;
export const noteName = (midi, preferFlat = false) => {
  const n = NOTES[pc(midi)];
  return preferFlat && FLAT_NAMES[n] ? FLAT_NAMES[n] : n;
};
export const noteIndex = name => {
  const flat = Object.entries(FLAT_NAMES).find(([, f]) => f === name);
  return NOTES.indexOf(flat ? flat[0] : name);
};
export const midiToFreq = m => 440 * Math.pow(2, (m - 69) / 12);
export const freqToMidi = f => 69 + 12 * Math.log2(f / 440);

export const SCALES = {
  major: { name: 'Major scale', steps: [0, 2, 4, 5, 7, 9, 11] },
  minor: { name: 'Natural minor', steps: [0, 2, 3, 5, 7, 8, 10] },
  minPent: { name: 'Minor pentatonic', steps: [0, 3, 5, 7, 10] },
  majPent: { name: 'Major pentatonic', steps: [0, 2, 4, 7, 9] },
  blues: { name: 'Blues scale', steps: [0, 3, 5, 6, 7, 10] },
  majArp: { name: 'Major arpeggio (R 3 5)', steps: [0, 4, 7] },
  minArp: { name: 'Minor arpeggio (R b3 5)', steps: [0, 3, 7] },
  octave: { name: 'Root + 5th + octave', steps: [0, 7] },
  mixo: { name: 'Mixolydian', steps: [0, 2, 4, 5, 7, 9, 10] },
  dorian: { name: 'Dorian', steps: [0, 2, 3, 5, 7, 9, 10] },
};

const DEGREE_LABELS = { 0: 'R', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7' };
export const intervalLabel = semis => DEGREE_LABELS[pc(semis)];

export const INTERVALS = [
  { s: 1, short: 'm2', name: 'Minor 2nd', ref: 'Jaws theme' },
  { s: 2, short: 'M2', name: 'Major 2nd', ref: 'Happy Birthday' },
  { s: 3, short: 'm3', name: 'Minor 3rd', ref: 'Greensleeves' },
  { s: 4, short: 'M3', name: 'Major 3rd', ref: 'When the Saints Go Marching In' },
  { s: 5, short: 'P4', name: 'Perfect 4th', ref: 'Here Comes the Bride' },
  { s: 6, short: 'TT', name: 'Tritone', ref: 'The Simpsons theme' },
  { s: 7, short: 'P5', name: 'Perfect 5th', ref: 'Twinkle Twinkle Little Star' },
  { s: 8, short: 'm6', name: 'Minor 6th', ref: 'Love Story theme (Where Do I Begin)' },
  { s: 9, short: 'M6', name: 'Major 6th', ref: 'My Bonnie Lies Over the Ocean' },
  { s: 10, short: 'm7', name: 'Minor 7th', ref: '"Somewhere" (West Side Story)' },
  { s: 11, short: 'M7', name: 'Major 7th', ref: "Don't Know Why (Norah Jones)" },
  { s: 12, short: 'P8', name: 'Octave', ref: 'Somewhere Over the Rainbow' },
];

export const CHORD_TYPES = {
  maj: { name: 'Major', sym: '', tones: [0, 4, 7] },
  min: { name: 'Minor', sym: 'm', tones: [0, 3, 7] },
  dim: { name: 'Diminished', sym: '°', tones: [0, 3, 6] },
  aug: { name: 'Augmented', sym: '+', tones: [0, 4, 8] },
  dom7: { name: 'Dominant 7', sym: '7', tones: [0, 4, 7, 10] },
  maj7: { name: 'Major 7', sym: 'maj7', tones: [0, 4, 7, 11] },
  min7: { name: 'Minor 7', sym: 'm7', tones: [0, 3, 7, 10] },
};

// Diatonic chords. Degrees are semitone offsets from the key root.
const MAJOR_DIATONIC = [
  { roman: 'I', off: 0, type: 'maj' }, { roman: 'ii', off: 2, type: 'min' }, { roman: 'iii', off: 4, type: 'min' },
  { roman: 'IV', off: 5, type: 'maj' }, { roman: 'V', off: 7, type: 'maj' }, { roman: 'vi', off: 9, type: 'min' },
  { roman: 'vii°', off: 11, type: 'dim' },
];
const MAJOR_BORROWED = [
  { roman: 'bVII', off: 10, type: 'maj' }, { roman: 'iv', off: 5, type: 'min' }, { roman: 'bVI', off: 8, type: 'maj' },
  { roman: 'V7', off: 7, type: 'dom7' },
];
const MINOR_DIATONIC = [
  { roman: 'i', off: 0, type: 'min' }, { roman: 'ii°', off: 2, type: 'dim' }, { roman: 'III', off: 3, type: 'maj' },
  { roman: 'iv', off: 5, type: 'min' }, { roman: 'v', off: 7, type: 'min' }, { roman: 'VI', off: 8, type: 'maj' },
  { roman: 'VII', off: 10, type: 'maj' },
];
const MINOR_BORROWED = [
  { roman: 'V', off: 7, type: 'maj' }, { roman: 'IV', off: 5, type: 'maj' }, { roman: 'V7', off: 7, type: 'dom7' },
];

export function keyChords(root, mode = 'major') {
  const r = noteIndex(root);
  const flat = FLAT_KEYS.has(root) || (mode === 'minor' && ['D', 'G', 'C', 'F'].includes(root));
  const build = list => list.map(d => {
    const rootPc = (r + d.off) % 12;
    const name = noteName(rootPc, flat || d.roman.startsWith('b')) + CHORD_TYPES[d.type].sym;
    return { ...d, rootPc, name };
  });
  return mode === 'minor'
    ? { diatonic: build(MINOR_DIATONIC), borrowed: build(MINOR_BORROWED) }
    : { diatonic: build(MAJOR_DIATONIC), borrowed: build(MAJOR_BORROWED) };
}

export const PRESET_PROGRESSIONS = [
  { name: 'Pop anthem', romans: ['I', 'V', 'vi', 'IV'] },
  { name: 'Three-chord rock', romans: ['I', 'IV', 'V', 'IV'] },
  { name: 'Emotional pop', romans: ['vi', 'IV', 'I', 'V'] },
  { name: "'50s doo-wop", romans: ['I', 'vi', 'IV', 'V'] },
  { name: 'Classic rock (bVII)', romans: ['I', 'bVII', 'IV', 'I'] },
  { name: 'Jazz turnaround', romans: ['ii', 'V7', 'I', 'I'] },
  { name: 'Folk', romans: ['I', 'IV', 'I', 'V'] },
];

// Voice a chord for playback: bass root + close voicing in a guitar range.
export function voiceChord(rootPc, type, base = 52) {
  const tones = CHORD_TYPES[type].tones;
  let root = base + ((rootPc - pc(base) + 12) % 12);
  if (root > base + 7) root -= 12;
  return { bass: root - 12, notes: tones.map(t => root + t) };
}
