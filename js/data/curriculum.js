// The learning path. Order and content synthesised from JustinGuitar Grades 1–3,
// Andy Guitar / Marty Music (electric), StudyBass, TalkingBass and BassBuzz (bass),
// and ear-training / songwriting sources. See RESEARCH.md.
//
// Unit fields:
//   id, track ('guitar' | 'bass' | 'shared'), phase (0–6), title, goal,
//   steps[], min (minimum sessions before moving on), bpm [start, target] | null,
//   tool { id, opts } (opens a built-in tool), learn (YouTube search query for a free lesson)

export const PHASES = [
  { n: 0, name: 'Setup', when: 'Week 1', blurb: 'Tune up, hold it right, get a clean sound.',
    checks: ['Tune both instruments on your own', 'Play open strings evenly to a 60 BPM click'] },
  { n: 1, name: 'Foundations', when: 'Weeks 1–4', blurb: 'First chords, first riffs, steady plucking. Fingertips toughen up.',
    checks: ['Guitar: A↔D at 15+ changes a minute', 'Bass: steady eighth notes at 80 BPM, no stray ringing', 'Play one riff on each instrument'] },
  { n: 2, name: 'First Songs', when: 'Months 2–3', blurb: 'The 8 essential chords, real strumming, root–fifth bass lines.',
    checks: ['All 8 open chords at ~30 changes a minute', 'One full song start-to-finish on guitar', 'One full song start-to-finish on bass'] },
  { n: 3, name: 'Theory That Unlocks Songs', when: 'Months 4–6', blurb: 'Pentatonic, the blues, chords in a key, your first song.',
    checks: ['Improvise over a 12-bar blues on guitar', 'Play roots, 5ths & arpeggios through I–IV–V–vi on bass', 'Name the chord numbers in a simple song', 'Finish your first original song'] },
  { n: 4, name: 'Lead, Groove & Ears', when: 'Months 7–9', blurb: 'Bends, vibrato, 16ths, ghost notes — and figuring lines out by ear.',
    checks: ['Clean whole-step bends, in tune', 'Work out a simple pop bass line by ear', 'Record your own song with guitar + bass'] },
  { n: 5, name: 'Figure It Out Yourself', when: 'Months 10–12', blurb: 'Barre chords, walking bass, transcribing whole songs.',
    checks: ['E- and A-shape barre chords ring clean', 'Walk a bass line over a blues', 'Transcribe a whole song without tab', 'Finished original song on both instruments'] },
  { n: 6, name: 'Fluency', when: 'Year 2+', blurb: 'The whole neck, modes, solos, and writing regularly.',
    checks: ['All 5 pentatonic patterns', 'Transcribe a solo or vocal melody', 'Complete a songwriting challenge'] },
];

const U = (id, track, phase, title, goal, steps, extra = {}) =>
  ({ id, track, phase, title, goal, steps, min: 2, bpm: null, tool: null, learn: null, ...extra });

