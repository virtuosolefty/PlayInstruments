import { atTempo, PASS_STARS, MASTER_STARS } from './path.js';
import { struckSetFor } from '../struck/struckSets.js';
import { stringKit } from '../instruments.js';
import { pieceDetails } from './discovery.js';

export const LESSON_STEPS = [
  { id: 'sound', label: 'Sound' }, { id: 'note', label: 'First note' },
  { id: 'listen', label: 'Listen' }, { id: 'follow', label: 'Follow along' },
  { id: 'practice', label: 'Practice' }, { id: 'check', label: 'Check progress' },
];

export function learningRecord(saved = {}) {
  const step = LESSON_STEPS.some(s => s.id === saved?.step) ? saved.step : 'sound';
  return { ...saved, step, rate: Math.max(.4, Math.min(1, Number(saved?.rate) || .65)),
    completed: saved?.completed && typeof saved.completed === 'object' ? saved.completed : {},
  };
}

export function lessonSettings(step, rate = .65) {
  return { mode: step === 'listen' ? 'listen' : ['sound', 'note', 'follow'].includes(step) ? 'wait' : 'practice',
    rate: ['listen', 'check'].includes(step) ? 1 : rate,
    loop: null, transpose: 0, hands: 'both', referenceAudio: false,
  };
}

export const comfortableRate = rate => Math.min(1, Math.round((rate + .1) * 100) / 100);

/** Recommends the next lesson to play through; once every open one is finished,
 * the first whose check is not passed, and after that the first not mastered.
 * Never points the learner at a locked row. */
export function recommendedLesson(state) {
  const entries = state.stages.flatMap(s => s.entries);
  return entries.find(e => e.id === state.currentId && e.unlocked)?.id
    ?? entries.find(e => e.unlocked && !e.finished)?.id
    ?? entries.find(e => e.unlocked && !e.passed)?.id
    ?? entries.find(e => e.unlocked && !e.mastered)?.id
    ?? entries.find(e => e.unlocked)?.id ?? null;
}

export function lessonOutcome(result) {
  const outcome = outcomeOf(result);
  const summary = result?.summary;
  if (!summary || !result?.grade?.complete) return outcome;
  const strength = summary.hit > 0 ? `You found ${summary.hit} ${summary.hit === 1 ? 'note' : 'notes'} in the phrase.` : 'You stayed with the whole phrase. That gives you a place to start.';
  const nextAction = summary.wrongNotes > 0 ? `${summary.wrongNotes} extra ${summary.wrongNotes === 1 ? 'note' : 'notes'}: find the next note slowly before playing it.`
    : summary.missed > 0 ? `Find the ${summary.missed} missed ${summary.missed === 1 ? 'note' : 'notes'} with the music waiting for you.`
    : result.mode === 'wait' ? 'The notes are there. Try the same phrase at a comfortable speed.'
    : result.grade.bands?.timing != null && result.grade.bands.timing < 80 ? 'Count the beat aloud and repeat at a comfortable speed.'
    : 'Keep that comfortable tempo, or take a small step to the next lesson.';
  return { ...outcome, strength, nextAction };
}

function outcomeOf(result) {
  if (!result?.grade?.complete) return { kind: 'incomplete', title: 'A little more of the phrase', message: 'Finish the phrase to get useful feedback. Your partial attempt is saved when notes were played.' };
  if (result.mode === 'wait') return { kind: 'guided', title: 'Guided practice completed', message: 'You found your way through the phrase, and the next lesson is open. Timing was not assessed, so this run carries no stars.' };
  if (!atTempo(result.rate)) return { kind: 'practice', title: 'Practice saved', message: `You completed the phrase at ${Math.round(result.rate * 100)}% speed, and the next lesson is open. Build up gradually before checking at 100%.` };
  if (result.grade.stars >= MASTER_STARS) return { kind: 'mastered', title: 'Lesson mastered', message: 'Four or more stars at the written tempo. That is as well as this lesson asks to be known.' };
  if (result.grade.stars >= PASS_STARS) return { kind: 'passed', title: 'Mastery check passed', message: 'Three stars at the written tempo passes the check. Four masters the lesson.' };
  return { kind: 'retry', title: 'Keep building your rhythm', message: 'This attempt is saved, and the next lesson is open. For the stars, try the phrase more slowly, then return for a check at 100% speed.' };
}

