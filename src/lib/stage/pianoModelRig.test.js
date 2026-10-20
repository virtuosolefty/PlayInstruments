import { describe, expect, it } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { buildPianoModelRig } from './pianoModelRig.js';

/** A keyboard of three keys and the case they sit in, all sharing one material as a downloaded piano does. */
function piano() {
  const shared = new MeshStandardMaterial({ color: '#ffffff' });
  const scene = new Group();
  const key = (name, x) => {
    const node = new Group();
    node.name = name;
    node.position.set(x, 3, 6);
    node.add(new Mesh(new BoxGeometry(0.4, 0.4, 3), shared));
    return node;
  };
  const c = key('key-60', 0), cSharp = key('key-61', 0.3), d = key('key-62', 0.5);
  const lid = new Mesh(new BoxGeometry(10, 1, 10), shared);
  lid.name = 'part0';
  scene.add(c, cSharp, d, lid);
  return { scene, c, cSharp, d, lid, shared };
}
const material = node => node.children[0].material;

describe('a modelled piano whose keys answer to playing', () => {
  it('finds each key by its note, makes it pickable, and gives it a material of its own', () => {
    const { scene, c, d, lid, shared } = piano();
    const rig = buildPianoModelRig(scene);
    expect(rig.keys).toEqual([60, 61, 62]);
    expect(rig.targets).toHaveLength(3);
    expect(rig.targets.map(mesh => mesh.userData.midi)).toEqual([60, 61, 62]);
    expect(material(c)).not.toBe(shared);
    expect(material(c)).not.toBe(material(d));
    expect(lid.material).toBe(shared);
  });

  it('presses and lights the key whose note sounds, and only that key', () => {
    const { scene, c, d } = piano();
    const rig = buildPianoModelRig(scene);
    rig.press(60, '#5ab8ff', 0);
    expect(rig.update(60)).toBe(true);
    expect(c.position.y).toBeLessThan(3);
    expect(material(c).emissive.getHex()).not.toBe(0);
    expect(d.position.y).toBe(3);
    expect(material(d).emissive.getHex()).toBe(0);
  });

  it('lets the key back up when the note ends, and rests once it is there', () => {
    const { scene, c } = piano();
    const rig = buildPianoModelRig(scene);
    rig.press(60, '#5ab8ff', 0);
    rig.update(100);
    rig.release(60, 100);
    rig.update(1000);
    expect(c.position.y).toBe(3);
    expect(material(c).emissive.getHex()).toBe(0);
    expect(rig.update(1100)).toBe(false);
  });

  it('only lights a key when motion is reduced', () => {
    const { scene, c } = piano();
    const rig = buildPianoModelRig(scene, { reducedMotion: () => true });
    rig.press(60, '#5ab8ff', 0);
    rig.update(100);
    expect(c.position.y).toBe(3);
    expect(material(c).emissive.getHex()).not.toBe(0);
  });

  it('gives the keys plain ivory and ebony, so the colours beside them in a texture cannot bleed in', () => {
    const { scene, c, cSharp, lid, shared } = piano();
    shared.map = { isTexture: true };
    buildPianoModelRig(scene);
    expect(material(c).map).toBeNull();
    expect(material(cSharp).map).toBeNull();
    expect(material(c).color.getHexString()).toBe('f2eee4');
    expect(material(cSharp).color.getHexString()).toBe('141217');
    expect(lid.material.map).toEqual({ isTexture: true });
  });

  it('ignores notes the model has no key for', () => {
    const rig = buildPianoModelRig(piano().scene);
    expect(() => rig.press(20, '#5ab8ff', 0)).not.toThrow();
    expect(rig.update(10)).toBe(false);
  });
});