export const UNITS = [
  // ───────────────────────── GUITAR ─────────────────────────
  U('g01', 'guitar', 0, 'Tune up & hold the guitar', 'Tune all 6 strings by yourself and sit/stand with a relaxed posture.', [
    'Tune E A D G B E (thick → thin) with the Tuner tool.',
    'Hold the pick between thumb and the side of your index finger, tip just showing.',
    'Relax your shoulders. Thumb behind the neck, not squeezing.',
  ], { min: 1, tool: { id: 'tuner', opts: { inst: 'guitar' } }, learn: 'JustinGuitar how to tune your guitar beginner' }),
  U('g02', 'guitar', 0, 'Clean amp tone & open strings', 'Get a clean sound and pick each open string evenly in time.', [
    'Amp: gain low, bass/mid/treble at 12 o\'clock. Change one knob at a time.',
    'Pick each open string 4 times, down-strokes, with the metronome.',
    'Listen: every note the same volume?',
  ], { bpm: [60, 80], tool: { id: 'metronome', opts: { bpm: 60 } }, learn: 'Andy Guitar electric guitar amp settings for beginners' }),

  U('g03', 'guitar', 1, 'The A chord', 'Play A with every string ringing clearly.', [
    'Place fingers 1-2-3 on fret 2 of D, G, B strings (or JustinGuitar\'s 2-1-3 fingering).',
    'Strum from the A string. Pick each string one at a time — fix any buzz.',
    'Lift off and place again 10 times. Speed comes later.',
  ], { min: 2, learn: 'JustinGuitar A chord beginner' }),
  U('g04', 'guitar', 1, 'The D chord + One Minute Changes', 'Change between A and D cleanly.', [
    'Learn D: strum from the D string only.',
    'One Minute Changes A↔D: count clean changes in 60 seconds. Write it down.',
    'Move fingers as a group; look at where you\'re going.',
  ], { min: 3, tool: { id: 'changes', opts: { pair: 'A–D' } }, learn: 'JustinGuitar D chord one minute changes' }),
  U('g05', 'guitar', 1, 'The E chord', 'Play E and change between E, A and D.', [
    'Learn E: all 6 strings ring.',
    'One Minute Changes: E↔A, then E↔D.',
    'Keep the thumb relaxed — press only as hard as you need.',
  ], { min: 3, tool: { id: 'changes', opts: { pair: 'E–A' } }, learn: 'JustinGuitar E chord' }),
  U('g06', 'guitar', 1, 'Down-strums in time', 'Strum 4 down-strums per bar and change chords without stopping.', [
    'Metronome on. 4 down-strums on A, then D, then E. Repeat.',
    'Keep the strumming arm moving even while you change.',
    'If you\'re late on a change, slow the click by 10 BPM.',
  ], { min: 3, bpm: [60, 90], tool: { id: 'metronome', opts: { bpm: 60 } }, learn: 'JustinGuitar strumming down strums beginner' }),
  U('g07', 'guitar', 1, 'Reading tab & your first riff', 'Read a tab and play a single-note riff in time.', [
    'Tab lines = strings (top line is the thin high e). Numbers = frets.',
    'Learn the Seven Nation Army riff on the A string, slowly.',
    'Play it 4 times in a row with the click, no stops.',
  ], { min: 2, bpm: [70, 110], tool: { id: 'metronome', opts: { bpm: 70 } }, learn: 'how to read guitar tab beginner Marty Music' }),
  U('g08', 'guitar', 1, 'One-finger power chords + palm muting', 'Play E5/A5 power chords with a light palm mute.', [
    'Power chord = root + 5th. Start with open E5 and A5.',
    'Rest the side of your picking hand on the strings right at the bridge.',
    'Chug 8 down-strokes per chord with the click. Too muffled? Move the hand toward the bridge.',
  ], { min: 2, bpm: [70, 110], tool: { id: 'metronome', opts: { bpm: 70 } }, learn: 'one finger power chords palm muting beginner electric guitar' }),

  U('g09', 'guitar', 2, 'Em and Am', 'Add the two easiest minor chords.', [
    'Learn Em (2 fingers) and Am.',
    'One Minute Changes: Em↔Am, then Am↔E (same shape, moved!).',
    'Play a 4-chord loop: Em – Am – D – A.',
  ], { min: 2, tool: { id: 'changes', opts: { pair: 'Em–Am' } }, learn: 'JustinGuitar Em Am chords' }),
  U('g10', 'guitar', 2, 'Dm', 'Play Dm and change to/from A and Am.', [
    'Learn Dm — strum from the D string.',
    'One Minute Changes: Dm↔Am, D↔Dm.',
    'Hear it: D is happy, Dm is sad. That\'s major vs minor.',
  ], { min: 2, tool: { id: 'changes', opts: { pair: 'Dm–Am' } }, learn: 'JustinGuitar Dm chord' }),
  U('g11', 'guitar', 2, 'The C chord', 'Play C cleanly and change to Am and G.', [
    'Learn C — the stretch is normal at first.',
    'One Minute Changes: C↔Am (fingers 1 and 2 stay put!).',
    'Arch your fingers so the open G and E ring.',
  ], { min: 3, tool: { id: 'changes', opts: { pair: 'C–Am' } }, learn: 'JustinGuitar C chord' }),
  U('g12', 'guitar', 2, 'The G chord', 'Play G and complete the 8 essential open chords.', [
    'Learn G (any common fingering — be consistent).',
    'One Minute Changes: G↔C, G↔D.',
    'Loop: G – C – D – G.',
  ], { min: 3, tool: { id: 'changes', opts: { pair: 'G–C' } }, learn: 'JustinGuitar G chord' }),
  U('g13', 'guitar', 2, 'The "Old Faithful" strum', 'Strum D – D U – U D U smoothly at 80 BPM.', [
    'Arm moves down-up constantly like a pendulum; you just miss the strings sometimes.',
    'Count "1 2 & (3) & 4 &" — skip the down on beat 3.',
    'Do it on one chord first, then a G – C – D loop.',
  ], { min: 4, bpm: [60, 90], tool: { id: 'metronome', opts: { bpm: 60 } }, learn: 'JustinGuitar old faithful strumming pattern' }),
  U('g14', 'guitar', 2, 'Moveable power chords', 'Play 2-finger power chords on the E and A strings, palm-muted.', [
    'Root on E or A string, 5th two frets up on the next string.',
    'Move G5 – A5 – C5 – D5 with chugged eighth notes.',
    'Mute the strings you aren\'t playing with spare fingers.',
  ], { min: 3, bpm: [70, 120], tool: { id: 'metronome', opts: { bpm: 70 } }, learn: 'moveable power chords palm mute beginner electric guitar' }),
  U('g15', 'guitar', 2, 'Alternate picking', 'Pick single notes down-up evenly.', [
    'On one string: 4 notes per fret (1-2-3-4) with down-up picking.',
    'Small pick movements from the wrist; keep it relaxed.',
    'Then apply it to a riff you know.',
  ], { min: 3, bpm: [60, 100], tool: { id: 'metronome', opts: { bpm: 60, sub: 2 } }, learn: 'JustinGuitar alternate picking beginner' }),
  U('g16', 'guitar', 2, 'Capo + chord review', 'Use a capo and make all 8 chords fluent.', [
    'Capo on fret 2: play G – C – D. Same shapes, new key.',
    'One Minute Changes on your 2 slowest pairs.',
    'Goal: ~30 clean changes a minute on any pair.',
  ], { min: 3, tool: { id: 'changes', opts: {} }, learn: 'JustinGuitar how to use a capo' }),

  U('g17', 'guitar', 3, 'Eighth-note strumming & dynamics', 'Strum steady eighths and play soft / loud on purpose.', [
    'D U D U D U D U with the click.',
    'Play 2 bars quiet, 2 bars loud. Same timing.',
    'Accent beats 2 and 4 for a rock feel.',
  ], { min: 3, bpm: [70, 110], tool: { id: 'metronome', opts: { bpm: 70, sub: 2 } }, learn: 'JustinGuitar eighth note strumming' }),
  U('g18', 'guitar', 3, 'Cadd9 & G5 "anchor" chords', 'Change G – Cadd9 – D keeping fingers 3 & 4 anchored.', [
    'Fingers 3 and 4 stay on the B and high e strings, fret 3.',
    'Loop G – Cadd9 – Dsus4 – Em7.',
    'This is the sound of a thousand pop songs.',
  ], { min: 2, learn: 'JustinGuitar stuck 3 and 4 chords Cadd9' }),
  U('g19', 'guitar', 3, 'The mini F chord', 'Play the small F (4 strings) cleanly.', [
    'Index finger flattens across B and high e at fret 1.',
    'Roll the finger slightly onto its side — less pressure needed.',
    'One Minute Changes: F↔C.',
  ], { min: 4, tool: { id: 'changes', opts: { pair: 'F–C' } }, learn: 'JustinGuitar easy F chord' }),
  U('g20', 'guitar', 3, 'E minor pentatonic (open)', 'Play the open E minor pentatonic up and down.', [
    'Frets 0 and 3 on every string except G and B (0 and 2 / 0 and 3).',
    'Alternate pick, up and down, with the click.',
    'Make up a 4-note riff with it.',
  ], { min: 3, bpm: [60, 100], tool: { id: 'fretboard', opts: { inst: 'guitar', root: 'E', scale: 'minPent' } }, learn: 'JustinGuitar E minor pentatonic open position' }),
  U('g21', 'guitar', 3, 'A minor pentatonic — pattern 1', 'Play pattern 1 at the 5th fret evenly.', [
    'Index on fret 5, pinky on fret 8 — one-finger-per-fret.',
    'Up and down with alternate picking, then in 3-note groups.',
    'The root notes (A) are the "home" notes — find all 3.',
  ], { min: 4, bpm: [60, 110], tool: { id: 'fretboard', opts: { inst: 'guitar', root: 'A', scale: 'minPent' } }, learn: 'JustinGuitar minor pentatonic pattern 1' }),
  U('g22', 'guitar', 3, 'Hammer-ons & pull-offs', 'Make hammered and pulled notes as loud as picked ones.', [
    'Hammer-on: pick fret 5, slam finger onto fret 7.',
    'Pull-off: flick the finger down off the string, don\'t just lift.',
    'Use them inside the pentatonic pattern.',
  ], { min: 3, learn: 'JustinGuitar hammer ons pull offs' }),
  U('g23', 'guitar', 3, 'Dominant 7th chords', 'Play A7, D7, E7, G7, C7, B7.', [
    'Learn 2 new 7ths per session.',
    'Hear the "bluesy, wants to move" sound.',
    'Loop A7 – D7 – E7 (the blues chords in A).',
  ], { min: 3, learn: 'JustinGuitar 7th chords A7 D7 E7' }),
  U('g24', 'guitar', 3, '12-bar blues & first improvisation', 'Play a 12-bar shuffle in A and improvise over it.', [
    'Bars: A A A A | D D A A | E D A E.',
    'Use the shuffle rhythm on power chords (A5–A6).',
    'Improvise with A minor pentatonic over a groove — few notes, lots of space.',
  ], { min: 4, bpm: [70, 110], tool: { id: 'drums', opts: { groove: 'shuffle', bpm: 80 } }, learn: 'JustinGuitar 12 bar blues shuffle rhythm' }),
  U('g25', 'guitar', 3, 'Sus chords', 'Use Dsus2/Dsus4, Asus2/Asus4 for movement.', [
    'Play D → Dsus4 → D → Dsus2 → D.',
    'Same for A.',
    'Add them into a song you know.',
  ], { min: 2, learn: 'JustinGuitar sus chords sus2 sus4' }),

  U('g26', 'guitar', 4, '16th-note strumming', 'Strum steady 16ths and common 16th patterns.', [
    'Arm moves twice as fast; count "1 e & a".',
    'Try D – DU – UDU – DU patterns with muted strums.',
    'Start at 60 BPM. Clean beats fast.',
  ], { min: 4, bpm: [55, 90], tool: { id: 'metronome', opts: { bpm: 55, sub: 4 } }, learn: 'JustinGuitar 16th note strumming' }),
  U('g27', 'guitar', 4, 'String bends — in tune', 'Bend a whole step and land exactly on the target pitch.', [
    'Play fret 9 on the G string (target). Then bend fret 7 up to match it.',
    'Use 2–3 fingers together and turn the wrist.',
    'Half-step bends next. Check with the Tuner tool.',
  ], { min: 4, tool: { id: 'tuner', opts: { inst: 'guitar' } }, learn: 'guitar string bending in tune beginner Andy Guitar' }),
  U('g28', 'guitar', 4, 'Vibrato', 'Add even, controlled vibrato to a held note.', [
    'Small, repeated mini-bends from the wrist.',
    'Slow and wide, then fast and narrow — on purpose.',
    'Finish your licks with vibrato on the root.',
  ], { min: 3, learn: 'JustinGuitar vibrato technique' }),
  U('g29', 'guitar', 4, 'Pentatonic pattern 2 & licks', 'Connect pattern 1 and 2 and learn 3 licks.', [
    'Pattern 2 starts on the 8th fret (in A).',
    'Slide between patterns on the G string.',
    'Learn 3 classic licks and play them over the blues groove.',
  ], { min: 4, tool: { id: 'fretboard', opts: { inst: 'guitar', root: 'A', scale: 'minPent' } }, learn: 'minor pentatonic pattern 2 connecting licks' }),
  U('g30', 'guitar', 4, 'Muting with gain', 'Play crunch-tone riffs with no unwanted noise.', [
    'Turn gain up to a light crunch.',
    'Fretting hand: spare fingers lightly touch unused strings.',
    'Picking hand: palm rests on the low strings when playing high ones.',
  ], { min: 3, learn: 'guitar muting technique unwanted string noise' }),

  U('g31', 'guitar', 5, 'E-shape barre chords', 'Play F, G and their minors as full barres.', [
    'Index finger flat across all strings at fret 1. E shape with fingers 2–4.',
    'Thumb low behind the neck; pull back with the arm a little.',
    'Check every string. 80% technique, 20% strength.',
  ], { min: 6, tool: { id: 'changes', opts: { pair: 'F(barre)–C' } }, learn: 'JustinGuitar E shape barre chord' }),
  U('g32', 'guitar', 5, 'A-shape barre chords', 'Play Bb, C, Bm as A-shape barres.', [
    'Barre on fret 1 (Bb), ring-finger mini-barre or 3 fingers.',
    'Move it: fret 3 = C, fret 5 = D.',
    'Root on the A string tells you the name.',
  ], { min: 6, learn: 'JustinGuitar A shape barre chord' }),
  U('g33', 'guitar', 5, 'Triads on the top 3 strings', 'Play major & minor triads up the neck.', [
    'Three shapes for each major triad on strings G-B-e.',
    'Walk C major up the neck through all three.',
    'Use them for a "second guitar" part over a song.',
  ], { min: 4, learn: 'major triads top three strings guitar' }),
  U('g34', 'guitar', 5, 'CAGED: C and A shapes', 'See how open shapes move up the neck.', [
    'Play C major using the C shape, then the A shape.',
    'Find the root notes in each.',
    'Connect to your pentatonic patterns.',
  ], { min: 4, learn: 'CAGED system explained beginner' }),

  U('g35', 'guitar', 6, 'All 5 pentatonic patterns', 'Improvise across the whole neck.', [
    'Learn one new pattern per week.',
    'Improvise using only 2 adjacent patterns at a time.',
  ], { min: 8, tool: { id: 'fretboard', opts: { inst: 'guitar', root: 'A', scale: 'minPent' } }, learn: 'five pentatonic patterns guitar' }),
  U('g36', 'guitar', 6, 'Major scale on the neck', 'Play the major scale in two positions.', [
    'Play G major in position 2 and position 7.',
    'Sing each note as you play.',
  ], { min: 6, tool: { id: 'fretboard', opts: { inst: 'guitar', root: 'G', scale: 'major' } }, learn: 'JustinGuitar major scale guitar' }),
  U('g37', 'guitar', 6, 'Modes as colours', 'Jam Mixolydian and Dorian over vamps.', [
    'Mixolydian: major with a flat 7 (think D – C – G).',
    'Dorian: minor with a major 6 (think Am – D).',
  ], { min: 6, learn: 'mixolydian dorian guitar explained' }),
  U('g38', 'guitar', 6, 'Picking speed & efficiency', 'Play short phrases fast and clean.', [
    'Short 4–6 note bursts at target tempo, then rest.',
    'Explore Troy Grady\'s free Primer.',
  ], { min: 6, bpm: [80, 140], tool: { id: 'metronome', opts: { bpm: 80, sub: 4 } }, learn: 'Troy Grady primer picking motion' }),

  // ───────────────────────── BASS ─────────────────────────
  U('b01', 'bass', 0, 'Tune up, posture & thumb anchor', 'Tune E A D G and set a relaxed posture.', [
    'Tune E A D G (thick → thin) with the Tuner tool.',
    'Strap height: bass sits about the same seated and standing.',
    'Plucking thumb rests on the pickup when you play the E string.',
  ], { min: 1, tool: { id: 'tuner', opts: { inst: 'bass' } }, learn: 'BassBuzz how to tune bass beginner' }),
  U('b02', 'bass', 0, 'Alternate plucking & rest strokes', 'Pluck evenly with index–middle, across the string.', [
    'Pluck ACROSS the string so your finger lands on the next string (rest stroke).',
    'Strictly alternate: index, middle, index, middle.',
    'Open E string, 4 notes per click, then all strings.',
  ], { bpm: [60, 90], tool: { id: 'metronome', opts: { bpm: 60 } }, learn: 'BassBuzz plucking technique rest stroke alternating' }),

  U('b03', 'bass', 1, 'One-finger-per-fret "spider"', 'Play 1-2-3-4 on each string cleanly.', [
    'Index on fret 1 … pinky on fret 4. Use the pinky!',
    'Up across all strings and back down with the click.',
    'Press just behind the fret, minimum pressure.',
  ], { min: 3, bpm: [60, 100], tool: { id: 'metronome', opts: { bpm: 60 } }, learn: 'bass one finger per fret exercise beginner' }),
  U('b04', 'bass', 1, 'Muting with both hands', 'No strings ringing that you didn\'t ask for.', [
    'Fretting hand: release pressure to stop a note.',
    'Plucking hand: thumb moves to rest on the E string when you play A/D/G.',
    'Record 20 seconds and listen for hum. Fix and repeat.',
  ], { min: 3, learn: 'TalkingBass bass muting technique' }),
  U('b05', 'bass', 1, 'Root notes in eighth notes', 'Play steady 8th-note roots over a chord loop.', [
    'Loop: G – C – D – G (frets 3 on E, 3 on A, 5 on A, 3 on E).',
    '8 even notes per bar, locked to the drum groove.',
    'Change on time, without a gap.',
  ], { min: 3, bpm: [70, 110], tool: { id: 'drums', opts: { groove: 'rock', bpm: 80 } }, learn: 'bass root notes eighth notes beginner' }),
  U('b06', 'bass', 1, 'Reading bass tab & first riff', 'Read tab and play Seven Nation Army.', [
    '4 lines = E A D G (top line is G).',
    'Learn the Seven Nation Army riff slowly.',
    'Play it 4 times with the drum groove.',
  ], { min: 2, bpm: [70, 120], tool: { id: 'drums', opts: { groove: 'rock', bpm: 80 } }, learn: 'how to read bass tab beginner' }),
  U('b07', 'bass', 1, 'String crossing', 'Move between strings with no gaps or noise.', [
    'Alternate open E and A, then A and D, then D and G.',
    'Keep strict i-m alternation, even when crossing.',
  ], { min: 2, bpm: [60, 100], tool: { id: 'metronome', opts: { bpm: 60, sub: 2 } }, learn: 'bass string crossing exercise' }),

  U('b08', 'bass', 2, 'Root–octave shape', 'Play roots and octaves anywhere on the neck.', [
    'Octave = 2 strings up, 2 frets up.',
    'Play root–octave on each chord of G – C – D – G.',
  ], { min: 2, tool: { id: 'fretboard', opts: { inst: 'bass', root: 'G', scale: 'octave' } }, learn: 'bass octave shape beginner' }),
  U('b09', 'bass', 2, 'Root–fifth–octave', 'Play R–5–8 patterns through a progression.', [
    '5th = 1 string up, 2 frets up.',
    'Pattern: R – 5 – 8 – 5 on each chord.',
    'Use it on a I–IV–V in A and in G.',
  ], { min: 3, bpm: [70, 110], tool: { id: 'drums', opts: { groove: 'rock', bpm: 80 } }, learn: 'TalkingBass root and fifth bass lines' }),
  U('b10', 'bass', 2, 'Locking to the groove', 'Feel the beat with the click on 2 and 4.', [
    'Metronome on beats 2 & 4 only (Settings: accent).',
    'Play quarter-note roots. The click is the snare.',
    'Then play with a drum loop for 3 minutes without stopping.',
  ], { min: 3, bpm: [70, 100], tool: { id: 'drums', opts: { groove: 'rock', bpm: 80 } }, learn: 'bass locking in with drums timing beginner' }),
  U('b11', 'bass', 2, 'Rests & syncopation', 'Leave space on purpose and play off the beat.', [
    'Play on 1 and the "&" of 2. Silence elsewhere (mute!).',
    'Short notes vs long notes — both on purpose.',
  ], { min: 3, bpm: [70, 100], tool: { id: 'drums', opts: { groove: 'rock', bpm: 75 } }, learn: 'BassBuzz syncopation beginner' }),
  U('b12', 'bass', 2, 'Reading rhythms', 'Count and play quarters, eighths and rests.', [
    'Count aloud "1 & 2 & 3 & 4 &" while playing.',
    'Read one rhythm line from StudyBass per session.',
  ], { min: 3, tool: { id: 'metronome', opts: { bpm: 70, sub: 2 } }, learn: 'StudyBass reading rhythms bass' }),
  U('b13', 'bass', 2, 'Two-beat (country) feel', 'Alternate root and 5th on beats 1 and 3.', [
    'Root on 1, 5th (below or above) on 3.',
    'Bounce: short notes, steady time.',
  ], { min: 2, tool: { id: 'drums', opts: { groove: 'twoFeel', bpm: 90 } }, learn: 'two feel bass line root fifth country' }),

  U('b14', 'bass', 3, '12-bar blues boogie line', 'Play R–3–5–6 boogie through a 12-bar in A.', [
    'Pattern per chord: R – 3 – 5 – 6 – b7 – 6 – 5 – 3.',
    'Bars: A A A A | D D A A | E D A E.',
    'Shuffle feel with the drums.',
  ], { min: 4, tool: { id: 'drums', opts: { groove: 'shuffle', bpm: 80 } }, learn: '12 bar blues bass line beginner' }),
  U('b15', 'bass', 3, 'Minor pentatonic (1 octave)', 'Play and improvise with the minor pentatonic.', [
    'A minor pentatonic from fret 5 on the E string.',
    'Make a 2-bar riff from it over a drum loop.',
  ], { min: 3, tool: { id: 'fretboard', opts: { inst: 'bass', root: 'A', scale: 'minPent' } }, learn: 'bass minor pentatonic beginner' }),
  U('b16', 'bass', 3, 'Major scale (1 octave)', 'Play the major scale shape in any key.', [
    'Start on the E or A string. Pattern W-W-H-W-W-W-H.',
    'Play it in G, then C, then A.',
  ], { min: 3, bpm: [60, 100], tool: { id: 'fretboard', opts: { inst: 'bass', root: 'G', scale: 'major' } }, learn: 'bass major scale one octave shape' }),
  U('b17', 'bass', 3, 'Major & minor arpeggios', 'Play R–3–5–8 for major and minor chords.', [
    'Major: R – 3 – 5 – 8. Minor: R – b3 – 5 – 8.',
    'Play arpeggios through G – Em – C – D.',
  ], { min: 3, tool: { id: 'fretboard', opts: { inst: 'bass', root: 'G', scale: 'majArp' } }, learn: 'bass arpeggios major minor beginner' }),
  U('b18', 'bass', 3, 'Chromatic approach notes', 'Lead into each new root from a half step away.', [
    'On beat 4, play one fret above or below the next root.',
    'Root always lands on beat 1.',
  ], { min: 3, tool: { id: 'drums', opts: { groove: 'rock', bpm: 80 } }, learn: 'bass chromatic approach notes' }),
  U('b19', 'bass', 3, 'Lock with the kick drum', 'Match your rhythm to the kick pattern.', [
    'Drum tool → "Kick only". Play roots exactly with each kick.',
    'Then turn the full kit on. Keep matching the kick.',
  ], { min: 3, tool: { id: 'drums', opts: { groove: 'funk', bpm: 85 } }, learn: 'bass lock in with kick drum' }),
  U('b20', 'bass', 3, 'Major pentatonic', 'Use the major pentatonic for happy, melodic lines.', [
    'G major pentatonic: G A B D E.',
    'Write a 2-bar fill using it.',
  ], { min: 3, tool: { id: 'fretboard', opts: { inst: 'bass', root: 'G', scale: 'majPent' } }, learn: 'bass major pentatonic' }),

  U('b21', 'bass', 4, 'Sixteenth notes', 'Play even 16ths with strict alternation.', [
    'Count "1 e & a". Start at 55–60 BPM.',
    'Play 16ths on one note, then over a progression.',
  ], { min: 4, bpm: [55, 90], tool: { id: 'metronome', opts: { bpm: 55, sub: 4 } }, learn: 'bass sixteenth notes exercise' }),
  U('b22', 'bass', 4, 'Ghost notes', 'Add percussive muted notes to grooves.', [
    'Lightly touch the string (no pressure) and pluck — "thud".',
    'Play a scale with every note muted, then mix real + ghost notes.',
  ], { min: 4, learn: 'bass ghost notes beginner' }),
  U('b23', 'bass', 4, 'Dynamics & note length', 'Control volume and note length on purpose.', [
    'Same line: all short (staccato), then all long (legato).',
    'Play soft verse, loud chorus.',
  ], { min: 3, learn: 'bass dynamics note length staccato legato' }),
  U('b24', 'bass', 4, 'Playing with a pick', 'Play punk/rock eighths with a pick (optional style).', [
    'Down-picks only, then alternate picking.',
    'Mute with the fretting hand — picks are loud!',
  ], { min: 2, learn: 'bass with a pick technique beginner' }),
  U('b25', 'bass', 4, 'Simandl fingering', 'Use 1-2-4 fingering for low positions.', [
    'Fingers 1, 2, 4 cover 3 frets; ring finger supports pinky.',
    'Play the major scale low on the neck with Simandl.',
  ], { min: 3, learn: 'Simandl fingering bass explained' }),

  U('b26', 'bass', 5, '7th-chord arpeggios', 'Play maj7, m7, dom7 and m7b5 arpeggios.', [
    'Add the 7th to your triad shapes.',
    'Play through I – vi – ii – V.',
  ], { min: 4, learn: 'bass seventh chord arpeggios' }),
  U('b27', 'bass', 5, 'Walking bass over a blues', 'Walk quarter notes over a 12-bar blues.', [
    'Beat 1 root → beats 2–3 chord or scale tones → beat 4 approach note.',
    'Start with a two-feel, then walk.',
  ], { min: 6, tool: { id: 'drums', opts: { groove: 'swing', bpm: 100 } }, learn: 'TalkingBass walking bass blues beginner' }),
  U('b28', 'bass', 5, 'Slap & pop basics (optional)', 'Slap with the thumb and pop with the index.', [
    'Thumb bounces off the E string near the neck.',
    'Octave pattern: slap root, pop octave.',
  ], { min: 4, learn: 'slap bass basics beginner' }),
  U('b29', 'bass', 5, 'Two-octave scales', 'Play major and minor scales across 2 octaves.', [
    'Shift positions smoothly on the D string.',
  ], { min: 4, learn: 'two octave major scale bass' }),

  U('b30', 'bass', 6, 'Walking over ii–V–I', 'Walk lines over jazz standard changes.', [
    'Learn a standard (e.g. Autumn Leaves) changes.',
  ], { min: 8, learn: 'walking bass ii V I' }),
  U('b31', 'bass', 6, 'Modal grooves', 'Write grooves in Mixolydian and Dorian.', [
    'Dorian funk vamp; Mixolydian rock vamp.',
  ], { min: 6, learn: 'dorian bass groove' }),
  U('b32', 'bass', 6, 'Funk 16th syncopation', 'Play funk grooves with ghost notes and 16ths.', [
    'Learn one classic funk groove a week.',
  ], { min: 6, tool: { id: 'drums', opts: { groove: 'funk', bpm: 95 } }, learn: 'funk bass groove lesson' }),

  // ───────────────────────── SHARED: ears, fretboard, theory, writing ─────────────────────────
  U('s01', 'shared', 0, 'The musical alphabet', 'Know the 12 notes and half/whole steps.', [
    'A A# B C C# D D# E F F# G G# — no sharp between B–C and E–F.',
    'One fret = half step. Two frets = whole step.',
    'Tap frets on the low E string in the Fretboard tool and say each note.',
  ], { min: 1, tool: { id: 'fretboard', opts: { inst: 'guitar', mode: 'explore' } }, learn: 'musical alphabet guitar fretboard beginner' }),
  U('s02', 'shared', 0, 'Pitch matching', 'Hum a note and find it on the instrument.', [
    'Play a note, hum it. Then hum a note and find it on the low E string.',
    'Slide up/down until it "locks" with your voice.',
  ], { min: 2, learn: 'JustinGuitar ear training sing and play' }),

  U('s03', 'shared', 1, 'Notes on the E string', 'Name any note on the low E string in under 2 seconds.', [
    'Fretboard tool → Note Finder → E string only.',
    'Landmarks: 0 = E, 3 = G, 5 = A, 7 = B, 8 = C, 12 = E.',
  ], { min: 3, tool: { id: 'fretboard', opts: { inst: 'guitar', mode: 'quiz', strings: [0] } }, learn: 'learn notes on low E string guitar' }),
  U('s04', 'shared', 1, 'Notes on the A string', 'Name any note on the A string. (Same on bass!)', [
    'Note Finder → A string only, then E + A mixed.',
    'Landmarks: 0 = A, 2 = B, 3 = C, 5 = D, 7 = E, 12 = A.',
  ], { min: 3, tool: { id: 'fretboard', opts: { inst: 'bass', mode: 'quiz', strings: [1] } }, learn: 'learn notes on A string guitar bass' }),
  U('s05', 'shared', 1, 'Ear: octaves & fifths', 'Tell an octave from a fifth by ear.', [
    'Ear Trainer → Intervals, level 1.',
    'Sing along. Fifth = "Twinkle Twinkle" (first jump).',
  ], { min: 3, tool: { id: 'ear', opts: { mode: 'intervals' } } }),
  U('s06', 'shared', 1, 'Ear: major vs minor', 'Hear if a chord is major or minor.', [
    'Ear Trainer → Chords, level 1.',
    'Play the same pair on your guitar: A vs Am.',
  ], { min: 3, tool: { id: 'ear', opts: { mode: 'chords' } } }),

  U('s07', 'shared', 2, 'Ear: thirds & fourths', 'Add major/minor 3rds and perfect 4ths.', [
    'Ear Trainer → Intervals (keep going to level 3).',
    '4ths vs 5ths are the hardest pair — drill them.',
  ], { min: 4, tool: { id: 'ear', opts: { mode: 'intervals' } } }),
  U('s08', 'shared', 2, 'Octave shapes everywhere', 'Find any note on every string.', [
    'Pick a note (e.g. C). Find it on every string, saying the name.',
    'Note Finder → all strings.',
  ], { min: 4, tool: { id: 'fretboard', opts: { inst: 'guitar', mode: 'quiz', strings: [0, 1, 2, 3, 4, 5] } }, learn: 'guitar octave shapes find any note' }),
  U('s09', 'shared', 2, 'The major scale formula', 'Build any major scale from W-W-H-W-W-W-H.', [
    'Build G major on one string using the formula.',
    'Fretboard → Scales → major. Play it on guitar AND bass.',
  ], { min: 2, tool: { id: 'fretboard', opts: { inst: 'guitar', root: 'G', scale: 'major' } }, learn: 'major scale formula whole half steps' }),
  U('s10', 'shared', 2, 'Create: your first chord loop', 'Make and record a 4-chord loop. Hum over it.', [
    'Song Pad → key of G → pick 4 chords. Press play.',
    'Play it on guitar along with the pad. Hum anything over it.',
    'Record 30 seconds on your phone. Save the idea.',
  ], { min: 1, tool: { id: 'songpad', opts: { key: 'G' } } }),

  U('s11', 'shared', 3, 'Chords in a key', 'Know I ii iii IV V vi vii° in G, C, D, A, E.', [
    'Pattern: Major minor minor Major Major minor dim.',
    'Song Pad shows them for any key — say them aloud.',
  ], { min: 3, tool: { id: 'songpad', opts: {} }, learn: 'chords in a key diatonic chords guitar' }),
  U('s12', 'shared', 3, 'Nashville numbers & common progressions', 'Recognise I–IV–V, I–V–vi–IV, vi–IV–I–V, I–vi–IV–V.', [
    'Song Pad → presets. Play each in 2 keys.',
    'Look up a favourite song on Hooktheory TheoryTab and read its numbers.',
  ], { min: 3, tool: { id: 'songpad', opts: {} }, learn: 'Nashville number system explained' }),
  U('s13', 'shared', 3, 'Ear: scale degrees 1, 3, 5', 'Hear the role of a note inside a key.', [
    'Ear Trainer → Scale degrees, level 1.',
    'Sing back from the note down to "home" (1).',
  ], { min: 4, tool: { id: 'ear', opts: { mode: 'degrees' } } }),
  U('s14', 'shared', 3, 'Ear: all intervals', 'Recognise every interval within an octave.', [
    'Ear Trainer → Intervals, all levels.',
    'Use the reference songs shown after each answer.',
  ], { min: 5, tool: { id: 'ear', opts: { mode: 'intervals' } } }),
  U('s15', 'shared', 3, 'Create: your first full song', 'Write a verse + chorus. A "bad" song is a win.', [
    'Verse progression + a different chorus progression.',
    'Hum a melody. Write 4 lines of words (object writing helps).',
    'Record a rough version. Save it in Song Pad.',
  ], { min: 3, tool: { id: 'songpad', opts: {} } }),

  U('s16', 'shared', 4, 'Ear: all 7 scale degrees', 'Hear every degree of the major scale.', [
    'Ear Trainer → Scale degrees, levels 2–3.',
  ], { min: 5, tool: { id: 'ear', opts: { mode: 'degrees' } } }),
  U('s17', 'shared', 4, 'Ear: hear progressions', 'Recognise I–IV–V and I–V–vi–IV by ear.', [
    'Ear Trainer → Progressions.',
    'Find 3 songs that use I–V–vi–IV.',
  ], { min: 5, tool: { id: 'ear', opts: { mode: 'progressions' } } }),
  U('s18', 'shared', 4, 'Find the key of a song', 'Find the "home" note of any song within a minute.', [
    'Hum the note that feels like home. Find it on the E string.',
    'Check: do phrases end there? Major or minor 3rd above it?',
  ], { min: 4, learn: 'how to find the key of a song by ear guitar' }),
  U('s19', 'shared', 4, 'Transcribe your first bass line', 'Work out a simple bass line by ear.', [
    'Slow the song to 75% (YouTube speed or Moises).',
    'Loop one bar. Find the first note on the E/A strings. Then the next.',
    'Check against a tab only at the end.',
  ], { min: 4, learn: 'how to transcribe bass lines by ear beginner' }),
  U('s20', 'shared', 4, 'Create: write a riff', 'Write a 2-bar riff from the pentatonic.', [
    'Pick a groove first (Drums tool, ~80 BPM).',
    'Noodle in minor pentatonic until something sticks. Repeat it.',
    'Vary it: move it, add a bend, play it on bass too.',
  ], { min: 2, tool: { id: 'drums', opts: { groove: 'rock', bpm: 80 } } }),

  U('s21', 'shared', 5, 'Ear: 7th, dim & aug chords', 'Recognise more chord colours.', [
    'Ear Trainer → Chords, levels 2–4.',
  ], { min: 5, tool: { id: 'ear', opts: { mode: 'chords' } } }),
  U('s22', 'shared', 5, 'Transcribe a whole song', 'Bass → chords → melody, no tab.', [
    'Map sections first (verse, chorus…).',
    'Bass notes → chord quality → use the key\'s chords to guess.',
    'Check a tab only after.',
  ], { min: 6, learn: 'how to transcribe a song by ear step by step' }),
  U('s23', 'shared', 5, 'Borrowed chords', 'Use bVII and iv for colour.', [
    'In G: F (bVII) and Cm (iv). Try G – F – C – G.',
  ], { min: 3, tool: { id: 'songpad', opts: {} }, learn: 'borrowed chords explained bVII iv' }),
  U('s24', 'shared', 5, 'Create: song structure', 'Write a song with verse, pre-chorus, chorus, bridge.', [
    'Use V – PC – C – V – PC – C – B – C.',
    'Make the bridge contrast: new chords, new rhythm.',
  ], { min: 4, tool: { id: 'songpad', opts: {} } }),

  U('s25', 'shared', 6, 'Melodic dictation', 'Sing then play vocal melodies by ear.', [
    'One phrase at a time. Sing it, then find it.',
  ], { min: 8 }),
  U('s26', 'shared', 6, 'Modes as colours (theory)', 'Understand modes as the major scale from another degree.', [
    'Dorian = 2nd degree, Mixolydian = 5th degree.',
  ], { min: 4, learn: 'modes explained simply guitar' }),
  U('s27', 'shared', 6, 'Songwriting challenge', 'Write a song a week (or join FAWM / 50-90).', [
    'Finish songs — don\'t polish forever.',
  ], { min: 8, tool: { id: 'songpad', opts: {} } }),
];

