# Practice Deck improvements

Implemented across models, beginner lessons and the playing interface. Changes are uncommitted.

## Models

The preparation pipeline now simplifies surface geometry within an error limit, preserves part/material boundaries, and protects strings, frets, bridges and hardware. Prepared models still use their existing playable rigs.

| Model | Before bytes | After bytes | Before triangles | After triangles |
| --- | ---: | ---: | ---: | ---: |
| Electronic kit | 6,808,256 | 2,781,916 | 409,108 | 116,502 |
| Bass guitar | 3,659,692 | 2,234,832 | 174,746 | 79,964 |
| Antique cello | 2,329,844 | 1,833,908 | 121,620 | 86,916 |

The electronic kit and electric violin have adjusted dark finishes so their surfaces reflect the studio lights. Shared full-detail lighting has stronger fill and rim light. Cello chooser cards use portrait framing. Downloaded kits can be played by tapping their parts or their accessible labels; drag the background to turn. Keyboard reset keeps focus, while pointer reset dismisses the reset control.

Existing artists and licences are retained. `CREDITS.md`, `modelCredits.js` and prepared model metadata describe the modifications. Replacement Sketchfab models remain a separate choice requiring the user's downloaded glTF ZIPs.

## Lessons

- Piano has 17 path lessons: a steady-note exercise and alternating hands now precede both hands together.
- Guitar, bass, violin and cello introduce string crossings before a full scale. Drums introduces two-part coordination before the complete beat.
- Goals explain the prerequisite and previous lesson. Preparation tips cover posture, hand/bow position, first-note reading and reference tuning.
- Finishing still opens lessons independently of stars. New bridge lessons stay available without closing later lessons a returning learner has reached, or redirecting their next recommendation backward.
- Feedback names notes found and one correction for extra notes, missed notes or timing. Guided attempts still make no timing judgement and earn no stars.
- Daily practice includes finished guided phrases for review, and an open tune for enjoyment before a recital has been earned. Phrase count and the daily run goal are labelled separately.
- Easy tunes have instrument-specific order; drum beats progress through coordination before syncopation and open hats. Every piano tune has fingering, with hand changes explained. Violin high third-finger places explicitly say they sit above the third-finger tape.

## Interface and tokens

On phones, a compact lesson action stays beside the instrument. The full guide opens on demand, and the step list expands when requested. Settings and repeated next-note cards no longer displace the stage. Guided piano uses a range fitted to the phrase, with fewer keys on phones. The learning home places its main lesson action before the fold at 390 × 844.

Compact controls are 40px on desktop and 44px below 900px. Fret buttons also have a minimum width and height, with scrolling for the full neck. Favourites and armed transport use violet. Model loading text has an opaque surface. The [local design-system mirror](design-system.html) embeds the exact token source; `npm run design:sync` updates it, and a unit test checks parity.

### Palette token edits

| Theme | Token | Before | After |
| --- | --- | --- | --- |
| Light | `--bg` | `#f2f0eb` | `#f5f3ee` |
| Light | `--bg-3` | `#e0dfeb` | `#e7e5ef` |
| Light | `--line-strong` | `#80809a` | `#77778f` |
| Light | `--bad` | `#b53954` | `#a9304b` |
| Dark | `--line-strong` | `#686880` | `#74748a` |
| Dark | `--text-faint` | `#8b8b9c` | `#9696a7` |
| Dark | `--now-dim` | `#35659f` | `#4d86c6` |

Both themes now alias `--armed-bg`, `--armed-border`, `--armed-text` and `--armed-shadow` to their primary-action tokens. New model surface, loading, backdrop, material and picture-aspect values are declared in `tokens.css`.

Measured faint text contrast against the darkest raised app surface is 4.89:1 in light and 5.28:1 in dark. Strong control borders meet 3:1 on raised surfaces (3.50:1 light, 3.37:1 dark). These measurements cover those token pairs, rather than certifying the entire app.

## Verification and visual evidence

Regression tests were added before implementation. `npm test`: 96 files and 1,279 tests passed. Production build passed. The relevant browser suites cover beginner learning, discovery/retention, model selection and the new phone/kit interactions; all 35 unique checks passed across runs and targeted reruns. A stale drum-hint assertion was updated to the new tapping behavior and rerun successfully.

Screens were re-shot with `scripts/dev/shoot.mjs`, `scripts/media/shoot-instruments.mjs` and `scripts/media/shoot-models.mjs`, plus a matrix at desktop 1440 × 900 and phone 390 × 844 in both themes. Models are awaited before capture. Images were opened for inspection. Shipped instrument previews and all nine model previews were refreshed.

- [Piano phone before/after](../../shots/after/phone-piano-comparison.png)
- [Guitar phone before/after](../../shots/after/phone-guitar-comparison.png)
- [Electronic kit before/after](../../shots/after/electronic-kit-comparison.png)
- [Palette swatches before/after](../../shots/after/palette-comparison.png)
- [Desktop light](../../shots/after/desktop-light-all.png), [desktop dark](../../shots/after/desktop-dark-all.png)
- [Phone light](../../shots/after/phone-light-all.png), [phone dark](../../shots/after/phone-dark-all.png)
- [All model previews](../../shots/after/models-all.png)

Screenshots and raw measurement/test logs live in the ignored `shots/` directory. No real microphone, physical MIDI controller, Safari or Firefox validation was performed. The existing production bundle-size warning remains.
