import Icon from './Icon.jsx';
import { useEffect, useRef, useState } from 'react';
import { LESSON_STEPS, lessonCanVisit, lessonWords, noteInstruction, lessonPurpose, beginnerFoundation } from '../lib/learning/learning.js';
import { useStringInput } from '../hooks/useGuitarInput.js';
import { playInput } from '../lib/input/playInput.js';
import { isStringed, stringKit } from '../lib/instruments.js';
import NextNoteCard, { ComputerKey } from './NextNoteCard.jsx';
import TermText from './TermText.jsx';
import { cueLines } from '../lib/learning/glossary.js';

const QUICK_STEPS = [{ id: 'note', label: 'Make a sound' }, { id: 'follow', label: 'Play a phrase' }, { id: 'done', label: 'Your next step' }];
/** The steps a lesson walks through: all six, or three for the quick introduction. */
const lessonSteps = record => (record.quick ? QUICK_STEPS : LESSON_STEPS);

/** What a step asks, as a title and one sentence. */
function stepCopy(step, instrument) {
  const kit = stringKit(instrument), fretted = !!kit?.fretted;
  return {
    sound: ['Let’s make a sound.', 'Play a test note, then confirm you can hear it. This checks the selected sound output.'],
    note: ['Your first note.', instrument === 'drums' ? 'Hit the drum with the blue ring. Tap it on the kit, tap its pad, or press its letter.' : instrument === 'tabla' ? 'Play the stroke with the blue ring. Tap it on the tabla, tap its pad, or press its letter.' : instrument === 'handpan' ? 'Strike the note with the blue ring. Tap it on the handpan, tap its pad, or press its key.' : fretted ? 'Pluck the highlighted string. An open string needs no finger on a fret.' : kit?.bowed ? 'Bow the highlighted string. Press and hold near the bridge for an open string.' : 'Find this note on the keyboard. You can click a key, use your computer keys, or play a MIDI controller.'],
    listen: ['Hear the shape of it.', 'Press Listen to the phrase above. Watch where the notes land; you don’t need to play yet.'],
    follow: lessonWords(instrument).follow,
    practice: ['Give the phrase a rhythm.', 'Play at a comfortable speed. After the phrase, choose whether to repeat or raise the tempo a little.'],
    check: ['See what you’ve learned.', 'Play the full phrase in time at 100% speed. Three stars passes the check and four masters the lesson. The next lesson is open either way.'],
  }[step] ?? ['Your next step.', ''];
}

/**
 * The buttons a step offers: sending the test note, moving on, a check, the next lesson. One component so the stage
 * card (wide screens) and the guide (narrow screens) offer exactly the same, and never both at once.
 */
