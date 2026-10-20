import { useEffect, useState } from 'react';
import { useDialog } from '../hooks/useDialog.js';
import Icon from './Icon.jsx';
import { stageTierHere, webglAvailable, webglRendererName } from '../lib/stage/webgl.js';
import { chooseVariant, familyOf, instrumentInfo, isStringed, normalizeInstrument, stringKit } from '../lib/instruments.js';
import InstrumentButtons from './InstrumentButtons.jsx';
import { explainStageDetail, normalizeStageQuality, STAGE_QUALITIES } from '../lib/stage/quality.js';

const QUALITY_CHOICES = {
  auto: { label: 'Auto', title: 'Full detail on a graphics card, light on software rendering' },
  full: { label: 'Full', title: 'The 3D models of the guitar, the bass and the bowed strings, with reflections and a lacquered finish' },
  light: { label: 'Light', title: 'The simpler built-in guitar and the drawn fretboards and fingerboards, for older computers' },
};
/** The violin family's outline: upper bout, a shallow waist, the wider lower bout. Shared so the two read as relatives. */
const BOWED_BODY = 'M12 5.6C14.6 5.6 16 6.9 15.9 8.7 15.8 10.1 14.6 10.6 14.6 11.6 14.6 12.6 16 13 16.6 14.4 17.5 16.8 16.2 20 12 20 7.8 20 6.5 16.8 7.4 14.4 8 13 9.4 12.6 9.4 11.6 9.4 10.6 8.2 10.1 8.1 8.7 8 6.9 9.4 5.6 12 5.6Z';
const F_HOLES = 'M10.4 12.8c.3.9.3 1.8 0 2.7M13.6 12.8c-.3.9-.3 1.8 0 2.7';

/**
 * One drawing per instrument, told apart at a glance when the picker shows icons alone: the violin leans with its
 * bow across it, the cello stands on its endpin, and the bass is the long-necked solid body. All six share the
 * 24-unit grid, a 1.6 stroke and round joins, and each fills the box about as much as the others.
 *
 * @param instrument an instrument id (instruments.js); `guitar` is the older boolean form
 */
