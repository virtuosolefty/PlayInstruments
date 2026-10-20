import { describe, expect, it } from 'vitest';
import { BufferAttribute, BufferGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import { fieldPlace } from '../../components/HandpanMap.jsx';
import { foldedSummary } from '../../components/GuitarWorkspace.jsx';
import { DRONE_LEVEL, TANPURA, droneFor, droneLevel } from '../audio/drone.js';
import { buildDroneVoice } from '../audio/droneVoice.js';
import { HANDPAN } from './handpan.js';
import { stringKit } from '../instruments.js';
import { DRUM_OF, PICTURE, STROKE_PLACES, markerAt } from './tablaMap.js';
import { buildTablaZones, measureHeads } from '../stage/tablaZones.js';
import { TABLA } from './tabla.js';
import { noteName } from '../music/theory.js';

describe('the handpan map', () => {
  it('puts the ding in the middle and every other note round it, where the 3D pan has it', () => {
    expect(fieldPlace(HANDPAN.piece('ding'))).toEqual({ x: 50, y: 50 });
    const places = HANDPAN.pieces.filter(p => p.id !== 'ding').map(fieldPlace);
    for (const { x, y } of places) {
      expect(Math.hypot(x - 50, y - 50)).toBeGreaterThan(25);
      expect(Math.hypot(x - 50, y - 50)).toBeLessThan(40);
    }
    // F#3 (-18°) sits just left of the player's side, A3 (+18°) just right; both below the middle.
    const fs3 = fieldPlace(HANDPAN.pieces.find(p => noteName(p.midi) === 'F#3' && p.group === 'Top'));
    const a3 = fieldPlace(HANDPAN.pieces.find(p => noteName(p.midi) === 'A3'));
    expect(fs3.x).toBeLessThan(50);
    expect(a3.x).toBeGreaterThan(50);
    expect(fs3.y).toBeGreaterThan(50);
  });

  it('mirrors the underside, which is seen turned over', () => {
    const under = HANDPAN.pieces.find(p => p.group === 'Underside' && p.angle > 10 && p.angle < 170);
    expect(fieldPlace(under).x).toBeLessThan(50);
  });
});

describe('where each bol is struck', () => {
  it('places every stroke on its own drum, inside the head in the picture', () => {
    for (const piece of TABLA.pieces) {
      const at = markerAt(piece.id), head = PICTURE.heads[DRUM_OF[piece.id]];
      expect(at, piece.id).toBeTruthy();
      expect(((at.x - head.x) / head.rx) ** 2 + ((at.y - head.y) / head.ry) ** 2, piece.id).toBeLessThanOrEqual(1);
    }
    expect(PICTURE.heads.dayan.x).toBeGreaterThan(PICTURE.heads.bayan.x);
  });

  it('keeps Na on the rim and Tun and Te on the dayan’s black centre', () => {
    expect(STROKE_PLACES.na.zone.outer).toBe(1);
    expect(STROKE_PLACES.na.zone.inner).toBeGreaterThan(0.8);
    for (const id of ['tun', 'te']) expect(STROKE_PLACES[id].zone.outer).toBeLessThan(0.5);
  });

  it('measures a head and rings each stroke there on the 3D tabla, the rim on the rim and the rest on the skin', () => {
    // A drum: a flat skin of radius 1 at height 0.9 and a rope rim of radius 1 at height 1.
    const ring = (r, y, n = 48) => Array.from({ length: n }, (_, i) => [Math.cos((i / n) * Math.PI * 2) * r, y, Math.sin((i / n) * Math.PI * 2) * r]);
    const points = [...ring(1, 1), ...ring(0.3, 0.9), ...ring(0.1, 0.9), ...ring(1, 0)].flat();
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(Float32Array.from(points), 3));
    const drum = new Group();
    drum.add(new Mesh(geometry, new MeshBasicMaterial()));
    drum.updateMatrixWorld(true);
    const heads = measureHeads(new Map([['dayan', [drum]]]));
    expect(heads.dayan.y).toBeCloseTo(1, 3);
    expect(heads.dayan.skinY).toBeCloseTo(0.9, 3);
    expect(heads.dayan.r).toBeGreaterThan(0.9);
    const zones = buildTablaZones(new Map([['dayan', [drum]]]));
    const na = zones.group.find(m => m.name === 'tabla-zone-na'), tun = zones.group.find(m => m.name === 'tabla-zone-tun');
    expect(na.position.y).toBeGreaterThan(tun.position.y);
    expect(zones.group.every(m => m.material.opacity === 0)).toBe(true);
    zones.mark(new Set(['na']), '#6eb4ff');
    expect(na.material.opacity).toBeGreaterThan(0);
    expect(tun.material.opacity).toBe(0);
    zones.flash('tun', '#5ad79a', 1, 0);
    expect(zones.update(100)).toBe(true);
    expect(tun.material.opacity).toBeGreaterThan(0.5);
    expect(zones.update(1000)).toBe(false);
    expect(tun.material.opacity).toBe(0);
  });
});

describe('the drone', () => {
  it('is offered for the veena and the handpan, Sa and Pa on D, plucked in a tanpura’s order', () => {
    expect(droneFor('veena')).toBe(TANPURA);
    expect(droneFor('handpan')).toBe(TANPURA);
    expect(droneFor('guitar')).toBeNull();
    expect(TANPURA.map(noteName)).toEqual(['A2', 'D3', 'D3', 'D2']);
    expect(droneLevel({})).toBe(DRONE_LEVEL.default);
    expect(droneLevel({ droneLevel: 99 })).toBe(DRONE_LEVEL.max);
  });

  it('plucks its strings in turn on its own timer, and lets them fade when stopped', () => {
    const plucks = [], ramps = [];
    let tick = null;
    class Node { constructor() { this.gain = { rampTo: v => ramps.push(v) }; } connect() { return this; } dispose() {} }
    class PolySynth extends Node { triggerAttackRelease(name) { plucks.push(name); } }
    const Tone = { Gain: Node, Filter: Node, PolySynth, Synth: Node, now: () => 0, dbToGain: db => 10 ** (db / 20), Frequency: midi => ({ toNote: () => noteName(midi) }) };
    const voice = buildDroneVoice(Tone, {}, { setTimer: fn => { tick = fn; return 1; }, clearTimer: () => { tick = null; } });
    voice.start(TANPURA);
    tick(); tick(); tick(); tick();
    expect(plucks).toEqual(['A2', 'D3', 'D3', 'D2', 'A2']);
    expect(voice.running).toBe(true);
    voice.stop();
    expect(voice.running).toBe(false);
    expect(ramps.at(-1)).toBe(0);
  });
});

describe('free play on a phone', () => {
  it('folds the card to one line that says what is in it', () => {
    expect(foldedSummary(stringKit('veena'), null)).toBe('Open strings · Sa Pa Sa Pa');
    expect(foldedSummary(stringKit('bass'), null)).toBe('Open strings · E A D G');
    expect(foldedSummary(stringKit('guitar'), { name: 'Em' })).toMatch(/^Chords/);
  });
});
