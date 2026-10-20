import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import TopBar from './components/TopBar.jsx';
import Icon from './components/Icon.jsx';
import ShortcutLegend from './components/ShortcutLegend.jsx';
import BarInspector from './components/BarInspector.jsx';
import UndoToast from './components/UndoToast.jsx';
import { barAt } from './lib/music/passages.js';
import { barCount } from './lib/practice/barInspect.js';
import StageViews, { StageAppearance } from './components/StageViews.jsx';
import LiveHud from './components/LiveHud.jsx';
import FreePlayBar from './components/FreePlayBar.jsx';
import SetupDialog from './components/SetupDialog.jsx';
import TunerDialog from './components/TunerDialog.jsx';
import StudioLibrary from './components/StudioLibrary.jsx';
import StudioHeader, { InstrumentSettings, stageCaption } from './components/StudioHeader.jsx';
import GuitarWorkspace from './components/GuitarWorkspace.jsx';
import BowedWorkspace from './components/BowedWorkspace.jsx';
import DrumWorkspace from './components/DrumWorkspace.jsx';
import { chooseVariant, familyOf, INSTRUMENTS, instrumentForStudy, instrumentInfo, instrumentKit, normalizeInstrument, studyIdFor, usesKit } from './lib/instruments.js';
import Controls from './components/Controls.jsx';
import PianoRoll from './components/PianoRoll.jsx';
import Minimap from './components/Minimap.jsx';
const StaffView = lazy(() => import('./components/StaffView.jsx'));
const RollGL = lazy(() => import('./components/RollGL.jsx'));
const PianoWholeView = lazy(() => import('./components/PianoWholeView.jsx'));
import FeedbackPanel from './components/FeedbackPanel.jsx';
import PiecePanel from './components/PiecePanel.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import SongLibrary from './components/SongLibrary.jsx';
import PathTab from './components/PathTab.jsx';
import ProgressTab from './components/ProgressTab.jsx';
import KeyboardPanel from './components/KeyboardPanel.jsx';
import { MODES, usePracticeEngine } from './hooks/usePracticeEngine.js';
import { loadScoreFromFile, loadScoreFromUrl } from './lib/music/score.js';
import PracticeReport from './components/PracticeReport.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Drawer from './components/Drawer.jsx';
import CalibratorDialogs from './components/CalibratorDialogs.jsx';
import AppModals from './components/AppModals.jsx';
import { useComputerKeyboard } from './hooks/useComputerKeyboard.js';
import { useImports } from './hooks/useImports.js';
import { usePassages } from './hooks/usePassages.js';
import { useKeyboardSetup } from './hooks/useKeyboardSetup.js';
import { usePathData } from './hooks/usePathData.js';
import { useAppData } from './hooks/useAppData.js';
import { useMicNotes, useMicStatus } from './hooks/useMicInput.js';
import { MIC_STATUS } from './lib/input/micInput.js';
import { NARROW_QUERY, PHONE_QUERY, SHORT_LANDSCAPE_QUERY, useMediaQuery } from './hooks/useMediaQuery.js';
import { useRoute } from './hooks/useRoute.js';
import { INSTRUMENT_MODES, midiOutput } from './lib/input/midiOutput.js';
import { arrangeScore, assessFit, FIT_MODES, FULL_VARIANT, HAND_FILTERS } from './lib/music/arrange.js';
import { AUTO_PROFILE } from './lib/input/devices.js';
import { emitSyntheticMidi, midiInput, MIDI_STATUS } from './lib/input/midiInput.js';
import { DRILL_RATE, nextStep, suggestNext } from './lib/practice/coaching.js';
import { drillFrom } from './lib/practice/drills.js';
import { webglAvailable } from './lib/stage/webgl.js';
import { pageTitle } from './lib/app/pageTitle.js';
import { audio } from './lib/audio/audio.js';
import { playInput } from './lib/input/playInput.js';
import { pianoViewRange, visibleFrets } from './lib/strings/instrumentView.js';
import { displayRangeFor } from './lib/piano/keyboard.js';
import InstrumentControls from './components/InstrumentControls.jsx';
import LearningHome, { LearningSummary } from './components/LearningHome.jsx';
import LessonGuide, { LessonBar, LessonDock, LessonStepCard } from './components/LessonGuide.jsx';
import { useLearningFlow } from './hooks/useLearningFlow.js';
import { useScorePreview } from './hooks/useScorePreview.js';
import { FIRST_LESSON } from './lib/learning/discovery.js';
import { loadSettings } from './lib/app/storage.js';
import { DEFAULT_SETTINGS, migrateSettings } from './lib/app/settings.js';
import { appearanceFor, applyAppearance } from './lib/app/appearance.js';
import { useCommandPalette } from './hooks/useCommandPalette.js';
import { useAwake } from './hooks/useAwake.js';
import { useScreenTransition } from './hooks/useScreenTransition.js';
import { withNote, withoutNote } from './lib/practice/pieceNotes.js';
import { soundFor, techniqueFor } from './lib/audio/technique.js';
import { useShownModel } from './lib/stage/shownModel.js';
import { droneFor, droneLevel } from './lib/audio/drone.js';
import { struckSetFor } from './lib/struck/struckSets.js';
import CommandPalette from './components/CommandPalette.jsx';
import CoachTour from './components/CoachTour.jsx';

/** How long a cleared history can be brought back before it is deleted. */
const UNDO_SECONDS = 10;
/** The piano keys' height on a short landscape screen. */
const SHORT_KEYBOARD_HEIGHT = 72;

/**
 * The count-in as beat lamps.
 *
 * `beatsLeft` counts down across the whole count-in, which may be more than one
 * bar; the lamps show position within the bar, because that is what your hands
 * are counting. Lamps behind the beat stay lit so the row fills rather than
 * chases.
 */
function BeatPads({ countIn }) {
  const { beatsLeft, beatsPerBar } = countIn;
  const current = beatsPerBar - 1 - ((beatsLeft - 1) % beatsPerBar);
  return (
    <div className="beat-pads" aria-hidden="true">
      {Array.from({ length: beatsPerBar }, (_, i) => (
        <i key={i} className={i === current ? 'now' : i < current ? 'past' : ''} />
      ))}
    </div>
  );
}

