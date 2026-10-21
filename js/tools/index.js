// Registry of built-in tools. Each module exports mount(container, opts) -> cleanup.
import * as metronome from './metronome.js';
import * as drums from './drums.js';
import * as tuner from './tuner.js';
import * as fretboard from './fretboard.js';
import * as ear from './ear.js';
import * as changes from './changes.js';
import * as songpad from './songpad.js';
import * as library from './library.js';

export const TOOLS = {
  metronome: { name: 'Metronome', icon: 'metronome', desc: 'Click, subdivisions, tap tempo, tempo ladder, clean-BPM log.', mod: metronome },
  drums: { name: 'Drum Grooves', icon: 'drums', desc: 'Rock, funk, shuffle, swing… with a kick-only drill for bass.', mod: drums },
  tuner: { name: 'Tuner', icon: 'tuner', desc: 'Microphone tuner for guitar and bass, with reference notes.', mod: tuner },
  fretboard: { name: 'Fretboard', icon: 'fretboard', desc: 'Explore notes, see scales, and play the note-finder game.', mod: fretboard },
  ear: { name: 'Ear Trainer', icon: 'ear', desc: 'Intervals, chord quality, scale degrees and progressions.', mod: ear },
  changes: { name: 'One Minute Changes', icon: 'changes', desc: 'Count clean chord changes in 60 seconds.', mod: changes },
  library: { name: 'Chord & Shape Library', icon: 'book', desc: 'Every chord diagram, bass shape and theory picture in one place.', mod: library },
  songpad: { name: 'Song Pad', icon: 'songpad', desc: 'Build progressions in any key, loop them, save song ideas.', mod: songpad },
};
