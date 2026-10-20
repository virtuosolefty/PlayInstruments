import { struckSetFor } from '../lib/struck/struckSets.js';
import { pressProps } from './DrumPads.jsx';

/** How far from the middle of the pan a field sits, as a share of the pan's width. */
const TOP_REACH = 0.34, UNDER_REACH = 0.31;

/**
 * Where a field sits on the map, in percent of its pan: the angle round the pan (handpan.js) as the 3D pan has it,
 * 0 nearest the player, who sits below the map. The underside is seen turned over, so it is mirrored.
 *
 * @returns {{ x: number, y: number }}
 */
export function fieldPlace(piece) {
  if (piece.angle === null || piece.angle === undefined) return { x: 50, y: 50 };
  const under = piece.group === 'Underside', reach = under ? UNDER_REACH : TOP_REACH;
  const angle = (piece.angle * Math.PI) / 180;
  return { x: +(50 + (under ? -1 : 1) * Math.sin(angle) * reach * 100).toFixed(2), y: +(50 + Math.cos(angle) * reach * 100).toFixed(2) };
}

/**
 * The handpan's notes as the pan itself, seen from above: the ding in the middle, the top notes round it where
 * they are on the D Aegean, and the underside beside it, turned over, round the gu. Each field is a button, as the
 * pads are: it plays on press, from the keyboard, and to a screen reader by its name and key.
 *
 * @param {object} props
 * @param {(id: string) => void} props.onHit
 * @param {Set<string>} [props.next] the notes to strike next, which wear the blue ring
 */
export default function HandpanMap({ set = struckSetFor('handpan'), onHit, next }) {
  const field = piece => {
    const { x, y } = fieldPlace(piece);
    return <button key={piece.id} type="button" className={`pan-field ${piece.id === 'ding' ? 'ding' : ''} ${next?.has(piece.id) ? 'next' : ''}`}
      style={{ left: `${x}%`, top: `${y}%` }} data-piece={piece.id} aria-label={`${piece.label}, key ${piece.key.toUpperCase()}`}
      {...pressProps(onHit, piece.id)}>
      <strong>{piece.short}</strong><kbd>{piece.key.toUpperCase()}</kbd>
    </button>;
  };
  const top = set.pieces.filter(piece => piece.group === 'Top'), under = set.pieces.filter(piece => piece.group === 'Underside');
  return <div className="handpan-map drum-pads handpan-pads" role="group" aria-label={set.padsLabel}>
    <div className="pan-side">
      <span className="pan-caption">Top · you sit below it</span>
      <div className="pan top">{top.map(field)}</div>
    </div>
    <div className="pan-side">
      <span className="pan-caption">Underside · turned over</span>
      <div className="pan under"><span className="pan-gu" aria-hidden="true">gu</span>{under.map(field)}</div>
    </div>
  </div>;
}
