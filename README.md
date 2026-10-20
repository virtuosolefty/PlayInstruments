# Practice Deck

Practice Deck is a browser-based practice studio for piano, guitar (and bass), violin, cello, veena, drums, tabla and handpan. Play on the screen, use computer keys for piano, drums, tabla and handpan, connect a MIDI controller, or play your own instrument into the microphone. Follow falling notes, learn short guided phrases, play ten songs you already know on every instrument, and keep your progress in your browser.

## Use it online

Once the GitHub Pages deployment completes, open:

**https://virtuosolefty.github.io/PlayInsturments/**

No download or account is required. Sound starts after you click **Enable sound** or play an instrument control. It can be installed from the browser's menu as an app; it still needs a connection to load.

## Run it on your computer

You need [Node.js 20 or newer](https://nodejs.org/).

```bash
git clone https://github.com/virtuosolefty/PlayInsturments.git
cd PlayInsturments
npm install
npm run dev
```

Open the address shown in the terminal, normally `http://localhost:5173`.

To test the production version:

```bash
npm run build
npm run preview
```

## Getting started

1. Choose an instrument on the welcome page: Piano, Guitar, Violin, Cello, Veena, Drums, Tabla or Handpan. Guitar has a **Bass** setting in the studio's controls.
2. Select **Try piano** (or whichever you chose) to play a short guided phrase.
3. Click **Enable sound** when the browser asks you to start audio.
4. Use the on-screen instrument, the computer keyboard for piano and drums, a MIDI controller, or your own instrument through the microphone (**Input & sound → Microphone**).
5. Return to the learning home to continue your saved lesson, explore pieces, or download a progress backup.

Your results and settings stay in the current browser. There is no account or cloud sync, so download a backup from the learning home if you want to protect or move your progress.

## What works

- Piano: on-screen keys, computer keyboard, and Web MIDI input.
- Guitar: on-screen fretboard, chord shapes, strum controls, and MIDI note input. On the 3D stage, lessons and free play's **Fretboard** view show the neck straight across, with each string numbered; at full detail, **Whole instrument** shows a 3D model of an acoustic guitar that you can turn by dragging. The 2D trainer is a rosewood fretboard with true fret spacing.
- Violin and cello: on the 3D stage at full detail, 3D models with finger tapes, numbered finger markers and a bow that plays the sounding string; free play opens on **Fingerboard**, and **Whole instrument** shows the violin at three-quarters and the cello standing on its endpin. Otherwise, a drawn fingerboard with finger tapes. Press and hold a place to bow it, drag along a string to slide, or bow near the bridge for an open string (keyboard: arrows, then hold Enter or Space). Seven first-position lessons each, a finger chart in Learn mode, and a scale explorer in Free play. A **Bow / Fingers** switch beside the instrument plays it with the bow (a note sounds while held) or plucked with the fingers (pizzicato: a press plucks, it rings away by itself, with a plucked voice of its own and no bow on the string).
- Bass (under Guitar): four strings an octave below the guitar's lowest four. Seven lessons from the open strings to roots, root-and-fifth and a walking line. At full detail it is played on a 3D bass guitar that can be seen whole and turned; otherwise on the drawn fretboard.
- Drums: a nine-piece kit (kick, snare, closed and open hi-hat, three toms, crash and ride). Lessons scroll as lanes, one a drum, each tile showing the key that plays it. Hit the 3D kit, the on-screen pads, the computer keys (each drum is the letter it starts with: K, S, H, O, T, M, F, C, R), or a pad controller or electronic kit sending the standard General MIDI drum notes. Seven lessons from finding each drum to a beat with a fill, and a free-play kit you can turn by dragging the floor. The 3D kit is built in code, so there is no model to download; the drum sounds are synthesized. On the 3D kit a pair of drumsticks strikes each drum as it is hit, and the kick's beater swings into its head.
- Veena: a Saraswati veena tuned with Sa on D, its four playing strings Pa, Sa, Pa, Sa (A1 D2 A2 D3), the sarani nearest you. Seven lessons in the way Carnatic music is taught: the open strings, Sa and Pa, sarali and janta varisai in Mayamalavagowla, the swaras below Sa and a climbing pattern; the ten songs you know are played from Sa. Each note is named by its swara first ("Pa · A3 · string 1 · fret 7"). At full detail it is played on a downloaded 3D veena, whose frets were moved to where equal temperament puts them so that every marked fret is one the model has; otherwise on the drawn fretboard. The microphone hears it as it hears the guitar.
- Tabla: the dayan and the bayan, six strokes (Na, Tin, Tun, Te on the dayan; Ge and Ke on the bayan), each on its own key (N T U E G K). Lessons scroll as lanes and name their bols; Dha is Na and Ge together. Seven lessons from meeting the two drums to Dadra, Keherwa and Teentaal, and ten thekas to play along to. A downloaded 3D tabla lights the drum each stroke falls on; the strokes are synthesized.
- Handpan: a D Aegean 18 (D3 ding; F#3 A3 C#4 D4 F#4 G#4 A4 C#5 D5 F#5 round it; B2 E3 G#3 B3 E4 B4 E5 underneath), built in code in the shape of the pans at ayasainstruments.com, which was the visual reference only. The middle row of keys plays the top from the ding up (A to '), the bottom row the underside (Z to M). Strike a field on the 3D pan to play it, turn the pan over with **Top / Underside** (a lesson turns it by itself when the next notes are underneath), seven lessons and ten tunes. Its sound is built like a real pan's: each note with its octave and twelfth, the overtones fading first while the note rings on for about six seconds at the ding (letting go of a key does not stop it), a slow shimmer, the notes tuned to its octave and twelfth ringing along, and a soft finger thud.
- More instruments in the whole view: in free play at full detail, **Whole instrument** opens a pop-up with a picture of each instrument there is to see: a bass guitar, an electric violin, an antique cello, and an acoustic and an electronic drum kit. Choose one to see it whole and turn it; **Fretboard**, **Fingerboard** or **Practice kit** goes back to the instrument you play. The bass, the electric violin and the antique cello answer to your playing: the bass's four strings move with the guitar strings of the same name, and the bow plays on the violin and the cello, which can be bowed by the bridge. They keep the lessons of the instrument they stand in for, but you hear the instrument you see: the bass guitar sounds like a bass, an octave below the guitar string it answers to; the electric violin is brighter, with no wooden body; the electronic kit has its own booming kick, snappy snare and short cymbals. The antique cello and the grand piano sound as the cello and the piano do. The two drum kits answer too: each drum lights and moves when you tap it, or hit it from the keys, the pads or a controller. Drag the background to turn a downloaded kit.
- Songs you already know: ten familiar tunes (Hot Cross Buns to Happy Birthday) arranged for every instrument in its first position, and ten beats for the drums. They are open from the first visit, on the learning home, in the library and in each Exercise list.
- Lessons that open as you go: playing a lesson through once, at any speed or with the notes waiting for you, opens the next one. Stars are separate: three at full speed pass a lesson's check and four master it.
- Your own instrument, through the microphone: choose **Input & sound → Microphone** and play single notes on a real guitar, bass, violin, cello, veena or piano; lessons judge them as they would a controller's. **More → Tuner** names the note it hears, how many cents off it is, and which string to turn. Chords, strums and drums are not heard.
- Light and dark themes, guided lessons, practice feedback, favourites, and local backups.
- Free play that is easy to find your way in: one row with the chord, scale or drum-key explorer, the tuner and the input check, the note you played last, and which computer keys play.
- Input & sound in three steps (choose how you play, check you are heard, check the sound), with timing, touch, keyboard size and external sound under **More options**. The top bar says when a controller is connected or missing, and a controller plugged in later is announced.
- Three-dimensional piano, guitar, bass, violin, cello, veena, drum kit, tabla and handpan views with a simpler 2D trainer option. **Instrument settings → 3D detail** chooses Full (the 3D models), Light (the simpler built-in guitar and the drawn fretboards and fingerboards) or Auto, and says which is in use.

For the best MIDI experience, use a current Chromium-based browser such as Chrome or Edge. Firefox and Safari can still use the on-screen instruments and the microphone, but do not provide Web MIDI support. The microphone needs the site to be served over https (or from localhost).

## GitHub Pages

The included workflow publishes each push to `main` to GitHub Pages. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the deployment source if GitHub has not selected it automatically. The published site appears at the online link above once the workflow succeeds.

## Development checks

```bash
npm test
npm run build
npm run test:e2e
```

The application uses React, Vite, Tone.js, VexFlow, and Three.js.

## Project structure

```text
.github/workflows/   GitHub Pages deployment
docs/                Developer notes; docs/design/ holds design notes and the design system
e2e/                 Playwright tests (tests/, helpers/, pages/, fixtures/)
e2e/config/          Focused Playwright suites (studio, guitar, reference piano)
public/              Static files: songs, preview images, the prepared 3D models (see CREDITS.md), manifest
scripts/build/       Build steps: public pages, icons, design-system sync
scripts/songs/       The bundled song library and its generators
scripts/media/       Pictures of the instruments and models (needs the dev server and a GPU)
scripts/models/      Prepares downloaded models: node scripts/models/prepare.mjs
scripts/dev/         Tools for looking at and measuring the running app
src/components/      React components
src/hooks/           React hooks
src/lib/             The app's logic, with unit tests beside each file; instruments.js is the registry
  app/               Settings, storage, routes, theme, commands and shortcuts
  audio/             The sound engine, its output, the drone, playback and speech
  input/             MIDI, microphone, pitch, tuner and device timing
  music/             Theory, notation, scores and arranging
  practice/          Matching, grading, the clock, loops and drills
  learning/          The learning path, discovery, glossary and progress
  piano/             The keyboard and the piano roll
  strings/           Guitar, bass, veena, violin and cello
  struck/            Drums, tabla and handpan
  stage/             The 3D studio, the model lists and credits
src/styles/          Stylesheets, loaded in order from src/main.jsx
```

How each feature works, the code layout and the test suite are described in [docs/developer-notes.md](docs/developer-notes.md); the plan for the 3D string instruments is [docs/design/strings-3d-plan.md](docs/design/strings-3d-plan.md).

Run a focused suite with `npm run test:studio`, or `npx playwright test --config e2e/config/guitar.config.js`.

## Credits

The 3D instruments are free models from Sketchfab, used under the Creative Commons Attribution 4.0 licence. Their authors are credited in [CREDITS.md](CREDITS.md) and in the app under **Help**.

## Privacy

Practice history is stored locally in your browser. Shared lesson links contain only the selected instrument and lesson identifier; they do not include your scores or practice history.

The microphone is used only while the tuner is open or Microphone is your chosen input. What it hears is analysed in your browser to find its pitch and then discarded. It is not recorded, stored or sent anywhere.

### Design and visual checks

On phones, guided lessons keep a compact next-action card beside the instrument; **Guide** opens the full explanation. Lessons include preparation tips, a goal and why it comes next. The piano path has 17 lessons, including steady-beat and alternating-hand steps before both hands together. Easy tunes are ordered for each instrument, with piano hand changes explained.

The local [design-system mirror](docs/design/design-system.html) includes both themes and embeds the exact contents of `src/styles/tokens.css`. Run `npm run design:sync` after changing tokens; `npm test` checks that the mirror stays current.

With the dev server running, use `node scripts/dev/shoot.mjs http://localhost:5199/`, `node scripts/media/shoot-instruments.mjs http://localhost:5199/`, and `node scripts/media/shoot-models.mjs http://localhost:5199/` to refresh the screens and shipped previews. Open the images to check them.