export const unitById = Object.fromEntries(UNITS.map(u => [u.id, u]));
export const trackUnits = track => UNITS.filter(u => u.track === track);

// Song ladders. Titles only (no lyrics). `after` = unit that must be done first.
export const SONGS = [
  { id: 'gs01', inst: 'guitar', title: 'Wild Thing', artist: 'The Troggs', after: 'g06', skill: 'A–D–E: your first I–IV–V' },
  { id: 'gs02', inst: 'guitar', title: 'Seven Nation Army', artist: 'The White Stripes', after: 'g07', skill: 'Single-note riff, reading tab' },
  { id: 'gs03', inst: 'guitar', title: 'Smoke on the Water', artist: 'Deep Purple', after: 'g08', skill: 'Two-string riff, rests' },
  { id: 'gs04', inst: 'guitar', title: 'A Horse with No Name', artist: 'America', after: 'g09', skill: 'Two chords, steady strumming' },
  { id: 'gs05', inst: 'guitar', title: "Knockin' on Heaven's Door", artist: 'Bob Dylan', after: 'g12', skill: 'G, D, Am, C changes' },
  { id: 'gs06', inst: 'guitar', title: 'Come As You Are', artist: 'Nirvana', after: 'g15', skill: 'Riff + alternate picking', note: 'Original is tuned down a whole step' },
  { id: 'gs07', inst: 'guitar', title: 'Stand By Me', artist: 'Ben E. King', after: 'g13', skill: 'I–vi–IV–V "50s" progression' },
  { id: 'gs08', inst: 'guitar', title: 'Let It Be', artist: 'The Beatles', after: 'g19', skill: 'I–V–vi–IV, the F chord' },
  { id: 'gs09', inst: 'guitar', title: 'Blitzkrieg Bop', artist: 'Ramones', after: 'g14', skill: 'Power-chord changes, down-pick stamina' },
  { id: 'gs10', inst: 'guitar', title: 'Redemption Song', artist: 'Bob Marley', after: 'g15', skill: 'Riff + strumming mix' },
  { id: 'gs11', inst: 'guitar', title: 'Wonderwall', artist: 'Oasis', after: 'g26', skill: 'Anchor chords, 16th strumming, capo' },
  { id: 'gs12', inst: 'guitar', title: 'Smells Like Teen Spirit', artist: 'Nirvana', after: 'g14', skill: 'Moving power chords, muted strums' },
  { id: 'gs13', inst: 'guitar', title: 'Sweet Home Alabama', artist: 'Lynyrd Skynyrd', after: 'g22', skill: 'D–C–G, picking chord tones' },
  { id: 'gs14', inst: 'guitar', title: 'Wish You Were Here', artist: 'Pink Floyd', after: 'g22', skill: 'Intro lick with hammer-ons' },
  { id: 'gs15', inst: 'guitar', title: 'Wonderful Tonight', artist: 'Eric Clapton', after: 'g27', skill: 'Melodic riff, bends, feel' },

  { id: 'bs01', inst: 'bass', title: 'Seven Nation Army', artist: 'The White Stripes', after: 'b06', skill: 'One-string riff' },
  { id: 'bs02', inst: 'bass', title: 'Smoke on the Water', artist: 'Deep Purple', after: 'b05', skill: 'Steady eighths' },
  { id: 'bs03', inst: 'bass', title: 'Another One Bites the Dust', artist: 'Queen', after: 'b11', skill: 'Rests, muting, funk' },
  { id: 'bs04', inst: 'bass', title: 'Come As You Are', artist: 'Nirvana', after: 'b07', skill: 'Melodic repeating riff', note: 'Original is tuned down a whole step' },
  { id: 'bs05', inst: 'bass', title: 'Back in Black', artist: 'AC/DC', after: 'b10', skill: 'Eighths locked to the kick' },
  { id: 'bs06', inst: 'bass', title: 'Blitzkrieg Bop', artist: 'Ramones', after: 'b05', skill: 'Driving roots, endurance' },
  { id: 'bs07', inst: 'bass', title: 'With or Without You', artist: 'U2', after: 'b05', skill: 'Roots under I–V–vi–IV' },
  { id: 'bs08', inst: 'bass', title: 'Stand By Me', artist: 'Ben E. King', after: 'b09', skill: 'Syncopated line through a progression' },
  { id: 'bs09', inst: 'bass', title: 'Yellow', artist: 'Coldplay', after: 'b10', skill: 'Supportive eighths' },
  { id: 'bs10', inst: 'bass', title: 'Psycho Killer', artist: 'Talking Heads', after: 'b08', skill: 'Octave jumps' },
  { id: 'bs11', inst: 'bass', title: 'Should I Stay or Should I Go', artist: 'The Clash', after: 'b10', skill: 'Tempo changes, punk eighths' },
  { id: 'bs12', inst: 'bass', title: 'Under Pressure', artist: 'Queen & David Bowie', after: 'b11', skill: 'Syncopation' },
  { id: 'bs13', inst: 'bass', title: 'Come Together', artist: 'The Beatles', after: 'b18', skill: 'Slides, groove, feel' },
  { id: 'bs14', inst: 'bass', title: 'Money', artist: 'Pink Floyd', after: 'b15', skill: '7/4 time' },
  { id: 'bs15', inst: 'bass', title: 'Billie Jean', artist: 'Michael Jackson', after: 'b19', skill: 'Locking with drums, pinky', note: 'Harder than it looks — one bar at a time' },
  { id: 'bs16', inst: 'bass', title: 'Superstition', artist: 'Stevie Wonder', after: 'b22', skill: 'Syncopated funk (stretch goal)' },
];