function StepActions({ learning, engine, score, onSetup, path, instrument }) {
  const { record, outcome } = learning;
  const words = lessonWords(instrument);
  const passed = ['passed', 'mastered'].includes(outcome?.kind);
  const finished = !!path.state.exercises[score?.id]?.finished;
  const next = learning.recommendedId;
  // Offered beside the lesson's own next step, never in place of it: the quick introduction and today's practice have their own way on.
  const canMoveOn = finished && !passed && !!next && next !== score?.id && !engine.playing && !record.quick && !(record.daily && !record.daily.complete)
    && (record.step === 'follow' ? record.followed : ['practice', 'check'].includes(record.step));
  return <>
    {!learning.ready && <div role={learning.error ? 'alert' : 'status'} className="lesson-load-state"><strong>{learning.error || 'Preparing your lesson…'}</strong>{learning.error && <><button onClick={learning.retry}>Retry lesson</button><button onClick={onSetup}>Check sound setup</button></>}</div>}
    {learning.ready && record.step === 'sound' && <div className="lesson-actions"><button className="primary" disabled={learning.testing} onClick={learning.sendTest}>{learning.testing ? 'Sending test note…' : 'Play a test note'}</button>{learning.testSent && <><p role="status">Test note sent. Did you hear it?</p><button className="primary" onClick={learning.confirmSound}>I heard it</button></>}<button onClick={onSetup}>No sound? Check setup</button></div>}
    {record.step === 'listen' && record.listened && <div className="lesson-actions"><p className="lesson-success"><Icon name="check" size={14} /> Demonstration completed</p><button className="primary" onClick={() => learning.goStep('follow')}>{words.find}</button></div>}
    {record.step === 'follow' && record.followed && <div className="lesson-actions">{record.quick&&<p className="lesson-success">You played a whole phrase. Your next step is to give it a rhythm.</p>}<button className="primary" onClick={() => record.quick?learning.finishQuick():record.daily && !record.daily.complete ? learning.finishDailyItem() : learning.goStep('practice')}>{record.quick?'Find my next step →':record.daily && !record.daily.complete ? 'Continue today’s practice →' : 'Next: add a rhythm →'}</button>{record.daily && <button onClick={()=>learning.goStep('practice')}>Spend more time on this phrase</button>}</div>}
    {record.step === 'practice' && record.practised && !engine.playing && <div className="lesson-actions">{record.rate < 1 && <button onClick={()=>learning.changeRate(learning.nextRate)}>Try {Math.round(learning.nextRate*100)}% next</button>}<button className="primary" onClick={()=>learning.goStep('check')}>Ready for a check at 100% →</button></div>}
    {record.step === 'check' && outcome && !engine.playing && <div className="lesson-actions">{passed ? <button className="primary" onClick={next && next !== score.id ? ()=>learning.startLesson(next) : learning.openHome}>{next && next !== score.id ? 'Continue to the next lesson →' : 'See your learning path →'}</button> : <button className="primary" onClick={()=>learning.goStep('practice')}>Practise at a slower tempo</button>}</div>}
    {outcome&&!passed&&record.step==='check'&&<button className="lesson-easier" onClick={()=>learning.goStep('follow')}>Take your time with the notes again</button>}
    {canMoveOn&&<button className="lesson-easier lesson-move-on" onClick={()=>learning.startLesson(next)}>Move on to the next lesson →</button>}
  </>;
}

/**
 * On a wide screen, what the step asks sits on the stage, by the instrument, as a museum puts each exhibit's one
 * sentence and its controls beside the exhibit: the step's number, title, one sentence and its buttons. While a
 * run plays it folds to its title, so it never covers notes being played.
 */
export function LessonStepCard({ learning, engine, score, instrument = 'piano', onSetup, path }) {
  const { record } = learning;
  const steps = lessonSteps(record);
  const index = Math.max(0, steps.findIndex(step => step.id === record.step));
  const [title, line] = stepCopy(record.step, instrument);
  const heading = useRef(null);
  useEffect(() => { if (learning.ready) heading.current?.focus({ preventScroll: true }); }, [record.step, learning.ready]);
  return <div className="step-card-anchor">
    <section className={`step-card ${engine.playing ? 'playing' : ''}`} aria-label="This step">
      <span className="step-count">STEP {index + 1} OF {steps.length}</span>
      <h2 ref={heading} tabIndex={-1}>{title}</h2>
      {!engine.playing && <>{line && <TermText className="step-line" text={line} instrument={instrument} />}<StepActions learning={learning} engine={engine} score={score} onSetup={onSetup} path={path} instrument={instrument} /></>}
    </section>
  </div>;
}

