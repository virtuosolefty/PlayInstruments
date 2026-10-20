/**
 * recipes.mjs — what each downloaded instrument is made of, and how it sits on the stage.
 *
 * prepare.mjs does the same work for every instrument; a recipe tells it which
 * pieces are which, which way the model faces, and how big its textures may be.
 * Pieces are told apart by shape, measured against the model's own length, so
 * the rules hold whatever units the artist modelled in.
 *
 * Stage axes, shared with the guitar built in code: x runs along the strings
 * from the head of the instrument toward its body, y points out of the playing
 * surface, z runs across the strings. `axes` gives, for each stage axis, the
 * model axis it comes from (with its sign).
 */

import { creditLine, modelCredit } from '../../src/lib/stage/modelCredits.js';

/** Size of `piece` along `axis` as a share of the model's length. */
const share = (piece, axis, model) => piece.box.size[axis] / model.length;

/** The credit written into the model's file, from the app's one list of credits. */
const credit = model => {
  const { title, author, authorUrl, source, license, licenseUrl } = modelCredit(model);
  return { title, author, authorUrl, source, license, licenseUrl, line: creditLine(modelCredit(model)) };
};

/**
 * Where a string plays that rises over a bridge partway along the instrument
 * and runs on down to a tailpiece (the veena's): from where it levels out past
 * the nut, at the head end, to its crest. `centres` run from the head (see
 * `ringCentres` in fit.mjs); `up` is the model axis that points out of the
 * playing surface.
 */
const crestSpan = (along, up, steepest = 0.05) => centres => {
  const crest = centres.reduce((best, c, i) => (c[up] > centres[best][up] ? i : best), 0);
  const slope = i => Math.abs((centres[i + 1][up] - centres[i][up]) / (centres[i + 1][along] - centres[i][along]));
  // Up from the pegs the string climbs steeply to the nut, then barely rises.
  let nut = 0;
  while (nut < crest && slope(nut) > steepest) nut++;
  return { from: centres[nut], to: centres[crest] };
};

/** Standing as it was made: up is the model's y. */
const UPRIGHT = [[0, 1], [1, 1], [2, 1]];
/**
 * For an instrument that is played, made lying along x with its head toward
 * +x and its top toward +y: turned half round, so the stage's x runs from the
 * head to the body.
 */
const HEAD_TOWARD_X = { lengthAxis: 0, headAt: 'max', axes: [[0, -1], [1, 1], [2, -1]] };

/**
 * A model that is only shown (showcase.mjs): `axes` stands it up, and `view`
 * is the angle the viewer first sees it from, in degrees round it and above it.
 * `omit` names the materials of anything left out, which the model's credit
 * (modelCredits.js) then has to say. `zones` is for a drum kit that answers to
 * being hit: where each drum stands, in stage units (see `drumZonePart`), so
 * that each is a part of its own.
 */
const shown = (model, { axes = UPRIGHT, view, imageSize = 1024, omit = () => false, zones, keys = false, simplify, liftDarkMaterials, retone }) => ({
  showcase: true,
  zones,
  keys,
  simplify,
  liftDarkMaterials,
  retone,
  lean: true,
  credit: credit(model),
  axes,
  view,
  omit,
  imageSize: (image, role) => (typeof imageSize === 'function' ? imageSize(image, role) : imageSize),
});

// The guitar's parts are already separate meshes, named by their materials.
const GUITAR_PARTS = {
  body1: 'top', body2: 'sides', body3: 'back', body_facets_guitar: 'binding', bridge: 'bridge',
  'neck-head': 'neck', neck2: 'fretboard', 'bridge-pins-saddle-nut': 'hardware', frets: 'frets',
  'string5-6': 'string', 'string1-2-3-4': 'string', pattern: 'rosette', tuning: 'tuners',
};