export default function App({ startupSettings = {} }) {
  // Centralized app state (replaces 7 scattered useState calls)
  const appData = useAppData(startupSettings);
  const { settings, setSettings: storeSettings, days, refreshVersion, storageFailure } = appData;
  // A change of screen cross-fades (View Transitions); every other update goes straight through.
  const setSettings = useScreenTransition(storeSettings, settings);
  const instrument = normalizeInstrument(settings.practiceInstrument);
  // Every instrument but the piano brings a kit: its own studies, path and workspace.
  const kitted = usesKit(instrument);
  const kit = instrumentKit(instrument);
  const guitar = instrument === 'guitar';
  // Guitar and bass share one studio; violin and cello another.
  const fretted = !!kit?.fretted;
  // A struck instrument (struck.js): the drums, the tabla, the handpan, all played in DrumWorkspace.
  const struck = struckSetFor(instrument);
  const drums = !!struck;
  const studyId = studyIdFor(settings, instrument);
  const look = appearanceFor(settings);
  const theme = look.theme;
  // Theme, dark accent, true black and text size are attributes on <html> that tokens.css keys on.
  useLayoutEffect(() => { applyAppearance(document.documentElement, look); }, [look.theme, look.accent, look.black, look.text]);
  const [freePlay, setFreePlay] = useState(!!settings.entryFreePlay);
  useEffect(()=>{if(settings.entryFreePlay)setSettings(s=>({...s,entryFreePlay:false}));},[]);
  const [focus, setFocus] = useState(false);
  const [chordInspector, setChordInspector] = useState(null);
  const [sustain, setSustain] = useState(false);
  useEffect(() => midiInput.onMessage(msg => { if (msg.type === 'sustain') { setSustain(msg.value); playInput.sustained = msg.value; } }), []);
  const [setupOpen, setSetupOpen] = useState(false);
  const [tunerOpen, setTunerOpen] = useState(false);
  // A real instrument, heard through the microphone, plays as a controller would. A drum kit has no one pitch to hear.
  const micChosen = settings.inputMethod === 'mic' && !(struck && !struck.pitched);
  // Chosen on an earlier visit, the microphone still waits for a click or a key press on this one:
  // a page does not start listening because it was opened.
  const [gestured, setGestured] = useState(false);
  useEffect(() => {
    const seen = () => setGestured(true);
    const opts = { capture: true, once: true };
    window.addEventListener('pointerdown', seen, opts);
    window.addEventListener('keydown', seen, opts);
    return () => { window.removeEventListener('pointerdown', seen, opts); window.removeEventListener('keydown', seen, opts); };
  }, []);
  // While the tuner is open the notes it hears are for tuning, not for the lesson.
  useMicNotes(micChosen && gestured, kit?.tuning ? kit : null, tunerOpen);
  const mic = useMicStatus();
  const micListening = mic.status === MIC_STATUS.ON;
  const [requestedTab, setRequestedTab] = useState(null);
  const [libraryInstrument, setLibraryInstrument] = useState(settings.practiceInstrument ?? 'piano');
  // A bowed instrument plucked with the fingers is its own voice (technique.js).
  const technique = techniqueFor(settings, instrument);
  // What is heard is what is seen: a model the whole-instrument view shows in the instrument's place has its own voice.
  const shownModel = useShownModel();
  useEffect(() => { const { voice, transpose } = soundFor(instrument, technique, shownModel); audio.setInstrumentType(voice, { transpose }); }, [instrument, technique, shownModel]);
  // The drone sounds while you practise an instrument that has one (drone.js), and stops on the learning home.
  const practising = settings.learningView !== 'home';
  const drone = settings.drone && practising ? droneFor(instrument) : null;
  const droneDb = droneLevel(settings);
  useEffect(() => { audio.setDrone(drone, droneDb); }, [drone, droneDb]);

  // UI state (not data-related, stays local)
  const [library, setLibrary] = useState([]);
  const [rawScore, setRawScore] = useState(null);
  const scoreLoadToken = useRef(0);
  const [midiState, setMidiState] = useState({
    status: MIDI_STATUS.IDLE,
    inputs: [],
    selectedId: null,
    error: null,
  });
  const [outputState, setOutputState] = useState({ outputs: [], selectedId: null });
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const feedbackOpenRef = useRef(false);
  feedbackOpenRef.current = feedbackOpen;
  // Escape backs out of whatever is layered over the stage, one layer at a
  // time: the This run panel first, then focus mode. The library drawer and the
  // dialogs already handle their own Escape.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (document.querySelector('[role="dialog"]:not([hidden])')) return;
      if (feedbackOpenRef.current) setFeedbackOpen(false);
      else setFocus(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  const [calibrating, setCalibrating] = useState(false);
  const [calibratingTouch, setCalibratingTouch] = useState(false);
  const [error, setError] = useState(null);
  const storageProblem = !!storageFailure;
  // A microphone that stops while it is how notes are played in must not pass in silence.
  useEffect(() => {
    if (!micChosen || tunerOpen) return;
    if (mic.status === MIC_STATUS.ERROR) setError(`${mic.error} Notes from your instrument are not being heard. Open Input & sound to turn the microphone back on.`);
    else if (mic.status === MIC_STATUS.DENIED) setError('Microphone access is blocked, so notes from your instrument are not being heard. Allow it for this site in your browser’s address bar, then open Input & sound.');
    else if (mic.status === MIC_STATUS.UNSUPPORTED) setError('This browser cannot use a microphone here. Open Input & sound to choose another way to play.');
  }, [micChosen, tunerOpen, mic.status, mic.error]);
  useEffect(() => { playInput.error = e => setError(`Could not play this note: ${e.message}`); return () => { playInput.clear(); playInput.error = () => {}; }; }, []);
  useEffect(() => { playInput.clear(); }, [instrument, freePlay, settings.renderer, settings.pianoRange, settings.typingOctave]);

  const acceptImportedScore = useCallback(loaded => {
    setRawScore(loaded);
    setSettings(s => ({ ...s, practiceInstrument: 'piano', learningView: 'studio', loop: null }));
  }, [setSettings]);

  const { localScores, loadFile: handleLoadFile, loadSamples: handleLoadSamples } = useImports({
    onError: setError,
    onScoreLoaded: acceptImportedScore,
  });

  /* --------------------------------------------------- storage went wrong */
  useEffect(() => {
    if(!storageFailure)return;
    setError(storageFailure.quota
      ? 'Your browser storage is full, so recent changes could not be saved. Export your saved history from Progress before clearing site data.'
      : 'Your browser is refusing to save changes. This session may not be available after you leave.');
  }, [storageFailure]);

  /**
   * A restore replaces the whole database, so reload settings.
   * appData hook handles day ledger and history refresh automatically via refreshVersion.
   */
  const refreshAfterRestore = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS, ...migrateSettings(loadSettings()), loop: null, startIntent: null, entryFreePlay: false });
    setFreePlay(false);
  }, [setSettings]);

  /* -------------------------------------------------------- bundled library */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}songs/songs.json`);
        if (!res.ok) throw new Error(`songs.json returned ${res.status}`);
        const manifest = await res.json();
        if (cancelled) return;
        setLibrary(manifest.map(entry => ({
          ...entry,
          url: entry.url.startsWith('/songs/')
            ? `${import.meta.env.BASE_URL}songs/${entry.url.slice('/songs/'.length)}`
            : entry.url,
        })));
      } catch (err) {
        setError(
          `Could not load the bundled song library (${err.message}). Reload the page or try again later.`,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------------------------------------- Web MIDI */
  useEffect(() => {
    const off = midiInput.onDevicesChanged(setMidiState);
    // The same MIDIAccess carries the output ports, which is how note duty gets
    // handed to a plugin like Mini Grand.
    const offAccess = midiInput.onAccess((access) => midiOutput.attach(access));
    const offOut = midiOutput.onChange(setOutputState);
    // Try silently on load; browsers that need a gesture will just report idle.
    midiInput.connect();
    return () => {
      off();
      offAccess();
      offOut();
    };
  }, []);

  // A controller plugged in while the app is open is announced: it plays at once, and Input & sound can check it.
  // The ones already there when the page loads are not news.
  const [found, setFound] = useState(null);
  const knownInputs = useRef(null);
  useEffect(() => {
    if (midiState.status !== MIDI_STATUS.READY) return;
    const before = knownInputs.current;
    knownInputs.current = new Set(midiState.inputs.map(input => input.id));
    const fresh = before && midiState.inputs.find(input => !before.has(input.id));
    if (fresh) setFound(fresh);
    else if (found && !knownInputs.current.has(found.id)) setFound(null);
  }, [midiState]);
  useEffect(() => {
    if (!found) return undefined;
    const id = setTimeout(() => setFound(null), 12000);
    return () => clearTimeout(id);
  }, [found]);

  // Honour a remembered output port once the ports actually exist.
  useEffect(() => {
    if (settings.midiOutputId && outputState.outputs.some((o) => o.id === settings.midiOutputId)) {
      midiOutput.select(settings.midiOutputId);
    }
  }, [settings.midiOutputId, outputState.outputs]);

  /* ------------------------------------------------------ keyboard geometry */
  /** Set once the engine exists — see the note in useKeyboardSetup. */
  const playingRef = useRef(false);
  const {
    deviceName, autoDetected, profile, keyWindow, setKeyboardLow, shiftOctave, resetOctave,
  } = useKeyboardSetup(midiState, settings.keyboardId, playingRef);

  /* ------------------------------------------------- the score you practise */
  const score = useMemo(
    () =>
      kitted ? kit.studies.find(s => s.id === studyId) : arrangeScore(rawScore, {
        window: keyWindow,
        fit: settings.fit,
        hands: settings.hands,
        transpose: settings.transpose,
      }),
    [kitted, kit, studyId, rawScore, keyWindow, settings.fit, settings.hands, settings.transpose],
  );

  const engineSettings = useMemo(
    () => ({
      ...settings,
      onHistoryChanged: () => {
        // Hook handles history refresh via storage change event listener
        // Nothing to do here anymore—recordSession triggers storage-write event
        // which is detected by useAppData
      },
    }),
    [settings],
  );
  const engine = usePracticeEngine(freePlay ? null : score, engineSettings);
  const stageScore = useMemo(() => freePlay && score ? { ...score, notes: [], noteCount: 0, duration: 0 } : score, [score, freePlay]);
  const stageEngine = freePlay ? { ...engine, sessionRef: { current: null } } : engine;
  const changeWorkspace = value => { learning.leave(); setFreePlay(value); };
  const openSetup = () => { preview.stop(); engine.actions.pause(); setSetupOpen(true); };
  const openTuner = () => { preview.stop(); engine.actions.pause(); setSetupOpen(false); setTunerOpen(true); };
  const selectStudy = id => {
    const owner = instrumentKit(instrumentForStudy(id));
    if (!owner) return;
    engine.actions.pause(); engine.clearLastResult(); setFreePlay(false);
    setSettings(s => ({ ...s, learningView: 'studio', practiceInstrument: owner.id, [owner.studyKey]: id, loop: null }));
  };
  playingRef.current = engine.playing;

  /* --------------------------------- follow the controller's octave buttons */
  /* ---------------------------------------------------------------- history */
  /**
   * Only when it was asked for *and* the machine can do it. Checked here
   * rather than inside the component so a browser without WebGL never even
   * downloads Three.js.
   */
  const useGL = settings.renderer === 'gl' && webglAvailable();

  const variant = score?.variant ?? FULL_VARIANT;
  const history = useMemo(
    () => (score ? appData.getSongHistory(score.id, { variant }) : null),
    [score?.id, variant, refreshVersion, appData],
  );
  const troubleSpots = useMemo(
    () => (score ? appData.getTroubleSpots(score.id) : []),
    [score?.id, refreshVersion, appData],
  );
  const best = useMemo(
    () => appData.getAllBestStars(variant),
    [variant, refreshVersion, appData],
  );
  const starsBySong = best.stars;
  const starRates = best.rates;
  const suggested = useMemo(
    () => kitted ? null : suggestNext(library, starsBySong, score?.id),
    [kitted, library, starsBySong, score?.id],
  );

  const path = usePathData(library, days, refreshVersion, instrument);

  const narrow = useMediaQuery(NARROW_QUERY);
  const phone = useMediaQuery(PHONE_QUERY);
  // Sideways, the keys give up some height so the notes above them have room to fall.
  const shortLandscape = useMediaQuery(SHORT_LANDSCAPE_QUERY);
  const keyboardHeight = shortLandscape ? Math.min(SHORT_KEYBOARD_HEIGHT, settings.pianoHeight ?? 104) : (settings.pianoHeight ?? 104);
  // Eighty-eight keys on a phone are 7px each. Until the player picks a range themselves, a phone fits the piece.
  const phoneFit = phone && (settings.pianoRange ?? 'full') === 'full' && !settings.pianoRangeChosen;

  const rollRange = useMemo(() => {
    if (settings.fit === FIT_MODES.OFF) return null;
    if (!deviceName && settings.keyboardId === AUTO_PROFILE) return null;
    return keyWindow;
  }, [settings.fit, settings.keyboardId, deviceName, keyWindow]);
  const visiblePianoRange = useMemo(() => (settings.learningView === 'lesson' && settings.pianoRange === 'fit') || phoneFit ? displayRangeFor(score, narrow ? 9 : 25) : pianoViewRange(score, settings.pianoRange, settings.typingOctave, rollRange), [score, settings.pianoRange, settings.typingOctave, settings.learningView, narrow, phoneFit, rollRange]);

  const bestCombo = useMemo(
    () => (score ? appData.getBestCombo(score.id, variant) : 0),
    [score?.id, variant, refreshVersion, appData],
  );

  const ghost = useMemo(
    () => (score ? appData.getGhost(score.id, variant) : null),
    [score?.id, variant, refreshVersion, appData],
  );
  const assessment = useMemo(
    () => (rawScore ? assessFit(rawScore.range, keyWindow) : null),
    [rawScore, keyWindow],
  );

  /* ----------------------------------------------------------- song loading */
  const pickSong = useCallback(
    async (entry) => {
      const request = ++scoreLoadToken.current;
      try {
        setError(null);
        if (entry.local) {
          const found = localScores.find((s) => s.id === entry.id);
          if (found) setRawScore(found);
          return;
        }
        const loaded = await loadScoreFromUrl(entry.url, { id: entry.id, title: entry.title, key: entry.key, timeSignature: entry.timeSignature, fingering: entry.fingering });
        if (request !== scoreLoadToken.current) return;
        setRawScore({ ...loaded, composer: entry.composer, description: entry.description });
      } catch (err) {
        setError(`Could not load "${entry.title}": ${err.message}`);
      }
    },
    [localScores],
  );

  const selectPianoSong = useCallback(async entry => {
    engine.actions.pause();
    setSettings(s => ({ ...s, learningView: 'studio', practiceInstrument: 'piano', lastPianoId: entry.id, loop: null }));
    setFreePlay(false);
    await pickSong(entry);
  }, [engine.actions, setSettings, pickSong]);

  const changeInstrument = value => {
    if ((settings.practiceInstrument ?? 'piano') === value) return;
    engine.actions.pause();
    engine.clearLastResult();
    // The kind chosen (the bass) is remembered for its family, so the picker's Guitar button comes back to it.
    setSettings(s => ({ ...s, practiceInstrument: value, variants: { ...s.variants, [familyOf(value)]: value }, learningView: s.learningView === 'lesson' ? 'home' : s.learningView, loop: null }));
  };

  // Open the first bundled piece once the manifest has arrived.
  useEffect(() => {
    if (library.length && !rawScore && settings.learningView !== 'lesson') pickSong(library.find(s => s.id === settings.lastPianoId) ?? library[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [library]);

  // The drawer is set-up furniture. If a run starts while it is open — easy to
  // do, since Play is reachable by space bar — get it out of the way.
  useEffect(() => {
    if (engine.playing) setLibraryOpen(false);
  }, [engine.playing]);


  /* ----------------------------------------------------------------- actions */
  const previewNote = useCallback(async (midi) => {
    await audio.start();
    emitSyntheticMidi({ type: 'noteon', midi, velocity: 0.75 });
    setTimeout(() => emitSyntheticMidi({ type: 'noteoff', midi, velocity: 0 }), 320);
  }, []);

  const testSound = useCallback(async midi => {
    await audio.start();
    const output = settings.instrumentSource === INSTRUMENT_MODES.EXTERNAL ? midiOutput : audio;
    const dropped = output.notesDropped;
    output.play(midi, 0.32, undefined, 0.75);
    if (output.notesDropped > dropped) throw new Error('The selected sound output could not play the test note.');
  }, [settings.instrumentSource]);

  const prepareLearning = useCallback(() => { scoreLoadToken.current++; setFreePlay(false); setFocus(false); setLibraryOpen(false); }, []);
  const learning = useLearningFlow({ settings, setSettings, library, path, score, engine, onScore: setRawScore, onLeaveFreePlay: prepareLearning, testSound });
  const preview = useScorePreview({ active: learning.homeOpen, instrument, instrumentSource:settings.instrumentSource, midiOutputId:settings.midiOutputId });
  const intentHandled = useRef(false);
  useEffect(()=>{
    const intent=settings.startIntent;
    if(!intent || intentHandled.current || !library.length)return;
    intentHandled.current=true;
    setSettings(s=>({...s,startIntent:null}));
    const id=intent.kind==='quick'?FIRST_LESSON[instrument]:intent.lessonId;
    const entry=learning.entries.find(item=>item.id===id);
    if(!entry){setError('This shared lesson is not in the library. Choose a piece below to get started.');return;}
    if(intent.kind==='quick')learning.startLesson(id,null,{quick:true});
    else if(kitted)selectStudy(id);else selectPianoSong(entry);
  },[settings.startIntent,library.length,learning.entries]);
  const toggleFavorite=id=>setSettings(s=>({...s,favoritePieces:(s.favoritePieces??[]).includes(id)?s.favoritePieces.filter(f=>f!==id):[...(s.favoritePieces??[]),id]}));
  const openProgress=()=>{learning.leave();setLibraryOpen(true);setRequestedTab({id:'progress',at:Date.now()});};
  useEffect(() => { if (learning.active && narrow) setFeedbackOpen(false); }, [learning.active, narrow, learning.record.step]);
  useEffect(() => { if (learning.active && narrow && engine.playing) setFeedbackOpen(false); }, [learning.active, narrow, engine.playing]);

  // Everything to do with picking a stretch of music and hearing, looping or
  // drilling it. One concern, and the place the shared bar-windows live.
  const {
    queuePlay,
    hearPassage,
    hearOrTry,
    toggleLoop,
    practiseSpot,
    hearSpot,
    drillPassage,
    hearReportPassage,
  } = usePassages({ score, settings, setSettings, engine });

  // The QWERTY keyboard is both the piano and the deck's shortcuts.
  useComputerKeyboard({
    disabled: learning.homeOpen,
    guided: learning.active,
    onGuidedPlay: learning.togglePlay,
    freePlay,
    engine,
    settings,
    setSettings,
    score,
    hearOrTry,
    toggleLoop,
    onClose: () => setLibraryOpen(false),
  });


  const runAgain = useCallback(() => {
    engine.clearLastResult();
    engine.actions.restart();
  }, [engine]);

  const applyRate = useCallback(
    (rate) => {
      setSettings((s) => ({ ...s, rate }));
      engine.clearLastResult();
      engine.actions.restart();
    },
    [engine],
  );

  const goToSuggested = useCallback(() => {
    engine.clearLastResult();
    if (suggested) pickSong(suggested);
  }, [engine, pickSong, suggested]);

  // What the report offers after a run: on a kit, the lesson the path has opened; on the piano, the piece suggested.
  const nextLessonId = kitted && path.state.currentId !== score?.id ? path.state.currentId : null;
  const reportNext = nextLessonId ? { label: 'Next lesson', go: () => selectStudy(nextLessonId) }
    : suggested ? { label: 'Next piece', go: () => goToSuggested() } : null;

  const reportStep = useMemo(
    () =>
      engine.lastResult
        ? nextStep({
            grade: engine.lastResult.grade,
            passages: engine.lastResult.passages,
            rate: engine.lastResult.rate,
            nextSong: suggested,
          })
        : null,
    [engine.lastResult, suggested],
  );

  /**
   * Turn the accumulated trouble map into a study. Built from `rawScore` so it
   * goes through the normal fitting pipeline afterwards — folding never moves a
   * note in time, so the recorded trouble timestamps still line up.
   */
  const buildDrill = useCallback(() => {
    const drill = drillFrom(rawScore, troubleSpots);
    if (!drill) {
      setError('Nothing to drill yet: play a run or two first and the trouble spots will build up.');
      return;
    }
    setSettings((s) => ({ ...s, loop: null, rate: DRILL_RATE }));
    setRawScore(drill);
  }, [rawScore, troubleSpots]);

  /**
   * Hear a piece played through without being judged on it. Worth one click
   * rather than three: knowing what something sounds like is most of deciding
   * whether to spend twenty minutes on it.
   */
  const listenTo = useCallback(
    async (entry) => {
      setSettings((s) => ({ ...s, learningView: 'studio', practiceInstrument: 'piano', mode: MODES.LISTEN, loop: null, rate: 1 }));
      setLibraryOpen(false);
      queuePlay(0);
      await pickSong(entry);
    },
    [pickSong, queuePlay],
  );

  /** Back to the piece a drill was cut from, restoring full speed. */
  const leaveDrill = useCallback(() => {
    const parent = rawScore?.drillOf;
    if (!parent) return;
    setSettings((s) => ({ ...s, rate: 1, loop: null }));
    const entry = library.find((song) => song.id === parent.id);
    if (entry) pickSong(entry);
    else {
      const local = localScores.find((s) => s.id === parent.id);
      if (local) setRawScore(local);
    }
  }, [rawScore, library, localScores, pickSong]);

  // Clearing a piece's history waits UNDO_SECONDS with an Undo before anything is deleted. A second Clear in that
  // time deletes the first at once; leaving the page in that time deletes nothing.
  const [pendingClear, setPendingClear] = useState(null);
  const clearTimer = useRef(null);
  // A piece's note for next time goes with its history.
  const forgetHistory = useCallback(songId => { appData.clearSongHistory(songId); setSettings(s => ({ ...s, pieceNotes: withoutNote(s.pieceNotes, songId) })); }, [appData, setSettings]);
  const clearHistory = useCallback(() => {
    if (!score) return;
    if (pendingClear) { clearTimeout(clearTimer.current); forgetHistory(pendingClear.songId); }
    const item = { songId: score.id, title: score.title };
    setPendingClear(item);
    clearTimer.current = setTimeout(() => { forgetHistory(item.songId); setPendingClear(null); }, UNDO_SECONDS * 1000);
  }, [score, forgetHistory, pendingClear]);
  const undoClear = useCallback(() => { clearTimeout(clearTimer.current); setPendingClear(null); }, []);
  useEffect(() => () => clearTimeout(clearTimer.current), []);
  // Playing the piece again ends the undo there: the old history goes now, so the new run is not swept away with it.
  useEffect(() => {
    if (!engine.playing || !pendingClear || pendingClear.songId !== score?.id) return;
    clearTimeout(clearTimer.current);
    forgetHistory(pendingClear.songId);
    setPendingClear(null);
  }, [engine.playing, pendingClear, score?.id, forgetHistory]);
  // Your own line for next time (pieceNotes.js): written in the report, shown in the guide before the next run.
  const pieceNote = score && pendingClear?.songId !== score.id ? settings.pieceNotes?.[score.id] ?? null : null;
  const setNoteFor = (id, text) => setSettings(s => ({ ...s, pieceNotes: withNote(s.pieceNotes, id, text) }));
  const applyNoteAction = a => setSettings(s => ({ ...s, loop: a.loop, ...(a.rate ? { rate: a.rate } : {}) }));
  const closeError = useCallback(() => setError(null), []);
  // Every piece and study, for the teacher's progress page (it covers every instrument, not the one on stage).
  const allPieces = useMemo(() => [...library, ...INSTRUMENTS.filter(id => id !== 'piano').flatMap(id => instrumentKit(id)?.studies ?? [])], [library]);
  // While a cleared history waits for its undo, its stars and best streak are hidden with it.
  const shownStars = useMemo(() => (pendingClear ? { ...starsBySong, [pendingClear.songId]: undefined } : starsBySong), [starsBySong, pendingClear]);
  const shownRates = useMemo(() => (pendingClear ? { ...starRates, [pendingClear.songId]: undefined } : starRates), [starRates, pendingClear]);
  const shownCombo = pendingClear && pendingClear.songId === score?.id ? 0 : bestCombo;

  const startAudio = useCallback(async () => {
    try { await engine.actions.ensureAudio(); } catch (err) { setError(`Could not enable sound: ${err.message}. Open Input & sound to try again.`); }
  }, [engine.actions]);

  // Sound needs one real click or key press on the page before the browser
  // will let it start. A note from a MIDI controller does not count, which is
  // why playing the keyboard first produced silence: the keys lit up but the
  // audio clock stayed suspended. So the first gesture anywhere in the app —
  // opening the library, a tab, anything — quietly starts the audio engine,
  // and a controller note that arrives before that gets a visible nudge.
  const audioReadyRef = useRef(engine.audioReady);
  audioReadyRef.current = engine.audioReady;
  useEffect(() => {
    const unlock = () => { if (!audio.running) startAudio(); };
    const opts = { capture: true, passive: true };
    window.addEventListener('pointerdown', unlock, opts);
    window.addEventListener('keydown', unlock, opts);
    window.addEventListener('touchend', unlock, opts);
    return () => {
      window.removeEventListener('pointerdown', unlock, opts);
      window.removeEventListener('keydown', unlock, opts);
      window.removeEventListener('touchend', unlock, opts);
    };
  }, [startAudio]);
  const [soundNudge, setSoundNudge] = useState(false);
  useEffect(() => midiInput.onMessage((msg) => {
    // A note from the microphone needs no sound from the app, so there is nothing to nudge about.
    if (msg.type === 'noteon' && msg.source !== 'mic' && !audioReadyRef.current) setSoundNudge(true);
  }), []);
  useEffect(() => { if (engine.audioReady) setSoundNudge(false); }, [engine.audioReady]);

  /**
   * Nothing has been judged yet, so a scoreboard would be six zeroes and three
   * "nothing here" messages. Show the piece instead until there is something
   * real to report — and switch the moment a run starts, not the moment the
   * first note lands, so the panel does not change under you mid-phrase.
   */
  const beforeFirstNote =
    !engine.playing &&
    ((engine.summary?.hit ?? 0) + (engine.summary?.wrongNotes ?? 0) + (engine.summary?.missed ?? 0)) === 0;

  // Only when the piece panel is not carrying the call to action. Play there
  // already starts the audio engine, so showing both is two buttons asking for
  // the same click.
  const showStartBanner = !engine.audioReady && !engine.playing && !beforeFirstNote;
  const stageNote = stageCaption(instrument, freePlay, technique);
  // An address for every screen, so Back goes back and a screen can be bookmarked (useRoute.js, route.js).
  const route = useMemo(() => {
    const view = learning.homeOpen ? 'home' : learning.active ? 'lesson' : libraryOpen ? 'library' : 'studio';
    return {
      view, instrument,
      id: view === 'lesson' ? (learning.lesson?.id ?? null) : view === 'studio' && !freePlay ? (score?.id ?? null) : null,
      free: view === 'studio' && freePlay,
    };
  }, [learning.homeOpen, learning.active, learning.lesson?.id, libraryOpen, instrument, freePlay, score?.id]);
  // One step toward an address from the bar: an instrument first, then the screen, then the piece. False when the
  // address names something the app does not have (a lesson or study of another instrument, a removed piece).
  const applyRoute = target => {
    if (target.id && usesKit(target.instrument) && target.view !== 'lesson' && instrumentForStudy(target.id) !== target.instrument) return false;
    if (target.view === 'home' || target.view === 'lesson') {
      if (target.instrument !== instrument) { changeInstrument(target.instrument); return true; }
      if (target.view === 'home') { if (!learning.homeOpen) learning.openHome(); return true; }
      if (!learning.entries.some(entry => entry.id === target.id)) return false;
      learning.startLesson(target.id);
      return true;
    }
    setLibraryOpen(target.view === 'library');
    if (learning.homeOpen || learning.active) learning.leave();
    if (target.view === 'library' || target.free) {
      if (freePlay !== target.free) setFreePlay(target.free);
      if (target.instrument !== instrument) changeInstrument(target.instrument);
      return true;
    }
    if (freePlay) setFreePlay(false);
    if (target.id && target.id !== score?.id) {
      if (usesKit(target.instrument)) { selectStudy(target.id); return true; }
      const entry = library.find(e => e.id === target.id);
      // A piece that is not there: still go to its instrument, then let the address go.
      if (!entry) { if (target.instrument !== instrument) changeInstrument(target.instrument); return false; }
      selectPianoSong(entry);
      return true;
    }
    if (target.instrument !== instrument) changeInstrument(target.instrument);
    return true;
  };
  useRoute(route, applyRoute, library.length > 0);
  // Arriving in the studio from another screen puts the focus on its title, as the home and a lesson do with theirs
  // (ui-ux-pro-max focus-on-route-change). Closing the library is left to the drawer, which returns the focus itself.
  const lastView = useRef(route.view);
  useEffect(() => {
    const from = lastView.current;
    lastView.current = route.view;
    if (from === route.view || route.view !== 'studio' || from === 'library') return undefined;
    const frame = requestAnimationFrame(() => document.querySelector('.studio-heading h1')?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [route.view]);

  // The inspector's bar: chosen by clicking the timeline or the roll (never by a keyboard seek or "Restart
  // passage"), never while a run plays, and let go of on a new piece or when a run starts.
  const [inspectedBar, setInspectedBar] = useState(null);
  // The note clicked on the roll (its time and pitch), when the click was on one; the bar alone otherwise.
  const [inspectedNote, setInspectedNote] = useState(null);
  const engineNow = useRef(engine);
  engineNow.current = engine;
  useEffect(() => { setInspectedBar(null); }, [score?.id, learning.active, freePlay]);
  useEffect(() => { if (engine.playing) setInspectedBar(null); }, [engine.playing]);
  const chooseBarAt = useCallback(time => {
    if (!score || learning.active || freePlay || engineNow.current.playing) return;
    setInspectedBar(Math.min(barCount(score), barAt(time, score)));
  }, [score, learning.active, freePlay]);
  const seekAndChoose = useCallback((time, lane = null) => {
    engineNow.current.actions.seek(time);
    chooseBarAt(time);
    setInspectedNote(lane == null ? null : { time, midi: lane });
  }, [chooseBarAt]);
  const chooseBarOnly = useCallback(time => { setInspectedNote(null); chooseBarAt(time); }, [chooseBarAt]);
  const openLibrary = () => { learning.leave(); setLibraryInstrument(instrument); setLibraryOpen(true); setRequestedTab({ id: 'songs', at: Date.now() }); };
  // Ctrl+K: the palette runs the same functions as the controls it names.
  const palette = useCommandPalette({ settings, setSettings, instrument, library, learning, engine, score, freePlay, focus, theme,
    selectPianoSong, selectStudy, changeInstrument, changeWorkspace, openLibrary, openProgress, openSetup, openTuner, toggleLoop, hearOrTry,
    toggleFocus: () => setFocus(v => !v), startAudio });
  // The studio's first-visit tour, or again from Help. Never over a lesson, free play, a report or a run.
  const [tourAgain, setTourAgain] = useState(false);
  const showTour = (tourAgain || !settings.studioTourDone) && settings.onboarded && !learning.homeOpen && !learning.active && !freePlay
    && !!score && !engine.playing && !engine.lastResult && !setupOpen && !tunerOpen && !palette.open;
  const endTour = useCallback(() => { setTourAgain(false); setSettings(s => ({ ...s, studioTourDone: true })); }, [setSettings]);
  // While a run plays, the chrome around the stage fades back; moving the pointer brings it back for a moment.
  const awake = useAwake(engine.playing);
  // The transport: on a phone above the stage, where its one-row deck and More sheet live; on a wide screen in one
  // bar under the keys, beside the hands, with Practice settings moved up beside Focus.
  const deck = !freePlay && <Controls
    settings={settings}
    setSettings={setSettings}
    engine={engine}
    score={score}
    onShowFeedback={narrow ? () => setFeedbackOpen(true) : null}
    onHearOrTry={hearOrTry}
    onToggleLoop={toggleLoop}
    headerSlot={!narrow}
  />;
  useEffect(() => { document.title = pageTitle({ piece: score?.title, instrument: instrumentInfo(instrument).label, freePlay, home: learning.homeOpen }); }, [score?.title, instrument, freePlay, learning.homeOpen]);

  // Setup chrome recedes while you play. Opacity only — collapsing any of it
  // would reflow the toolbar at the exact moment you are trying to hit a note.
  return (
    <div className={`app studio-app ${kitted ? 'guitar-mode' : 'piano-mode'} ${instrument}-mode ${learning.active ? 'guided-lesson' : ''} ${engine.playing ? 'focused' : ''} ${engine.playing && !awake ? 'receded' : ''} ${focus ? 'focus-view' : ''} ${freePlay ? 'free-play' : ''}`}>
      <a className="skip-link" href="#practice-stage">Skip to practice</a>
      <TopBar settings={settings} setSettings={setSettings} onSearch={() => palette.setOpen(true)} onTour={() => { learning.leave(); setFreePlay(false); setTourAgain(true); }} onLearn={learning.openHome} learningHome={learning.homeOpen} theme={theme} onToggleTheme={() => setSettings(s => ({ ...s, theme: theme === 'light' ? 'dark' : 'light' }))} onSetup={openSetup} onTuner={openTuner} onProgress={openProgress}
        midiState={midiState} micListening={micListening} micChosen={micChosen} midiChosen={settings.inputMethod === 'midi'} deviceName={deviceName}
        onSelectDevice={(id) => midiInput.select(id)}
        storageProblem={storageProblem}
        onConnectMidi={() => midiInput.connect()}
        audioReady={engine.audioReady}
        audioLabel={engine.instrument}
        onStartAudio={startAudio}
        score={score}
        libraryOpen={libraryOpen}
        onToggleLibrary={() => { if (learning.homeOpen) learning.leave(); setLibraryInstrument(instrument); if (!libraryOpen) setRequestedTab({ id: 'songs', at: Date.now() }); setLibraryOpen((open) => !open); }}
        profile={kitted ? null : profile}
        window={keyWindow}
        onLeaveDrill={leaveDrill}
        latencyMs={settings.inputLatencyMs}
        outputName={
          outputState.outputs.find((o) => o.id === outputState.selectedId)?.name ?? null
        }
      />

      {found && <div className="device-toast" role="status">
        <Icon name="check" size={16} />
        <span><strong>{found.name}</strong> is connected and ready to play.</span>
        <button className="primary" onClick={() => { setSettings(s => ({ ...s, inputMethod: 'midi' })); setFound(null); openSetup(); }}>Check it</button>
        <button onClick={() => setFound(null)} aria-label="Dismiss">×</button>
      </div>}

      {soundNudge && !engine.audioReady && (
        <div className="sound-nudge" role="alert">
          <Icon name="volume" size={16} />
          <span><strong>Your keyboard is connected, but sound is off.</strong> Browsers need one click on the page before they play audio.</span>
          <button className="primary" onClick={startAudio}>Turn on sound</button>
        </div>
      )}

      {learning.homeOpen ? <LearningHome learning={learning} path={path} storageProblem={storageProblem} instrument={instrument} days={days} settings={settings} setSettings={setSettings} preview={preview} onPick={kitted?entry=>selectStudy(entry.id):selectPianoSong} onFavorite={toggleFavorite} onBackup={openProgress} onInstrument={changeInstrument} onExplore={() => changeWorkspace(true)} onLibrary={openLibrary} /> : <div
        className={`app-body ${libraryOpen ? 'library-open' : ''} ${
          feedbackOpen ? 'feedback-open' : ''
        }`}
      >
        <aside
          className="pane left"
          aria-hidden={!libraryOpen}
          inert={!libraryOpen ? '' : undefined}
          aria-label="Library and setup"
        >
          <Drawer onClose={() => setLibraryOpen(false)} requestedTab={requestedTab}
            songs={
              <>
              <StudioLibrary instrument={libraryInstrument} onInstrument={(id, exact) => setLibraryInstrument(exact ? id : chooseVariant(settings.variants, id))} onPickStudy={selectStudy}
                favorites={settings.favoritePieces ?? []} onFavorite={id => setSettings(s => ({ ...s, favoritePieces: (s.favoritePieces ?? []).includes(id) ? s.favoritePieces.filter(f => f !== id) : [...(s.favoritePieces ?? []), id] }))}
                dailySet={path.set} dailyProgress={path.progress} onPlan={() => setRequestedTab({ id: 'path', at: Date.now() })}
                recentId={usesKit(libraryInstrument) ? studyIdFor(settings, libraryInstrument) : settings.lastPianoId}

                library={library}
                localScores={localScores}
                activeId={score?.id}
                onPick={selectPianoSong}
                onLoadFile={handleLoadFile}
                window={keyWindow}
                starsBySong={shownStars}
                starRates={shownRates}
                suggestedId={suggested?.id}
                onListen={listenTo}
              />
              </>
            }
            path={
              <><LearningSummary learning={learning} state={path.state} onOpen={learning.openHome}/><PathTab guitar={kitted}
                state={path.state}
                set={path.set}
                dailyProgress={path.progress}
                library={kitted ? kit.studies : library}
                days={days}
                goalMinutes={settings.dailyGoalMinutes}
                onGoalChange={(dailyGoalMinutes) => setSettings((s) => ({ ...s, dailyGoalMinutes }))}
                onPick={kitted ? entry => selectStudy(entry.id) : selectPianoSong}
                benchmark={path.benchmark}
                decay={path.decay}
                badges={path.badges}
                streak={path.streak}
              /></>
            }
            progress={
              <><LearningSummary learning={learning} state={path.state} onOpen={learning.openHome}/><ProgressTab onBeginner={learning.openHome}
                days={days}
                goalMinutes={settings.dailyGoalMinutes}
                onGoalChange={(dailyGoalMinutes) => setSettings((s) => ({ ...s, dailyGoalMinutes }))}
                library={kitted ? kit.studies : library}
                starsBySong={shownStars}
                onPick={kitted ? entry => selectStudy(entry.id) : selectPianoSong}
                onRestored={refreshAfterRestore}
                pieces={allPieces}
              /></>
            }
          />
        </aside>

        {libraryOpen && <div className="scrim" onClick={() => setLibraryOpen(false)} />}

        <main className="pane center">
          <StudioHeader score={score} settings={settings} onInstrumentChange={changeInstrument} freePlay={freePlay} onFreePlay={changeWorkspace} focus={focus} onFocus={() => setFocus(v => !v)}
            instrumentSettings={<InstrumentSettings settings={settings} setSettings={setSettings} instrument={instrument}>
              {!kitted && <InstrumentControls settings={settings} setSettings={setSettings} shownRange={phoneFit ? 'fit' : undefined} sustain={sustain} onSustain={value => playInput.sustain(value)} />}
            </InstrumentSettings>} />
          {learning.active ? <LessonBar learning={learning} engine={engine} onShowGuide={narrow ? () => setFeedbackOpen(true) : null}/> : narrow && deck}
          {freePlay && !learning.active && <FreePlayBar kit={kit} technique={technique} onTuner={kit?.tuning ? openTuner : null} onSetup={openSetup} drone={droneFor(instrument) ? { on: !!settings.drone, onToggle: () => setSettings(s => ({ ...s, drone: !s.drone })) } : null} />}

          {!freePlay && !learning.active && <Minimap theme={theme}
            score={score}
            troubleSpots={troubleSpots}
            loop={settings.loop}
            onLoopChange={loop => setSettings(s => ({ ...s, loop }))}
            engine={engine}
            onSeek={engine.actions.seek}
            onChooseBar={chooseBarOnly}
          />}

          {/* Everything that floats over the notes lives in here, so it is
              positioned against the roll rather than the whole pane — anchoring
              to the pane puts the wait hint on top of the toolbar. */}
          {!kitted && <StageViews settings={settings} setSettings={setSettings} freePlay={freePlay} lesson={learning.active} />}
          {learning.active && !narrow && <LessonStepCard learning={learning} engine={engine} score={score} instrument={instrument} onSetup={openSetup} path={path} />}

          {!freePlay && !kitted && settings.view !== 'roll' && (
            /* Engraving is the most intricate thing here and the only part
               using a third-party renderer. Its own boundary, so a piece
               VexFlow cannot set costs you the stave and not the session. */
            <ErrorBoundary
              fallback={
                <div className="staff-view empty-staff">
                  This piece could not be engraved. The falling notes still work: switch back to Roll.
                </div>
              }
            >
              <Suspense fallback={<div className="staff-view empty-staff">Engraving…</div>}>
                <StaffView score={score} engine={engine} />
              </Suspense>
            </ErrorBoundary>
          )}

          <div id="practice-stage" tabIndex={-1} className={`roll-area ${!freePlay && !kitted && settings.view === 'staff' ? 'hidden-roll' : ''}`}>
          {/* Two renderers, one geometry. rollGeometry.js decides where every
              note belongs and both of these read it, so the GPU roll cannot
              drift away from the canvas one on the thing that matters.

              The canvas roll stays the default and the fallback. It is the one
              that cannot lose a graphics context, the one jsdom can run — so
              the test suite keeps exercising a real renderer — and the one
              that is currently at full feature parity. */}
          {/* The chord and scale explorers go in the side column; on a narrow screen that column is a slide-over that
              free play has no button to open, so there they stay inline under the stage. */}
          {fretted ? <GuitarWorkspace key={instrument} appearance={<StageAppearance settings={settings} setSettings={setSettings} />} instrument={instrument} onInstrument={changeInstrument} onTuner={openTuner} score={stageScore} engine={stageEngine} settings={settings} setSettings={setSettings} freePlay={freePlay} onFreePlay={() => changeWorkspace(true)}
            onStudy={selectStudy}
            inspector={focus || narrow ? null : chordInspector} onError={setError} onContextLost={why => { setSettings(s => ({ ...s, renderer: 'canvas' })); setError(`Switched to 2D Trainer: ${why}.`); }}
          /> : drums ? <DrumWorkspace key={instrument} instrument={instrument} score={stageScore} appearance={<StageAppearance settings={settings} setSettings={setSettings} />} engine={stageEngine} settings={settings} freePlay={freePlay} onFreePlay={() => changeWorkspace(true)}
            onStudy={selectStudy} inspector={focus || narrow ? null : chordInspector} listening={settings.mode === MODES.LISTEN} compact={narrow} onError={e => setError(`Could not play the ${instrumentInfo(instrument).label.toLowerCase()}: ${e.message}`)}
          /> : kitted ? <BowedWorkspace key={instrument} appearance={<StageAppearance settings={settings} setSettings={setSettings} />} instrument={instrument} onInstrument={changeInstrument} onTuner={openTuner} score={stageScore} engine={stageEngine} settings={settings} setSettings={setSettings} freePlay={freePlay} onFreePlay={() => changeWorkspace(true)}
            onStudy={selectStudy} inspector={focus || narrow ? null : chordInspector}
          /> : useGL ? (
            <Suspense fallback={<div className="roll-gl" />}>
              <RollGL theme={theme}
                score={stageScore}
                engine={stageEngine}
                pixelsPerSecond={settings.pps}
                troubleSpots={troubleSpots}
                range={visiblePianoRange} settings={settings} keyboardHeight={keyboardHeight} fingers={learning.active}
                labels={settings.noteLabels}
                ghost={ghost}
                bestCombo={shownCombo}
                onSeek={seekAndChoose}
                onPreviewNote={previewNote}
                onContextLost={(why) => {
                  setSettings((s) => ({ ...s, renderer: 'canvas' }));
                  setError(`Switched back to the 2D view: ${why}.`);
                }}
              />
              {/* Only in free play, so its models and viewer code load when someone can use them. */}
              {freePlay && <Suspense fallback={null}><PianoWholeView freePlay={freePlay} quality={settings.stageQuality} /></Suspense>}
            </Suspense>
          ) : (
            <PianoRoll
              score={stageScore}
              engine={stageEngine}
              pixelsPerSecond={settings.pps}
              troubleSpots={troubleSpots}
              onSeek={seekAndChoose}
              onPreviewNote={previewNote}
              range={visiblePianoRange} settings={settings} keyboardHeight={keyboardHeight} fingers={learning.active}
              labels={settings.noteLabels}
              ghost={ghost}
              bestCombo={shownCombo}
            />
          )}

          {engine.playing && !freePlay && !learning.active && settings.mode !== MODES.LISTEN && !engine.countIn && (
            <LiveHud summary={engine.summary} combo={engine.comboRef?.current?.count ?? 0} waitingMode={settings.mode === MODES.WAIT} />
          )}

          {engine.countIn && (
            <div className="count-in" aria-live="polite">
              <span className="beat">{engine.countIn.beatsLeft}</span>
              {/* The same count, as beat lamps. A number you read is a number
                  you are half a beat behind by the time you have read it; a row
                  of lamps filling left to right you catch out of the corner of
                  your eye while looking at the keys. Both, because the number
                  is what a screen reader gets. */}
              <BeatPads countIn={engine.countIn} />
              <span className="hint">get ready</span>
            </div>
          )}

          {engine.lastResult && !learning.active && (
            <PracticeReport
              result={engine.lastResult}
              previousSessions={(history?.sessions ?? []).slice(0, -1)}
              step={reportStep}
              onDrill={drillPassage}
              onRepeat={runAgain}
              onApplyRate={applyRate}
              onNextSong={goToSuggested}
              onClose={engine.clearLastResult}
              spokenCoaching={settings.spokenCoaching}
              onSpokenCoachingChange={(spokenCoaching) =>
                setSettings((s) => ({ ...s, spokenCoaching }))
              }
              /* The arranged score, so "against the score" compares your run
                 with the notes you were actually asked to play — folded,
                 transposed and hand-filtered exactly as the roll showed them. */
              scoreNotes={score?.notes ?? []}
              onHearPassage={hearReportPassage}
              next={reportNext}
              note={pieceNote}
              notePieceId={score?.id ?? null}
              onNoteChange={score ? setNoteFor : null}
            />
          )}

          {engine.waiting && settings.mode === MODES.WAIT && (
            <div className="wait-hint">
              waiting for{' '}
              {(engine.sessionRef.current?.currentGate?.notes ?? [])
                .filter((n) => n.status === 'pending')
                .map((n) => n.name)
                .join(' + ') || '…'}
            </div>
          )}

          {showStartBanner && !learning.active && (
            <div className="roll-overlay">
              <div className="banner">
                <h3>Ready when you are</h3>
                <p>
                  Browsers need one click before they'll make sound. Hit start, then press ▶ Play (or the space bar)
                  and follow the falling notes.
                </p>
                <button className="primary" onClick={startAudio}>
                  Start audio engine
                </button>
              </div>
            </div>
          )}
          </div>
          {/* One status line: what the stage shows on the left, how it is set up on the right. Shortcuts live in Help. */}
          {learning.active && narrow && <LessonDock learning={learning} engine={engine} score={score} instrument={instrument} onShowGuide={() => setFeedbackOpen(true)} />}
          {!narrow && !learning.active && deck}
          <footer className="studio-footer">
            <span className="stage-caption"><i />{stageNote.caption}<span className="stage-description">{stageNote.description}</span></span>
            {kitted && <span className="footer-meta">{fretted ? `${guitar ? '' : `${kit.label} · `}${kit.tuningLabel ?? 'Standard tuning'} · ${visibleFrets(settings.guitarFrets, phone)} frets` : `${kit.label} · ${instrumentInfo(instrument).detail}`}</span>}
            <span>{freePlay ? 'Explore freely · no score recorded' : learning.active ? <><kbd>Space</kbd> play / pause<span className="footer-detail"> · Your lesson is saved automatically</span></> : <ShortcutLegend />}</span>
          </footer>
        </main>

        {feedbackOpen && narrow && (
          <div className="scrim feedback-scrim" onClick={() => setFeedbackOpen(false)} />
        )}

        <aside className="pane right" aria-label={learning.active ? 'Lesson guide' : 'This run'}>
          {narrow && <button className="close-feedback" onClick={() => setFeedbackOpen(false)} aria-label={learning.active ? 'Close lesson guide' : 'Close this run panel'}><Icon name="close" size={14} /> Close</button>}
          {learning.active ? <LessonGuide learning={learning} engine={engine} score={score} instrument={instrument} onSetup={openSetup} path={path} typingOctave={settings.typingOctave ?? 0} stageCard={!narrow}/> : freePlay && kitted ? <div ref={setChordInspector} className="chord-inspector"/> : freePlay ? <div className="section free-play-coach"><h2>Follow your curiosity.</h2><p>Play a few notes, find a chord you like, and make it your own.</p><div className="free-play-tip">Click the keys, play a MIDI controller, or use your computer keyboard: the row from A to J is the white keys from middle C.</div><p className="hint">Free play is not graded and does not add practice results.</p></div> : inspectedBar && score && !engine.playing ? (
            <BarInspector score={score} bar={inspectedBar} note={inspectedNote} troubleSpots={troubleSpots} onSelect={bar => { setInspectedNote(null); setInspectedBar(bar); }}
              onHear={hearPassage} onLoop={(from, to) => setSettings(s => ({ ...s, loop: [from, to] }))} onClose={() => setInspectedBar(null)} />
          ) : beforeFirstNote ? (
            <>
              <PiecePanel
                score={score}
                history={history}
                assessment={kitted ? null : assessment}
                mode={settings.mode} rate={settings.rate} loop={settings.loop} onHear={hearOrTry} onWait={() => setSettings(s => ({ ...s, mode: MODES.WAIT }))}
                bestStars={score ? (shownStars[score.id] ?? 0) : 0}
                bestStarsRate={score ? (shownRates[score.id] ?? 1) : 1}
                audioReady={engine.audioReady}
                onPlay={() => engine.actions.play()}
                onLeaveDrill={leaveDrill}
                playing={engine.playing}
                note={pieceNote} onNoteAction={applyNoteAction} onClearNote={() => setNoteFor(score.id, '')}
              />
              {/* Show if current variant has sessions, OR if there's any history in other variants.
                  This ensures the "Show runs in other arrangements" button is reachable. */}
              {pendingClear?.songId !== score?.id && ((history?.sessions?.length ?? 0) > 0 || (appData.getSongHistory(score?.id)?.sessions?.length ?? 0) > 0) && score && (
                <HistoryPanel
                  history={history}
                  songId={score?.id}
                  troubleSpots={troubleSpots}
                  onPractiseSpot={practiseSpot}
                  onHearSpot={hearSpot}
                  onClear={clearHistory}
                  onBuildDrill={kitted ? null : buildDrill}
                />
              )}
            </>
          ) : (
            <>
              <FeedbackPanel playing={engine.playing} summary={engine.summary} events={engine.events} score={score} listening={settings.mode === MODES.LISTEN} waitingMode={settings.mode === MODES.WAIT} />
              {/* Show if current variant has sessions, OR if there's any history in other variants. */}
              {pendingClear?.songId !== score?.id && ((history?.sessions?.length ?? 0) > 0 || (appData.getSongHistory(score?.id)?.sessions?.length ?? 0) > 0) && score && (
                <HistoryPanel
                  history={history}
                  songId={score?.id}
                  troubleSpots={troubleSpots}
                  onPractiseSpot={practiseSpot}
                  onHearSpot={hearSpot}
                  onClear={clearHistory}
                  onBuildDrill={kitted ? null : buildDrill}
                />
              )}
            </>
          )}
        </aside>
      </div>}

      {setupOpen && <SetupDialog settings={settings} setSettings={setSettings} midiState={midiState} audioReady={engine.audioReady} audioLabel={engine.instrument} onTest={testSound} onTuner={openTuner} onClose={() => setSetupOpen(false)} more={
          <KeyboardPanel
            piano={!kitted}
            midi={settings.inputMethod === 'midi'}
            deviceName={deviceName}
            profile={profile}
            profileId={settings.keyboardId}
            onProfileChange={(keyboardId) => setSettings((s) => ({ ...s, keyboardId }))}
            window={keyWindow}
            onShiftOctave={shiftOctave}
            onResetOctave={resetOctave}
            autoDetected={autoDetected}
            fit={settings.fit}
            onFitChange={(fit) => setSettings((s) => ({ ...s, fit }))}
            assessment={assessment}
            latencyMs={settings.inputLatencyMs}
            onCalibrate={() => { setSetupOpen(false); setCalibrating(true); }}
            velocityCurve={settings.velocityCurve}
            onCalibrateTouch={() => { setSetupOpen(false); setCalibratingTouch(true); }}
            instrumentSource={settings.instrumentSource}
            onInstrumentSourceChange={(instrumentSource) =>
              setSettings((s) => ({ ...s, instrumentSource }))
            }
            outputs={outputState.outputs}
            selectedOutputId={outputState.selectedId}
            onSelectOutput={(id) => {
              midiOutput.select(id);
              setSettings((s) => ({ ...s, midiOutputId: id }));
            }}
            forwardInput={settings.forwardInput}
            onForwardInputChange={(forwardInput) => setSettings((s) => ({ ...s, forwardInput }))}
            onLoadSamples={handleLoadSamples}
            pieceRange={rawScore?.range ?? null}
            onMoveWindow={setKeyboardLow}
          />
      } />}
      {tunerOpen && <TunerDialog instrument={instrument} onClose={() => setTunerOpen(false)} />}
      {palette.open && <CommandPalette commands={palette.commands} onClose={() => palette.setOpen(false)} />}
      {showTour && <CoachTour onDone={endTour} />}
      <UndoToast message={pendingClear ? `History for ${pendingClear.title} cleared` : ''} onUndo={undoClear} />
      <AppModals
        practiceInstrument={settings.practiceInstrument}
        onInstrumentChange={family => changeInstrument(chooseVariant(settings.variants, family))}
        onSetup={() => { setSettings(s => ({ ...s, onboarded: true })); openSetup(); }}
        showFirstRun={!settings.onboarded && library.length > 0}
        onBeginner={learning.openHome}
        onFirstRunDone={() => setSettings((s) => ({ ...s, onboarded: true }))}
        midiState={midiState}
        profile={profile}
        keyWindow={keyWindow}
        onConnectMidi={() => midiInput.connect()}
        isDev={import.meta.env.DEV}
        error={error}
        onErrorClose={closeError}
      />

      <CalibratorDialogs
        calibrating={calibrating}
        onCloseCalibrateLatency={() => setCalibrating(false)}
        onApplyCalibrateLatency={(inputLatencyMs) => {
          setSettings((s) => ({ ...s, inputLatencyMs }));
          setCalibrating(false);
        }}
        latencyMs={settings.inputLatencyMs}
        calibratingTouch={calibratingTouch}
        onCalibrateTouchClose={() => setCalibratingTouch(false)}
        onCalibrateTouchApply={(velocityCurve) => {
          setSettings((s) => ({ ...s, velocityCurve }));
          setCalibratingTouch(false);
        }}
        velocityCurve={settings.velocityCurve}
      />
    </div>
  );
}