export function InstrumentIcon({ guitar = false, instrument = guitar ? 'guitar' : 'piano' }) {
  const props = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (instrument === 'violin') {
    return (
      <svg {...props}>
        <g transform="translate(12.6 11.4) rotate(-32) scale(.9) translate(-12 -11.6)">
          <path d={BOWED_BODY} /><path d="M12 5.6V2.6" /><circle cx="12" cy="1.8" r=".9" /><path d={F_HOLES} />
        </g>
        <path d="M2.8 18.2 20.5 8.6" strokeWidth="1.3" opacity=".7" />
      </svg>
    );
  }
  if (instrument === 'cello') {
    return (
      <svg {...props}>
        <g transform="translate(0 .2)"><path d={BOWED_BODY} /><path d="M12 5.6V2.4" /><circle cx="12" cy="1.6" r=".9" /><path d={`${F_HOLES}M12 20v2.8`} /></g>
      </svg>
    );
  }
  if (instrument === 'bass') {
    return (
      <svg {...props}>
        <g transform="translate(12 12) rotate(42) scale(1.17) translate(-12 -10.9)">
          <path d="M10.4 11.6c-.9-.9-1.9-.6-2.2.6-.3 1.2.4 1.9 0 3-.6 1.7-.2 4.4 1.8 5.3 1.4.6 2.8.6 4.2 0 2-.9 2.4-3.6 1.8-5.3-.4-1.1.3-1.8 0-3-.3-1.2-1.3-1.5-2.2-.6" />
          <path d="M12 13.2V.9M10.8 15.8h2.4M10.8 17.9h2.4" /><path d="M10.6 1.6h-1M13.4 1.6h1M10.6 3.2h-1M13.4 3.2h1" />
        </g>
      </svg>
    );
  }
  if (instrument === 'veena') {
    // Lying across: the round resonator, the long neck with its frets, the yali head curling up, the gourd beneath.
    return (
      <svg {...props}>
        <circle cx="17.6" cy="13.2" r="4.4" /><path d="M13.3 12.1H3.4M13.3 14.1H3.4" /><path d="M3.4 12.1c-1.3-.2-1.8-1.4-1.2-2.6.5-.9 1.6-1 2.1-.4" />
        <path d="M6 12.1v2M8.2 12.1v2M10.2 12.1v2" /><circle cx="6.4" cy="17.4" r="2.2" /><path d="M6.4 14.1v1.1" />
      </svg>
    );
  }
  if (instrument === 'tabla') {
    // The bayan, round and low, and beside it the taller dayan, each with its black centre.
    return (
      <svg {...props}>
        <path d="M2.6 15.2c0-2.9 2.4-4.7 5.6-4.7s5.6 1.8 5.6 4.7-2.4 4.9-5.6 4.9-5.6-2-5.6-4.9Z" /><ellipse cx="8.2" cy="11.2" rx="4.4" ry="1.2" />
        <path d="M15.1 8.4h5.8l-.7 11.1h-4.4z" /><ellipse cx="18" cy="8.4" rx="2.9" ry=".9" />
        <circle cx="8.2" cy="11.2" r=".7" fill="currentColor" stroke="none" /><circle cx="18" cy="8.4" r=".5" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (instrument === 'handpan') {
    // Two shells seen from the side: the ding's dome on top and a tone field each side.
    return (
      <svg {...props}>
        <path d="M2.3 13.2c2-3.8 5.6-5.8 9.7-5.8s7.7 2 9.7 5.8c-2.1 2.5-5.7 3.8-9.7 3.8s-7.6-1.3-9.7-3.8Z" /><path d="M2.3 13.2h19.4" />
        <path d="M10 7.6c.4-1.2 1.1-1.9 2-1.9s1.6.7 2 1.9" /><ellipse cx="7" cy="10.7" rx="1.4" ry=".7" /><ellipse cx="17" cy="10.7" rx="1.4" ry=".7" />
      </svg>
    );
  }
  if (instrument === 'drums') {
    return (
      <svg {...props}>
        <ellipse cx="12" cy="11.5" rx="7.5" ry="2.6" /><path d="M4.5 11.5v5.2c0 1.5 3.4 2.7 7.5 2.7s7.5-1.2 7.5-2.7v-5.2" /><path d="M8 13.9v5.2M16 13.9v5.2M12 14.1v5.3" />
        <path d="m4.2 3.4 6.3 5.6M19.8 3.4l-6.3 5.6" /><circle cx="4" cy="3.2" r=".9" fill="currentColor" stroke="none" /><circle cx="20" cy="3.2" r=".9" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (instrument === 'guitar') {
    return (
      <svg {...props}>
        <g transform="translate(12 12) rotate(42) scale(1.2) translate(-12 -10.9)">
          <path d="M12 9.2c2.1 0 3.1 1.3 2.8 2.9-.2 1-.5 1.3.3 2 1.5 1.3 1.6 3.9.1 5.5-1.3 1.4-5.1 1.4-6.4 0-1.5-1.6-1.4-4.2.1-5.5.8-.7.5-1 .3-2C8.9 10.5 9.9 9.2 12 9.2Z" />
          <circle cx="12" cy="14.6" r="1.25" /><path d="M12 9.2V2.6M10.9 18.4h2.2" /><path d="M11 1.2h2l-.2 1.6h-1.6z" fill="currentColor" />
        </g>
      </svg>
    );
  }
  return (
    <svg {...props}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" /><path d="M9 12.5v7M15 12.5v7" />
      <rect x="7.4" y="4.5" width="3.2" height="7.6" rx=".6" fill="currentColor" stroke="none" /><rect x="13.4" y="4.5" width="3.2" height="7.6" rx=".6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function StudioHeader({ score, settings, onInstrumentChange, freePlay, onFreePlay, focus, onFocus, instrumentSettings = null }) {
  const current = normalizeInstrument(settings.practiceInstrument);
  // On a phone the header keeps the title and one button; the rest opens as a sheet (chrome.css).
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = () => setSheetOpen(false);
  useEffect(() => {
    if (!sheetOpen) return undefined;
    const onKey = event => { if (event.key === 'Escape') setSheetOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheetOpen]);
  const sheetLabel = `${instrumentInfo(current).label} · ${freePlay ? 'Free play' : 'Learn'}`;
  return (
    <div className="studio-header">
      <div className="studio-heading">
        <h1 tabIndex={-1}>{freePlay ? 'A little room to improvise.' : score?.title ?? 'Choose your next piece'}</h1>
        <p title={score?.title}>{freePlay ? 'Explore your instrument. Nothing is scored or saved.' : (score?.composer ?? 'Your practice session')}<span>{!freePlay && ` · ${Math.round((score?.bpm ?? 80) * settings.rate)} bpm · ${score?.key?.name ?? ''}`}</span></p>
      </div>
      <button className="header-sheet-toggle" aria-expanded={sheetOpen} aria-label={`${sheetLabel}. Change instrument or workspace`} onClick={() => setSheetOpen(open => !open)}><InstrumentIcon instrument={familyOf(current)} /><span>{sheetLabel}</span><Icon name="chevronDown" size={14} /></button>
      {sheetOpen && <div className="header-sheet-scrim" onClick={closeSheet} />}
      <div className={`studio-header-actions ${sheetOpen ? 'open' : ''}`}><div className="workspace-switch" role="group" aria-label="Workspace"><button aria-pressed={!freePlay} onClick={() => { closeSheet(); onFreePlay(false); }}>Learn</button><button aria-pressed={freePlay} onClick={() => { closeSheet(); onFreePlay(true); }}>Free play</button></div>
      <InstrumentButtons className="instrument-picker" label="Practice instrument" current={current}
        onPick={value => { closeSheet(); onInstrumentChange(chooseVariant(settings.variants, value)); }}
        buttonProps={value => ({ 'aria-label': instrumentInfo(value).label, title: `${instrumentInfo(value).label} · ${instrumentInfo(value).tagline}` })}
        content={value => <><InstrumentIcon instrument={value} /><span>{instrumentInfo(value).label}</span></>} />{instrumentSettings}<span id="practice-settings-slot" className="practice-settings-slot" /><button className="focus-toggle" aria-pressed={focus} onClick={() => { closeSheet(); onFocus(); }} title={focus ? 'Show everything again (Esc)' : 'Hide panels and settings — just the music'}><Icon name={focus ? 'minimize' : 'focus'} size={14} />{focus ? 'Exit focus' : 'Focus'}</button></div>
    </div>
  );
}

/** What the stage is showing and the one thing to do with it. The studio footer carries it. */
export function stageCaption(instrument = 'piano', freePlay = false, technique = 'bow') {
  const stringed = isStringed(instrument), kit = stringKit(instrument);
  const name = instrumentInfo(instrument).label.toUpperCase();
  if (instrument === 'drums') return { caption: freePlay ? name : 'DRUM LANES', description: freePlay ? 'Tap a drum, or press the letter it starts with' : 'Hit each drum as its tile reaches the line' };
  if (instrument === 'tabla') return { caption: freePlay ? name : 'TABLA BOLS', description: freePlay ? 'Tap a drum, or press the letter a bol is spoken with' : 'Play each bol as its tile reaches the line' };
  if (instrument === 'handpan') return { caption: freePlay ? name : 'HANDPAN NOTES', description: freePlay ? 'Tap a note, or press its key' : 'Strike each note as its tile reaches the line' };
  return {
    caption: freePlay ? name : !stringed ? 'PIANO ROLL' : kit.bowed ? `${name} FINGERS` : `${name} TAB`,
    description: freePlay ? (kit?.bowed ? (technique === 'fingers' ? 'Press a place to pluck it' : 'Press and hold a place to bow it') : 'Click a note or play your controller')
      : !stringed ? 'Play as the notes reach the line' : kit.bowed ? 'Numbers show the finger to use' : 'Numbers show the fret to play',
  };
}

/** The settings of the instrument on stage. Sits beside the instrument picker in the studio header. */
export function InstrumentSettings({ settings, setSettings, instrument = 'piano', children }) {
  const stringed = isStringed(instrument), kit = stringKit(instrument);
  const [open, setOpen] = useState(false);
  const ref = useDialog({ open, onClose: () => setOpen(false) });
  const available = webglAvailable();
  const renderer = available ? settings.renderer : 'canvas';
  const quality = normalizeStageQuality(settings.stageQuality);
  return (
      <div className="popover-host instrument-settings-host">
      <button className="instrument-settings-toggle" aria-expanded={open} aria-haspopup="dialog" title="Instrument settings" onClick={() => setOpen(v => !v)}><Icon name="sliders" size={15} /><span>Instrument settings</span></button>
      {open && <><div className="popover-scrim" onClick={() => setOpen(false)} /><div className="popover instrument-settings-panel" ref={ref} role="dialog" aria-modal="true" aria-label="Instrument settings" tabIndex={-1}>
      <div className="settings-heading"><strong>Instrument settings</strong><button aria-label="Close instrument settings" onClick={() => setOpen(false)}>×</button></div>
      <p className="hint">{kit?.bowed ? `On the 3D Stage at full detail the ${kit.label.toLowerCase()} is a 3D model; at light detail it keeps the 2D fingerboard.` : kit?.stage === 'model' ? `On the 3D Stage at full detail the ${kit.label.toLowerCase()} is a 3D model; at light detail it keeps the drawn fretboard.` : kit?.fretted && !kit.stage ? `The ${kit.label.toLowerCase()} is played on its drawn fretboard; it has no 3D model yet.` : 'Choose how your instrument looks and responds.'} 2D or 3D is chosen on the stage itself.</p>
      {renderer === 'gl' && stringed && <><span className="settings-label">3D detail</span>
      <div className="stage-view-switch" role="group" aria-label="3D detail">
        {STAGE_QUALITIES.map(value => <button key={value} aria-pressed={quality === value} title={QUALITY_CHOICES[value]?.title}
          onClick={() => setSettings(s => ({ ...s, stageQuality: value }))}>{QUALITY_CHOICES[value]?.label ?? value}</button>)}
      </div>
      <p className="hint stage-detail-note" role="status">{explainStageDetail({ quality, tier: stageTierHere(quality), rendererName: webglRendererName() })}</p></>}
      {children}
      </div></>}
      </div>
  );
}
