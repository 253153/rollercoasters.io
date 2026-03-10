import * as THREE from 'three';
import {
  GenerationSettings,
  GeneratedCoaster,
  GeneratedSegment,
  SegmentDefinition,
} from '../app/types';
import { CONFIG } from '../app/config';
import { SegmentLibrary } from './SegmentLibrary';
import { SeededRandom } from './SeededRandom';
import { TerrainBuilder } from '../world/TerrainBuilder';

/** Minimum world-space Y the track is allowed to reach */
const MIN_TRACK_Y = TerrainBuilder.GROUND_Y + 4;

export class TrackGenerator {
  private library: SegmentLibrary;

  constructor(library: SegmentLibrary) {
    this.library = library;
  }

  generate(settings: GenerationSettings): GeneratedCoaster {
    const rng = new SeededRandom(settings.seed);
    const lengthRange = CONFIG.generation.lengthMap[settings.length];
    const targetCount = rng.range(lengthRange.min, lengthRange.max);
    const candidates = this.library.getForIntensity(settings.intensity);

    const segments: GeneratedSegment[] = [];
    const allPoints: THREE.Vector3[] = [];

    const transform = new THREE.Matrix4().identity();
    let totalInversions = 0;

    const addSegment = (def: SegmentDefinition): void => {
      const localPoints = def.buildLocalCurvePoints();
      const worldPoints = localPoints.map((p) => p.clone().applyMatrix4(transform));

      segments.push({ definition: def, worldPoints });

      const startIdx = allPoints.length === 0 ? 0 : 1;
      for (let i = startIdx; i < worldPoints.length; i++) {
        allPoints.push(worldPoints[i]);
      }

      totalInversions += def.inversionCount;
      this.advanceTransform(transform, localPoints);
    };

    /**
     * Test whether placing a segment with the current transform
     * would push any point below the minimum allowed height.
     */
    const wouldGoUnderground = (def: SegmentDefinition): boolean => {
      const localPoints = def.buildLocalCurvePoints();
      for (const p of localPoints) {
        const wp = p.clone().applyMatrix4(transform);
        if (wp.y < MIN_TRACK_Y) return true;
      }
      return false;
    };

    // Mandatory opening sequence
    const stationStart = this.library.getById('stationStart')!;
    const liftHill = this.library.getById('liftHill')!;
    const firstDrop = this.library.getById('firstDrop')!;
    const brakeRun = this.library.getById('brakeRun')!;

    addSegment(stationStart);
    addSegment(liftHill);
    addSegment(firstDrop);

    // Main body generation
    const recentTagWindow = 3;
    const recentTags: string[][] = [];
    let consecutiveInversions = 0;

    const bodyCount = targetCount - 4;
    for (let i = 0; i < bodyCount; i++) {
      const flatRecentTags = recentTags.flat();

      // Try up to several candidates to find one that doesn't go underground
      let picked: SegmentDefinition | null = null;
      for (let attempt = 0; attempt < 8; attempt++) {
        const candidate = this.library.getWeightedRandom(
          candidates,
          rng,
          flatRecentTags,
          consecutiveInversions
        );
        if (!candidate) break;

        if (!wouldGoUnderground(candidate)) {
          picked = candidate;
          break;
        }
        // This candidate would clip underground -- try the next one
      }

      // If every candidate would go underground, place a straight segment
      // (flat, so it can't descend) to give altitude recovery a chance
      if (!picked) {
        const straight = this.library.getById('straight');
        if (straight && !wouldGoUnderground(straight)) {
          picked = straight;
        } else {
          break;
        }
      }

      addSegment(picked);

      recentTags.push(picked.tags);
      if (recentTags.length > recentTagWindow) recentTags.shift();

      if (picked.inversionCount > 0) {
        consecutiveInversions++;
      } else {
        consecutiveInversions = 0;
      }
    }

    addSegment(brakeRun);

    // Safety net: if any point still ended up below minimum, lift the whole track
    this.enforceMinimumHeight(allPoints, segments);

    return {
      segments,
      allPoints,
      settings,
      totalInversions,
      segmentCount: segments.length,
    };
  }

  /**
   * Post-generation pass: find the lowest point and lift everything
   * above the minimum allowed height if needed.
   */
  private enforceMinimumHeight(
    allPoints: THREE.Vector3[],
    segments: GeneratedSegment[]
  ): void {
    let minY = Infinity;
    for (const p of allPoints) {
      if (p.y < minY) minY = p.y;
    }

    if (minY < MIN_TRACK_Y) {
      const lift = MIN_TRACK_Y - minY;
      for (const p of allPoints) {
        p.y += lift;
      }
      for (const seg of segments) {
        for (const p of seg.worldPoints) {
          p.y += lift;
        }
      }
    }
  }

  private advanceTransform(transform: THREE.Matrix4, localPoints: THREE.Vector3[]): void {
    if (localPoints.length < 2) return;

    const lastPt = localPoints[localPoints.length - 1];
    const prevPt = localPoints[localPoints.length - 2];

    const localDir = new THREE.Vector3()
      .subVectors(lastPt, prevPt)
      .normalize();

    const worldExit = lastPt.clone().applyMatrix4(transform);
    const worldDir = localDir.clone().transformDirection(transform).normalize();

    // Flatten the exit direction slightly to prevent cumulative downward pitch.
    // This simulates real coasters which level out between elements.
    if (worldDir.y < -0.15) {
      worldDir.y *= 0.4;
      worldDir.normalize();
    }

    const up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(worldDir.dot(up)) > 0.95) {
      up.set(0, 0, -1);
    }

    const right = new THREE.Vector3().crossVectors(up, worldDir).normalize();
    const correctedUp = new THREE.Vector3().crossVectors(worldDir, right).normalize();

    transform.makeBasis(right, correctedUp, worldDir);
    transform.setPosition(worldExit);
  }
}
