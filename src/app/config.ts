import { RideIntensity, RideLength } from './types';

export const CONFIG = {
  camera: {
    fov: 75,
    near: 0.1,
    far: 2000,
    rideOffset: new Float32Array([0, 1.6, 0]),
    /** Max yaw/pitch for mouse-look during ride (radians) */
    lookMaxYaw: Math.PI * 0.55,
    lookMaxPitch: Math.PI * 0.4,
    lookSensitivity: 0.003,
    lookReturnSpeed: 3.0,
  },

  renderer: {
    antialias: true,
    pixelRatioMax: 2,
  },

  track: {
    railGauge: 1.8,
    railRadius: 0.12,
    spineRadius: 0.06,
    tieWidth: 2.0,
    tieHeight: 0.08,
    tieDepth: 0.15,
    tieInterval: 4,
    sampleSpacing: 0.5,
    railSegmentsRadial: 10,
  },

  supports: {
    interval: 12,
    minHeight: 2.5,
    radius: 0.2,
    baseRadius: 0.35,
    baseHeight: 0.3,
    radialSegments: 12,
  },

  speed: {
    gravity: 25.0,
    drag: 0.3,
    minSpeed: 3.0,
    maxSpeed: 75.0,
    liftSpeed: 6.0,
    initialSpeed: 2.0,
  },

  generation: {
    maxConsecutiveInversions: 2,
    lengthMap: {
      short: { min: 8, max: 12 },
      medium: { min: 12, max: 18 },
      long: { min: 18, max: 28 },
      extreme: { min: 25, max: 40 },
    } as Record<RideLength, { min: number; max: number }>,
    intensityThrill: {
      chill: { maxThrill: 3, inversionChance: 0.05 },
      thrill: { maxThrill: 6, inversionChance: 0.25 },
      insane: { maxThrill: 10, inversionChance: 0.5 },
    } as Record<RideIntensity, { maxThrill: number; inversionChance: number }>,
  },

  world: {
    groundSize: 2000,
    fogNear: 100,
    fogFar: 800,
  },
} as const;