export const WARMUPS = {
  guitar: [
    'Shake out your hands. Open & close fists ×10, gentle wrist circles.',
    'Chromatic 1-2-3-4 on each string, light pressure, slow.',
    'Open-string alternate picking, 4 per string, relaxed.',
  ],
  bass: [
    'Loosen hands and wrists. Shoulders down.',
    'Spider 1-2-3-4 across all strings, strict index–middle plucking.',
    'Open-string rest strokes — every note the same volume.',
  ],
};

export const CREATE_PROMPTS = [
  'Record any 4 chords you know as a loop on your phone. Hum over it for one minute.',
  'Make a 2-note riff. Play it 8 times with small changes each time.',
  'Object writing (10 min idea → 3 min version): pick an object near you; describe it with sight, sound, smell, taste, touch, body feeling and motion. No rhymes needed.',
  'Take a song you know. Keep its chords, hum a brand new melody over them.',
  'Play your current riff, but change one note. Then change the rhythm.',
  'Write a song title on a piece of paper. Strum G – Em – C – D and hum how that title might sound.',
  'Improvise for 2 minutes using only 3 notes. Space is musical.',
  'Play a sad version of a happy progression (swap a major chord for its minor).',
  'Write 2 lines about where you are right now. Speak them in rhythm over a strum.',
  'Record a bass line on your phone, then strum chords over the playback.',
];

