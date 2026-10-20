import Listbox from './Listbox.jsx';
import { playInput } from '../lib/input/playInput.js';
/** @param {object} props @param {string} [props.shownRange] the range drawn when it is not the saved one: a phone fits the piece until a range is picked */
export default function InstrumentControls({ settings, setSettings, shownRange, sustain, onSustain }) {
  const patch = p => setSettings(s => ({...s,...p}));
  return <div className="instrument-controls" aria-label="Piano playing controls">
    <label>Range<Listbox label="Piano visible range" value={shownRange ?? settings.pianoRange ?? 'full'} options={[{value:'fit',label:'Fit piece'},{value:'two',label:'2 octaves'},{value:'full',label:'Full range'}]} onChange={v=>patch({pianoRange:v,pianoRangeChosen:true})} /></label>
    <div className="octave-controls"><button aria-label="Lower keyboard octave" disabled={(settings.typingOctave??0)<=-2} onClick={()=>{playInput.releasePrefix('typing-');patch({typingOctave:(settings.typingOctave??0)-1});}}>−</button><span>Octave {settings.typingOctave??0}</span><button aria-label="Raise keyboard octave" disabled={(settings.typingOctave??0)>=2} onClick={()=>{playInput.releasePrefix('typing-');patch({typingOctave:(settings.typingOctave??0)+1});}}>+</button></div>
    <label>Labels<Listbox label="Keyboard labels" value={settings.pianoLabels??'octaves'} options={[{value:'octaves',label:'Octaves'},{value:'notes',label:'Notes'},{value:'keys',label:'Computer keys'},{value:'off',label:'Off'}]} onChange={v=>patch({pianoLabels:v})} /></label>
    <label>Touch<Listbox label="Piano velocity mode" value={settings.pianoVelocityMode??'fixed'} options={[{value:'fixed',label:'Fixed'},{value:'position',label:'Key position'}]} onChange={v=>patch({pianoVelocityMode:v})} /></label>
    <label className="velocity-control">Strength<input aria-label="Playing strength" type="range" min="0.2" max="1" step="0.01" value={settings.playVelocity??0.72} onChange={e=>patch({playVelocity:+e.target.value})}/></label>
    <label className="velocity-control">Key size<input aria-label="Keyboard height" type="range" min="64" max="230" step="1" value={settings.pianoHeight??104} onChange={e=>patch({pianoHeight:+e.target.value})}/></label>
    <button aria-pressed={sustain} onClick={()=>onSustain(!sustain)}>Sustain {sustain?'on':'off'}</button>
  </div>;
}