export function lessonPurpose(lesson, stages = [], entries = []) {
  const detail = pieceDetails(lesson);
  const ids = stages.flatMap(stage => stage.exercises), index = ids.indexOf(lesson?.id);
  const previous = entries.find(entry => entry.id === ids[index - 1]);
  return { goal: detail.skill || 'Find your first note, then play a short phrase.',
    why: previous ? `${detail.needs}. Build on ${previous.title.toLowerCase()} one phrase at a time.` : 'Start by finding the sounds. The music can wait while you explore.' };
}

const FOUNDATIONS = {
  piano: ['Sit close enough to reach the keys with relaxed shoulders and level forearms. Let your fingers curve naturally.', 'Find middle C: the white key just left of a pair of black keys near the middle. C4 is its name; finger 1 is your thumb. On the treble staff it sits on a short ledger line below the five lines.', 'A higher note sits farther right. Start with one hand and count a steady beat before joining both hands.'],
  guitar: ['Support the guitar so your fretting hand does not have to hold it up. Keep shoulders relaxed and the wrist comfortable.', 'Press just behind a fret with a fingertip. Start by picking one open string, then change to its neighbour.', 'Standard tuning, low to high: E A D G B E. Check with a reference pitch or your usual tuner before practising.'],
  bass: ['Support the bass with a strap or on your lap. Keep the fretting wrist comfortable; move the hand instead of forcing a stretch.', 'Rest the plucking thumb lightly on a pickup or a lower string. Alternate index and middle fingers, and quiet strings you are not playing.', 'Standard tuning, low to high: E A D G. Check your tuning with a reference or your usual tuner.'],
  veena: ['Sit cross-legged with the resonator on the floor by your right knee and the small gourd under the neck resting on your left thigh, the strings facing up and away.', 'Press a string with the tip of your left index finger just on the fret, and slide along the frets rather than lifting. Pluck down with your right index finger, the middle finger ready for the next pluck.', 'Sa on D, the four strings low to high: Pa, Sa, Pa, Sa (A D A D). Sarani, the highest, lies nearest you; the three drone strings at the side ring with it.'],
  violin: ['Support the violin comfortably between shoulder and jaw without squeezing. A teacher can help fit the chin and shoulder rests.', 'Keep the bow hand relaxed with a curved thumb. Begin on one open string; draw the bow between fingerboard and bridge.', 'Tune G D A E with a reference or your usual tuner. First-position tapes are guides; listen to the pitch as well.'],
  cello: ['Sit on the front of a stable chair with feet supported. Adjust the endpin so the instrument balances comfortably against you.', 'Keep the bow hand relaxed with a curved thumb. Begin on one open string, with the bow between fingerboard and bridge.', 'Tune C G D A with a reference or your usual tuner. Fingers 1 to 4 run from index to little finger.'],
  drums: ['Set the seat so your feet reach the pedals comfortably. Keep shoulders loose and wrists free to move.', 'Hold the sticks lightly and let them rebound. Start with one hand or foot, then join two parts before the full beat.', 'Count one, two, three, four. Eighth notes add the and between beats; kick and snare can land with the hi-hat.'],
  tabla: ['Sit cross-legged on the floor or on a low cushion, the dayan in front of your right knee and the bayan in front of your left. Keep the shoulders and wrists loose.', 'Na: rest the ring finger on the edge of the black centre and flick the first finger at the rim, so it rings. Ge: strike the bayan with the middle fingers and lift them, so it booms.', 'Say each bol as you play it. A taal is a cycle of beats; its theka is the bols that mark it, and the first beat, sam, is where the cycle lands.'],
  handpan: ['Rest the handpan on your lap or on a stand, the gu (the hole) underneath, the ding in the middle of the top.', 'Strike each field near its centre with the pad of a finger or the side of the thumb, and lift at once so it rings. Play softly: a handpan sounds best gently.', 'The ding is the lowest note on top; the notes round it climb in a zig-zag, one side then the other. Let every note fade before you judge it.'],
};
export const beginnerFoundation = instrument => FOUNDATIONS[instrument] ?? FOUNDATIONS.piano;