export const STUDIO_STEPS = {
  progression: { title: 'Write the progression', steps: [
    'Open Song Pad. Pick a key and 4 chords (try a preset, then change one chord).',
    'Set a tempo you can play comfortably. Press play and listen 4 times.',
  ], tool: { id: 'songpad', opts: {} } },
  guitar: { title: 'Guitar part', steps: [
    'Strum the progression along with the pad.',
    'Try a different strum or a single-note riff on top.',
    'Record it on your phone (Voice Memos / GarageBand / BandLab).',
  ] },
  bass: { title: 'Bass line', steps: [
    'Play roots in eighth notes along with your guitar recording.',
    'Upgrade: root–5th, then an approach note into each change.',
    'Record it over the guitar.',
  ] },
  melody: { title: 'Melody & words', steps: [
    'Hum over the loop until a phrase repeats itself.',
    'Write 2–4 lines (or nonsense syllables!) to that phrase.',
    'Save the idea in Song Pad with a title. Done is better than perfect.',
  ], tool: { id: 'songpad', opts: {} } },
};

export const ytSearch = q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
export const songLinks = s => [
  { label: 'Lesson videos', url: ytSearch(`${s.title} ${s.artist} ${s.inst} lesson easy`) },
  { label: 'Tab (Songsterr)', url: `https://www.songsterr.com/?pattern=${encodeURIComponent(s.title + ' ' + s.artist)}` },
  { label: 'Chords (Ultimate Guitar)', url: `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(s.title)}` },
];