export function LessonBar({ learning, engine, onShowGuide }) {
  const { record, ready } = learning;
  const [stepsOpen, setStepsOpen] = useState(false);
  const playable = !['sound','note'].includes(record.step);
  const steps = lessonSteps(record);
  return <section className={`lesson-bar ${stepsOpen ? 'steps-expanded' : ''}`} aria-label="Lesson steps">
    {onShowGuide && <button className="lesson-steps-toggle" aria-expanded={stepsOpen} onClick={() => setStepsOpen(open => !open)}>Lesson steps</button>}
    <ol>{steps.map((step,index) => <li key={step.id}><button aria-current={record.step === step.id ? 'step' : undefined} disabled={!ready || (step.id==='done'?!record.followed:!lessonCanVisit(step.id, record))} onClick={() => step.id==='done'?learning.finishQuick():learning.goStep(step.id)}><span>{String(index+1).padStart(2,'0')}</span>{step.label}</button></li>)}</ol>
    {onShowGuide && <button className="lesson-guide-toggle" onClick={onShowGuide}>Open lesson guide</button>}
    <div className="lesson-transport"><button className={playable ? 'primary' : ''} disabled={!ready || !playable || learning.starting} onClick={() => learning.togglePlay()}>{learning.starting ? 'Preparing sound…' : engine.playing ? 'Pause lesson' : record.step === 'listen' ? 'Listen to the phrase' : record.step === 'check' ? 'Start mastery check' : playable ? 'Play this step' : 'Follow the guide →'}</button><button disabled={!ready || !playable || learning.starting} onClick={() => learning.togglePlay(true)}>Restart step</button><span>{engine.playing ? 'In progress' : 'Ready at your pace'} · {record.step === 'listen' || record.step === 'check' ? 100 : Math.round(record.rate*100)}% speed</span><button className="lesson-save" onClick={learning.openHome}>Save & leave</button></div>
  </section>;
}

/** Keeps the next action beside the instrument; explanations open in the existing guide. */
export function LessonDock({ learning, engine, score, instrument, onShowGuide }) {
  const { record, outcome } = learning;
  const kit = stringKit(instrument), first = score?.notes[0];
  const next = engine.sessionRef.current?.currentGate?.notes?.find(n => n.status === 'pending') ?? first;
  const timer = useRef(null);
  useEffect(() => () => { clearTimeout(timer.current); playInput.release('lesson-dock-note'); }, []);
  const playFirst = () => {
    if (!first) return;
    playInput.press('lesson-dock-note', first.midi, .72, isStringed(instrument) ? { source: `${instrument}-screen`, string: first.string, fret: first.fret } : {});
    clearTimeout(timer.current);
    timer.current = setTimeout(() => playInput.release('lesson-dock-note'), kit?.bowed ? 900 : 400);
  };
  const label = record.step === 'sound' ? 'Check your sound' : record.step === 'note' ? noteInstruction(first, instrument)
    : record.step === 'follow' && !record.followed ? noteInstruction(next, instrument)
    : outcome?.title ?? ({ listen: 'Hear the phrase, then find its notes', practice: 'Play at a comfortable speed', check: 'Try the phrase at the written tempo' })[record.step];
  return <section className="lesson-dock" aria-label="Your next lesson action">
    <div className="lesson-dock-heading"><strong>{learning.ready ? label : learning.error ?? 'Preparing your lesson...'}</strong><button onClick={onShowGuide}>Guide</button></div>
    <div className="lesson-dock-actions">
      {learning.ready && record.step === 'sound' && <>{!learning.testSent ? <button className="primary" disabled={learning.testing} onClick={learning.sendTest}>Play a test note</button> : <button className="primary" onClick={learning.confirmSound}>I heard it</button>}</>}
      {learning.ready && record.step === 'note' && <button className="primary" onClick={playFirst}>Play {first?.name} on screen</button>}
      {record.step === 'listen' && record.listened && <button className="primary" onClick={() => learning.goStep('follow')}>Find the notes</button>}
      {record.step === 'follow' && record.followed && <button className="primary" onClick={() => record.quick ? learning.finishQuick() : record.daily && !record.daily.complete ? learning.finishDailyItem() : learning.goStep('practice')}>{record.quick ? 'Find my next step' : record.daily && !record.daily.complete ? 'Continue today\u2019s practice' : 'Next: add a rhythm'}</button>}
      {record.step === 'practice' && record.practised && !engine.playing && <button onClick={() => learning.goStep('check')}>Check at 100%</button>}
      {record.step === 'check' && outcome && !engine.playing && <button onClick={() => learning.recommendedId !== score.id ? learning.startLesson(learning.recommendedId) : learning.openHome()}>Continue learning</button>}
    </div>
  </section>;
}

