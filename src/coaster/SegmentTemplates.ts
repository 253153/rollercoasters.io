import * as THREE from 'three';
import { SegmentDefinition, SegmentCategory } from '../app/types';

/**
 * All segments define control points in local space:
 *   +Z = forward (direction of travel)
 *   +Y = up
 *   +X = right
 *
 * First point is always (0, 0, 0) — the entry.
 * Points are spaced to give CatmullRom enough shape.
 */

function seg(
  id: string,
  category: SegmentCategory,
  opts: {
    weight?: number;
    thrillRating?: number;
    inversionCount?: number;
    minSpeed?: number;
    maxSpeed?: number;
    tags?: string[];
    cooldownTags?: string[];
  },
  pointsFn: () => THREE.Vector3[]
): SegmentDefinition {
  return {
    id,
    category,
    weight: opts.weight ?? 1,
    thrillRating: opts.thrillRating ?? 1,
    inversionCount: opts.inversionCount ?? 0,
    minSpeed: opts.minSpeed ?? 0,
    maxSpeed: opts.maxSpeed ?? 100,
    tags: opts.tags ?? [],
    cooldownTags: opts.cooldownTags ?? [],
    buildLocalCurvePoints: pointsFn,
  };
}

function v(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x, y, z);
}

// ------------------------------------------------------------------
// SEGMENT TEMPLATES
// ------------------------------------------------------------------

const stationStart = seg('stationStart', 'start', {
  weight: 0, thrillRating: 0, tags: ['station'],
}, () => [
  v(0, 0, 0),
  v(0, 0, 10),
  v(0, 0, 20),
  v(0, 0, 30),
]);

const liftHill = seg('liftHill', 'lift', {
  weight: 0, thrillRating: 1, tags: ['lift'], minSpeed: 3,
}, () => [
  v(0, 0, 0),
  v(0, 5, 15),
  v(0, 20, 35),
  v(0, 40, 55),
  v(0, 55, 70),
  v(0, 65, 85),
  v(0, 70, 100),
]);

const firstDrop = seg('firstDrop', 'drop', {
  weight: 0, thrillRating: 5, tags: ['drop', 'speed-gain'],
}, () => [
  v(0, 0, 0),
  v(0, -5, 8),
  v(0, -22, 20),
  v(0, -42, 35),
  v(0, -52, 50),
  v(0, -56, 65),
  v(0, -55, 80),
]);

const straight = seg('straight', 'transition', {
  weight: 3, thrillRating: 0, tags: ['flat'],
}, () => [
  v(0, 0, 0),
  v(0, 0, 12),
  v(0, 0, 24),
  v(0, 0, 36),
]);

const gentleLeftBank = seg('gentleLeftBank', 'turn', {
  weight: 3, thrillRating: 2, tags: ['turn', 'left'],
  cooldownTags: ['left'],
}, () => [
  v(0, 0, 0),
  v(-4, 0, 12),
  v(-12, 0, 28),
  v(-22, 0, 38),
  v(-30, 0, 42),
]);

const gentleRightBank = seg('gentleRightBank', 'turn', {
  weight: 3, thrillRating: 2, tags: ['turn', 'right'],
  cooldownTags: ['right'],
}, () => [
  v(0, 0, 0),
  v(4, 0, 12),
  v(12, 0, 28),
  v(22, 0, 38),
  v(30, 0, 42),
]);

const sTurn = seg('sTurn', 'turn', {
  weight: 2, thrillRating: 2, tags: ['turn'],
}, () => [
  v(0, 0, 0),
  v(-6, 0, 10),
  v(-10, 0, 22),
  v(-6, 0, 34),
  v(6, 0, 46),
  v(10, 0, 58),
  v(6, 0, 70),
  v(0, 0, 80),
]);

const camelback = seg('camelback', 'hill', {
  weight: 3, thrillRating: 3, tags: ['hill', 'airtime'],
}, () => [
  v(0, 0, 0),
  v(0, 8, 10),
  v(0, 15, 22),
  v(0, 8, 34),
  v(0, 0, 44),
]);

const bunnyHops = seg('bunnyHops', 'hill', {
  weight: 2, thrillRating: 3, tags: ['hill', 'airtime'],
  cooldownTags: ['airtime'],
}, () => [
  v(0, 0, 0),
  v(0, 6, 8),
  v(0, 0, 16),
  v(0, 6, 24),
  v(0, 0, 32),
  v(0, 6, 40),
  v(0, 0, 48),
]);

const helixLeft = seg('helixLeft', 'turn', {
  weight: 2, thrillRating: 4, tags: ['helix', 'turn', 'left'],
  cooldownTags: ['helix'],
}, () => {
  const pts: THREE.Vector3[] = [];
  const radius = 25;
  const steps = 16;
  const totalAngle = Math.PI * 1.5;
  const descent = -3;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * totalAngle;
    const x = -radius + Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = t * descent;
    pts.push(v(x, y, z));
  }
  return pts;
});