export const RESOURCES = [
  { group: 'Guitar lessons', items: [
    ['JustinGuitar (free beginner course)', 'https://www.justinguitar.com/'],
    ['Andy Guitar — electric beginners', 'https://www.andyguitar.co.uk/'],
    ['Marty Music', 'https://www.martymusic.com/'],
    ['Paul Davids — mistakes & mindset', 'https://pauldavidsguitar.com/blog/10-guitar-mistakes-beginners-make-and-how-to-fix-them'],
  ] },
  { group: 'Bass lessons', items: [
    ['StudyBass (free structured course)', 'https://www.studybass.com/study-guide/'],
    ['TalkingBass (450+ free lessons)', 'https://www.talkingbass.net/beginner-lessons/'],
    ['BassBuzz free 7-day course', 'https://www.bassbuzz.com/courses/beginner/'],
    ["Scott's Bass Lessons crash courses", 'https://courses.scottsbasslessons.com/crash-courses'],
  ] },
  { group: 'Ears & theory', items: [
    ['Functional Ear Trainer (iOS)', 'https://apps.apple.com/app/id1088761926'],
    ['ToneDear', 'https://tonedear.com/'],
    ['musictheory.net', 'https://www.musictheory.net/'],
    ['Hooktheory TheoryTab', 'https://www.hooktheory.com/theorytab'],
  ] },
  { group: 'Tools', items: [
    ['Moises (slow down / isolate bass)', 'https://moises.ai/'],
    ['BandLab (free recording, Android/web)', 'https://www.bandlab.com/'],
    ['Groove Scribe (drum patterns)', 'https://www.mikeslessons.com/gscribe/'],
    ['FAWM songwriting challenge', 'https://fawm.org/'],
  ] },
];
