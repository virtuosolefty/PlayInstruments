import { describe, expect, it } from 'vitest';
import { Group } from 'three';
import { KIT_LAYOUT, buildDrumKit } from './drumKitModel.js';
import { STROKE, buildDrumSticks, contactPose, handFor, strikePoint, strokePose } from './drumSticks.js';

describe('which hand, and where it lands', () => {
  it('plays the hi-hat, ride and two lower toms with the right, the rest with the left', () => {
    expect(['hihat', 'ride', 'tom-mid', 'tom-floor'].map(handFor)).toEqual(['right', 'right', 'right', 'right']);
    expect(['snare', 'tom-high', 'crash'].map(handFor)).toEqual(['left', 'left', 'left']);
  });

  it('strikes a drum on its head, a cymbal on its bow, and leaves the kick to the foot', () => {
    expect(strikePoint('kick')).toBeNull();
    const snare = KIT_LAYOUT.find(p => p.id === 'snare');
    const onSnare = strikePoint('snare');
    // On top of the head, a little toward the player.
    expect(onSnare.y).toBeGreaterThan(snare.position[1] + snare.depth / 2 - 0.01);
    expect(onSnare.z).toBeGreaterThan(snare.position[2]);
    const ride = KIT_LAYOUT.find(p => p.id === 'ride');
    const onRide = strikePoint('ride');
    expect(Math.hypot(onRide.x - ride.position[0], onRide.z - ride.position[2])).toBeLessThan(ride.radius);
  });

  it('holds the stick from the player’s side, its tip on the strike point', () => {
    const point = strikePoint('tom-high');
    const pose = contactPose('left', point);
    expect(pose.tip.distanceTo(point)).toBeLessThan(1e-9);
    expect(pose.grip.distanceTo(pose.tip)).toBeCloseTo(0.4, 6);
    expect(pose.grip.z).toBeGreaterThan(point.z);
    expect(pose.grip.y).toBeGreaterThan(point.y);
  });
});

describe('a stroke', () => {
  const point = strikePoint('snare');
  const contact = contactPose('left', point);
  const rest = { grip: contact.grip.clone().setY(1), tip: contact.tip.clone().setY(0.9) };
  const stroke = { from: rest, contact, rest };

  it('reaches the drum, bounces off it, then goes home and ends', () => {
    expect(strokePose(stroke, STROKE.down).tip.distanceTo(point)).toBeLessThan(1e-6);
    const bounced = strokePose(stroke, STROKE.down + STROKE.bounce);
    expect(bounced.tip.y).toBeGreaterThan(point.y + 0.1);
    expect(strokePose(stroke, STROKE.down + STROKE.bounce + STROKE.home + 1)).toBeNull();
  });
});

describe('the sticks on the kit', () => {
  it('moves the hand that plays a piece, lends the other when it is busy, and swings the kick beater', () => {
    const kit = buildDrumKit();
    const sticks = buildDrumSticks({ beater: kit.pieces.get('kick').beater });
    expect(sticks.group).toBeInstanceOf(Group);
    const [left, right] = sticks.group.children;
    const at = stick => stick.position.clone();
    const leftRest = at(left), rightRest = at(right);

    sticks.strike('snare', 1000);
    expect(sticks.update(1000 + STROKE.down, false)).toBe(true);
    expect(at(left).distanceTo(leftRest)).toBeGreaterThan(0.01);
    expect(at(right).distanceTo(rightRest)).toBe(0);

    // A second left-hand piece at once: the right hand takes it.
    sticks.strike('tom-high', 1010);
    sticks.update(1010 + STROKE.down, false);
    expect(at(right).distanceTo(rightRest)).toBeGreaterThan(0.01);

    sticks.strike('kick', 2000);
    sticks.update(2040, false);
    expect(kit.pieces.get('kick').beater.rotation.x).toBeLessThan(0);
    sticks.update(2400, false);
    expect(kit.pieces.get('kick').beater.rotation.x).toBe(0);
  });

  it('strikes another kit where it is told to, and the built kit where it is not', () => {
    const sticks = buildDrumSticks();
    const target = strikePoint('snare').add({ x: 0.1, y: 0.05, z: 0 });
    sticks.aimAt(id => (id === 'snare' ? target : null));
    sticks.strike('snare', 0);
    sticks.update(STROKE.down, false);
    const left = sticks.group.children[0];
    left.updateMatrixWorld(true);
    // The stick's tip is LENGTH along its +y from its grip.
    const tip = left.localToWorld(left.position.clone().set(0, 0.4, 0));
    expect(tip.distanceTo(target)).toBeLessThan(1e-3);
  });

  it('keeps everything at rest for reduced motion', () => {
    const sticks = buildDrumSticks();
    const left = sticks.group.children[0];
    const before = left.position.clone();
    sticks.strike('snare', 0);
    sticks.update(STROKE.down, true);
    expect(left.position.distanceTo(before)).toBe(0);
  });
});
