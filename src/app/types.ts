import * as THREE from 'three';

export type RideLength = 'short' | 'medium' | 'long' | 'extreme';
export type RideIntensity = 'chill' | 'thrill' | 'insane';
export type AppState = 'menu' | 'preview' | 'riding' | 'results';
export type RideSimState = 'idle' | 'riding' | 'finished';

export type SegmentCategory =
  | 'start'
  | 'lift'
  | 'drop'
  | 'turn'
  | 'hill'
  | 'inversion'
  | 'transition'
  | 'brake';

export interface GenerationSettings {
  length: RideLength;
  intensity: RideIntensity;
  seed: number;
}

export interface SegmentDefinition {
  id: string;
  category: SegmentCategory;
  weight: number;
  thrillRating: number;
  inversionCount: number;
  minSpeed: number;
  maxSpeed: number;
  tags: string[];
  cooldownTags: string[];
  buildLocalCurvePoints(): THREE.Vector3[];
}

export interface GeneratedSegment {
  definition: SegmentDefinition;
  worldPoints: THREE.Vector3[];
}

export interface GeneratedCoaster {
  segments: GeneratedSegment[];
  allPoints: THREE.Vector3[];
  settings: GenerationSettings;
  totalInversions: number;
  segmentCount: number;
}

export interface TrackSample {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  binormal: THREE.Vector3;
  bankAngle: number;
  cumulativeDistance: number;
}

export interface RideStats {
  duration: number;
  totalInversions: number;
  maxSpeed: number;
  maxHeight: number;
  segmentCount: number;
  seed: number;
  totalDistance: number;
}

export interface SavedCoaster {
  name: string;
  seed: number;
  length: RideLength;
  intensity: RideIntensity;
  savedAt: number;
}
