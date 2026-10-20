import { struckSetFor } from '../lib/struck/struckSets.js';
import { DRUM_OF, HOW, PICTURE, markerAt } from '../lib/struck/tablaMap.js';
import ModelCredit from './ModelCredit.jsx';
import { pressProps } from './DrumPads.jsx';

/**
 * The tabla as it is: a picture of the two drums, rendered from the 3D model, with each stroke marked where it is
 * struck (tablaMap.js). Each mark is a button, as the pads were: it plays on press, from the keyboard, and to a screen
 * reader by its name ("Na, the rim") and key. On a narrow screen a mark shows its key alone; the lines under the
 * picture say how each drum is played. The picture is the CC BY-NC model's, so its artist is credited on it.
 *
 * @param {object} props
 * @param {(id: string) => void} props.onHit
 * @param {Set<string>} [props.next] the strokes to play next, which wear the blue ring
 */
export default function TablaMap({ set = struckSetFor('tabla'), onHit, next }) {
  const base = import.meta.env.BASE_URL ?? '/';
  return <div className="tabla-map drum-pads tabla-pads" role="group" aria-label={set.padsLabel}>
    <div className="tabla-picture" style={{ aspectRatio: `${PICTURE.width} / ${PICTURE.height}` }}>
      <img src={`${base}${PICTURE.src}`} width={PICTURE.width} height={PICTURE.height} alt="" draggable="false" />
      {set.pieces.map(piece => {
        const at = markerAt(piece.id);
        if (!at) return null;
        return <button key={piece.id} type="button" className={`tabla-stroke on-${DRUM_OF[piece.id]} ${next?.has(piece.id) ? 'next' : ''}`}
          style={{ left: `${at.x}%`, top: `${at.y}%` }} data-piece={piece.id} aria-label={`${piece.label}, key ${piece.key.toUpperCase()}`}
          {...pressProps(onHit, piece.id)}>
          <strong>{piece.short}</strong><kbd>{piece.key.toUpperCase()}</kbd>
        </button>;
      })}
      <ModelCredit id="tabla" className="tabla-picture-credit" />
    </div>
    <p className="tabla-how"><span className="on-bayan">{HOW.bayan}</span><span className="on-dayan">{HOW.dayan}</span></p>
  </div>;
}