/** The chord a strummed lesson is on: its frets string by string, and a button to hear each chord of the lesson. */
function LessonChords({ kit, score, engine, step }) {
  const names = [...new Set(score.notes.map(n => n.chord).filter(Boolean))];
  const { pluck, silence } = useStringInput(kit.id);
  useEffect(() => { silence(); }, [step, engine.playing, silence]);
  if (!names.length) return null;
  const next = (engine.sessionRef.current?.currentGate?.notes ?? score.notes.filter(n => n.time >= engine.songTime - .15)).find(n => n.chord);
  const current = kit.chords.find(c => c.name === (next?.chord ?? names[0]));
  const count = kit.tuning.length, letter = s => kit.stringName(s).note;
  // The guitar's two E strings are told apart the way chord charts do it: the high one in lower case.
  const short = s => (s === count - 1 && letter(s) === letter(0) ? letter(s).toLowerCase() : letter(s));
  return <div className="lesson-chords"><span className="eyebrow">{next ? 'NEXT CHORD' : 'CHORD SHAPE'} · {current.name}</span><div className="lesson-chord-fingers" aria-label={`${current.name} chord frets, string ${count} (${letter(0)}) to string 1 (${letter(count - 1)})`}>{current.frets.map((fret,i) => <span key={i}><small>{short(i)}</small><b>{fret ?? '×'}</b></span>)}</div><p>0 = open · × = skip this string. Fingers: 1 index, 2 middle, 3 ring.</p><div>{names.map(name => <button key={name} onClick={() => { const chord=kit.chords.find(c=>c.name===name); silence(); pluck(chord.frets.flatMap((fret,string)=>fret===null?[]:[{string,fret}]),{spread:24,strength:.72}); }}>Strum {name}</button>)}</div></div>;
}

/**
 * The lesson guide in the side panel. With `stageCard` (wide screens) the step itself is on the stage, so the guide
 * says what the lesson is for, in its own short cues, and how it should feel; on a narrow screen it carries the step
 * as well.
 */
