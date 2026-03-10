import * as THREE from 'three';
import { TrackSample } from '../app/types';
import { CONFIG } from '../app/config';
import { computeParallelTransportFrames } from '../utils/curves';

export class TrackSpline {
  readonly curve: THREE.CatmullRomCurve3;
  readonly samples: TrackSample[];
  readonly totalLength: number;

  constructor(points: THREE.Vector3[]) {
    this.curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    this.totalLength = this.curve.getLength();

    const sampleCount = Math.max(
      100,
      Math.ceil(this.totalLength / CONFIG.track.sampleSpacing)
    );

    this.samples = computeParallelTransportFrames(this.curve, sampleCount);
  }

  /** Look up sample by cumulative distance, with linear interpolation */
  sampleAtDistance(distance: number): TrackSample {
    const d = THREE.MathUtils.clamp(distance, 0, this.totalLength);

    // Binary search for the bracketing samples
    let lo = 0;
    let hi = this.samples.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (this.samples[mid].cumulativeDistance <= d) lo = mid;
      else hi = mid;
    }

    const s0 = this.samples[lo];
    const s1 = this.samples[hi];
    const segLen = s1.cumulativeDistance - s0.cumulativeDistance;
    const t = segLen > 0 ? (d - s0.cumulativeDistance) / segLen : 0;

    return {
      position: new THREE.Vector3().lerpVectors(s0.position, s1.position, t),
      tangent: new THREE.Vector3().lerpVectors(s0.tangent, s1.tangent, t).normalize(),
      normal: new THREE.Vector3().lerpVectors(s0.normal, s1.normal, t).normalize(),
      binormal: new THREE.Vector3().lerpVectors(s0.binormal, s1.binormal, t).normalize(),
      bankAngle: s0.bankAngle + (s1.bankAngle - s0.bankAngle) * t,
      cumulativeDistance: d,
    };
  }

  /** Get the center of all sample positions (for orbit camera target) */
  getCenter(): THREE.Vector3 {
    const center = new THREE.Vector3();
    for (const s of this.samples) center.add(s.position);
    center.divideScalar(this.samples.length);
    return center;
  }

  /** Get the maximum height across all samples */
  getMaxHeight(): number {
    let max = -Infinity;
    for (const s of this.samples) {
      if (s.position.y > max) max = s.position.y;
    }
    return max;
  }
}