export const RECIPES = {
  guitar: {
    credit: credit('guitar'),
    // Model: neck along z with the headstock toward −z, top facing +y, bass strings toward −x.
    lengthAxis: 2,
    headAt: 'min',
    axes: [[2, 1], [1, 1], [0, -1]],
    strings: 6,
    classify: piece => GUITAR_PARTS[piece.material] ?? 'other',
    /** Frets are measured too: the fret maths has to land on them. */
    frets: piece => piece.material === 'frets',
    imageSize: () => 1024,
  },

  violin: {
    credit: credit('violin'),
    // Model: one mesh along z with the scroll toward −z, top facing +y.
    lengthAxis: 2,
    headAt: 'min',
    axes: [[2, 1], [1, 1], [0, -1]],
    strings: 4,
    classify(piece, model) {
      if (share(piece, 2, model) > 0.6 && share(piece, 0, model) < 0.05) return 'string';
      if (share(piece, 2, model) < 0.01 && share(piece, 0, model) > 0.05 && share(piece, 0, model) < 0.15 && share(piece, 1, model) > 0.03) return 'bridge';
      return piece.largest ? 'body' : 'fittings';
    },
    imageSize: (image, role) => (role === 'baseColor' ? 2048 : 1024),
  },

  cello: {
    credit: credit('cello'),
    // Model: standing on its endpin along +y with the scroll at the top, front facing +z.
    lengthAxis: 1,
    headAt: 'max',
    axes: [[1, -1], [2, 1], [0, -1]],
    strings: 4,
    classify(piece, model) {
      if (piece.material === 'cello_mat01') return 'body';
      if (share(piece, 1, model) > 0.5 && share(piece, 0, model) < 0.03) return 'string';
      if (share(piece, 1, model) < 0.01 && share(piece, 0, model) > 0.04) return 'bridge';
      if (share(piece, 1, model) > 0.3 && share(piece, 0, model) > 0.03) return 'fingerboard';
      return 'fittings';
    },
    imageSize: (image, role) => (image.includes('mat01') && role === 'baseColor' ? 2048 : role === 'metallicRoughness' && image.includes('mat02') ? 512 : 1024),
  },

  // The instruments the whole-instrument view offers beside the three above. Each reads
  // models-src/<id>/scene.gltf. These three are played there, so they are measured and
  // their strings replaced, exactly as above.

  'guitar-bass': {
    simplify: { ratio: 0.35, error: 0.002 },
    credit: credit('guitar-bass'),
    ...HEAD_TOWARD_X,
    lean: true,
    strings: 4,
    // Each string is a mesh of its own, far longer and thinner than anything else; the neck is as long but far wider.
    classify: (piece, model) => (share(piece, 0, model) > 0.6 && share(piece, 1, model) < 0.03 && share(piece, 2, model) < 0.04 ? 'string' : `part${piece.primIndex}`),
    // One string measures three times too thick, and it is the highest.
    rightHanded: true,
    // Twenty slivers of wire across the neck, each a separate piece of twenty triangles; the nut beside them has twelve.
    frets: (piece, model) => piece.triangles === 20 && share(piece, 0, model) < 0.006 && share(piece, 2, model) > 0.03 && share(piece, 2, model) < 0.07,
    imageSize: () => 1024,
  },

  'violin-electric': {
    liftDarkMaterials: true,
    credit: credit('violin-electric'),
    // Model: standing along y with the scroll at the top, front facing +z, as the cello above.
    lengthAxis: 1,
    headAt: 'max',
    axes: [[1, -1], [2, 1], [0, -1]],
    lean: true,
    strings: 4,
    // Its strings are all one gauge.
    rightHanded: true,
    classify: (piece, model) => (share(piece, 1, model) > 0.6 && share(piece, 0, model) < 0.04 ? 'string' : 'frame'),
    imageSize: () => 1024,
  },

  veena: {
    simplify: { ratio: 0.35, error: 0.002 },
    credit: credit('veena'),
    // Model: lying along x with the yali head toward −x and the strings on top (+y); the three drone strings run
    // along its side toward +z.
    lengthAxis: 0,
    headAt: 'min',
    axes: [[0, 1], [1, 1], [2, 1]],
    lean: true,
    strings: 4,
    // All seven strings are one material; the four that are played run the whole length, the drones about two thirds.
    classify: (piece, model) => (piece.material === 'Material.016' && share(piece, 0, model) > 0.9 ? 'string' : piece.material === 'Material.016' ? 'drones' : `part${piece.primIndex}`),
    rightHanded: true,
    // Sarani, the highest and the one most played, lies nearest the player, beside the drones.
    highestNearest: true,
    // The strings rise gently from the nut to the bridge on the resonator, then fall away to the tailpiece.
    playingSpan: crestSpan(0, 1),
    // Twenty-one brass bars across the neck past the nut's, which the model spaces evenly; prepare.mjs moves each to where equal
    // temperament puts it, so a fret the stage marks is a fret the model has.
    evenFrets: (piece, model) => share(piece, 0, model) < 0.01 && share(piece, 1, model) > 0.005 && share(piece, 1, model) < 0.01 && share(piece, 2, model) > 0.03 && share(piece, 2, model) < 0.06,
    imageSize: () => 1024,
  },

  'cello-antique': {
    simplify: { ratio: 0.5, error: 0.002 },
    credit: credit('cello-antique'),
    ...HEAD_TOWARD_X,
    lean: true,
    strings: 4,
    // Its strings are all one gauge.
    rightHanded: true,
    classify(piece, model) {
      // The material "String" also covers the tail gut and the fine tuners; a string is the long one.
      if (piece.material === 'String') return share(piece, 0, model) > 0.5 ? 'string' : 'fittings';
      return { Body: 'body', Body_NONE: 'body', Bridge: 'bridge', Fingerboard: 'fingerboard', Neck: 'neck' }[piece.material] ?? 'fittings';
    },
    imageSize: (image, role) => (role === 'baseColor' && image.includes('Body') ? 2048 : 1024),
  },

  // These two are shown, not played (showcase.mjs), but each drum is its own part, so a hit moves and lights it.
  // Boxes are in stage units, found by looking at the kit; the kick is listed last because its box holds the others' lower edges.
  // Played on the practice stage at full detail, so it wears that stage's finish: wine lacquer shells (linear colour of
  // #5a1222) in place of teal. Its cymbals share one metal with the stands, so they turn bronze in drumModelRig.js, where
  // each drum has materials of its own. Its white platform and stool go: the stage has its own floor, and from the
  // drummer's side the stool would stand in front of the kit.
  // A grand whose keys are separate pieces: each becomes a part of its own (keyParts, showcase.mjs) and presses as
  // its note plays.
  'piano-grand': shown('piano-grand', { keys: true, view: { azimuthDeg: 30, elevationDeg: 28 } }),
  'drums-acoustic': shown('drums-acoustic', {
    view: { azimuthDeg: 25, elevationDeg: 22 },
    omit: (material, mesh) => mesh === 'Plane.001__0' || material === 'Cylinder.015__0',
    retone: {
      Main_Color: { color: [0.102, 0.006, 0.016], metallic: 0.2, roughness: 0.32 },
    },
    zones: [
      { id: 'crash', at: [3, 10.5, 0, 7.5, 13.5, 4.5], maxSize: 6 },
      { id: 'ride', at: [-10.5, 9.8, -0.5, -5.5, 13, 3.5], maxSize: 7 },
      { id: 'hihat', at: [6, 9.3, -2, 10, 12, 2.5], maxSize: 4.5 },
      { id: 'snare', at: [2, 5.9, -3.5, 6.4, 8.6, 0.8], maxSize: 4 },
      { id: 'tom-high', at: [0, 7.2, -0.8, 3.7, 10.6, 3.4], maxSize: 4.2 },
      { id: 'tom-mid', at: [-3.9, 7, -0.8, -0.4, 10.6, 3.2], maxSize: 4.2 },
      { id: 'tom-floor', at: [-7.4, 3.4, -2.8, -3.4, 8.8, 1.2], maxSize: 4.4 },
      { id: 'kick', at: [-3.7, 0.2, -0.6, 3.4, 7, 4.6], maxSize: 7.2 },
    ],
  }),
  // The tabla: the dayan and the bayan, its 829k triangles mostly the laced ropes, which simplify well. Each drum is a
  // part of its own (zones), so the stage can light and move the one that is struck.
  // Made with the dayan toward −x: turned half round, so from the player's seat (+z) the dayan is on the right, where
  // the right hand plays it, and the bayan on the left.
  tabla: shown('tabla', {
    axes: [[0, -1], [1, 1], [2, -1]],
    simplify: { ratio: 0.1, error: 0.002 },
    view: { azimuthDeg: 0, elevationDeg: 38 },
    // Written in the older specular-glossiness materials: the dayan's wood is a black base under a reddish shine and
    // the bayan's pot a perfect mirror, both black once converted. Given back their wood and their copper.
    retone: {
      korpusklein: { color: [0.2, 0.07, 0.035], metallic: 0, roughness: 0.42 },
      'Material.003': { color: [0.74, 0.45, 0.3], metallic: 1, roughness: 0.3 },
    },
    zones: [
      { id: 'dayan', at: [1.5, -1, -6, 13, 11, 6], maxSize: 13 },
      { id: 'bayan', at: [-13, -1, -7, 1.5, 11, 7], maxSize: 13 },
    ],
  }),
  // Its pads face the drummer, who sits toward −z: seen from that side and above, as on its box.
  // A lead trails a kit's width across the floor to a plug (the parts named EDK-T14): framed with it, the kit is half the size.
  // It has two crash pads and two low toms, and each answers to the one key.
  'drums-electronic': shown('drums-electronic', {
    liftDarkMaterials: true,
    simplify: { ratio: 0.2, error: 0.002 },
    view: { azimuthDeg: 205, elevationDeg: 30 },
    omit: material => material.endsWith('EDK-T14'),
    zones: [
      { id: 'hihat', at: [6.8, 11.5, -1.2, 11.8, 13.6, 4.2], maxSize: 5.6 },
      { id: 'ride', at: [-12, 11.8, -2.2, -6.6, 14.2, 3.4], maxSize: 6 },
      { id: 'crash', at: [2.6, 14, 3.8, 7.6, 16.6, 8.6], maxSize: 5.4 },
      { id: 'crash', at: [-6, 14, 3.8, -1, 16.6, 8.6], maxSize: 5.4 },
      { id: 'tom-high', at: [1.4, 10.2, 2, 5.6, 13.2, 6.2], maxSize: 4.4 },
      { id: 'tom-mid', at: [-3, 10.2, 2, 1.1, 13.2, 6.2], maxSize: 4.4 },
      { id: 'tom-floor', at: [-7.2, 8.1, 0.2, -3.2, 10.5, 4.3], maxSize: 4.4 },
      { id: 'tom-floor', at: [-9, 8.1, -3.9, -5, 10.5, 0.1], maxSize: 4.4 },
      { id: 'snare', at: [2, 6.6, -3, 6.6, 8.8, 1.4], maxSize: 5 },
      { id: 'kick', at: [-0.4, 1.3, 3.4, 2.2, 3.6, 5.8], maxSize: 2.8 },
    ],
  }),
};
