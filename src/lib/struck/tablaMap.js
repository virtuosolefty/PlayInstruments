/**
 * tablaMap.js — where on the tabla each bol is struck, for the 2D picture (TablaMap.jsx) and the 3D stage
 * (TablaStage.jsx), so both teach the same place.
 *
 * A place is given on the drum's head, as a share of the head's radius: `u` to the player's right, `v` toward the
 * player. `zone` is the band of the head the stroke uses (`inner` to `outer`, as shares of the radius, round
 * `centre`), which the 3D stage lights; `at` is where its marker sits in the picture.
 */

/** Which drum each stroke is played on. */
export const DRUM_OF = Object.freeze({ na: 'dayan', tin: 'dayan', tun: 'dayan', te: 'dayan', ge: 'bayan', ke: 'bayan' });

/**
 * Each stroke's place on its head. The bayan's black spot sits off-centre, toward the player and the dayan, as on a
 * real bayan; Ke is played flat across it, Ge on the open skin beyond.
 */
export const STROKE_PLACES = Object.freeze({
  na: Object.freeze({ zone: Object.freeze({ inner: 0.86, outer: 1, centre: [0, 0] }), at: [0.9, -0.28] }),
  tin: Object.freeze({ zone: Object.freeze({ inner: 0.5, outer: 0.84, centre: [0, 0] }), at: [0.62, 0.7] }),
  tun: Object.freeze({ zone: Object.freeze({ inner: 0, outer: 0.44, centre: [0, 0] }), at: [-0.32, -0.04] }),
  te: Object.freeze({ zone: Object.freeze({ inner: 0, outer: 0.44, centre: [0, 0] }), at: [0.3, -0.14] }),
  ge: Object.freeze({ zone: Object.freeze({ inner: 0.45, outer: 0.85, centre: [0, 0] }), at: [-0.36, -0.4] }),
  ke: Object.freeze({ zone: Object.freeze({ inner: 0, outer: 0.34, centre: [0.06, 0.16] }), at: [0.1, 0.2] }),
});

/**
 * The heads in the picture public/media/tabla-from-above.webp, measured when it was rendered from the 3D model
 * (centre and radii as percent of the picture's width and height).
 */
export const PICTURE = Object.freeze({
  src: 'media/tabla-from-above.webp', width: 960, height: 560,
  heads: Object.freeze({
    dayan: Object.freeze({ x: 75.65, y: 37.87, rx: 13.95, ry: 20.37 }),
    bayan: Object.freeze({ x: 30.25, y: 39.14, rx: 20.9, ry: 30.74 }),
  }),
});

/** Where a stroke's marker sits in the picture, in percent of its width and height. */
export function markerAt(strokeId) {
  const place = STROKE_PLACES[strokeId], head = PICTURE.heads[DRUM_OF[strokeId]];
  if (!place || !head) return null;
  const [u, v] = place.at;
  return { x: +(head.x + u * head.rx).toFixed(2), y: +(head.y + v * head.ry).toFixed(2) };
}

/** How each drum is played, in one line, under the picture. */
export const HOW = Object.freeze({
  bayan: 'Bayan, left hand: Ge with the middle fingers on the open skin, lifted at once; Ke with the hand flat, held.',
  dayan: 'Dayan, right hand: Na on the rim, Tin just inside it, Tun and Te on the black centre, open or closed.',
});
