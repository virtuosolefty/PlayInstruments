import { useMemo } from 'react';
import { useStageView } from '../hooks/useStageView.js';
import { normalizeStageQuality, STAGE_TIERS } from '../lib/stage/quality.js';
import { stageTierHere } from '../lib/stage/webgl.js';
import StageViewSwitch from './StageViewSwitch.jsx';
import WholeModels from './WholeModels.jsx';

/**
 * The piano's Whole instrument view: in free play at full detail, a switch
 * over the roll between the keyboard you practise on and the grand piano
 * (stageModels.js), shown in the viewer over the roll. The grand's keys go
 * down as you play, whatever you play with (ModelViewer.jsx), so the roll's
 * own keyboard, the computer keys and a controller all still sound.
 *
 * Rendered inside the roll area, which is the stage the viewer covers.
 *
 * @param {object} props
 * @param {boolean} props.freePlay
 * @param {'auto'|'full'|'light'} [props.quality]
 */
export default function PianoWholeView({ freePlay, quality = 'auto' }) {
  const [stageView, setStageView] = useStageView(freePlay ? 'freePlay' : 'lesson');
  const full = useMemo(() => stageTierHere(normalizeStageQuality(quality)) === STAGE_TIERS.FULL, [quality]);
  if (!freePlay || !full) return null;
  const whole = stageView === 'whole';
  return <>
    <WholeModels instrument="piano" active={whole} quality={quality} />
    <div className="piano-stage-views"><StageViewSwitch label="Keyboard" short="Keys" value={whole ? 'whole' : 'learn'} onChange={setStageView} /></div>
  </>;
}
