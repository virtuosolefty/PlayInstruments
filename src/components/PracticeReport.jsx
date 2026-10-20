import { useEffect, useMemo, useRef, useState } from 'react';
import { ReportNote } from './NextTimeNote.jsx';
import Icon from './Icon.jsx';
import { compareToBest } from '../lib/practice/grading.js';
import { cancelSpeech, coachingScript, speak, speechAvailable } from '../lib/audio/speech.js';
import { clipsDuration, comparisonClips, PerformancePlayback, toClips } from '../lib/audio/playback.js';
import { audio } from '../lib/audio/audio.js';
import { reducedMotion } from '../lib/practice/beatPulse.js';
import { useDialog } from '../hooks/useDialog.js';

/**
 * Count a number up on arrival. A score that simply appears is a fact; one that
 * arrives is a result — and this is the emotional peak of a session, so it is
 * worth the eight lines.
 */
function useCountUp(target, ms = 750) {
  const [value, setValue] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const reduced = reducedMotion();
    if (reduced) {
      setValue(target);
      return undefined;
    }
    const start = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / ms);
      // Ease out, so it decelerates into the final number rather than stopping.
      setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, ms]);

  return value;
}

const BAND_LABELS = {
  notes: 'Notes',
  timing: 'Timing',
  dynamics: 'Dynamics',
};

/** The tempo slider's step down, and the slowest it goes (Controls.jsx). */
const RATE_STEP = 0.1;
const SLOWEST_RATE = 0.4;

const BAND_TONE = (v) => (v >= 85 ? 'var(--good)' : v >= 60 ? 'var(--warn)' : 'var(--bad)');

