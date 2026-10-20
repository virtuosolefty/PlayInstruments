import { struckSetFor } from '../lib/struck/struckSets.js';

/**
 * The kit as nine buttons: the way to play it by touch, by keyboard, and with
 * a screen reader. Always present, so the 3D kit is never the only way in.
 *
 * A pad answers on pointer-down, since a drum hit cannot wait for the release
 * that a click needs. A click that came from the keyboard or from assistive
 * technology (it has no pointer behind it) plays too.
 *
 * @param {object} props
 * @param {(id: string) => void} props.onHit
 * @param {Set<string>} [props.next] the pieces to hit next, which are marked
 * @param {boolean} [props.large] the pads are the whole instrument (the 2D trainer), not a strip under the 3D kit
 */
/**
 * What makes a button play `id`: on pointer-down, since a hit cannot wait for the release a click needs, and on a
 * click with no pointer behind it (the keyboard, a screen reader). Shared by the pads, the handpan's map and the
 * tabla's picture.
 */
export const pressProps = (onHit, id) => ({
  onPointerDown: event => { if (event.button > 0) return; onHit(id); },
  onClick: event => { if (event.detail === 0) onHit(id); },
});

export default function DrumPads({ set = struckSetFor('drums'), onHit, next, large = false }) {
  return <div className={`drum-pads ${set.id}-pads ${large ? 'large' : ''}`} role="group" aria-label={set.padsLabel} style={{ '--pad-count': set.pieces.length }}>
    {set.pieces.map(piece => <button key={piece.id} type="button" className={`drum-pad ${piece.limb ?? ''} side-${piece.side} ${next?.has(piece.id) ? 'next' : ''}`}
      data-piece={piece.id} aria-label={`${piece.label}, key ${piece.key.toUpperCase()}`}
      {...pressProps(onHit, piece.id)}>
      <strong>{piece.short}</strong><kbd>{piece.key.toUpperCase()}</kbd>
    </button>)}
  </div>;
}