const helixRight = seg('helixRight', 'turn', {
  weight: 2, thrillRating: 4, tags: ['helix', 'turn', 'right'],
  cooldownTags: ['helix'],
}, () => {
  const pts: THREE.Vector3[] = [];
  const radius = 25;
  const steps = 16;
  const totalAngle = Math.PI * 1.5;
  const descent = -3;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * totalAngle;
    const x = radius - Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = t * descent;
    pts.push(v(x, y, z));
  }
  return pts;
});

const verticalLoop = seg('verticalLoop', 'inversion', {
  weight: 1, thrillRating: 7, inversionCount: 1,
  tags: ['inversion', 'loop'], cooldownTags: ['inversion'],
  minSpeed: 20,
}, () => {
  const pts: THREE.Vector3[] = [];
  const radius = 16;
  const steps = 24;
  // Teardrop loop shape (wider at bottom) in the YZ plane
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * Math.PI * 2;
    // Slight teardrop: larger radius at bottom, smaller at top
    const r = radius * (1 - 0.2 * Math.sin(angle));
    const y = r * (1 - Math.cos(angle));
    const z = r * Math.sin(angle);
    pts.push(v(0, y, z));
  }
  return pts;
});

const corkscrewLeft = seg('corkscrewLeft', 'inversion', {
  weight: 1, thrillRating: 6, inversionCount: 1,
  tags: ['inversion', 'corkscrew'], cooldownTags: ['inversion'],
  minSpeed: 18,
}, () => {
  const pts: THREE.Vector3[] = [];
  const steps = 20;
  const forwardDist = 45;
  const radius = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * Math.PI * 2;
    const x = -Math.sin(angle) * radius;
    const y = (1 - Math.cos(angle)) * radius;
    const z = t * forwardDist;
    pts.push(v(x, y, z));
  }
  return pts;
});

const corkscrewRight = seg('corkscrewRight', 'inversion', {
  weight: 1, thrillRating: 6, inversionCount: 1,
  tags: ['inversion', 'corkscrew'], cooldownTags: ['inversion'],
  minSpeed: 18,
}, () => {
  const pts: THREE.Vector3[] = [];
  const steps = 20;
  const forwardDist = 45;
  const radius = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * Math.PI * 2;
    const x = Math.sin(angle) * radius;
    const y = (1 - Math.cos(angle)) * radius;
    const z = t * forwardDist;
    pts.push(v(x, y, z));
  }
  return pts;
});

const inlineTwist = seg('inlineTwist', 'inversion', {
  weight: 1, thrillRating: 7, inversionCount: 1,
  tags: ['inversion', 'twist'], cooldownTags: ['inversion'],
  minSpeed: 18,
}, () => {
  const pts: THREE.Vector3[] = [];
  const steps = 20;
  const forwardDist = 50;
  const radius = 6;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * Math.PI * 2;
    const x = Math.sin(angle) * radius;
    const y = (1 - Math.cos(angle)) * radius;
    const z = t * forwardDist;
    pts.push(v(x, y, z));
  }
  return pts;
});

const zeroGRoll = seg('zeroGRoll', 'inversion', {
  weight: 1, thrillRating: 8, inversionCount: 1,
  tags: ['inversion', 'roll', 'airtime'], cooldownTags: ['inversion'],
  minSpeed: 20,
}, () => {
  const pts: THREE.Vector3[] = [];
  const steps = 24;
  const forwardDist = 55;
  const radius = 7;
  const liftHeight = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * Math.PI * 2;
    // Parabolic hill profile while rolling
    const hillT = 4 * t * (1 - t);
    const x = Math.sin(angle) * radius;
    const y = (1 - Math.cos(angle)) * radius * 0.5 + hillT * liftHeight;
    const z = t * forwardDist;
    pts.push(v(x, y, z));
  }
  return pts;
});

const brakeRun = seg('brakeRun', 'brake', {
  weight: 0, thrillRating: 0, tags: ['brake', 'flat'],
}, () => [
  v(0, 0, 0),
  v(0, 0, 10),
  v(0, 0, 20),
  v(0, 0, 35),
  v(0, 0, 50),
]);

// ------------------------------------------------------------------

export const ALL_SEGMENT_TEMPLATES: SegmentDefinition[] = [
  stationStart,
  liftHill,
  firstDrop,
  straight,
  gentleLeftBank,
  gentleRightBank,
  sTurn,
  camelback,
  bunnyHops,
  helixLeft,
  helixRight,
  verticalLoop,
  corkscrewLeft,
  corkscrewRight,
  inlineTwist,
  zeroGRoll,
  brakeRun,
];
