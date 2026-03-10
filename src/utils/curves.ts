import * as THREE from 'three';
import { TrackSample } from '../app/types';

/**
 * Parallel transport frame computation along a curve.
 * Avoids the twist discontinuities of Frenet frames on loops and inversions.
 */
export function computeParallelTransportFrames(
  curve: THREE.CatmullRomCurve3,
  sampleCount: number
): TrackSample[] {
  const samples: TrackSample[] = [];
  if (sampleCount < 2) return samples;

  const totalLength = curve.getLength();

  let prevNormal = new THREE.Vector3(0, 1, 0);
  let cumulativeDistance = 0;

  for (let i = 0; i < sampleCount; i++) {
    const t = i / (sampleCount - 1);
    const position = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();

    if (i === 0) {
      // Bootstrap the initial normal: choose an up vector not parallel to tangent
      const up = new THREE.Vector3(0, 1, 0);
      if (Math.abs(tangent.dot(up)) > 0.99) {
        up.set(1, 0, 0);
      }
      prevNormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
      prevNormal.crossVectors(prevNormal, tangent).normalize();
    } else {
      // Parallel transport: rotate previous normal to be perpendicular to new tangent
      const prevTangent = curve.getTangentAt((i - 1) / (sampleCount - 1)).normalize();
      const crossVec = new THREE.Vector3().crossVectors(prevTangent, tangent);
      const dotVal = prevTangent.dot(tangent);

      if (crossVec.lengthSq() > 1e-10) {
        const angle = Math.acos(THREE.MathUtils.clamp(dotVal, -1, 1));
        const axis = crossVec.normalize();
        const rotMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
        prevNormal.applyMatrix4(rotMatrix).normalize();
      }

      // Re-orthogonalize to avoid drift
      const binorm = new THREE.Vector3().crossVectors(tangent, prevNormal).normalize();
      prevNormal.crossVectors(binorm, tangent).normalize();
    }

    if (i > 0) {
      const prevPos = samples[i - 1].position;
      cumulativeDistance += position.distanceTo(prevPos);
    }

    const normal = prevNormal.clone();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    // Compute bank angle from the track's lateral tilt
    const worldUp = new THREE.Vector3(0, 1, 0);
    const projectedNormal = normal.clone().projectOnPlane(tangent).normalize();
    const projectedUp = worldUp.clone().projectOnPlane(tangent).normalize();
    let bankAngle = 0;
    if (projectedNormal.lengthSq() > 0.01 && projectedUp.lengthSq() > 0.01) {
      bankAngle = projectedNormal.angleTo(projectedUp);
      const cross = new THREE.Vector3().crossVectors(projectedUp, projectedNormal);
      if (cross.dot(tangent) < 0) bankAngle = -bankAngle;
    }

    samples.push({
      position: position.clone(),
      tangent: tangent.clone(),
      normal,
      binormal,
      bankAngle,
      cumulativeDistance,
    });
  }

  // Normalize cumulative distances to actual arc length
  if (samples.length > 0) {
    const ratio = totalLength / (samples[samples.length - 1].cumulativeDistance || 1);
    for (const s of samples) {
      s.cumulativeDistance *= ratio;
    }
  }

  return samples;
}