export function lessonCanVisit(step, record) {
  if (step === 'sound') return true;
  if (step === 'note') return !!record.soundConfirmed || !!record.quick;
  if (step === 'listen') return !!record.firstNoteDone;
  if (step === 'follow') return !!record.listened || !!(record.quick && record.firstNoteDone);
  if (step === 'practice') return !!record.followed;
  return !!record.practised;
}

/**
 * Whether a lesson's own score is loaded and showing, so its steps can be
 * played. Nothing is ready before the lesson itself is known: the piano
 * library loads after the page does, and a missing lesson and a missing score
 * must not count as a match.
 */
export function lessonReady({ active, lesson, loading, error, score }) {
  return !!(active && lesson && !loading && !error && score?.id === lesson.id);
}

/** @param instrument an instrument id; `true` still means guitar for older callers */
export function noteInstruction(note, instrument) {
  if (!note) return 'Preparing your first note…';
  const id = instrument === true ? 'guitar' : instrument;
  const struck = struckSetFor(id);
  if (struck) return struck.instruction(note);
  const kit = stringKit(id);
  // A plucked string is found by its tablature number and fret; a bowed one by its name and finger.
  const swara = kit?.swara ? `${kit.swara(note.midi)} · ` : '';
  if (kit?.fretted) return `${swara}${note.name} · string ${kit.stringName(note.string).number} · ${note.fret === 0 ? 'open (no finger)' : `fret ${note.fret} · finger ${note.finger}`}`;
  if (kit?.bowed) return `${note.name} · ${kit.stringName(note.string).note} string · ${note.fret === 0 ? 'open (no finger)' : `${id === 'violin' && note.fret === 6 ? 'high ' : ''}finger ${note.finger}${id === 'violin' && note.fret === 6 ? ' (above the third-finger tape)' : ''}`}`;
  return `${note.name}${note.finger ? ` · finger ${note.finger}` : ''}`;
}

const NOTE_WORDS = Object.freeze({
  different: name => `You played a different note. Look for ${name}. Take your time.`,
  follow: Object.freeze(['Find the notes. Take your time.', 'Press Play this step. The music waits until you play the next note or chord. Timing is not assessed here.']),
  below: 'Or play this note on the instrument below.',
  find: 'Now find the notes →',
});
const DRUM_WORDS = Object.freeze({
  different: name => `That was a different drum. Look for ${name}. Take your time.`,
  follow: Object.freeze(['Find each drum. Take your time.', 'Press Play this step. The music waits until you hit the next drum. Timing is not assessed here.']),
  below: 'Or hit this drum on the kit below.',
  find: 'Now find the drums →',
  glossary: 'The kick is played with your foot and everything else with your hands. Each drum is the letter it starts with; H is the closed hi-hat and O the open one. A beat is the steady count, and tempo is how fast it moves. Use the on-screen kit, your computer keys or MIDI input; the microphone cannot tell one drum from another, so it is not used for the kit.',
});

const BOL_WORDS = Object.freeze({
  different: name => `That was a different stroke. Look for ${name}. Take your time.`,
  follow: Object.freeze(['Find each stroke. Take your time.', 'Press Play this step. The music waits until you play the next bol. Timing is not assessed here.']),
  below: 'Or play this stroke on the tabla below.',
  find: 'Now find the bols →',
  glossary: 'The dayan is the small right-hand drum and the bayan the big left-hand one. A bol is a stroke and its syllable; Dha is Na and Ge together. A taal is a cycle of beats, and its theka the bols that mark it.',
});

/** The words a lesson uses for what is played: a note on most instruments, a drum on the kit, a stroke on the tabla. */
export const lessonWords = instrument => (instrument === 'drums' ? DRUM_WORDS : instrument === 'tabla' ? BOL_WORDS : NOTE_WORDS);