export default function LessonGuide({ learning, engine, score, instrument = 'piano', onSetup, path, typingOctave = 0, stageCard = false }) {
  const kit = stringKit(instrument);
  const fretted = !!kit?.fretted;
  const words = lessonWords(instrument);
  const { record, outcome } = learning;
  const purpose = lessonPurpose(learning.lesson, path.state.stages, learning.entries);
  const heading = useRef(null);
  useEffect(() => {
    if (!learning.ready || stageCard) return;
    heading.current?.focus({ preventScroll: true });
    const pane = heading.current?.closest('.pane.right');
    if (pane) pane.scrollTop = 0;
  }, [record.step, learning.ready, stageCard]);
  const firstNoteTimer = useRef(null);
  useEffect(() => () => { clearTimeout(firstNoteTimer.current); playInput.release('lesson-first-note'); }, []);
  const first = score?.notes[0];
  const target = engine.sessionRef.current?.currentGate?.notes?.filter(n => n.status === 'pending')?.[0];
  const result = engine.lastResult;
  const entry = path.state.exercises[score?.id];
  const finished = !!entry?.finished;
  const copy = stepCopy(record.step, instrument);
  const tips = beginnerFoundation(instrument);
  const cues = cueLines(learning.lesson?.description ?? score?.description);
  return <section className="lesson-guide" aria-label="Lesson coach">
    <span className="eyebrow">{record.daily && !record.daily.complete ? `TODAY’S PRACTICE · ${record.daily.index+1} OF ${record.daily.ids.length}` : 'YOUR LESSON GUIDE'}</span>
    {stageCard ? <>
      <h2 className="lesson-point">{purpose.goal}</h2>
      {cues.length > 0 && <ul className="lesson-cues">{cues.map(cue => <TermText key={cue} as="li" text={cue} instrument={instrument} />)}</ul>}
      <p className="lesson-feel">{tips[0]}</p>
      <details className="lesson-purpose"><summary>Why this lesson, and how to sit</summary><p>{purpose.why}</p><ul>{tips.slice(1).map(tip => <li key={tip}>{tip}</li>)}</ul></details>
    </> : <>
      <details className="lesson-purpose"><summary>{purpose.goal}</summary><p>{purpose.why}</p><strong>Before you play a real instrument</strong><ul>{tips.map(tip => <li key={tip}>{tip}</li>)}</ul></details>
      <h2 ref={heading} tabIndex={-1}>{copy[0]}</h2><TermText className="lesson-instruction" text={copy[1]} instrument={instrument} />
      <StepActions learning={learning} engine={engine} score={score} onSetup={onSetup} path={path} instrument={instrument} />
    </>}
    {learning.ready && record.step === 'note' && <div className="first-note-target"><span>LOOK FOR</span><strong>{noteInstruction(first,instrument)}</strong><ComputerKey midi={first?.midi} instrument={instrument} typingOctave={typingOctave}/><button onClick={() => {playInput.press('lesson-first-note',first.midi,.72,isStringed(instrument)?{source:`${instrument}-screen`,string:first.string,fret:first.fret}:{});clearTimeout(firstNoteTimer.current);firstNoteTimer.current=setTimeout(()=>playInput.release('lesson-first-note'),kit?.bowed?900:400);}}>Play {first.name} on screen</button><small>{words.below}</small>{record.quick&&<button onClick={onSetup}>No sound? Check setup</button>}</div>}
    {score?.handChanges?.length > 0 && <details className="lesson-purpose"><summary>Where your hand moves</summary><ul>{score.handChanges.map(change => <li key={change.index}>{change.text}</li>)}</ul></details>}
    {learning.noteHint && <p className="lesson-note-feedback" role="status">{learning.noteHint}</p>}
    {record.step === 'follow' && !record.followed && <NextNoteCard note={target ?? first} instrument={instrument} found={engine.summary?.hit ?? 0} total={score?.noteCount ?? 0} typingOctave={typingOctave}/>}
    {['follow','practice','check'].includes(record.step) && fretted && score && <LessonChords kit={kit} score={score} engine={engine} step={record.step}/>}
    {record.step === 'practice' && <div className="lesson-tempo"><label htmlFor="lesson-speed">Comfortable tempo <b>{Math.round(record.rate*100)}%</b></label><input id="lesson-speed" aria-label="Lesson practice speed" type="range" min=".4" max="1" step=".05" value={record.rate} disabled={engine.playing} onChange={e=>learning.changeRate(+e.target.value)}/><small>Tempo means speed. Adjust it between attempts.</small></div>}
    {outcome && <div className="lesson-result" role="status"><span className="eyebrow">YOUR LAST ATTEMPT</span><h3>{outcome.title}</h3><p>{outcome.message}</p>{outcome.strength && <p>{outcome.strength}</p>}{outcome.nextAction && <p><strong>Next:</strong> {outcome.nextAction}</p>}<details><summary>See the numbers</summary><p>{result.summary.hit} notes hit · {result.summary.missed} missed · {result.summary.wrongNotes} extra notes</p><p>{result.grade.complete ? `${result.grade.stars} / 5 stars` : 'Partial attempt'} · {Math.round(result.rate*100)}% speed</p></details></div>}
    {!record.quick&&<details className="lesson-requirement"><summary>{entry?.passed || finished ? <Icon name="check" size={13} /> : null}{entry?.passed ? 'Check passed · how mastery works' : finished ? 'Lesson finished · how the stars work' : 'How lessons open and stars are earned'}</summary><p>Play this lesson through once, at any speed or with the notes waiting for you, and the next lesson opens. Stars say how well you know it: 3 at 100% speed passes the check and 4 masters it.</p></details>}
  </section>;
}