function Stars({ count }) {
  return (
    <div className="stars-row" role="img" aria-label={`${count} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= count ? 'on' : ''} style={{ animationDelay: `${n * 90}ms` }}>
          <Icon name="starFill" size={26} />
        </span>
      ))}
    </div>
  );
}

/**
 * The end-of-run verdict: how it went, which skill let you down, the passages
 * that need work, and the single most useful thing to do next.
 */
export default function PracticeReport({
  result,
  previousSessions = [],
  step,
  onDrill,
  onRepeat,
  onApplyRate,
  onNextSong,
  onClose,
  spokenCoaching = false,
  onSpokenCoachingChange,
  scoreNotes = [],
  onHearPassage,
  next = null,
  note = null,
  notePieceId = null,
  onNoteChange = null,
}) {
  const { grade, summary, passages, title } = result;
  const comparison = compareToBest(grade.overall, previousSessions);
  const shownScore = useCountUp(grade.overall);

  const script = useMemo(() => coachingScript({ grade, summary, step }), [grade, summary, step]);
  const canSpeak = speechAvailable();

  /**
   * Reading the verdict aloud, for the very common case of finishing a run
   * while still looking at your hands. Cleanup rather than a dismiss handler:
   * however the report goes away — closed, drilled, run again — the voice has
   * to stop with it, and only unmount catches all three.
   */
  useEffect(() => {
    if (!spokenCoaching) return undefined;
    speak(script);
    return cancelSpeech;
  }, [spokenCoaching, script]);

  /**
   * Hearing the run back.
   *
   * The thing a teacher does that no number on this screen can: play it to
   * you. A rushed bar and an uneven hand are both obvious in the ear and
   * nearly invisible in a percentage — and the person who has just played
   * something is the worst-placed one to say how it sounded, because they were
   * busy playing it.
   */
  const clips = useMemo(() => toClips(result.performance ?? []), [result.performance]);

  /**
   * The same run with the score underneath it.
   *
   * Solo playback answers "what did I do", which is the less useful half. It
   * cannot say what you should have done, and it degrades exactly where it is
   * needed most: a run you mostly missed plays back as a few disconnected
   * notes with nothing to judge them against. Against the score, a missed note
   * is a bar where only the reference sounds, a wrong one is a clash, and
   * dragging is you arriving behind something steady.
   */
  const together = useMemo(
    () => comparisonClips(result.performance ?? [], scoreNotes),
    [result.performance, scoreNotes],
  );

  /** null, 'you' or 'together' — one playback at a time, one button lit. */
  const [hearing, setHearing] = useState(null);
  const playerRef = useRef(null);
  if (!playerRef.current) playerRef.current = new PerformancePlayback(audio);

  // Whatever closes the report — Close, Run again, a drill — has to silence it.
  useEffect(() => () => playerRef.current?.stop(), []);

  const hear = (which, what) => {
    const player = playerRef.current;
    player.stop();
    if (hearing === which) {
      setHearing(null);
      return;
    }
    // A verdict being read aloud over the playback is two voices at once.
    cancelSpeech();
    setHearing(player.start(what, { onEnd: () => setHearing(null) }) ? which : null);
  };

  const runStep = () => {
    if (!step) return;
    if (step.passage) onDrill(step.passage, step.rate);
    else if (step.kind === 'next') onNextSong();
    else if (step.rate) onApplyRate(step.rate);
    else onRepeat();
  };

  const dialogRef = useDialog({ onClose });
  // One step down the tempo ladder, for a run that got away: never below the slowest the slider goes.
  const slower = Math.max(SLOWEST_RATE, Math.round(((result.rate ?? 1) - RATE_STEP) * 100) / 100);
  const offerSlower = slower < (result.rate ?? 1) - 0.001;

  const ringValue = grade.complete ? shownScore : Math.round(grade.coverage * 100);
  const ringTone = grade.complete ? BAND_TONE(grade.overall) : 'var(--warn)';

  return (
    <div className="report-overlay">
      <div
        className="report rx"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Practice report: ${grade.headline}`}
        tabIndex={-1}
      >
        <header className="rx-head">
          <span className="eyebrow">{title}</span>
          <div className="rx-tools">
            {canSpeak && (
              <button
                className={`rx-icon ${spokenCoaching ? 'on' : ''}`}
                onClick={() => onSpokenCoachingChange?.(!spokenCoaching)}
                aria-pressed={spokenCoaching}
                aria-label="Coach reads results aloud"
                title={spokenCoaching ? 'Stop reading results aloud' : 'Read this and future results aloud'}
              >
                <Icon name="volume" size={16} />
              </button>
            )}
            <button className="rx-icon" onClick={onClose} aria-label="Close report"><Icon name="close" size={16} /></button>
          </div>
        </header>

        <div className="rx-hero">
          <div className="rx-ring" style={{ '--ring': ringValue, '--ring-tone': ringTone }} role="img" aria-label={grade.complete ? `${grade.overall} out of 100` : `${ringValue}% of the piece played`}>
            <svg viewBox="0 0 120 120" aria-hidden="true"><circle className="track" cx="60" cy="60" r="52" /><circle className="value" cx="60" cy="60" r="52" pathLength="100" /></svg>
            <strong>{ringValue}{grade.complete ? '' : '%'}</strong>
            <span>{grade.complete ? 'of 100' : 'played'}</span>
          </div>
          <div className="rx-hero-copy">
            {grade.complete && <span className="report-finished"><Icon name="check" size={13} /> Finished</span>}
            <h2>{grade.headline}</h2>
            {grade.complete && <Stars count={grade.stars} />}
            <p className="blurb">{grade.blurb}</p>
            {grade.complete && (comparison.previousBest === null ? <em className="rx-best">First run: this is your starting point</em>
              : comparison.isBest ? <em className="rx-best record">New best · +{comparison.delta}</em>
              : <em className="rx-best">{comparison.delta} vs your best of {comparison.previousBest}</em>)}
          </div>
        </div>

        {result.mode === 'wait' && grade.complete && (
          <p className="report-note">
            <strong>Finished, without Path stars.</strong> Wait for me stops the clock at
            every chord, so this run was graded on notes and touch alone. It opens the
            next lesson on the Path; play it in Practice, at full speed, for the stars.
          </p>
        )}

        {step && (
          <div className="report-next">
            <div>
              <strong>{step.label}</strong>
              <span>{step.why}</span>
            </div>
            <button className="primary" onClick={runStep}>
              {step.passage ? `Practice ${step.passage.label.toLowerCase()}` : step.kind === 'next' ? 'Open next piece' : step.rate ? `Play at ${Math.round(step.rate * 100)}%` : 'Practise again'}
            </button>
          </div>
        )}

        <div className="rx-bands">
          {Object.entries(grade.bands).map(([key, value], i) => (
            <div className={`rx-band ${value === null ? 'unmeasured' : ''}`} key={key} style={{ '--band-delay': `${140 + i * 130}ms`, '--tone': value === null ? 'var(--line-strong)' : BAND_TONE(value) }}>
              <span className="rx-band-label">{BAND_LABELS[key]}</span>
              <strong>{value === null ? '—' : value}</strong>
              <div className="meter"><i style={{ width: `${value ?? 0}%` }} /></div>
              <span className="band-sub">{value === null ? unmeasured(key, result.mode) : bandSub(key, summary)}</span>
            </div>
          ))}
        </div>

        <div className="report-section">
          <h3>What to work on</h3>
          {passages.length === 0 ? (
            <p className="empty">Nothing recurring. That run was clean.</p>
          ) : (
            <div className="passage-list">
              {passages.map((p) => (
                <div className="passage-row" key={`${p.fromBar}-${p.toBar}`}>
                  <button className="passage" onClick={() => onDrill(p, null)} title="Loop this passage">
                    <span className="where">{p.label}</span>
                    <span className="what">{p.detail}</span>
                    <span className="go">Drill <Icon name="arrowRight" size={12} /></span>
                  </button>
                  {onHearPassage && (
                    <button className="hear-bit" onClick={() => onHearPassage(p)} title="Hear this passage played to you" aria-label={`Hear ${p.label}`}>
                      <Icon name="headphones" size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {onNoteChange && <ReportNote pieceId={notePieceId} note={note} onChange={onNoteChange} />}

        <footer className="rx-actions">
          {(clips.length > 0 || together.length > 0) && (
            <div className="rx-listen" role="group" aria-label="Listen back">
              <span>Listen back</span>
              {clips.length > 0 && (
                <button className={`hear-yourself ${hearing === 'you' ? 'on' : ''}`} onClick={() => hear('you', clips)} title={`Play back the ${clips.length} notes you played, at the volume you played them`}>
                  <Icon name={hearing === 'you' ? 'stop' : 'play'} size={13} />You <span className="hear-len">{clipsDuration(clips).toFixed(0)}s</span>
                </button>
              )}
              {together.length > 0 && (
                <button className={`hear-yourself ${hearing === 'together' ? 'on' : ''}`} onClick={() => hear('together', together)} title={clips.length > 0 ? 'Play your run with the score underneath it' : 'Play the piece as written'}>
                  <Icon name={hearing === 'together' ? 'stop' : 'play'} size={13} />{clips.length > 0 ? 'You + score' : 'The score'} <span className="hear-len">{clipsDuration(together).toFixed(0)}s</span>
                </button>
              )}
            </div>
          )}
          <div className="rx-go">
            {offerSlower && <button onClick={() => onApplyRate(slower)} title="Play it again, one step slower">Slower · {Math.round(slower * 100)}%</button>}
            {next && <button onClick={next.go}>{next.label} <Icon name="arrowRight" size={13} /></button>}
            <button onClick={onRepeat}><Icon name="restart" size={14} />Run again</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

/**
 * Why a band has no number.
 *
 * There are two reasons and they used to share one sentence, so a wait-mode run
 * blamed its blank timing on "too few notes played" after a full clean pass —
 * telling the player their playing was the problem when the mode was.
 */
function unmeasured(key, mode) {
  if (key === 'timing' && mode === 'wait') return 'Wait for me stops the clock, so it is never measured';
  return 'too few notes played to measure';
}

function bandSub(key, summary) {
  if (key === 'notes') {
    return `${summary.hit} of ${summary.total} · ${summary.wrongNotes} extra`;
  }
  if (key === 'timing') {
    return `± ${summary.meanAbsDeviationMs} ms average`;
  }
  const spread = Math.round((summary.velocitySpread ?? 0) * 127);
  return `±${spread} spread · ${summary.tooLoud ?? 0} hard, ${summary.tooSoft ?? 0} soft`;
}
