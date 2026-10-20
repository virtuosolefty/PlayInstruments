# Practice Deck

## Tabla, handpan and veena

Added 19 October 2026. The pickers now hold eight buttons: piano, guitar (with the bass behind it), violin, cello, veena, drums, tabla and handpan. On a phone the learning home lays them out in two rows of four.

### Struck instruments: one framework for the drums, the tabla and the handpan

- **A set** (`src/lib/struck/struck.js`, `struckSet`) is what a struck instrument is played with: its pieces (id, short name, label, note, key, hand, group), extra notes a controller may send for a piece (`aliases`), and its words. From it come `forMidi`, `canonical`, the computer keys, the lanes and the instruction line. `struckStudy` and `parseBeats` turn a lesson written as beat text (`-` rests, `a+b` splits a beat, two pieces on one beat sound together) into a score the matcher, history and lanes already understand.
- **Which sets there are** is `src/lib/struck/struckSets.js`: `STRUCK`, `struckSetFor`, `isStruck`. The drums keep their own `drums.js` and are wrapped there; `noun: 'Drum'` keeps "Drum studio" and "Drum exercise", which the others take from the kit's label.
- **One studio.** `DrumWorkspace.jsx` takes an `instrument` and reads its set: the lanes, pads, explorer card and keys are the drums' own components taking a set, and `STAGES` picks the 3D stage (`DrumStage`, `TablaStage`, `HandpanStage`). `usePracticeEngine.playedMidi` turns a controller's note into the piece it means with `set.canonical`.
- **The tabla** (`src/lib/struck/tabla.js`): six strokes, Na Tin Tun Te on the dayan (right hand) and Ge Ke on the bayan, each on its own key (N T U E G K). Bols are words: Dha is Na + Ge, Dhin is Tin + Ge, and `upNext` says "Dha · Na + Ge · press N + G". Seven lessons up to Teentaal, ten thekas. Its sound is synthesized (`tablaVoice.js`): the dayan's ringing strokes from tuned partials, the closed strokes from noise, Ge from a membrane synth. `TablaStage.jsx` shows the downloaded tabla and lights the drum a stroke falls on (`buildDrumModelRig`).
- **The tabla's model is CC BY-NC 4.0** (Marcel Porsiel). The player chose to use it and keep the app free: Practice Deck must not be sold or monetised while it ships this model. `modelCredits.js` carries the licence per credit (`NON_COMMERCIAL`), so Help and the model file say so. It is on `OWN_STAGE_MODELS` in `stageModels.js`, not in the whole-instrument view.
- **The handpan** (`src/lib/struck/handpan.js`, `handpanModel.js`, `HandpanStage.jsx`) is a D Aegean 18 built in code, in the shape of the pans at ayasainstruments.com, which was a visual reference only (the site was rate-limited, so the player's screenshot of their D Aegean 18 was used). Eleven notes on top, ding D3 in the middle and the rest climbing in a zig-zag, keys A to `'`; seven underneath on Z to M. Each field is a dimple with a dome, a ring torus marks the next note, and a struck field gives and springs back. **Top / Underside** turns the pan over; a lesson whose next notes are all underneath turns it by itself. The flip finishes on the first frame past its time, however late that frame comes.

### The veena

- **Kit** (`src/lib/strings/fretted.js`, beside the bass): `VEENA_TUNING` is A1 D2 A2 D3, Pa Sa Pa Sa with Sa on D; string 1 is the sarani. Lessons are written in swaras (`swaras('s r g m p d n S')`, frets on the sarani) in Mayamalavagowla, the raga Carnatic students start in; `theory.js` knows it as a mode (`mayamalavagowla`), so a wrong note is judged against the raga, and the lesson's key reads "Mayamalavagowla on D". The ten songs are arranged from Sa with a reach of twelve frets, so they stay on the sarani as a veena player would play them. The left hand slides one finger (`veenaFinger`).
- **Swaras in the words.** `kit.swara` (`veenaSwara`) puts the swara before the note name in Up next and the lesson instruction: "Pa · A3 · string 1 · fret 7 · finger 1". `kit.tuningLabel` ("Sa on D") and `kit.openStrings` give the stage header and the free-play card the veena's own words.
- **Model** (mayam3D, CC BY 4.0), played by `FrettedModelStage.jsx` like the bass, at full detail. Three things in the recipe (`scripts/models/recipes.mjs`) are new:
  - `playingSpan: crestSpan(0, 1)`: the veena's strings climb steeply from the pegs to the nut, rise gently to the bridge and fall away to the tailpiece, so the playing length is from where they level out to their crest.
  - `highestNearest`: the sarani lies nearest the player, beside the drone strings, so the strings are ordered with the highest nearest. `modelNeck` (`guitarNeck.js`) now places fret numbers and the playable surface on whichever side is outward.
  - `evenFrets`: the model spaces its 21 frets evenly. `placeEvenFrets` in `prepare.mjs` slides each to its equal-tempered place along the measured strings, so every fret the stage marks is a fret on the model; the bar at the nut stays where it is. `veena.test.js` checks the prepared frets against `fretX`.
- The three drone strings are kept as a part of their own (`drones`) and are not played. `MODEL_STRINGS.veena` gives the drawn strings veena gauges, the two lower ones wound.
- **Sound** is a plucked voice with strong upper partials and a long ring, for the buzzing jivari bridge.

### What you hear is what you see, and a handpan that sounds like one (20 October)

- **The whole-instrument view's models have their own voices.** Until now the voice followed only the instrument practised, so the bass guitar in the guitar's view played the guitar's sound, the electric violin the violin's and the electronic kit the acoustic kit's (checked in the browser for every model). `WholeModels.jsx` now tells `shownModel.js` which model stands in the instrument's place; App passes it to `soundFor` (`technique.js`), which picks the voice: the bass guitar plays the bass voice an octave down (`audio.setInstrumentType(voice, { transpose: -12 })`, since its strings answer to the guitar's of the same name), the electric violin a brighter bowed voice with no body (`BOWED['violin-electric']`), the electronic kit `buildDrumVoice(Tone, out, 'electronic')`. A plucked violin stays plucked. The antique cello and the grand piano keep the instrument's voice. Spec 21 checks each.
- **The handpan voice** (`handpanVoice.js`) replaces the plucked-string table entry, which was one additive tone whose partials all faded together and which a key's release cut off after about 1.3 s. Each strike is the note, a twin a slow beat above it (the shimmer), the octave tuned 3 cents wide and the twelfth, each a sine with its own fade (to 60 dB down: the note about 6 s at the ding and 3 s at the top, the octave 0.4 of that, the twelfth 0.22), the fields tuned to its octave and twelfth ringing quietly along, and a pink-noise thud below 900 Hz, all under a 5.2 kHz low-pass. A release does nothing; `releaseAll` damps. The fades are shaped on a gain directly: Tone's envelope turns a `decay` of 6 s into a time constant of `ln(7)/ln(200)`, about 0.37 s, which falls 60 dB in 2.5 s. Partials that have died away are let go at the next strike, not in `onstop`: `Tone.Offline` runs every stop callback before it renders, so letting go there silenced offline renders.
- **Measured** by rendering both voices offline in the browser as a 150 ms key tap (the script is not kept in the repo; `handpanVoice.test.js` checks the structure): D3 old 1.3 s audible, partials 0 / −5 / −9 dB fading together; new 5.5 s audible, 0 / −9 / −18 dB, fades 6.0 / 2.9 / 3.4 s (the twelfth held up by A4 ringing along), a 2 dB shimmer near 1 Hz, spectral centroid 208 Hz against 257.
- **No clipping** (20 October, found by the edge-case pass). With no limiter, eleven handpan notes struck hard peaked at 2.04 times full scale (the 19 October voice clipped too). Every sound now leaves through `buildOutput` (`audioOutput.js`): the master gain, a limiter at -1 dB, then a soft safety stage, a wave shaper that leaves everything under 85% of full scale exactly as it is and bends only peaks the limiter is too slow for, so nothing passes full scale. It is built inside a guard in `audio.js`: if it cannot be, the app plays through a plain gain, as before. The handpan voice is also a third quieter.
- **Search finds a lesson by its description** (`useCommandPalette.js`), ranked below title matches, so "underside" finds the handpan's "Under the shell".

Tests: `struckInstruments.test.js`, `veena.test.js`, `modelCredits.test.js`, `stageModels.files.test.js`, and in the browser `e2e/tests/31-world-instruments.spec.js` (studio config).

### Next steps after the new instruments (20 October)

From a ui-ux-pro-max pass over the new instruments; the player kept nine cards (plan artifact, collection `nextDecisions`). The tabla card carried the note "have the tabla instrument shown here", so its 2D view is a picture of the real tabla, not a drawing.

- **The handpan's 2D view is the pan** (`HandpanMap.jsx`): the ding in the middle, the ten top notes round it at the angles the 3D pan uses (`fieldPlace`, from `handpan.js`), the underside beside it turned over (mirrored) round the gu. Every field is a button with the pads' behaviour (plays on pointer-down, plays from a key-less click, named "E5, underside, key M"). The pans size from the height they have (`--pan-d`): large in free play, smaller beside a lesson's lanes (where the captions drop), stacked on a phone. Colours are the `--pan-*` tokens.
- **The tabla's 2D view is the tabla** (`TablaMap.jsx`, `tablaMap.js`): `public/media/tabla-from-above.webp` is the 3D model rendered by the app's own studio from the player's seat, higher up, and both heads were measured in it when it was made (`PICTURE.heads`, percent of the picture). Each bol's mark sits where it is struck (`STROKE_PLACES[id].at`, a share of the head's radius: Na on the rim, Tin inside it, Tun and Te on the dayan's black centre, Ge on the bayan's open skin, Ke on its centre). A narrow picture keeps each mark to its key (a container query). The marks are buttons named by the bol's label ("Na, the rim, key N"). If the model is ever changed, render and measure again with `node scripts/media/render-tabla-picture.mjs` (dev server running) and copy the heads it prints into `PICTURE.heads`.
- **The 3D tabla lights the place struck** (`stage/tablaZones.js`): a ring per stroke on its head, from the same `STROKE_PLACES` zones; each head is measured from the model's vertices (`measureHeads`: the rim from the highest ring, the skin from the highest point well inside it). The next stroke's ring glows; a struck one flashes in its verdict's colour. The whole drum no longer glows for the next stroke, and only gives a little when struck. A tap on a ring plays that stroke (the centre plays Tun); elsewhere on a drum, Na or Ge as before.
- **The veena's board is its own** (`strings.css`, `.veena-workspace`): the board's tokens re-pointed to dark wax and brass (`--wax-*`, `--brass-*`), and no inlay dots. On the sarani, frets in the piece's raga or scale (`keyPitchClassSet(score.key)`) show their swara at rest (`button.swara`, `--swara-*`); a place showing the next note, a chord shape or a held note keeps that.
- **Free play on a phone opens on the instrument** (`<details class="folded-card">` in `GuitarWorkspace.jsx` and `DrumWorkspace.jsx`): on a phone the free-play card (chords, open strings, keys and tips) folds into one line under the instrument; `foldedSummary` writes the line ("Open strings · Sa Pa Sa Pa" on the veena). The handpan's card lists its first two keys and "Show all 18 keys" (`StruckCard`, more than nine pieces).
- **The library's instruments on a phone**: two rows of four, as on the learning home (`clarity.css`).
- **No jump on the welcome page**: fallback faces with the real fonts' metrics (`tokens.css`: "Inter Fallback" on Arial, "Fraunces Fallback" on Times New Roman, "JetBrains Mono Fallback" on Courier New; size-adjust and ascent/descent overrides measured in Chromium). Layout shift went from 0.107 (phone) and 0.091 (desktop) to 0; spec 31 checks it stays under 0.05.
- **A drone** (`drone.js`, `droneVoice.js`): for the veena and the handpan, a tanpura's four strings (Pa, Sa, Sa, low Sa on D) plucked in turn every 1.2 s on the voice's own timer, each ringing through the next. `audio.setDrone(notes, levelDb)`; asked for before sound starts, it waits. App asks for it while the instrument has one, the setting `drone` is on and the learning home is not showing. A Drone button sits beside the metronome in a lesson and in the free-play bar; Practice settings has its volume (`droneLevel`, -30 to 0 dB, default -12, about 10 dB under a struck note). At 901 to 1440px the metronome and drone buttons are icons (`.pad-metronome`, `.pad-drone`).
- Spoken bols were kept out, as the card recommended: browser voices mispronounce them.

Tests: `nextSteps.test.js` (map places, tabla marks and zones, the drone's cycle, the folded line), and in the browser spec 31 (the pan map, the tabla picture, the veena's swaras and drone, phone free play, the library row, the welcome page's layout shift).

## Reach: installing, opening lessons, songs, more instruments and the microphone

Added October 2026, in four parts, each to remove something that kept a newcomer out.

### Installing, two names, and the film songs

- **Installing from GitHub Pages.** The site is served from `/PlayInsturments/`, so every address in `public/manifest.webmanifest` is relative (`start_url` and `scope` are `./`): a manifest address that starts at the root points at somebody else's page there. A phone asks for PNG icons, so `npm run icons` (`scripts/build/build-icons.mjs`) draws `public/icons/` from `public/favicon.svg`: 192 and 512 pixels, a maskable 512 with the background to the edges, and a 180 pixel one for iOS. There is no service worker, so the installed app still needs a connection.
- **Input & sound**, in the top bar, is what was called Instrument setup; it shared a first word with **Instrument settings** beside the instrument picker and the two were easily confused. It reads **Microphone on** or **Controller connected** when either is.
- **The stage's playable view has its own name.** Free play's view switch read Learn | Whole instrument under a workspace switch that reads Learn | Free play. The first button now says what it shows: **Fretboard** (guitar, bass), **Fingerboard** (violin, cello) or **Practice kit** (drums). `StageViewSwitch.jsx` takes it as `label`; the value behind it is still `'learn'`.
- **Film songs are local only.** Six film songs in `public/songs/songs.json` are marked `localOnly`. They are there when the app is run from a clone and are left out of a public build: `scripts/build/build-public-pages.mjs`, when `GITHUB_PAGES` or `PUBLIC_SITE_URL` is set, rewrites `dist/songs/songs.json` without them and deletes their MIDI files (`scripts/songs/public-library.mjs` decides which). `npm run songs` carries them over, since it does not write them. `scripts/songs/public-library.test.mjs` fails if a song tagged `film-music` is not marked. The files are still in the public repository; taking them out of it, and its history, is a separate decision. Two credits were wrong and are corrected (Rowdy Baby is Yuvan Shankar Raja's, the Theevandi theme Kailas Menon's). No song called "Anjathe Pookkal" could be found, so that entry's credit is unverified.

### Finishing a lesson opens the next one

`src/lib/learning/path.js` keeps two things apart that used to be one. **Finished** is one complete run of a lesson, guided (Wait for me) or timed, at any speed: it opens the next lesson, the next stage once every lesson in a stage is finished, and the stage's recital piece. **Stars** are as before: three at the written tempo pass a lesson's check, four master it, and only a timed run at tempo earns them. `exerciseState` reports `finished` beside `passed` and `mastered`; a stage has `finished` beside `cleared`; `pathState` counts `finishedCount` beside `passedCount`, and its `currentId` is the first open lesson not yet finished, then the first whose check is not passed. An abandoned run (stored without stars) opens nothing.

The words on the learning home, the Path tab, the lesson guide and the end-of-run report say the same: `blockerHelp` now explains why a lesson has no stars, never why the next one is shut. The lesson guide offers **Move on to the next lesson** beside its own next step once a lesson is finished.

### Ten songs for every instrument

`src/lib/music/easySongs.js` holds ten tunes everybody knows, written once in sol-fa (`d r m f s l t`, with marks for octave and length), all traditional or out of copyright. `arrangeTune` puts each in a key that sits in an instrument's first position: every note goes on the string just below it (the chart a method book prints), and `fitTonic` takes the first key on the instrument's list in which every note lands on an open string or a tape, or failing that within reach. `pianoTune` gives the melody from middle C, which `npm run songs` writes as MIDI, with a fingering where the tune sits under one hand. The drums have ten beats instead (`DRUM_BEATS` in `drums.js`).

A kit (`instruments.js`) now has `lessons` (what its path is made of), `songs` and `studies` (both). Songs are on no path and open from the start; they appear as the second collection on the learning home, in the library, and under their own heading in each workspace's Exercise list (`StudyOptions.jsx`).

### The bass

`INSTRUMENTS` is piano, guitar, bass, violin, cello, veena, drums, tabla, handpan (the last three since 19 October). A string kit is `fretted` or `bowed`.

**The pickers list five.** The bass is a kind of guitar, so `PICKER` (`instruments.js`) lists piano, guitar, violin, cello and drums, and the guitar has a small **Guitar | Bass** switch (`TypeSwitch.jsx`) in the studio's controls, on the learning home and in the library. Underneath, the bass stays an instrument of its own, with its own tuning, lessons, path, saved place and sound, so nothing keyed by an instrument id changed. `familyOf`, `variantsOf` and `chooseVariant` do the mapping; `settings.variants` remembers which kind the family was last on.

A ukulele and a viola were added with the bass and taken out again on 10 October 2026: the ukulele had no 3D model, and the viola was the violin's lessons a fifth lower on the violin's model. Settings saved for either fall back safely (`normalizeInstrument` gives the piano; `chooseVariant` gives the violin for a remembered viola).

- **The bass** is in `src/lib/strings/fretted.js` (tuning and lessons) and is played in the guitar's studio: `GuitarWorkspace.jsx` takes an `instrument` and reads everything from its kit. It has no chords; `OpenStringsCard.jsx` takes the chord explorer's place.
- **What the 3D stage shows** is `kit.stage`: `'drawn'` for the guitar (the one built in code, and its model for the whole view); `'model'` for the bass, which is played on the downloaded bass guitar at full detail (`FrettedModelStage.jsx`, with the drawn fretboard at light detail or if the model fails). The stage's painting, labels and pointer handling are shared in `src/lib/strings/frettedStage.js`; `stageLabels`, `hoverText` and `buildModelGuitarRig` take the instrument's tuning, pitch lookup and colours.
- **Sound.** `audio.js` builds each plucked voice from one table and each bowed voice from another: the bass is heavier and louder than the guitar, the cello darker and slower to speak than the violin.
- **Five in the pickers.** Below 1300px the studio header shows icons, with the name of the instrument chosen (`strings.css`). The learning home's picker wraps under its heading, and on a phone it and the header sheet's take two rows. `InstrumentIcon` has a drawing for the bass, used where it is shown on its own (the setup dialog, the tuner).

### Easier to follow: free play, practice and input

Added 10 October 2026. New styles are in `src/styles/flow.css`; `e2e/tests/25-flow.spec.js` covers the behaviour.

- **Free play has one row of things to do** (`FreePlayBar.jsx`, under the studio header): the explorer (Chords, Open strings, Scales or Drum keys, which puts the keyboard on that card), Tuner for the instruments that are tuned, and Check input. Beside them is the note played last and, in one line, how to play with nothing plugged in. In free play the tuner is here; in a lesson it stays in the instrument's own controls.
- **The explorer cards.** A chord's legend (root, finger, played, open, muted) sits under the diagram it explains. Strength, spread, bow pressure and scale tempo fold away under **Feel**, whose summary says what they are set to.
- **The path names the lesson to do.** On the learning home and in the drawer's Today’s plan the current lesson carries **Next**. Finished is a tick and stars are separate: `Stars` (`PathTab.jsx`) draws five, filled as far as the best run, from the first finished run, so a lesson finished with the notes waiting shows a tick and five empty stars.
- **The report** says **Finished** apart from its stars, and beside Run again offers **Slower** (one tenth down, never below the slider's 40%) and **Next lesson** (the lesson the path has opened) or **Next piece**.
- **The tempo slider marks the written tempo**, and off it a **Written tempo** button goes back: stars count toward the path at 100% or faster.
- **Input & sound is three steps** (`SetupDialog.jsx`): choose how you play, check you are heard, check the sound. Everything else is under **More options** in the same dialog (`KeyboardPanel.jsx`): the two measurements, named for what goes wrong ("Sound arrives late?", "Keys feel too loud or too soft?", the second only when a controller is how you play), a piano keyboard's size and fit, and **Advanced: external sound**. The library drawer no longer has a Settings tab. A calibrator is a dialog of its own, so Input & sound closes for it.
- **The top bar's input button** reads **No controller found**, in red, when a controller was chosen and none is connected, and its tooltip names the controller when one is.
- **A controller plugged in while the app is open is announced** (`App.jsx`, `found`): it plays at once, and **Check it** opens Input & sound on it. The ones already there when the page loads are not announced.
- **One segmented control.** Every "pick one" row (the pickers, Learn | Free play, the practice modes, Guitar | Bass, label modes, fit) shares one trough and one raised segment, in one rule at the top of `flow.css`; each control keeps only its own size. The stage's Fretboard | Whole instrument pill is left as it is, since it floats over the instrument, but it, Reset view and the small tools (`.view-tool`) are now one height.

### Finish

After the bass was folded into the guitar, the app was gone over screen by screen. What changed, and why:

- **The welcome page's pictures were a month out of date.** `public/media/*-studio.png` showed a top bar and studio layout that no longer existed. `scripts/media/shoot-instruments.mjs` now takes all five on the real graphics card at full detail; retake them whenever the studio's look changes.
- **The theme follows the device on a first visit** (`lib/theme.js`); a theme the visitor has chosen always wins. The welcome page uses the same rule without loading the studio.
- **Each screen names itself in the browser tab** (`lib/pageTitle.js`): "Meet the four strings · Bass — Practice Deck".
- **A Tuner button sits in a string instrument's own controls** (a `view-tool` button in `GuitarWorkspace` and `BowedWorkspace`), not only under More. In free play it is in the free-play bar instead.
- **The studio's controls row wraps** between 901 and 1250px instead of cutting a select down to a letter, and the line under the studio's title takes a second line before it is cut.
- **A four-string fretboard gets the room six strings had** in free play when it is the whole instrument (the bass at light detail): `--strings` on the board scales the string height.
- `e2e/tests/24-polish.spec.js` covers all of it.

### The tuner and the microphone

A real instrument can be played into the app, one note at a time.

- **Hearing a pitch.** `src/lib/input/pitch.js` finds the pitch of a tenth of a second of sound with the YIN method: the shortest shift at which the sound lines up with itself is one cycle of the note. That is what lets it hear a low string as the note it is when its overtones are louder than its fundamental. It works on plain arrays and is tested on tones made in code, from a bass guitar's low E to the top of a violin.
- **From pitches to notes.** `src/lib/input/noteTracker.js` turns thirty readings a second into notes that begin and end: a note begins when the same pitch has been heard twice running, ends after three quiet readings, and begins again if it comes back clearly louder than it had fallen to (a string plucked twice, a bow changing direction).
- **The microphone** is `src/lib/input/micInput.js`: one microphone that the tuner and the note input each `hold` while they need it, released when the last lets go. `listenPlan` sets how much sound is read for the sound card's rate: thinned at 96 kHz and above, shorter at a headset's 16 kHz. It asks the browser to cancel the app's own sound and not to suppress noise or level the volume, which are made for speech and treat a held note as noise. What it hears is analysed and discarded; nothing is recorded or sent.
- **Playing notes in.** With **Microphone** chosen under Input & sound (`settings.inputMethod === 'mic'`), `useMicNotes` (`hooks/useMicInput.js`) sends each note heard through the same path as a controller's, marked `source: 'mic'` and stamped `MIC_LATENCY_MS` earlier, which is about how long it takes to be sure of a note. The practice engine does not sound a note from the microphone (`soundsInput`): the instrument already has, and the app's own sound would go back in. That covers the wrong-note buzz too. Chosen on an earlier visit, the microphone still waits for the first click or key press before it comes on, and the top bar reads **Microphone off** until then. While the tuner is open the microphone stays on but notes are not played in.
- **The tuner** (`TunerDialog.jsx`, under More, and from Input & sound) shows the note, a needle half a semitone either way, and on a string instrument which string is nearest and which way to turn its peg. `src/lib/input/tuner.js` decides all of it: `steadyPitch` takes the median of the last few readings, and within 5 cents is in tune.
- **What it cannot do.** It hears one pitch at a time, so a chord or a strum is not recognised, and it is not offered for the drums. With the accompaniment or the metronome on, headphones keep the app's sound out of the microphone.
- **Tests.** `pitch.test.js`, `noteTracker.test.js`, `tuner.test.js` and `micInput.test.js` (the last with a made-up microphone and clock). In the browser, `e2e/tests/23-microphone.spec.js` gives Chromium a WAV file as its microphone (`e2e/helpers/fakeMicrophone.js` makes plucked-string notes), so the tuner and a lesson are tested on real sound through the browser's own microphone path. That is a clean signal: a real room, a cheap microphone and a real string have not been tried.

## Clarity: what you can read at a glance

Added 18 October 2026, from a before/after plan the user chose change by change. Styles are in `src/styles/clarity.css`, loaded last; `e2e/tests/27-clarity.spec.js` covers the phone deck and the acoustic kit on the stage.

- **Top bar.** Input & sound and Enable sound are two pills; while sound is off, Enable sound is tinted violet as the bar's one call to action.
- **Instrument icons** (`InstrumentIcon`, `StudioHeader.jsx`) are one drawn set on a 24-unit grid with one stroke: the violin leans with its bow, the cello stands on its endpin, guitar and bass lie on the diagonal. Each icon sits on its label's centre line.
- **Lesson steps** are a stepper: numbered dots on a rail, a tick for each step behind you, the current one ringed. It uses `:has()`; the upright phone keeps its one-chip summary.
- **The desktop deck** is one row from 1280px: the four tools are quiet icons that turn violet while on, and from 1440px the clock shows the piece's length and Play is wider. **On an upright phone** the deck is one row of Play, the mode and **More controls**; the tools, tempo and settings open beneath it. The zones dissolve into a twelve-column grid (`display: contents`), so no control is rendered twice. The mode reads "Wait" on a phone; the rest of its name stays for screen readers.
- **The report** (`PracticeReport.jsx`) shows the score, or the share played, as a ring; notes, timing and dynamics as three tiles; one primary button (the recommended step, or Run again when there is none); Listen back on the left and the replay actions on the right. Close and the Coach toggle are icon buttons in the corner.
- **The learning home** opens on a banner of the instrument (its `media/<instrument>-studio.png`) and a stage strip, one segment per lesson. Practice days are dots that fill with a tick. On a phone the instruments are one row, icon over name.
- **The library** shows difficulty as a three-bar meter; the word stays for screen readers.
- **Guitar, bass, violin and cello: View.** Frets or reach, labels, label size, neck height and left-handed are in a View pop-over (`ViewOptions.jsx`, which closes on Escape and on a press outside). Tuner and View sit at the end of the Up next row; the toolbar keeps only Guitar/Bass and the exercise, or goes. Browser tests open it with `openView` (`e2e/helpers/workspace.js`).
- **Phones put the instrument first.** The strings' options follow the stage, which is at least 240px tall, and a phone starts at first position (`visibleFrets`, `instrumentView.js`) until the player chooses the whole neck. A phone's piano fits the piece until a range is picked in the Range menu (`pianoRangeChosen`); the menu shows what is drawn.
- **Piano stage** (`rollScene.js`). On a real graphics card the keys and case reflect the studio's soft boxes; software rendering skips the map, which takes seconds to prepare there. Notes never reflect it, so a run looks as it does on the 2D roll. A sounding key sends a beam of its hand's colour up its lane, and the lanes of notes due in the next 1.2s glow. In free play each note you play rises up the roll as a trail; reduced motion keeps the stage still.
- **Drums.** The kit built in code is wine lacquer with bronze cymbals. At full detail the stage plays the downloaded acoustic kit (`stageModelKit`, `DrumStage.jsx`): fitted to the built kit's footprint, turned to the drummer's side, its rig lighting each hit and softly lighting the next drum (`mark`, `drumModelRig.js`), whose name tag lights too. The built kit stands in until it loads, and for good if it cannot. The model's teal shells are re-toned and its platform and stool left out when it is prepared (`retone` and `omit` in `scripts/models/recipes.mjs`); its cymbals turn bronze in the rig.
- **A grand piano** (`piano-grand`, "Grand Paino" by EastSeaSaltfishnet, CC BY 4.0) is the piano's Whole instrument choice: in free play at full detail a Keyboard | Whole instrument switch sits over the roll (`PianoWholeView.jsx`). Its 88 keys are separate pieces of the downloaded mesh; `keyParts` (`scripts/models/showcase.mjs`) finds them by shape (52 alike, 36 alike), tells the keyboard's front by the white keys reaching past the black, and names them `key-21` to `key-108` from the player's left. In the viewer every note from any input holds its key down and lights it (`pianoModelRig.js`, `data-keys-down` on the viewer), and a press on a key plays it. The keys are drawn plain ivory and ebony, since the texture's red felt bled into them at picture size.
- **Violin and cello lessons** frame from just before the nut rather than the end of the scroll, and a tape number near the top edge is held inside the stage.
- **Guitar rosette** is dark abalone rather than a rainbow.
- **Warnings** carry an icon and a full hairline border instead of a coloured bar down one side, and symbols that stood in for icons (hearts, ticks, a lock, a flame, stars) are `Icon`s. Note names keep their sharps and flats.
- **Welcome and home pictures** are cropped to the instrument's working area by `scripts/media/shoot-instruments.mjs`; take them again after any change to how a stage looks.

## Styling: tokens, the stage and the phone layout

Added in the October 2026 design pass. The design system it follows is a Claude artifact; its **Recommended changes** section lists the twenty changes and the measurements behind them.

- **Tokens.** `src/styles/tokens.css` is loaded first and is the only stylesheet that knows which theme is showing. It holds colours, the type scale (nine sizes from 11px, three weights, two trackings), spacing (4 to 32px), radii, three control heights (32, 40 and 48px), six z-index layers and the per-theme surfaces such as `--primary-bg` and `--seg-trough`. Every other stylesheet reads tokens. Do not add a `[data-theme]` selector outside this file; add a token.
- **The stage is dark in both themes.** The piano roll, the guitar workspace and the violin and cello workspaces carry the class `stage-dark`, which gives them the dark token values, so labels and overlays on a stage need no theme rules. `src/lib/stage/stageColors.js` reads the stage colours (`--note-right`, `--note-left`, `--hit`, `--miss`, `--late`, `--hit-line`, `--stage`) for the canvases, with the same values built in for tests. Hands are blue and amber. Violet is the interface colour and `--now` blue is the music position and the next note.
- **Chrome.** `chrome.css` holds the top bar (three destinations, the sound and input group, the More menu), the shared control rules and the one-line footer. Instrument settings sits beside the instrument picker; the stage caption is the left half of the footer.
- **Breakpoints** are 600, 900, 1200 and 1440px, and 1700px for the studio header's instrument picker, which shows icons below it. `phone.css` raises every control to 44px at 900px and below, and at 600px and below on an upright phone moves the destinations to a bottom tab bar and the header controls into a sheet (the button reads "Piano · Learn").
- **Browser tests.** `e2e/helpers/workspace.js` chooses Learn or Free play at any width. `e2e/helpers/studio.js` saves a returning player's settings before the page loads (`seedSettings`) and gathers page and console errors (`collectErrors`). Help and the theme switch are inside More, so a test opens More first.

### The ux-ui kit's rules

October 2026, from the ux-ui-agent-skills kit's gates (run on saved copies of the screens):

- **No native select.** Every choice from a list is `Listbox.jsx`, the ARIA select-only combobox: a button with `role="combobox"` that keeps the focus and the control's name, and a list drawn in a portal on the body, fixed under the button (or above it near the bottom of the window), so no drawer or pop-over clips it. Arrows, Home, End and Page keys move, a typed letter jumps, Enter or Space chooses, Escape or Tab closes. `onChange` gets the value as a string, as a select's did. Every CSS rule for `select` has a `.listbox-trigger` twin, so a list sits where its select sat; the list's own styles are at the end of `clarity.css`. The View pop-over leaves presses in an open list, and Escape on one, to the list. In browser tests, `e2e/helpers/listbox.js` has `choose(combobox, value)` and `openList(combobox)`, and a list's value is its trigger's `data-value`.
- **One h1 per page:** the page's own title (the studio's piece, the learning home's heading, the welcome page's line). The brand in the top bar is a `span.brand-name`.
- **No long dashes in interface copy.** A colon, full stop or comma instead. Piece and lesson titles keep theirs, and a lone dash still stands for a value not measured yet.
- **Tokens.** Raw values that a token already holds (a font size, a radius, a gap, a duration, a stage colour) read the token, and the string instruments' materials (wood, metal, fingerboard marks) are named in `tokens.css`, one value in both themes. Values with no token of that size (6px gaps, 2px lines) stay as they are.
- **The primary action** in dark mode is the solid `--primary-bg`; **display headings** on the lesson and the library are `--fs-3xl`; body copy stops at 65 characters; the first card of a collection and the first step on the welcome page lead; piece pictures keep to one band of blue to violet, told apart by lightness (`PieceArt.jsx`).

### Stage and guide, after the best AI-built apps

October 2026, from a comparison with apps built with Codex and Claude Code (OpenAI's Codex showcase and the open-source Music Practice); the user kept all eleven suggestions.

- **Titles in a serif.** `--display` (Fraunces, vendored from `@fontsource-variable/fraunces`) sets page, piece, lesson and inspector titles; one italic word in violet can carry a title's point (`<em>` in the learning home's heading). Everything else stays `--sans`. Rules in `display.css`.
- **Tonight's checklist.** `TonightPractice.jsx` replaces the learning home's numbered list: tonight's length in minutes (`sessionLength.js`: a piece twice plus a little, never under a minute), a ring of today's runs (`path.progress`), and each item with its minutes and a circle that ticks once today's practice has moved past it (`record.daily`).
- **The lesson's step on the stage.** On wide screens (`!narrow`, over 900px) `LessonStepCard` sits at the top right of the stage: the step's number, title, one sentence and its buttons (`StepActions`, shared with the guide so a button is never on screen twice). It folds to its title while a run plays. The guide (`LessonGuide` with `stageCard`) then shows the lesson's point (`lessonPurpose().goal`), its description as cue lines (`cueLines`) and the first beginner tip in italics. The six steps above the stage are a numbered pager naming only the current step. Phones keep `LessonDock` and the full guide.
- **Terms where they appear.** `TermText.jsx` underlines the first appearance of each glossary word (`glossary.js`, shared words plus each instrument's own) in lesson text; a tap shows its meaning under the line. It replaces "A little help with the terms".
- **Finger numbers on the keys.** In a lesson the piano's keys show the finger of the next note on each (`keyFingers.js`, from the authored fingering), in a disc of that hand's colour, on the 2D roll (`drawKeyboard`) and the 3D roll (`RollGL` text layer). The strings already label positions with fingers.
- **Views on the stage.** `StageViews.jsx` centres the piano's view switch over its stage: Falling notes, Notes + score, Sheet music, then 2D or 3D (`StageAppearance`, group name "Stage appearance", buttons named "2D Trainer" and "3D Stage"). In a lesson only 2D and 3D show, at the top left, clear of the step card. The string and drum workspaces put `StageAppearance` in their tool row. No backdrop blur on anything over a stage: re-blurring a canvas that redraws every frame stalled software-rendered 3D. The choices left Practice settings and Instrument settings. Browser tests switch with `setRenderer` in `e2e/helpers/workspace.js`.
- **Transport under the keys.** On wide screens App renders the deck after the stage, and Practice settings is portaled into `#practice-settings-slot` in the studio header, beside Focus (an icon below 1441px). Phones keep the deck above the stage.
- **The inspector.** Clicking the timeline (`onChooseBar`) or the roll (`seekAndChoose`) chooses that bar, never while a run plays and never past the last bar; keyboard seeks and "Restart passage" only seek; `BarInspector.jsx` shows its notes by hand, fingers, your stored slips there (`barInspect.js` over `getTroubleSpots`), the written tempo, and Hear bar (`hearPassage`) or Loop bars. Closing it, a new piece or starting a run lets go of it.
- **Keys in the footer.** `ShortcutLegend.jsx` lists `FOOTER_KEYS` from `shortcuts.js` (a test checks each is bound). Space always shows; the rest from 1180px with a fine pointer. An instrument's tuning line (`.footer-meta`) gives way first.
- **Not added:** levels, XP or level-up pop-ups.

### The ui-ux-pro-max audit

October 2026, from measuring the app against the ui-ux-pro-max skill's rules (axe-core was clean everywhere). Kept by the user, all seven built; the skill's own product profile (warm red, Righteous and Poppins, parallax) and a teacher mode were left out on purpose.

- **Targets.** Every control is at least 24px, and 44px where the pointer is coarse; hit areas grow, the look does not (the targets block at the end of `clarity.css`: checkboxes, the library's folded sections, the home page's footer links, the timeline canvas's transparent padding, range inputs). Spec 29 measures it.
- **Headings.** The learning home's sections are h2 under its h1 and discovery cards h3; the CSS moved with the tags.
- **Errors.** The error toast (`ErrorToast` in `AppModals.jsx`) has a Close button and closes on Escape when no dialog is open; it stays until closed, and is announced as an alert.
- **Sideways phones.** `landscape.css`, under `SHORT_LANDSCAPE_QUERY` (`(orientation: landscape) and (max-height: 520px) and (max-width: 960px)`, so a short desktop window keeps its layout): a one-line header, the one-row deck shared with upright phones (`clarity.css`), no timeline or footer, a one-chip lesson pager and a one-row lesson dock. The piano keys drop to 72px there (`SHORT_KEYBOARD_HEIGHT` in `App.jsx`) so the notes have room to fall.
- **Addresses.** `route.js` names every screen (`#/home/<instrument>`, `#/lesson/<instrument>/<id>`, `#/studio/<instrument>/<id or free>`, `#/library/<instrument>`); `useRoute.js` writes it (a change of screen is a new history entry, a new piece or instrument replaces it) and steers to an address from the bar one step at a time (`applyRoute` in `App.jsx`: instrument, then screen, then piece), taking a step only when the screen has moved since the last, so a piece that is loading is not asked for again. `applyRoute` returns false for something the app does not have (a study or lesson of another instrument, a removed piece), which is let go at once; one that never arrives is let go after four seconds. Shared lesson links (`?instrument=&lesson=`) still go through `Entry.jsx`.
- **Phone text.** On screens 600px wide or less `--fs-md` is 16px and `--fs-sm` 14px (`tokens.css`), and text fields are 16px so iOS does not zoom on focus.
- **Undo, not a question.** Clearing a piece's history hides it and shows `UndoToast` for `UNDO_SECONDS` (10); only then is it deleted. A second Clear deletes the first at once, and so does starting to play that piece, so a new run is never swept away with the old ones; leaving the page in the meantime deletes nothing. The undo message's status region stays mounted so it is announced, and sits above an error toast when both show.

### Reliability, speed, offline and tablets

October 2026, the follow-up list after the audit.

- **A stray brace.** `flow.css` had a `}` with nothing open, which made browsers drop the `.chord-legend` rule after it; the chord legend now wraps as designed (and spec 10's layout test, failing since before the clarity pass, passes).
- **Tests and 3D.** Headless Chromium draws WebGL in software, so a 3D stage's first frame can take far longer than an assertion's 8 seconds. Waits for a 3D canvas use `STAGE_TIMEOUT` (30s, `e2e/helpers/studio.js`); tests about 3D call `test.slow()`; the `AppPage` fixture (smoke, data and flow specs, which are not about the stage) runs on the 2D roll.
- **Idle frames.** `PianoRoll` and `Minimap` redrew every frame even when nothing moved; on a phone-speed CPU that kept the main thread busy all the time (about 5,000 ms of every 5 s, measured on the production build against the same build without the change). Both now skip frames when nothing has changed: the roll keeps drawing for `SETTLE_MS` (1.5 s) after its clock, size, zoom, hover or pressed keys last changed, and any new props wake it; the timeline draws when the playhead or its picture moves. Idle work fell to 600–1,700 ms in 5 s.
- **What loads.** A first visit loads 65 kB of script (compressed). Three.js loads only for the 3D stage, notation only for sheet music, and the grand piano's viewer (`PianoWholeView`) only in free play.
- **Offline.** `public/sw.js`, registered by `main.jsx` in production builds only: the page network-first (a new release arrives at once), built files cache-first, songs, media and models stale-while-revalidate, old entries trimmed. The app opens with no connection once it has been opened once; `useOnline` shows "Offline" in the top bar. Bump `VERSION` in `sw.js` to drop every cache.
- **Tablets.** On a touch screen at any width, controls are 44px (`--control-h` and `--control-h-sm` under `pointer: coarse` in `tokens.css`, the touch blocks in `studio-layout.css`). Between 901 and 1180px wide the lesson's step card sits in the page above the stage instead of on it, where it covered the falling notes.
- **Loose ends.** While a cleared history waits for its Undo, its stars and best streak are hidden too. Arriving in the studio from another screen focuses its title. A click on the 2D roll also names the note under it in the inspector (`laneAt`, `noteNear`); the 3D roll still chooses the bar only.
- **Teacher page.** Progress has "Share with a teacher": `teacherReport.js` makes one self-contained HTML page (practice days, pieces with runs, best result and last date, the bars that go wrong) from what the device has saved, and `TeacherShare.jsx` saves it. No account, no server.
- **Two spacing steps.** `--sp-hair` (2px) and `--sp-1-5` (6px) joined the scale; exact 2px and 6px gaps, padding and margins read them (hard-coded values 896 to 794).

### A dark accent that is not purple, and the patterns plan

October 2026. The stage spends blue (now, the right hand), green (a right note), red (a miss) and amber (late, the left hand) on meaning, so the dark room's accent has to stay clear of all four. Measured as distance in OKLab ×100 from the nearest: ivory 14.6, silver 18.3, copper 10.6, against 9.8 for the old violet. Teal (6.3 from green), champagne (7.4 from amber) and rose (8.2 from red) were measured and left out.

- **Appearance** is a dialog under More (`AppearanceDialog.jsx`): Light, Dark or True black; the dark accent (Ivory, the default, Silver, Copper or Violet); Standard or Large text. `appearance.js` turns the settings (`darkAccent`, `trueBlack`, `textSize`) into `data-accent`, `data-black` and `data-text` on `<html>`, used by the app and the welcome page alike; `tokens.css` swaps tokens on them. The dark accent applies wherever the dark tokens do, so the stage carries it in both themes. Violet needs no attribute: it is the tokens' own default. Ivory and silver are neutrals, so text links under them are underlined (`patterns.css`).
- **True black** is the dark theme with the page at `#000`, no glow, and the browser chrome black. **Large text** raises the nine `--fs-*` tokens by about a fifth; the stage and the keys keep their size, which browser zoom would not.
- **Ctrl+K** (Cmd+K; also the Search button in the top bar) opens `CommandPalette.jsx`: pieces for every instrument, lessons for the one on stage, instruments, screens and the studio's actions with their keys. `useCommandPalette.js` builds the list from App's own functions, so a command and its control cannot disagree; `commands.js` ranks a search (title start, word start, contained, detail and keywords, then a title's initials) and is tested on its own. It is a combobox over a grouped listbox, and full screen on a phone.
- **The studio tour** (`CoachTour.jsx`) shows once, on the first studio visit after the welcome: Play, the three modes, Input & sound. It blocks nothing, waits 600ms for the studio to settle, and Skip, Done or Escape set `studioTourDone`; Help replays it. Browser specs seed `studioTourDone: true` along with `onboarded`.
- **While a run plays** the chrome around the stage fades to 20% (`.receded`, opacity only, so nothing moves); `useAwake.js` brings it back for 2.5s when the pointer moves, and a pause brings it back for good. Focus inside a faded part keeps it at full strength.
- **A note for next time.** The report has one line; the guide shows it before the next run of that piece, and when it names a bar ("bar 5", "bars 3-4", with "at 70" or "70 bpm") a button loops that bar at that tempo (`pieceNotes.js`). Notes are settings (`pieceNotes`), so a backup carries them, and they clear with the piece's history.
- **Screens that move into each other.** `useScreenTransition.js` wraps `setSettings`: a change of `learningView` runs inside `document.startViewTransition`, a 200ms cross-fade, with the piece's title (`view-transition-name: piece-title`) carried from the home card to the studio heading. No API or reduced motion: it changes at once. A second change before the first finishes makes the browser reject the first transition's promises ("Transition was skipped"); they are caught, since the update itself still lands.
- **A stage-shaped placeholder** (`StagePlaceholder.jsx`) stands in while an instrument's code or 3D model loads: strings and frets, a fingerboard or drum heads in outline, a slow shimmer, the same words as before, at the stage's own size.
- **The beat on the line.** `beatPulse.js` flashes the hit line on each beat (more on the first of a bar) during the count-in and while the metronome runs: the 2D and 3D piano rolls, the string tab and the drum lanes. Off for reduced motion. The count-in panel covers the roll, so on the piano it is seen mostly with the metronome.
- **Polish after the plan.** The tour speaks of tapping on a touch screen (`touch` wording in `TOUR_STOPS`), not of the space bar and number keys. The palette matches a detail or keyword only from the start of a word, and the middle of a title only for four letters or more, so "ode" finds Ode to Joy and not "Listen mode". Tone.js and its audio-context layer (about 330 kB, a third of the studio's script) load when sound is first turned on (`loadTone` in `audio.js`): the App chunk went from 775 to 435 kB (227 to 146 kB compressed); `midiToName` no longer needs Tone. Because Tone now arrives after the click that asked for sound, the autoplay policy would leave a context made then suspended (spec 13's audible-note tests caught it): `_claimContext` makes the AudioContext and resumes it inside the click, and `_boot` hands it to Tone with `setContext`. `patterns.css` reads every size from tokens (`--dialog-w-sm`, `--palette-w`, `--palette-h`, `--swatch`, `--icon-box`, `--tip-arrow`, `--dur-shimmer`). The once known-bad `01-core-flows` "the bundled library loads…" read `.piece-title` with `innerText`, which is always empty inside the closed Piece details; `AppPage.currentPieceTitle()` now waits and reads its text content, and it passes.
- **Tests.** `commands.test.js`, `pieceNotes.test.js`, `beatPulse.test.js`, `appearance.test.js`, `useAwake.test.jsx`, `useScreenTransition.test.js` and `.hook.test.jsx`, `CommandPalette.test.jsx` (with the Appearance dialog), `NextTimeNote.test.jsx`, and in the browser `e2e/tests/30-patterns.spec.js`.

## Whole instrument: choosing what to see

Added October 2026. In free play at full detail, selecting **Whole instrument** opens a pop-up of pictures, one for each instrument there is to see. The one that is played is already on the stage, so choosing it closes the pop-up. Any other is shown over the stage in its place until the stage's playable view is chosen again (**Fretboard**, **Fingerboard** or **Practice kit**).

- **The list** is `src/lib/stage/stageModels.js`: for each instrument, the model that is played first, then the ones that are only shown. A model's id is its file name in `public/models/`, the name of its picture in `public/media/models/` and its key in `modelCredits.js`. Shown-only ids are `<instrument>-<kind>`, such as `guitar-bass`.
- **The list and the files agree.** `stageModels.files.test.js` reads `public/` and fails when a model on the list lacks its file, its measurements, its picture or its credit, so the app offers every model on the list without asking the server first.
- **The pop-up** is `ModelChooser.jsx`, a dialog over the app, so it has room for its pictures on a small stage. **The viewer** is `ModelViewer.jsx`: its own studio laid over the stage, the model framed whole and turned by dragging, all the way round. `WholeModels.jsx` ties the two together and is rendered by `GuitarStage.jsx`, `BowedStage3D.jsx` and `DrumStage.jsx`. The drums gain the Practice kit | Whole instrument switch only when another kit is there.
- **Rigged or only shown.** A model marked `rigged` in `stageModels.js` (the bass guitar, the electric violin, the antique cello) goes on the stage's own rig in the whole-instrument view, so it answers to playing: `buildBowedRig` gives the violin and cello their strings, finger places and bow, and `buildModelGuitarRig`, strung with `BASS_STRINGS`, gives the bass four strings that move with the guitar strings of the same name (E, A, D and G; the guitar's B and high E have none to move). `stage/otherRigs.js` builds each such rig the first time it is chosen and keeps it; `GuitarStage.jsx` hands it to `guitarViews` and `BowedStage3D.jsx` swaps it in itself. The sound and the lessons stay those of the instrument it stands in for, and Learn always goes back to that instrument. A model that is neither played nor rigged is only looked at, in the viewer. The two drum kits are looked at there too, but each drum answers to being hit (`struck` in `stageModels.js`): the recipe's `zones` (boxes in stage units, found by looking at the kit) make each drum a part of its own, named `drum-<id>-<n>` (`drumZonePart`), and `stage/drumModelRig.js` lights it in its verdict's colour and moves it, a cymbal rocking and a drum pressed down. `DrumStage.jsx` hands the viewer every hit it sees, whether from the keys, the pads, the model or a controller. A kit with two of a drum (the electronic kit's crashes and low toms) moves both on the one key. Re-prepare a kit with `node scripts/models/prepare.mjs drums-acoustic drums-electronic`.
- **Bow or fingers.** The violin and cello have a **Bow / Fingers** switch beside the instrument (`technique.js`, kept per instrument in `settings.bowedTechnique`). Bowed, a note sounds while it is held. Plucked (pizzicato), a press plucks once and the note is let go after `PLUCK_MS` (0.7 s violin, 1.1 s cello), played on a plucked voice of its own (`violin-pizz`, `cello-pizz` in `audio.js`: rounder and shorter than the guitar's). The bow is put down on the 2D and 3D stages, the plucked string still rings, and the hints, labels and the scale explorer say "pluck". Lessons and scoring are the same either way.
- **The tuner can be played into.** It used to be a dialog like any other, so the computer keys played nothing while it was open, and with the microphone listening there was nothing for it to hear. Its dialog now carries `data-play-through`, and `useComputerKeyboard.js` lets notes through any dialog marked so (and through a tip that does not hold the page, `aria-modal="false"`); shortcuts such as 1, 2 and 3 stay blocked. Each string card is a button that sounds that open string for two seconds, to tune by ear, and a note played on the keys, a controller or a card shows on the tuner as the reference when the microphone has nothing to read. Tested in `TunerDialog.test.jsx` and spec 30.
- **Segmented controls, aligned.** Every "pick one" row is a trough sized by its segments (segment + 3px padding + 1px border each side: 40 in 48 on a desktop, 44 in 52 on touch, 30 in 38 on the stage). `.mode-switch` (Listen / Practice / Wait for me, and the hands in Practice settings) had a fixed 40px trough around the studio's 40px segments, so the chosen one stood 5px out of it; it now has no height of its own. On a phone's one-row deck it stays 48px, level with Play and More, by thinning its trough to 2px and no border so the 44px touch segments sit centred. The learning home's instrument row shares a phone's width instead of scrolling Drums off its end. Spec 30 measures every segmented row on desktop and phone.
- **The artists are named where their work is.** `ModelCredit.jsx` puts "3D model by **artist**" (linked to their page) in the stage's bottom bar while a downloaded model is played: the violin and cello at full detail, the bass, the acoustic guitar in its whole view. The whole-instrument caption leads with the artist (kept on a phone, where the title and licence are dropped), every card in the chooser names its artist, and Help has a **3D artists** section with each name as a link. `CREDITS.md` opens with the list. All of it reads `modelCredits.js`.
- **Adding one.** Download Sketchfab's glTF, unzip it to `models-src/<id>/`, add the model to `stageModels.js` and its credit to `modelCredits.js`. For one that is only shown, add a `shown(...)` recipe to `scripts/models/recipes.mjs` (which way is up, and the angle it is first seen from). For one the stage is to rig, write a full recipe as for the guitar, violin and cello: which pieces are its strings, which way it lies, and `rightHanded: true` where the strings' thickness cannot say which side the bass is on. Listing the model's separate pieces, longest first, makes the strings stand out. Then, with the dev server running:

  ```bash
  node scripts/models/prepare.mjs <id>
  node scripts/media/shoot-models.mjs http://localhost:5173/ <id>
  ```

  The first writes `public/models/<id>.glb` and `.json` (`showcase.mjs` stands the model on the floor, its longest side 24 stage units); the second writes its picture. Add its row to `CREDITS.md`. `stageModels.files.test.js` fails until the list and the files agree.
- **What preparing does to a shown-only model.** Nothing is measured or split (a rigged one is measured and has its strings replaced, like the three that are played). Axes that would mirror it are refused. A material written as specular-glossiness, which the loader no longer draws, becomes metallic-roughness (`asMetalRough`). Texture coordinates and tangents are dropped where the material has no picture or normal map to use them (`leanPrimitive`). A recipe may `omit` parts by material name, and the credit then says so: the electronic kit's trailing lead doubled the box the viewer frames. Triangles are not reduced; the electronic kit is 409,000 of them and 6.6 MB, the largest file by far.
- **The five there now** (October 2026): a bass guitar, an electric violin and an antique cello, all rigged, and an acoustic and an electronic drum kit, which are shown and struck. The viewer's backdrop is lit from the middle and lighter than the stage, because the violin and the electronic kit are black.
- **Tests.** `stageModels.test.js`, `stageModels.files.test.js`, `stage/otherRigs.test.js`, `showcaseView.test.js`, `WholeModels.test.jsx`, `scripts/models/showcase.test.mjs`, and in the browser `e2e/tests/21-whole-instrument-chooser.spec.js`. Specs 18 and 19 keep the instrument that is played when the pop-up opens.

## Drums

Choose **Drums** in the instrument picker (or open `/drums/`). Added October 2026.

- **A hit is a note.** The kit is nine pieces, each a General MIDI percussion note: kick 36, snare 38, closed hi-hat 42, open hi-hat 46, high, mid and floor tom 50, 47 and 43, crash 49, ride 51 (`src/lib/struck/drums.js`). Because a hit is a note, the transport, the matcher, grading, the learning path and the library are the ones every instrument uses. A controller's other notes for the same drum (35 for the kick, 40 for the snare, and so on) are turned into the lesson's note in `playedMidi` (`usePracticeEngine.js`), which also leaves out the piano's input transposition.
- **Four ways to hit.** The 3D kit, the pads, the computer keys and MIDI. Each drum's key is the letter it starts with: K, S, H, O, T, M, F, C, R (`DRUM_KEYS`, used by `useComputerKeyboard.js` in place of the piano's key map). Screen hits go out as synthetic MIDI from `useDrumInput.js`, a note-on and a note-off 90 ms later, so sound and scoring are shared.
- **Lanes, not a stave.** `DrumLanes.jsx` scrolls one lane a drum, top of the kit at the top, and only the lanes the study uses. A tile carries its key; the kick is amber and the hands are blue, as on the piano roll; a missed tile has a broken outline.
- **The 3D kit is built in code** (`src/lib/struck/drumKitModel.js`): shells, heads, hoops, lugs, lathe-turned cymbals, stands and pedals, seen from the drummer's stool. No model is downloaded, so there is nothing to credit and every piece can be picked, ringed and moved on its own. `DrumStage.jsx` puts it in the shared studio (`src/lib/stage/studio.js`), rings the next drum, and flashes each hit in the colour of its verdict wherever the hit came from. In free play the floor can be dragged to turn the view. `drumLabels.js` keeps the names over the kit from overlapping.
- **Drumsticks** (`src/lib/struck/drumSticks.js`). Two hickory sticks, built in code, strike each piece as it is hit, whoever hits it (the 3D kit, the pads, the keys, a controller, or the app playing the study): the tip drops onto the place a drummer strikes (`strikePoint`: a drum's head a little toward the player, a cymbal's bow), bounces off and drifts back to rest over the snare (`STROKE`: 45, 170 and 420 ms). The right hand plays the hi-hat, ride, mid and floor toms, the left the rest; a hand still mid-stroke lends the piece to the other. The kick's beater is an arm pivoting at its pedal and swings into the head. The sticks sit on the stage rather than in the kit, so they also play the downloaded acoustic kit at full detail, aimed at the top of each of its drums (`stickTargets` in `DrumStage.jsx`, from the rig's part boxes). With reduced motion they rest still.
- **The pads are always there** (`DrumPads.jsx`). On the 2D trainer, or when WebGL cannot start or is lost, they are the whole kit. Under the 3D kit they fold into a disclosure on a wide screen and stay out at 900px and below. A pad answers on pointer-down; a click with no pointer behind it (keyboard, screen reader) plays too.
- **Sound** is synthesized (`src/lib/struck/drumVoice.js`): membrane synths for the kick, toms and snare body, filtered noise for the snare wires and the cymbals. The closed hi-hat cuts the open one short. There are no drum samples.
- **Lessons.** Six studies written as sixteen-step rows (`study()` in `drums.js`), from one hit on each drum to a beat with a fill. The matcher names a drum by `score.noteNames`, so a wrong hit reads "Wrong drum: Crash here, but the beat wants Snare" and never as a pitch. `lessonWords()` in `learning.js` gives the lesson guide a drummer's wording.
- **Adding an instrument with lessons of its own.** `INSTRUMENTS` in `instruments.js` is the list; `discovery.test.js` and `instruments.test.js` fail for any instrument on it without a first lesson, collections and a kit.

Tests: `drums.test.js`, `drumScoring.test.js`, `drumVoice.test.js`, `drumKitModel.test.js`, `drumLabels.test.js`, and in the browser `e2e/tests/20-drums.spec.js`, run with the guitar config since it needs WebGL.

## Violin and cello

Choose **Violin** or **Cello** in the instrument picker (or open `/violin/` and `/cello/`).
Each has a drawn fingerboard with scroll, pegs, finger tapes, f-holes and bridge.
Press and hold a place to bow it, drag along a string to slide, and bow near the
bridge for open strings. Keyboard: Tab to the fingerboard once, arrows to move,
hold Enter or Space to bow. The finger chart above it scrolls like guitar tab, with
finger numbers (0 = open string). Six first-position studies per instrument feed the
same lessons, library, path and scoring as the guitar; Free play has a scale explorer
with bow pressure and tempo. The bowed voices are synthesized offline.

The guitar's 3D stage now shows a 3+3 headstock with tuners and the neck running
into an acoustic body (rosette, soundhole, pickguard); the 2D trainer is drawn as a
rosewood fretboard with true fret spacing, pearl inlays and wound strings.

Refresh the welcome-page previews with `node scripts/media/shoot-instruments.mjs` while
the dev server runs.

## Instrument interaction update

The piano supports held notes, polyphonic pointer input, drag-to-play, sustain,
fixed or key-position velocity, note/computer-key labels, and fit/two-octave/full
views. Use the Key size slider above the stage to resize the keys.
Tab to the piano once, use arrows to select notes, and hold Enter or Space to play.

The guitar has a quieter Three.js neck, upright labels, first-position/full training
neck views, larger labels, and exact string/fret feedback. In Free play, the side
panel contains chord diagrams, finger numbers, open/muted strings, chord tones,
up/down strums, strength, and spread. Tab into the fret buttons once and use arrows
to navigate. MIDI pitches without string information show possible positions;
they do not claim to detect which string you played.

See [instrument validation](validation/instrument-validation.md).

## Desktop studio update

Switch between **Light** and **Dark** from the top bar. Use **Focus** for more playing
space, **Input & sound** to check your input and sound, and **Free play** to explore
without a score. The unified library includes favorites and remembers your last piece.

On tablets and phones the top bar takes a second line rather than pushing the studio
past the window, and in Free play the chord or scale explorer sits under the stage.
See [narrow layout checks](validation/narrow-layout-validation.md).

See [desktop changes](design/desktop-update.md) and [desktop verification](validation/desktop-validation.md).

## Piano + Guitar studio

Choose **Piano** or **Guitar** above the practice controls. Guitar includes a playable
12-fret board, standard tuning, six authored beginner studies, five chord shapes,
strumming, a left-handed view and an offline synthesized guitar voice. The existing
Listen / Practice / Wait for me modes, tempo, loops and feedback are shared.

Use **3D Stage** for the optional Three.js presentation, or **2D Trainer** for a
simple timing view. Guitar tab stays linear in time in both views. In 3D mode,
**Show fret buttons** provides a keyboard-accessible alternative to clicking the scene.

The 3D guitar draws at one of two detail levels. **Full** adds a studio environment for
the frets, strings and lacquer to reflect; **Light** is the simpler stage for older
computers. **Auto**, the default, picks Full on a graphics card and Light when the
browser is drawing in software. Change it under **Instrument settings → 3D detail**.
Either way the stage redraws only when something on it changes, and lowers its own
resolution a step at a time if frames start arriving late.

At **Full** detail the violin and cello are downloaded 3D models, and so is the guitar in
free play's **Whole instrument** view (credited under **Help** and in
[CREDITS.md](../CREDITS.md)). Guitar lessons and free play's **Fretboard** view use the guitar
built in code, whose strings sit wider apart and are easier to hit. At **Light** detail
the guitar is always the one built in code and the violin and cello keep their 2D
fingerboard. If a model cannot be loaded, the stage shows the light version instead.

Lessons show the neck straight across the stage through a long lens, so the frets keep
their true spacing; the violin and cello maps add finger tapes and numbered markers. String
names carry the string's number and pitch (6 E2 … 1 E4 on the guitar); where the strings
are too close together at the nut for the names to sit level with them, a thin line ties
each name back to its string. **Free play** opens on the same playable view (**Fretboard** on
the guitar and bass, **Fingerboard** on the bowed strings); the switch between it and
**Whole instrument** under the stage shows the whole model from
three-quarters (the cello stands on its endpin) and back. Drag the background to turn the
instrument a little either way, as far as the stage leaves room to keep the neck in view;
double-click or press **Reset view** to put it back. A drag that starts on the neck plays
the note there instead. On the violin and cello, press and hold a place to bow it, and
drag along the string to slide; the bow appears on the string while it sounds.

Guitar input currently means on-screen play or MIDI guitar. **Microphone/audio-interface
pitch detection is not implemented.** The starter exercises score pitch and timing,
not physical fingering or strumming technique. Selecting a piano library item returns
to Piano; guitar studies do not overwrite piano personal bests.

Read [the UI review and roadmap](design/ui-review.md), [validation notes](validation/validation.md),
or run `npm run test:studio` for the focused browser checks.

![Guitar stage](validation/instruments/guitar-3d.png)

A local web app for practising piano with an MPK Mini (or any class-compliant MIDI
controller). It reads a MIDI or MusicXML file as the source of truth, listens to
what you actually play, and tells you — immediately, in sound and on screen —
which notes you missed, which ones were wrong, *why* they were wrong in music-theory
terms, and how far off your timing was. Mistakes accumulate across sessions so you
can see whether the bar you keep fumbling is actually getting better.

![stack](https://img.shields.io/badge/React_18-Vite_5-Tone.js-informational)

## Running it

```bash
npm install
npm run songs     # generates the bundled practice library (public/songs/*.mid)
npm run dev       # http://localhost:5173
```

Then: open **Input & sound** to connect your MIDI controller or test the on-screen
instrument. Press **Play** to enable sound and begin. Choose **Guitar** for tablature,
or **Free play** for ungraded exploration.

```bash
npm test          # 521 engine, parser, grading, storage, guitar and render tests
npm run build     # production bundle into dist/
npm run preview   # serve the production build
```

**Browser support:** Web MIDI needs Chrome, Edge, Opera or Brave. Firefox and
Safari have no Web MIDI API — the app still runs there, you just have to play with
the computer keyboard. `localhost` counts as a secure context, so plain HTTP is
fine; reaching the app from another device on your LAN would need HTTPS.

**No hardware handy?** Play with the computer keyboard: `A`–`J` is the middle-C
octave, `W E T Y U` the black keys, `Z`–`M` an octave lower. Clicking the
on-screen keys works too. Everything is scored identically.

## The three practice modes

| Mode | What it does |
| --- | --- |
| **Listen** | Plays the reference performance so you can hear the piece. Nothing is scored. |
| **Practice** | The clock runs at your chosen speed. Pitch, timing and harmony are all judged. |
| **Wait for me** | The playhead stops at every chord until you play it correctly. The best way to learn something new — you can't fall behind. Never sounds the score to you: the playhead holds on the chord you have to find, so playing it aloud first would give the answer away. |

Supporting controls: playback speed 40–150 %, a hand filter (both / right / left),
a 4-bar loop, a metronome, reference audio on/off, and audible error cues on/off.

### Playing it without letting go of the piano

Both your hands are on a keyboard, so every action that needs a mouse costs you
the position you were in — which is most of what practising a passage consists
of. The whole deck is reachable from the keys:

| Key | | Key | |
| --- | --- | --- | --- |
| `space` | Play / pause | `1` `2` `3` | Listen / Practice / Wait |
| `0` | Stop | `←` `→` | Back / forward one bar |
| `\` | Hear ↔ Your turn | `↑` `↓` | Speed by 0.05 |
| `[` | Loop four bars | `]` | Metronome |

The keys are printed on the controls themselves, in the corner of each pad, the
way gear labels its secondary functions — a shortcut you only find by hovering
something you were already about to click is not much of a shortcut.

Two rules shape the scheme. **No shortcut may take a key that plays a note** —
the letters are the on-screen piano, and a key that sounds a note sometimes and
changes the mode other times is worse than no shortcut at all. `shortcuts.test.js`
checks that against `KEYBOARD_MAP` directly so the two cannot drift. And
**Restart is deliberately unbound**: it throws the run's score away, and an
action you cannot undo should cost a click you meant to make.

### Hear it, then play it

The **Hear** pad plays you whatever is in focus — the looped bars if a loop is
set, otherwise the piece from the top — and while it is playing it becomes
**Your turn**, which drops you back into Practice on the same bars. The same
**♪** button sits beside every trouble spot and every passage the report says
needs work, because those are by definition the bars most worth knowing the
sound of before another attempt.

Both halves cover exactly the same music: hearing a trouble spot and practising
it use one shared window, since a reference that stopped somewhere other than
the attempt would be worse than none. The speed is left alone too — whatever
tempo you are working at is the tempo you are about to try this at, and a
reference arriving faster than the attempt teaches the wrong thing.

This closed a real gap. Listen mode played the whole piece from the top and
cleared any loop on the way in, so the one bar you kept failing was the one bar
you could not hear.

**Reference audio is off by default.** The app sounds your keyboard, not the
score — a note reaching the hit line makes no noise unless you play it. Turn
**Reference** on when you want to hear the piece under your own hands. Listen
mode ignores the setting and always sounds the score; Wait mode ignores it the
other way and never does.

### If nothing is making a sound

The instrument indicator in the top right means *you will hear this*, not *this
is loaded* — it reads `audio.running`, which is the instrument being ready **and**
the audio clock actually going. Those two came apart once and the result was
Listen mode playing an entire piece in silence behind a green light, so if it
says **Enable sound**, click it; the clock is stopped.

A browser will suspend the audio clock when the tab goes to the background, and
sometimes decides the first click never counted. A run now notices that and
restarts the clock itself, once a second, for as long as it is stopped.

If notes still do not sound, the console says so: the audio engine counts every
note it was asked for and could not play and warns on the first one. It used to
log that at `console.debug`, which Chrome hides under Verbose — so a fault that
silenced every note looked exactly like a fault that silenced none.

**Picking the plugin means the browser stops sounding notes.** `instrumentFor`
used to read `instrumentSource === EXTERNAL && midiOutput.available`, so any
moment the port list came back empty — a device re-enumerating, a cable going,
the gap before `attach()` runs on startup — handed the notes quietly back to
the browser while the setting still said "A plugin". Since a plugin is usually
listening to the controller directly as well, that is heard as the app *and*
the plugin at once, with nothing anywhere explaining it. Chosen now means
chosen: if the plugin route is broken it is visibly broken rather than silently
replaced.

**The other way to hear everything twice** is the app forwarding your playing
to a plugin that can already hear your controller by itself. The panel now spots
the clearest case — sending to the same device you are playing — and says so,
rather than switching the forwarding off for you. Some rigs really do loop back
through the controller's own port on purpose, and guessing would be the same
well-meant silent correction as the fallback above.

The external route has the same two checks. In **Using your own instrument**
mode the indicator follows the MIDI port rather than the internal engine, so an
unplugged cable stops claiming to be a working instrument, and notes a port
refuses are counted and warned about under `[midi-out]`. `available` — a port
exists somewhere — and `running` — the one we are pointed at is still there —
are deliberately different questions.

## Fitting a piece to your keyboard

An MPK Mini reaches 25 keys — two octaves. Most of the repertoire spans three or
four, so on a mini controller a piece is not merely hard, it is unplayable: notes
land on keys that do not exist. The app therefore knows how big your keyboard is
and adapts the score to it.

The controller is identified from its MIDI port name (`MPK mini …` → 25 keys,
`Keystation 61 …` → 61 keys) and you can override the guess in **Library ▸ Your
keyboard**. An unrecognised controller is assumed to be a full 88-key piano,
because wrongly constraining a stage piano is worse than leaving a mini keyboard
unconstrained. The window follows your hardware: press OCT+/OCT− on the
controller and play any key, and the app slides its window by whole octaves to
match — the only way those buttons ever move.

Three fitting strategies, in increasing order of how much they change the music:

| Mode | What it does |
| --- | --- |
| **As written** | Nothing. Notes past the end of your keyboard stay unreachable. |
| **Octave shift** | Moves the whole piece by whole octaves so it sits where your hands are. Every interval survives exactly, but a piece wider than your keyboard still spills out at one end. |
| **Fit my keys** | Shifts, then folds any remaining stray note by octaves until it is in range. Pitch classes and rhythm survive; the melodic contour bends. This is what makes a 48-semitone Canon in D playable on 25 keys. |

When fitting is on, the on-screen keyboard shows exactly the keys you own, so it
mirrors the hardware one-for-one. The library marks every piece with what it will
take: **✓ fits**, **↕ octave**, or **⤢ folds**.

Folding is a compromise, so the library also ships five studies written to fit
inside two octaves natively — see the table below. On a Keystation 61 everything
fits and none of this machinery does anything.

## How it looks, and the Stage roll

This section used to say the roll was canvas 2D and would stay that way. The
argument was: under perspective, the screen distance from a note to the hit line
stops being linear in time, so "when does this arrive" — the player's entire
job — becomes a non-uniform judgement down the screen; and foreshortening
narrows the keys at the edges, breaking the one-for-one match between the
on-screen keyboard and your hardware that the fitting work exists to guarantee.

Those are still real tradeoffs, so the app names the choice directly. The
default **Trainer** roll is the canvas view: equal time covers equal distance,
and every key is the same width as the controller under your hands. The optional
**Stage** roll is a perspective WebGL scene available from
**Options -> Roll view -> Stage**. It is intentionally the presentation view:
you stand at the keyboard and the roll recedes away from you, solid note slabs
falling out of the dark and landing on the keys.

Three things are deliberately different in there, and each one is a consequence
of having depth rather than a decoration on top of it:

- **No past strip.** The Trainer roll keeps a fifth of its height below the hit
  line to draw what you actually played beside what was written. With depth in
  the scene that band is not a place where information sometimes appears, it is
  a hole in the middle of the instrument — so the hit line sits on the keyboard
  and a note arrives at the key it belongs to. The key itself lights instead.
- **The keyboard is capped at a keyboard's proportions.** Two octaves stretched
  across a widescreen monitor gives white keys wider than they are long, which
  under perspective reads as paving slabs. Beyond a maximum key width the table
  stops growing and is centred instead. A piece using most of the keyboard never
  reaches the cap.
- **The camera is solved for, not set.** A shallow angle has more vanishing
  point but has to stand further back to get the width of the table into frame,
  which costs the height of the picture; a steep one fills the frame and looks
  like a diagram with a lean. Which wins depends on the shape of the table,
  which changes with the piece, so `rollCamera.js` searches for the shallowest
  angle that still fits and keeps the front of the keys pinned to the bottom
  edge.

**Canvas 2D remains the default and the fallback**, for three reasons that have
nothing to do with taste: it cannot lose a graphics context, jsdom can run it —
so the test suite keeps exercising a real renderer rather than nothing — and it
is what a machine without a GPU gets. A lost context switches back to it and
says so.

What makes two renderers survivable is that neither owns the layout.
`rollGeometry.js` decides where every note belongs and both read it, so they
cannot disagree about the one thing that matters. The 500 kB of Three.js is a
separate lazy chunk; a session that never turns it on never downloads it.

Text is the exception: the GL roll draws note names, fingerings, bar numbers and
the combo read-out on a transparent 2D canvas layered over the scene. Text in
WebGL means a glyph atlas that goes soft when the device pixel ratio changes, or
an SDF font library bigger than the feature.

What actually makes an app like this feel good is feedback and typography, both
cheap:

- **A type scale of seven steps**, with nothing off it. This replaced nineteen
  hand-picked sizes between 9 and 30 px. Sizes that close together read as
  accidental rather than deliberate, and nothing lined up between panels. The
  bottom of the range moved up too — you read this from a metre away at a
  keyboard, not at phone distance.
- **Motion with one vocabulary**: three durations, two easings, and a
  `prefers-reduced-motion` override that collapses them all.
- **Hit flourishes.** A correct note blooms a ring at the hit line and spills
  light down its lane; a mistake pulses red. A run of clean notes lights the
  whole hit line and counts itself off to the side. The score read-outs are
  across the screen — you are looking at the line, so that is where playing well
  should feel like playing well.
- **Notes gain presence as they arrive.** A note four seconds out is
  information; a note about to be played is an instruction. Over its last
  second each one brightens and picks up a bloom in its hand's colour, and once
  it is behind the line it desaturates and recedes. The grid fades with distance
  for the same reason, and the hit line breathes while nothing is playing —
  a frozen still says "stopped", a slow pulse says "ready".
- **A map of the whole piece** sits above the roll, in place of a four-pixel
  progress bar. Notes are drawn as a pitch contour, the bars you keep fumbling
  are ticked in red along the bottom, any loop region is shaded, and clicking
  jumps there. A percentage tells you how far through you are; this tells you
  what is coming.
- **The report arrives rather than appears** — the score counts up, the three
  skill bars fill in sequence, and a personal best gets its own beat.

The roll holds 60 fps with the densest piece in the library. Getting there meant
caching the things that never change between frames: the keyboard is rendered
once and re-blitted until a key or a target actually moves, the vignette
gradient is built per resize rather than per frame, and notes too far away for a
gradient to be visible get a flat fill.
- **Progressive disclosure.** The toolbar carries the seven things you touch
  while playing; reference audio, metronome, error cues, octave and zoom moved
  behind **⚙ Options**. Twenty controls in one row gave the metronome checkbox
  the same weight as Play, which is the wrong answer to "what do I press?".
  The library drawer splits the same way, into **Songs / Keyboard / Progress** —
  it had grown to six sections in one scroll doing three unrelated jobs.
- **Focus.** While a run is playing the setup chrome — key count, MIDI port,
  active instrument — drops back to a fifth of its opacity and returns when you
  reach for the topbar. Opacity only, never collapse: hiding any of it would
  reflow the toolbar at the exact moment you are trying to land a note. The
  drawer closes itself when a run starts, for the same reason.
- **Nothing moves that you are not moving.** Verified by measuring every control
  in the topbar and toolbar before and after a run starts and asserting the
  boxes are identical. That check found two long-standing wobbles: `▶ Play`
  becoming `⏸ Pause` is thirteen pixels wider and slid the whole toolbar, and
  the instrument slot resized twice a session — once on the first note, again
  when the sampled piano finished downloading.

## The practice report

Every run ends with a verdict: a star rating out of five, the three skills
broken out so you can see which one let you down, the passages that need work,
and one thing to do next.

**The rating is meant to be capable of being bad.** Notes are weighted hardest
(55, against 30 for timing and 15 for touch), because playing the wrong pitch
makes everything else moot. Two guards keep the stars worth chasing:

- **A run that covers less than 60 % of the piece is not graded.** It shows the
  full breakdown and says *Incomplete*, but awards no stars and sets no record.
  Without that, quitting the moment things went wrong would be the reliable
  route to a high score — the opposite of practising.
- **Timing and touch are ratios over the notes you actually hit**, so they mean
  nothing when there are barely any. Below a floor that scales with the length
  of the piece, both are reported as unmeasured and their weight falls back onto
  the notes. Two lucky notes struck at the written velocity used to read as
  "100 % dynamics" and drag a collapsed run up towards a pass.

"What to work on" collapses individual mistakes onto bar numbers and merges
adjacent bars, because *"you missed twelve notes"* is a fact and *"bars 5–6 are
where it falls apart"* is an instruction. Each one is a button that loops those
bars and slows them down.

Records are kept per **arrangement**, not per piece. A folded 25-key run, a
right-hand-only run and a full 88-key run of the same music are different work,
so they never share a personal best.

Your longest clean streak is one of those records, and it is the one you are
told about **while you are still playing**: pass it and the hit line turns warm
and reads `NEW BEST · N in a row`. A record you find out about on a results
screen twenty seconds after the moment passed is a statistic. The engine had
always counted this per run and thrown it away at the end of each one.

### Hearing it back

The report can play the run to you, which is the one thing a teacher does that
no number on the screen can. Two buttons, because they answer different
questions:

- **Hear yourself** — your run alone, at the velocities you actually played. An
  uneven hand is obvious in the ear and nearly invisible in a percentage, and
  the person who has just played something is the worst-placed one to say how
  it sounded, because they were busy playing it.
- **Against the score** — your run with the written notes underneath it, a
  little quieter. This exists because playing a run back on its own answers the
  less useful half: it tells you what you did, and it cannot tell you what you
  should have done. It also thins out exactly where it is needed most — a run
  you mostly missed plays back as a handful of disconnected notes with nothing
  to judge them against. Against the score, every mistake becomes audible as
  itself: a missed note is a bar where only the reference sounds, a wrong one
  is a clash, and dragging is you arriving behind something steady.

Both parts share a timeline anchored on the earlier of the two first notes, so
if you came in two bars late you hear yourself come in two bars late. Anchoring
each part to its own first note would quietly correct the mistake you are
listening for.

If you played nothing at all, the second button becomes **Hear the score** —
that run is precisely the one where hearing how the piece actually goes is
worth the most.

## Playing one hand

Pick **R** or **L** and the app plays the other hand for you rather than
deleting it. Practising a right hand in silence is a memory test; practising it
against the left is music, and hearing the part you are fitting into is most of
what makes single-hand practice worth doing.

The accompaniment is drawn faintly behind the notes you have to play, never
counts as a hit or a miss, and sounds whether or not **Reference** is on — it is
not the reference performance, it is the other half of the piece. It also counts
as harmony when judging what you played over it, so a right-hand note is
measured against the chord underneath rather than against nothing.

When a score is fitted to a small keyboard, the fit is calculated from the notes
*you* play. The accompaniment comes out of the speakers, so squeezing it into
your two octaves would mangle the bass for no reason.

## Using your own instrument

A browser cannot host a VST or AU plugin — they are native code expecting a host
process, and there is no web sandbox that runs them. But it can send one notes,
which gets you the real thing. Two routes, both in **Library ▸ Your keyboard**:

**Point it at a plugin.** Choose *A plugin*, pick a MIDI output port, and your
instrument makes the piano sound while the app keeps reading and judging your
playing. On an MPK Mini this is nearly free: the controller already exposes a
port built for AIR plugins. The metronome and error cues deliberately stay in
the browser — they are not piano sounds, and a buzz cue through a grand piano
patch would be nonsense. If your plugin already hears the controller directly,
turn off **Send my playing too** or you get every note twice.

**Or drop in samples.** Bounce a few notes out of your instrument — one per
octave is plenty — name them for the pitch they record (`C4.wav`, `Ds3.wav`,
`Bb2.wav`), and drop them on the panel. The app reads the pitch from the
filename, stores the audio in IndexedDB and plays everything in between by
shifting the nearest sample. No manifest to write, no rebuild.

## A reason to come back

Daily practice is the single biggest determinant of how quickly anyone improves,
which is why every serious practice app tracks it. The streak here is meant as
evidence of that, not decoration — so it is hard to fake. **A day counts only
when you actually practised**: one complete run, or three minutes at the keys.
Opening the app earns nothing, and a run where you played no notes at all is not
recorded. It is the same principle as the coverage guard on stars.

Alongside it, a ring for the day's goal, which you can set anywhere from five
minutes to an hour.

## Exercises built from your own mistakes

The trouble map has been accumulating across every run of a piece — which bars
you miss, where you play the wrong note, where you drag. Until now it only lit
bands on the roll and offered a four-bar loop. **Build me an exercise**, under
Trouble spots, turns it into a study.

It takes the worst spots, collapses several inside one bar into one problem,
merges adjacent bars into a single longer passage, and cuts each one out of the
piece with a bar of run-up so you arrive in context rather than cold. Each
passage is played twice, separated by a bar of silence, in the order they occur
in the music rather than by severity. It opens at 70 % speed.

A drill keeps its own identity — `drill:<songId>` — so practising one never
writes to the parent piece's stars. The way back sits in the topbar rather than
the piece panel, because that panel is replaced by the scoreboard the moment you
play a note, and a way out that disappears is not a way out.

Every other app lets you loop a section you choose yourself. None of them
assembles one from what you have actually been getting wrong, which is strange,
because it is the obvious use of the data.

## Touch you can trust

The app grades your touch — dynamics is part of the star score — by comparing
the velocity your controller reported against the one written in the score.
Those are only in the same units if the controller is linear, and mini
controllers emphatically are not. Play as softly as you physically can on a
25-key and it may still report half the range; press firmly and it saturates
long before you are really playing loudly. Judged raw, that reads as someone
who thumps everything and cannot shade a phrase — a fact about the hardware,
not about them.

`grading.js` has always known this. Its comment on `WEIGHTS` says so outright,
and its answer was to care less: dynamics weighted down to 15% so the hardware
could not do too much damage. That is a workaround for a missing measurement,
and it penalises the person on a weighted 88-key stage piano whose touch is
worth listening to.

**Library ▸ Your keyboard ▸ Touch ▸ Calibrate** measures it instead. Three
passes — eight notes as softly as you can, eight comfortable, eight firm — and
the app takes the median of each (one fumbled note would drag an average far
enough to make the correction worse than none) and maps the range your hands
and your hardware produce together onto the range the music is written in. The
curve is drawn with dynamics markings up the side rather than MIDI numbers,
because ppp to fff is the unit the score is in.

A calibration it cannot trust is **refused, not stored**: too few notes, three
passes that did not get louder, or a range too narrow to map all come back as a
sentence explaining which, and nothing changes. Storing a guess there would
make the dynamics score worse than leaving it alone, which is the one outcome
the feature has to avoid.

The correction is applied at a single seam — the same place `inputLatencySec`
corrects timing — and to **the sound as well as the scoring**. A correction that
fixed your score but not what came out of the speakers would have you playing
to a meter instead of to your ears.

Two things deliberately left alone: the 15% weight stays where it is (raising
it because the number became trustworthy would silently rescore every run you
have ever done), and a calibration does not split your history the way an
arrangement does — it is a correction to you, not a different piece. Each run
records whether it was calibrated, so a maintainer comparing dynamics across a
year can see where the measurement changed.

## Timing you can trust

Two things had to be true before a rating meant anything.

**A count-in.** Every piece begins on beat one, so pressing Play used to put the
first note on the hit line instantly — unhittable, and a guaranteed miss on
every single run. Now the clock starts a bar early and counts you in. Nothing is
judged while it runs, so noodling along to the click costs you nothing. The
score is untouched: the clock simply starts at a negative time, which also gives
the opening notes their run-up down the screen.

**Latency calibration.** You play in time with what you *hear*, and your
speakers are always a buffer behind your fingers, which makes good playing
measure as late. **Library ▸ Your keyboard ▸ calibrate** ticks a click, has you
tap along, and takes the median offset — the median rather than the mean, so one
fumbled tap cannot skew the correction into making things worse. The result is
subtracted at the single point where hardware time becomes song time.

## How mistakes are judged

Four independent checks run on every note you play.

**1. Is it the right pitch, at roughly the right moment?**
A key press is matched to the nearest unplayed target of the same pitch within
±350 ms. Match found → hit; the timing deviation is recorded and labelled
*on time* / *early* / *late* against a ±90 ms window. No match → it's an extra
note, and check 2 runs. A target that goes 400 ms past its onset without being
played is marked *missed*.

**2. Why is the wrong note wrong?** (`src/lib/music/theory.js`)
This is the part that makes the feedback useful rather than just red. The played
pitch is compared against the notes actually sounding in the score at that
instant, the chord they form, and the estimated key of the piece:

| Verdict | Meaning | Severity |
| --- | --- | --- |
| Right note, wrong octave | correct pitch class, wrong register | 0.20 |
| Harmonically fine, not in the score | a chord tone — sounds OK, isn't written | 0.35 |
| Wrong note, still in key | diatonic, but a non-chord tone | 0.50 |
| Adjacent key slip | a semitone off a target: a hand-position problem, not an ear problem | 0.60 |
| Out of key | foreign to the key | 0.85 |
| Dissonant clash | foreign *and* a semitone or tritone against a sounding note | 1.00 |

Severity drives both the colour on screen and how ugly the error cue sounds, so
you can tell a harmless octave slip from a real clang without looking up.

Chords are identified by scoring every root/quality pair against the sounding
pitch classes, which handles inversions, doublings and incomplete voicings. The
key comes from a Krumhansl–Schmuckler correlation over a duration-weighted
pitch-class histogram; for minor keys the natural, harmonic and melodic forms are
unioned, so a raised 7th in a cadence isn't reported as an error.

**3. Are you drifting?**
Signed timing deviations are averaged over the run, so the panel can tell you
"you're rushing by 60 ms" rather than just showing a percentage.

**4. How hard did you hit it?**
Every hit records the MIDI velocity you played against the velocity written in
the score. A press more than 0.28 (about 36 of 127) from the written level is
called *harder* or *softer* and named in the live feed — "struck softer than
written (25 vs 99)". Two numbers come out of it:

- **Dynamics** — the share of hits inside that window, plus your average offset
  from the score.
- **Evenness** — the standard deviation of your own velocities, ignoring the
  score entirely. This is the more useful of the two on an exercise: a scale
  played at a consistent weight sounds right even if it is not at the level the
  file asked for, and a lumpy one shows up here as a wide spread.

The window is deliberately generous. These arrangements carry broad-brush
dynamics, and the signal worth having is a hand that thumps or fades, not a few
points of MIDI velocity.

The run panel also lists **which** pitches you played that the score did not
want, not just how many — so "3 wrong" becomes "C4, C♯4, F♯4".

## Visualisation

One canvas, four zones stacked vertically:

```
┌─────────────────────────────┐
│  future: targets falling    │  right hand blue, left hand violet
│                             │  bar lines + bar numbers, octave lanes
├═════════════════════════════┤  ← the hit line: play what crosses it
│  past: outcome + YOUR notes │  targets go green/red, your notes overlay
├─────────────────────────────┤     as narrower bars, so target vs. performance
│  keyboard                   │     sit literally side by side
└─────────────────────────────┘
```

The keyboard highlights the notes you should be holding (teal) and the ones you
are holding (green / amber / red by verdict). Faint red horizontal bands mark
places you have historically got wrong — they show up *before* you reach them.
Click anywhere in the roll to seek; click a key to hear it.

## Persistent progress

Everything is stored in `localStorage` under `piano-practice-coach:v1`, per song.
That key, the `piano-practice-coach/backup` format string and the IndexedDB
database name kept the old product name deliberately: renaming a storage
namespace orphans every practice history and every backup file already on disk,
which is a high price for a string nobody sees. Per song:

- **Sessions** — accuracy, timing, missed/wrong counts, mode and speed for every
  run, drawn as a sparkline with best-run highlighting and a change indicator.
- **Trouble spots** — cumulative miss/wrong/late counts keyed by position in the
  score. The worst offenders are listed worst-first; click one to loop those four
  bars immediately.

## The bundled library

`npm run songs` generates the library: eighteen pieces, the fifteen path
exercises and their recitals, and the ten easy songs (`easySongs.js`). All are
**public domain** — the composers died well over 70 years ago, or the tune is
traditional. Recent chart hits are still under copyright and this script writes
none; use the file loader for anything you hold a licence to. The six film
songs kept by hand in `songs.json` are marked `localOnly` and are left out of a
public build (see "Film songs are local only" above). Imported files are remembered in
IndexedDB, so "Your files" is still there tomorrow.

| Piece | Level | Why it's here |
| --- | --- | --- |
| C Major Scale, two octaves | ★ | Parallel hands. Timing evenness before speed. |
| Triads & Arpeggios in C | ★★ | I–ii–IV–V–vi–I: gives the harmonic checker real chords to reason about. |
| Twinkle, Twinkle, Little Star | ★ | Checks your controller, your latency and your ears in 30 seconds. |
| Ode to Joy — Beethoven | ★★ | Stepwise melody over block chords; a solid first two-hand piece. |
| Für Elise (opening) — Beethoven | ★★★ | The E–D♯ alternation makes the adjacent-key-slip detector earn its keep. |
| Prelude in C, BWV 846 (bars 1–8) — Bach | ★★★ | Pure broken chords, so every chord you play over gets named. |
| Canon in D — Pachelbel | ★★★ | The ground bass twice: half notes, then eighth-note variation. |
| Moonlight Sonata, mvt I (opening) — Beethoven | ★★★★ | Even triplets. The timing report is brutally honest here. |
| Twinkle (MusicXML import) | ★ | The same tune read from MusicXML — proves that import path works. |

### Two-octave studies

These are arranged to sit inside 24 semitones, so a 25-key controller plays them
exactly as written — no folding, no unreachable notes.

| Piece | Level | Why it's here |
| --- | --- | --- |
| Five-Finger Warm-up in C | ★ | C–G under five fingers, hands an octave apart. No thumb crossing. |
| Twinkle (two-octave version) | ★ | Single bass roots instead of spread chords. |
| Ode to Joy (two-octave version) | ★★ | The first eight bars over a walking bass. |
| Chord Shapes in C (close position) | ★★ | I–vi–IV–V7–I–ii–V7–I with the right hand never leaving one position. |
| Für Elise (two-octave version, C minor) | ★★★ | Transposed so it lines up with a C keybed; every interval of the original intact. |
| Amazing Grace (F major) | ★ | Pentatonic throughout — no wrong black key to hit. A gentle first piece in three-four. |
| Greensleeves (D minor) | ★★ | The first minor-key tune here; the raised leading note gives the harmony checker a real decision. |
| Scarborough Fair (D dorian) | ★★ | A minor tune with a major sixth in it. Slow, spacious, unforgiving about even timing. |
| The Entertainer (opening strain) — Joplin | ★★★ | Ragtime syncopation over a steady off-beat bass. The timing report earns its keep here. |

Three of those are transposed, and not arbitrarily. The app can only move a
piece by whole octaves, so a tune whose lowest note is a G can never line up
with a keybed that starts on C unless it is unusually narrow. Moving the key
keeps every interval of the original and costs only the pitch.

That last transposition is not arbitrary. The app can only move a piece by whole
octaves, so an A-minor arrangement would have to squeeze into fifteen semitones
to align with a keybed that starts on C — narrower than the theme itself. Moving
the key instead keeps the music and loses only the pitch. `build-songs.mjs`
asserts this for every study, so a two-octave piece that does not actually fit
fails the build.

The arrangements are simplified practice studies: opening sections, thinned
textures, comfortable registers. They are not urtext editions.

## Reading the music

**Roll · Both · Staff** in the toolbar. Falling notes tell you *when*; a staff
tells you *what*, and every review of an app in this space makes the same point
— blocks build reflexes, not reading. "Both" puts notation above the roll, which
is the useful middle while you still want the timing cue underneath.

The engraving itself is VexFlow. It is the one thing here worth a dependency:
beams, rests, accidentals, ties and spacing are not worth hand-rolling. But it
weighs more than the rest of the app put together, so **it is loaded only when
you ask for notation** — a session that stays on the roll never fetches it. The
main bundle is 160 kB gzipped; notation adds 391 kB the first time you open it.

The work that is ours is [notation.js](../src/lib/music/notation.js), and it is almost
entirely quantisation. A score holds onsets and lengths in seconds; notation
needs bars, note values, rests for the silence, and ties where a note runs over
a barline. Lengths are snapped to sixteenths — finer than that and human timing
becomes confetti — then expressed greedily as note values, so two and a half
beats comes out as a half tied to an eighth, which is what an engraver writes.
Hands take a stave each, falling back to middle C for files that carry no hand
information.

All of that is pure and tested without a canvas, including the property that
matters most: **every bar adds up to a full complement of beats.** A bar that
does not balance will not engrave, and the renderer cannot tell you that a
rhythm is wrong — only that it could not lay it out.

The window turns a page at a time rather than scrolling continuously. Reading is
done in bars, and a staff sliding under your eyes is harder to follow than one
that turns.

## Fingering

Which finger, not just which note — the question the app never used to answer.
**Options ▸ On each note ▸ Finger** writes 1–5 on the falling blocks instead of
the pitch name. Only one label fits on a note, so it is a choice rather than an
addition.

The fingering is **authored, never inferred.** Automatic fingering is a hard
problem and a wrong answer is worse than no answer — a learner following bad
fingering builds a habit that is harder to unlearn than none at all. So the
pieces this app generates carry fingering written into `build-songs.mjs`, and
imported files show none.

It currently covers the studies where fingering is genuinely determined rather
than a matter of taste: the two-octave C major scale (thumb tucks under after
the third and seventh degrees going up, third finger crosses coming down), the
five-finger warm-up, and the close-position chord shapes.

Because it travels alongside the notes by position, the build re-parses every
file it writes and refuses to ship if the note count does not match the
fingering it emitted.

## Your controller against 88 keys

Under **Library ▸ Keyboard** there is a whole piano an inch wide, with your
controller's window lit on it and a mark underneath showing the span the current
piece needs. Click anywhere to move the window. The app has always known which
keys you physically have; it used to say so in words — *"25 keys · C3–C5"* — and
a picture you can read beats a fact you have to decode.

The idea is lifted from the strip along the top of GarageBand's keyboard, which
is also where the keys got their gloss: a specular stripe down each black key, a
seam shadow between the whites, and a lit front lip. The keyboard map remains
canvas 2D. The optional Stage roll uses WebGL only for the main falling-note
view, where the extra cost buys a more physical presentation.

## Browsing by composer

The library groups into collections, so nineteen pieces in a column become a
catalogue. Beethoven has six entries — *Ode to Joy*, *Für Elise* and the
*Moonlight* opening, each with a two-octave version where one exists, plus the
opening of the Fifth. Picking a composer filters the list and opens a card with
their dates and a note on the pieces.

Every work has a **listen** button beside it, which loads the piece and plays it
straight through in Listen mode. Knowing what something sounds like is most of
deciding whether to spend twenty minutes on it, and that should be one click.

**Pieces can state their own key.** Estimation works from what sounds, which is
almost always enough — but the opening of the Fifth is four notes and never
touches its own tonic, and the estimator landed on D minor while honestly
reporting the lowest confidence in the library. Generated pieces now carry their
key and time signature in the manifest; imported files are still estimated.

That also fixed a quieter bug: the generator clears the header's time
signatures, so **every piece was being read back as 4/4** — and bar numbers in
the practice report and in generated drills are derived from it, so every
reference to "bars 5–6" was wrong for anything in 3/4, 6/8 or 2/4.

## Your own files

Drag a `.mid`, `.midi`, `.xml` or `.musicxml` file onto the sidebar, or browse for
it. Two-track MIDI files are read as right/left hand; single-track files are split
at middle C. The MusicXML reader handles divisions, chords, `backup`/`forward`,
ties across barlines, multiple staves and `<sound tempo>`. Compressed `.mxl` is
not supported — unzip it and load the `.musicxml` inside.

Imports are kept as their original bytes in IndexedDB and re-parsed on load, so
a change to the reader reaches everything you ever imported. If one of them can
no longer be read the app now says which — it used to drop them silently on the
grounds that it "wasn't worth a toast on load", but the file does not come back
and nothing else mentions it, so from the other side of the screen a piece you
imported has simply vanished and the app is the thing that lost it. A browser
with no IndexedDB at all says nothing, because there was never a vault to lose
anything from.

## Sound

The audio engine tries three sources in order and shows which one it got:

1. **Your own sample pack** in `public/samples/` — see
   [`public/samples/README.md`](../public/samples/README.md) for the layout and for
   an honest explanation of why a browser can't host a VST but can play the same
   samples the VST uses.
2. **Salamander Grand Piano** over CDN — a real sampled acoustic grand.
3. **Web Audio synthesis** — no downloads, fully offline, sounds synthetic.

Error cues are synthesised on the spot: a dull thud for a missed note, a soft
click for sloppy timing, and a detuned dyad for a wrong note whose interval gets
nastier as the severity rises.

## Code layout

`src/lib` is grouped by job (20 October 2026); each file's unit test sits beside it. `instruments.js`, the registry
that ties the instruments' kits together, stays at its root.

```
src/
  lib/
    instruments.js  which instruments exist, and each one's kit
    app/            settings.js, storage.js (localStorage sessions + trouble map), vault.js (IndexedDB: imported
                    files and sample packs), indexedDbBackup.js, route.js (an address per screen), pageTitle.js,
                    theme.js, appearance.js, commands.js (the Ctrl+K palette's matching), shortcuts.js
    audio/          audio.js (instrument loading, playback, error cues, metronome, the drone), audioOutput.js (the
                    master gain, limiter and safety stage), drone.js + droneVoice.js, playback.js, speech.js,
                    technique.js (bow or fingers, and the voice of a model shown in the whole view)
    input/          midiInput.js (Web MIDI: enumeration, hot-plug, normalisation), midiOutput.js, micInput.js,
                    pitch.js, tuner.js, noteTracker.js, playInput.js, devices.js (controller profiles and the
                    playable-key window), latency.js (tap-offset maths), velocity.js (a touch curve per controller)
    music/          theory.js (scales, key estimation, chord ID, wrong-note classification, note names),
                    score.js (MIDI + MusicXML into one Score shape), notation.js, arrange.js (fit a score onto a
                    keyboard: shift / fold / hand filter), passages.js (mistakes into "bars 5-6"), easySongs.js
    practice/       matcher.js (PracticeSession: hit/miss/timing), transport.js (the song clock + audio scheduler),
                    grading.js (a run into stars and skill bands), coaching.js (the one next action), drills.js,
                    liveFeedback.js, loopSelection.js, barInspect.js, beatPulse.js, sessionLength.js, pieceNotes.js
    learning/       learning.js (lesson steps and words), path.js, discovery.js, collections.js, glossary.js,
                    streaks.js (daily ledger), teacherReport.js
    piano/          keyboard.js (key geometry shared by roll and keyboard), keyFingers.js, pianoKeys.js,
                    pianoStage.js + pianoStagePaint.js, rollGeometry.js, rollPaint.js, rollCamera.js, rollScene.js
    strings/        guitar.js, fretted.js (the bass and the veena), bowed.js (violin, cello), guitarNeck.js,
                    guitarRig.js, guitarModelRig.js, guitarStageView.js, guitarViews.js, guitarBody.js,
                    guitarPresentation.js, frettedStage.js, bowedNeck.js / bowedRig.js / bowedBow.js /
                    bowedGeometry.js / bowedStageView.js, instrumentView.js
    struck/         struck.js + struckSets.js (the struck framework), drums.js, drumKitModel.js, drumLabels.js,
                    drumSticks.js, drumVoice.js, tabla.js, tablaMap.js, tablaVoice.js, handpan.js,
                    handpanModel.js, handpanVoice.js
    stage/          the 3D studio: studio.js (renderer, lights, floor, camera), environment.js, quality.js,
                    framing.js, views.js, turntable.js, pacing.js, stageRunner.js, models.js, modelFinish.js,
                    stageBars.js, drumModelRig.js, pianoModelRig.js, otherRigs.js, tablaZones.js; and
                    stageModels.js (which models each instrument has), modelCredits.js (their credits),
                    shownModel.js, showcaseView.js, stageColors.js, webgl.js
  hooks/
    usePracticeEngine.js   the one place engine, MIDI and React meet
    usePassages.js         hearing, looping and drilling a stretch of music
    useComputerKeyboard.js QWERTY as both the piano and the deck's shortcuts
    useImports.js / useKeyboardSetup.js / usePathData.js
  components/
    PianoRoll.jsx   the canvas view (owns its own rAF loop)
    KeyboardPanel.jsx  which controller you are on and how scores fit it
    PracticeReport.jsx the end-of-run verdict
    LatencyCalibrator.jsx  tap-along timing calibration
    TouchCalibrator.jsx    three-pass velocity calibration
    VelocityCurve.jsx      the correction, drawn in ppp-fff
    StreakStrip.jsx    daily practice at a glance
    TopBar / SongLibrary / Controls / FeedbackPanel / HistoryPanel
scripts/
  build/            build-public-pages.mjs (run by `npm run build`), build-icons.mjs, sync-design-system.mjs
  songs/            build-songs.mjs generates the bundled library (`npm run songs`), its generators, public-library.mjs
  media/            shoot-instruments.mjs, shoot-models.mjs, render-tabla-picture.mjs: the pictures in public/media
  models/           prepares the downloaded 3D models: `node scripts/models/prepare.mjs`
                    reads models-src/<name>/scene.gltf and writes public/models/<name>.glb + .json
  dev/              shoot.mjs, look.mjs, panels.mjs, sample.mjs, profile.mjs, check-browser.mjs: looking at and
                    measuring the running app
```

**No file over 800 lines.** `App.jsx` is the one that keeps drifting towards it,
and every hook in the list above exists because it crossed the line once. The
rule earns its keep by being enforced rather than admired: adding the passage
controls and the keyboard shortcuts pushed App to 993 lines, and `usePassages`
and `useComputerKeyboard` are what brought it back to 717.

Three deliberate choices worth knowing about:

**The master clock is `performance.now()`, not the audio clock.** That's the same
time domain as `MIDIMessageEvent.timeStamp`, so an incoming note is placed on the
timeline using the hardware's own timestamp rather than whenever React happened
to notice it. Audio is converted to Tone's clock only at the moment of
scheduling, which keeps playback jitter-free without compromising input timing.

**Frame-rate state lives in refs.** The canvas reads engine state directly in its
own rAF loop; React state refreshes about twelve times a second for the numeric
read-outs. A dense passage therefore causes zero extra re-renders.

## Tests

`npm test` runs 458 tests in 24 files. The logic that decides what you are told
about your playing lives in `src/lib/` as pure modules precisely so it can be
tested without a browser, a keyboard or a canvas.

**Judging what you played**

- `engine.test.js` (45) — key estimation, chord ID, all six wrong-note verdicts
  and their severity ordering, and the matcher's hit/miss/timing bookkeeping in
  both timed and wait modes.
- `grading.test.js` (44) — star bands, the notes/timing/dynamics weighting, and
  what happens when a band has too few notes to read.
- `dynamics.test.js` (26) — velocity against the written level, evenness, and
  repeated pitches.

**Progress and what it means**

- `path.test.js` (44) — the curriculum, the tempo ladder, unlocking, the daily
  set and the benchmark.
- `streaks.test.js` (28) — the day ledger, goals and streak arithmetic.
- `stars.test.js` (15) — best-star badges and the tempo they were earned at, and
  the longest clean streak per arrangement.
- `ghost.test.js` (8) — that the ghost only ever holds your best, and never
  races a folded arrangement against the full one.
- `backup.test.js` (11), `vault.test.js` (10) — export/import and the sample
  store.

**Reading and arranging the music**

- `parsers.test.js` (14) — parses the actual generated files back and checks the
  melodies, hands, tempi, keys and the MusicXML tie merge. A regression in the
  reader can't quietly turn into "you played a wrong note".
- `arrange.test.js` (29) — octave fitting, folding, hand filters and the variant
  key that keeps their records apart.
- `notation.test.js` (19) — note and rest durations for the engraved staff.
- `drills.test.js` (15) — exercises built from your own trouble spots.

**Everything else**

- `playback.test.js` (23) — turning captured key presses into playable clips for
  "hear yourself", putting your run and the score on one timeline so a late
  entry stays late, and that stopping actually stops.
- `velocity.test.js` (18) — fitting a touch curve to three measured passes, and
  refusing to store one that would make the dynamics score worse than none.
- `shortcuts.test.js` (14) — which key does what, and — the one that matters —
  that no shortcut ever claims a key that plays a note.
- `speech.test.js` (13) — spoken coaching.
- `audio.test.js` (9) — the difference between an instrument being loaded and a
  note through it being audible, and that a note which fails to sound is
  counted rather than swallowed.
- `midiOutput.test.js` (10) — the same two questions for an external plugin or
  hardware module: whether the selected port is still there, and whether notes
  it refused are counted rather than discarded in silence.
- `app.test.jsx` (15) — mounts the whole app against a stubbed fetch/canvas,
  switches songs, starts a run, feeds synthetic MIDI in and asserts that the
  wrong note gets explained and the session gets persisted.
- `useImports.test.jsx` (8) — restoring the files you imported, and that one
  which can no longer be read is named rather than quietly missing.
- `rollGeometry.test.js` (23) — where every note belongs, and above all that
  screen distance to the hit line stays linear in time.
- `routing.test.jsx` (5) — that "This app" and "A plugin" are genuinely
  exclusive, including when the plugin's port drops after you chose it.
- `ErrorBoundary.test.jsx` (6) — that a crash offers you your data back.

## Known limits

Two entries here went stale and were removed: velocity and dynamics *are*
judged — `dynamicsBand` in `grading.js` is 15% of the star score — and the staff
view *does* engrave, via VexFlow in `StaffView.jsx`. Both had been true once,
and both survived long enough to mislead someone reading this file to find out
what the app could not do. What remains:

- Sustain pedal (CC64) releases held notes, but pedal timing isn't scored. The
  MPK Mini this app is built around has no pedal input, so this is only a limit
  on larger controllers.
- The staff is engraved from the note data, not from the source file's own
  layout. Beaming, voicing and line breaks are the app's choices, not the
  publisher's.
- Ornaments, repeats, `D.C.`/`D.S.` jumps and multi-voice tuplets in MusicXML are
  read literally, not expanded.
- Manual octave transposition (the Octave slider) writes to the same history
  entry as the untransposed version. Fitting does not: `variantOf` in
  `arrange.js` keys history, ghosts and star badges by fit mode, keyboard span
  and hand filter, so a folded 25-key run never shares a record with the full
  piece. Octave shifts are left together on purpose — every interval and the
  whole contour survive them, so it is the same work.
- The daily streak's "best stars today" is a plain maximum over the day's runs
  and ignores the speed they were played at. The per-piece badges do not — see
  below.

### Stars and tempo

Five stars at 60% is not five stars, and until recently the library badges said
it was. `path.js` had always known better — passing and mastery are gated on
`atTempo` — but `getAllBestStars` took a plain maximum over every run, so a
clean slow attempt put five gold stars beside Moonlight Sonata.

The rating is not withheld, because slowing a piece down until it is clean is
the method this whole app teaches and scoring that zero would punish taking its
advice. It is qualified instead: the stars stand, with the tempo attached as a
small tag. Ties on stars break towards the faster run, so the badge always
reports the most impressive true version of what happened. `src/lib/app/stars.test.js`
pins the rules down.
