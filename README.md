# FretPath 🎸🎵

FretPath is a free, offline-capable practice coach for **6-string electric guitar and 4-string bass**. It works in any browser and installs to the home screen on Mac, iPhone and Android.

Every day it gives you a short, specific session: warm-up, one technique, a real song, ear and fretboard training, and a little songwriting. It is built around one goal: **play any song and write your own**.

- **Adaptive schedule.** You choose how many days a week and how long each session is. The app balances guitar and bass equally, counting the minutes you actually practise.
- **Ramp-up.** Sessions are capped at 15 minutes in weeks 1–4 (while calluses form) and 25 minutes until week 12. After that they grow to your chosen length.
- **Learning path.** 6 phases and about 100 skills across three tracks (guitar, bass, ears & theory), plus song ladders for both instruments. You can add your own songs.
- **Recall warm-up game.** Before each session you get 5 quick questions on your last practice: chord diagrams, note names, ear tests and concept checks. Anything you miss comes back for review.
- **Illustrations.** Chord diagrams, strumming patterns, tab, scale and bass shapes, guitar and bass anatomy, hand and pick diagrams, and theory pictures. They appear inside each lesson and all together in the Chord & Shape Library.
- **Themes.** Calm (the default; it follows light or dark mode), plus Playful, Midnight neon and Vintage amp in Settings.
- **Built-in tools.** Metronome (with tempo ladder), drum grooves, microphone tuner, fretboard and note-finder game, ear trainer, One Minute Changes timer, and a Song Pad that loops chord progressions and suggests bass lines.
- **Habits without guilt.** The goal is weekly and has a day of slack. A 2-minute session counts. Learned skills come back for spaced review. You can report pain, and the next session gets shorter.

Why it teaches this way: see [RESEARCH.md](RESEARCH.md).

## Run locally

Any static file server works. For example:

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Host on GitHub Pages

1. Push this folder to a GitHub repository.
2. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, then pick `main` and `/ (root)`.
3. Open `https://<username>.github.io/<repo>/`.
   - **iPhone:** in Safari, tap Share → Add to Home Screen.
   - **Android:** in Chrome, tap ⋮ → Install app.
   - **Mac:** in Safari, choose File → Add to Dock; in Chrome, click the install icon in the address bar.

## Your data

Progress is stored only in your browser (`localStorage`) on each device. To move it to another device, use **Settings → Export backup** there and **Import backup** on the other one.
